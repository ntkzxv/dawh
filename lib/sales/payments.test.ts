import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@/lib/warehouse/core";

const { clientQuery, query } = vi.hoisted(() => ({ clientQuery: vi.fn(), query: vi.fn() }));
vi.mock("@/lib/core/http/request-timing", () => ({ timedPoolQuery: query }));
vi.mock("@/lib/auth/session", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/core/db/transaction", () => ({
  withTransaction: (work: (client: unknown) => unknown) => work({ query: clientQuery }),
}));
vi.mock("@/lib/warehouse/ledger", () => ({ postInventoryLine: vi.fn() }));
vi.mock("@/lib/warehouse/stock-documents", () => ({ issueSerials: vi.fn(), reverseDocumentInTx: vi.fn() }));

import { allocateFifo, getReceipt, recordInstallmentPayment, unallocateTail, voidInstallmentPayment, type Slot } from "./payments";

const actorOf = (role: Actor["role"]): Actor => ({
  id: 1, authUserId: "u1", role, branchIds: [7], name: "T", email: "t@example.test", image: null,
});
const result = (rows: Record<string, unknown>[] = []) => ({ rows, rowCount: rows.length });
const slot = (seq: number, amount: number, paid: number): Slot => ({ seq, amountSatang: BigInt(amount), paidSatang: BigInt(paid) });
const paidOf = (slots: Slot[]) => slots.map((s) => Number(s.paidSatang));

beforeEach(() => {
  clientQuery.mockReset();
  query.mockReset();
});

describe("allocateFifo", () => {
  const slots = [slot(1, 1000, 400), slot(2, 1000, 0), slot(3, 1000, 0)];
  it("partial pay stays inside the first installment", () => expect(paidOf(allocateFifo(slots, BigInt(200)))).toEqual([600, 0, 0]));
  it("exact pay clears the first installment", () => expect(paidOf(allocateFifo(slots, BigInt(600)))).toEqual([1000, 0, 0]));
  it("spills across installments in order", () => expect(paidOf(allocateFifo(slots, BigInt(1700)))).toEqual([1000, 1000, 100]));
  it("rejects overpayment", () => {
    expect(() => allocateFifo(slots, BigInt(2601))).toThrowError(expect.objectContaining({ code: "OVERPAYMENT", status: 409 }));
    expect(paidOf(allocateFifo(slots, BigInt(2600)))).toEqual([1000, 1000, 1000]);
  });
});

describe("unallocateTail", () => {
  it("restores the tail after a FIFO allocation", () => {
    const before = [slot(1, 1000, 400), slot(2, 1000, 0), slot(3, 1000, 0)];
    expect(unallocateTail(allocateFifo(before, BigInt(1700)), BigInt(1700))).toEqual(before);
  });
  it("fails if paid amounts cannot cover the payment", () => {
    expect(() => unallocateTail([slot(1, 1000, 100)], BigInt(200))).toThrowError(expect.objectContaining({ code: "PAYMENT_MISMATCH" }));
  });
});

describe("recordInstallmentPayment", () => {
  const body = { amount: "5.00", method: "CASH", paidOn: "2020-01-01", referenceNo: "R" };
  const sale = (extra = {}) => result([{ branch_id: 7, sale_type: "INSTALLMENT", cancelled_at: null, closed_at: null, ...extra }]);
  const sqls = () => clientQuery.mock.calls.map(([sql]) => String(sql));

  it("locks, allocates, inserts an INSTALLMENT row and closes when fully paid", async () => {
    clientQuery
      .mockResolvedValueOnce(result()) // idempotency
      .mockResolvedValueOnce(sale())
      .mockResolvedValueOnce(result([{ seq: 1, amount: "10.00", paid_amount: "5.00" }]))
      .mockResolvedValueOnce(result()) // update installment
      .mockResolvedValueOnce(result([{ id: 31, record_no: "RC-00000031" }]));
    const out = await recordInstallmentPayment(actorOf("COUNTER_STAFF"), 9, body, "key-12345678");
    expect(out).toEqual({ id: 31, recordNo: "RC-00000031", closed: true, repeated: false });
    expect(sqls().filter((s) => s.includes("FOR UPDATE")).length).toBe(3);
    const upd = clientQuery.mock.calls.find(([s]) => String(s).includes("UPDATE app.sale_installments"))!;
    expect(upd[1]).toEqual([9, 1, "10.00"]);
    expect(sqls().some((s) => s.includes("'INSTALLMENT'") && s.includes("INSERT INTO app.sale_payments"))).toBe(true);
    expect(sqls().some((s) => s.includes("SET closed_at=now()"))).toBe(true);
  });
  it("does not close a partly paid contract", async () => {
    clientQuery
      .mockResolvedValueOnce(result()).mockResolvedValueOnce(sale())
      .mockResolvedValueOnce(result([{ seq: 1, amount: "10.00", paid_amount: "0.00" }]))
      .mockResolvedValueOnce(result()).mockResolvedValueOnce(result([{ id: 31, record_no: "x" }]));
    expect((await recordInstallmentPayment(actorOf("MANAGER"), 9, body, "key-12345678")).closed).toBe(false);
    expect(sqls().some((s) => s.includes("closed_at=now()"))).toBe(false);
  });
  it("rejects overpayment, closed and cancelled contracts with 409", async () => {
    clientQuery.mockResolvedValueOnce(result()).mockResolvedValueOnce(sale())
      .mockResolvedValueOnce(result([{ seq: 1, amount: "4.00", paid_amount: "0.00" }]));
    await expect(recordInstallmentPayment(actorOf("MANAGER"), 9, body, "key-12345678")).rejects.toMatchObject({ code: "OVERPAYMENT" });
    clientQuery.mockResolvedValueOnce(result()).mockResolvedValueOnce(sale({ closed_at: new Date() }));
    await expect(recordInstallmentPayment(actorOf("MANAGER"), 9, body, "key-12345678")).rejects.toMatchObject({ code: "CONTRACT_CLOSED" });
    clientQuery.mockResolvedValueOnce(result()).mockResolvedValueOnce(sale({ cancelled_at: new Date() }));
    await expect(recordInstallmentPayment(actorOf("MANAGER"), 9, body, "key-12345678")).rejects.toMatchObject({ code: "SALE_CANCELLED" });
  });
  it("replays the same payment id for a repeated key", async () => {
    clientQuery.mockResolvedValueOnce(result()).mockResolvedValueOnce(sale())
      .mockResolvedValueOnce(result([{ seq: 1, amount: "10.00", paid_amount: "0.00" }]))
      .mockResolvedValueOnce(result()).mockResolvedValueOnce(result([{ id: 31, record_no: "x" }]));
    await recordInstallmentPayment(actorOf("MANAGER"), 9, body, "key-12345678");
    const hash = clientQuery.mock.calls.find(([s]) => String(s).includes("idempotency_keys("))![1][2];
    clientQuery.mockReset();
    clientQuery.mockResolvedValueOnce(result([{ result_entity_id: 31, request_hash: hash, operation: "INSTALLMENT_PAYMENT" }]));
    expect(await recordInstallmentPayment(actorOf("MANAGER"), 9, body, "key-12345678")).toEqual({ id: 31, repeated: true });
  });
  it("rejects EMPLOYEE (403) and a future date (400)", async () => {
    await expect(recordInstallmentPayment(actorOf("EMPLOYEE"), 9, body, "key-12345678")).rejects.toMatchObject({ status: 403 });
    await expect(recordInstallmentPayment(actorOf("MANAGER"), 9, { ...body, paidOn: "2999-01-01" }, "key-12345678")).rejects.toMatchObject({ status: 400 });
  });
});

describe("voidInstallmentPayment", () => {
  const payment = (extra = {}) => result([{ kind: "INSTALLMENT", amount: "5.00", voided_at: null, ...extra }]);
  const start = (p: ReturnType<typeof payment>) =>
    clientQuery.mockResolvedValueOnce(result([{ sale_id: 9 }])).mockResolvedValueOnce(result([{ branch_id: 7 }])).mockResolvedValueOnce(p);

  it("COUNTER_STAFF cannot void (403)", async () => {
    await expect(voidInstallmentPayment(actorOf("COUNTER_STAFF"), 31, "oops")).rejects.toMatchObject({ status: 403 });
  });
  it("requires a reason", async () => {
    await expect(voidInstallmentPayment(actorOf("MANAGER"), 31, " ")).rejects.toMatchObject({ status: 400 });
  });
  it("rejects DOWN_PAYMENT / CASH_SALE kinds", async () => {
    start(payment({ kind: "DOWN_PAYMENT" }));
    await expect(voidInstallmentPayment(actorOf("MANAGER"), 31, "x")).rejects.toMatchObject({ status: 409, code: "NOT_VOIDABLE" });
  });
  it("rejects an already voided payment", async () => {
    start(payment({ voided_at: new Date() }));
    await expect(voidInstallmentPayment(actorOf("MANAGER"), 31, "x")).rejects.toMatchObject({ code: "ALREADY_VOIDED" });
  });
  it("rejects a payment that is not the latest", async () => {
    start(payment());
    clientQuery.mockResolvedValueOnce(result([{ id: 32 }]));
    await expect(voidInstallmentPayment(actorOf("MANAGER"), 31, "x")).rejects.toMatchObject({ status: 409, code: "NOT_LATEST_PAYMENT" });
  });
  it("gives the amount back from the tail, voids and reopens the contract", async () => {
    start(payment());
    clientQuery
      .mockResolvedValueOnce(result([{ id: 31 }]))
      .mockResolvedValueOnce(result([{ seq: 1, amount: "10.00", paid_amount: "10.00" }, { seq: 2, amount: "10.00", paid_amount: "3.00" }]));
    await voidInstallmentPayment(actorOf("MANAGER"), 31, "x");
    const updates = clientQuery.mock.calls.filter(([s]) => String(s).includes("UPDATE app.sale_installments")).map(([, v]) => v);
    expect(updates).toEqual([[9, 1, "8.00"], [9, 2, "0.00"]]);
    const sqls = clientQuery.mock.calls.map(([s]) => String(s));
    expect(sqls.some((s) => s.includes("SET voided_at=now()"))).toBe(true);
    expect(sqls.some((s) => s.includes("closed_at=NULL"))).toBe(true);
  });
});

describe("getReceipt", () => {
  it("rejects EMPLOYEE with 403", async () => {
    await expect(getReceipt(actorOf("EMPLOYEE"), 1)).rejects.toMatchObject({ status: 403 });
  });
  it("404 when the payment is missing", async () => {
    query.mockResolvedValueOnce(result());
    await expect(getReceipt(actorOf("COUNTER_STAFF"), 1)).rejects.toMatchObject({ status: 404 });
  });
  it("rejects a branch outside the actor's branches", async () => {
    query.mockResolvedValueOnce(result([{ branch_id: 8 }]));
    await expect(getReceipt(actorOf("COUNTER_STAFF"), 1)).rejects.toMatchObject({ code: "FORBIDDEN_BRANCH" });
  });
  it("returns the receipt row", async () => {
    query.mockResolvedValueOnce(result([{ branch_id: 7, record_no: "RC-1" }]));
    await expect(getReceipt(actorOf("COUNTER_STAFF"), 1)).resolves.toMatchObject({ record_no: "RC-1" });
  });
});
