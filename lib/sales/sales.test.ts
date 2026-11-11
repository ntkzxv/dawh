import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@/lib/warehouse/core";

const { query, clientQuery, postInventoryLine } = vi.hoisted(() => ({
  query: vi.fn(),
  clientQuery: vi.fn(),
  postInventoryLine: vi.fn(),
}));
vi.mock("@/lib/core/http/request-timing", () => ({ timedPoolQuery: query }));
vi.mock("@/lib/auth/session", () => ({ requireSession: vi.fn() }));
vi.mock("@/lib/core/db/transaction", () => ({
  withTransaction: (work: (client: unknown) => unknown) => work({ query: clientQuery }),
}));
vi.mock("@/lib/warehouse/ledger", () => ({ postInventoryLine }));
vi.mock("@/lib/warehouse/stock-documents", () => ({
  issueSerials: vi.fn(),
  reverseDocumentInTx: vi.fn().mockResolvedValue([99]),
}));

import { cancelSale, createSale, fromSatang, lineTotalSatang, listSales, listSellableStock, toSatang } from "./sales";
import { createCustomer } from "./customers";
import { requireModuleEnabled } from "@/lib/modules/status";

const actorOf = (role: Actor["role"]): Actor => ({
  id: 1, authUserId: "u1", role, branchIds: [7], name: "Test", email: "t@example.test", image: null,
});
const counter = actorOf("COUNTER_STAFF");
const result = (rows: Record<string, unknown>[] = []) => ({ rows, rowCount: rows.length });

beforeEach(() => {
  query.mockReset();
  clientQuery.mockReset();
  postInventoryLine.mockReset();
  clientQuery.mockResolvedValue(result([{ id: 1 }]));
});

describe("satang math", () => {
  it("computes 3 x 33.33 = 99.99 without float drift", () => {
    expect(fromSatang(lineTotalSatang("3", toSatang("33.33")))).toBe("99.99");
    expect(fromSatang(lineTotalSatang("0.5", toSatang("0.01")))).toBe("0.01");
    expect(fromSatang(lineTotalSatang("1.333", toSatang("10")))).toBe("13.33");
  });
});

describe("customer validation", () => {
  it("rejects a citizen id that is not 13 digits", async () => {
    await expect(createCustomer(counter, { fullName: "A", phone: "081", citizenId: "123" }))
      .rejects.toMatchObject({ status: 400 });
  });
  it("requires name and phone", async () => {
    await expect(createCustomer(counter, { phone: "081" })).rejects.toMatchObject({ status: 400 });
    await expect(createCustomer(counter, { fullName: "A" })).rejects.toMatchObject({ status: 400 });
  });
  it("stores a valid customer with creator and branch", async () => {
    query.mockResolvedValue(result([{ id: 3 }]));
    await createCustomer(counter, { fullName: " Somchai ", phone: "081", citizenId: "1234567890123" });
    expect(query.mock.calls[0][1]).toEqual(["Somchai", "081", "1234567890123", null, null, 7, 1]);
  });
});

describe("roles", () => {
  it.each([
    ["list", () => listSales(actorOf("EMPLOYEE"), new URLSearchParams())],
    ["create customer", () => createCustomer(actorOf("EMPLOYEE"), { fullName: "A", phone: "1" })],
    ["create sale", () => createSale(actorOf("EMPLOYEE"), {}, "key-12345678")],
    ["cancel by counter staff", () => cancelSale(counter, 1, "wrong")],
  ])("rejects %s with 403", async (_name, call) => {
    await expect(call()).rejects.toMatchObject({ status: 403 });
  });
});

describe("createSale", () => {
  const body = {
    customerId: 2, warehouseId: 4, paymentMethod: "CASH", referenceNo: "R1",
    lines: [{ productId: 9, quantity: "3", unitPrice: "33.33" }],
  };
  const mockLookups = () => {
    query.mockResolvedValueOnce(result([{ id: 2 }]));
    query.mockResolvedValueOnce(result([{ branch_id: 7 }]));
    query.mockResolvedValueOnce(result([{ id: 9, serial_tracked: false, sale_price: null }]));
  };

  it("posts a SALE document, negative stock line and a full-total payment", async () => {
    mockLookups();
    clientQuery
      .mockResolvedValueOnce(result()) // idempotency lookup
      .mockResolvedValueOnce(result([{ id: 50 }])) // inventory document
      .mockResolvedValueOnce(result([{ id: 11, record_no: "SO-00000011" }])); // sale
    const sale = await createSale(counter, body, "key-12345678");
    expect(sale).toEqual({ id: 11, recordNo: "SO-00000011", repeated: false });
    const sqls = clientQuery.mock.calls.map(([sql]) => String(sql));
    expect(sqls.some((sql) => sql.includes("inventory_documents") && sql.includes("'SALE'"))).toBe(true);
    expect(postInventoryLine).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({
      documentId: 50, warehouseId: 4, productId: 9, quantity: "-3",
    }));
    const payment = clientQuery.mock.calls.find(([sql]) => String(sql).includes("sale_payments"))!;
    expect(payment[1]).toEqual([11, "CASH_SALE", "CASH", "99.99", "R1", 1]);
    const lineInsert = clientQuery.mock.calls.find(([sql]) => String(sql).includes("sale_lines"))!;
    expect(lineInsert[1]).toEqual([11, 9, "3", "33.33", "99.99", []]);
    expect(sqls.some((sql) => sql.includes("idempotency_keys(") && sql.includes("SALE_CREATE"))).toBe(true);
    expect(sqls.some((sql) => sql.includes("audit_events"))).toBe(true);
  });

  describe("installment", () => {
    const future = "2099-01-31";
    const hp = (down: string, extra: Record<string, unknown> = {}) => ({
      ...body, saleType: "INSTALLMENT", paymentMethod: down === "0" ? undefined : "CASH",
      installment: { downPayment: down, interestRate: "10", months: 3, firstDueOn: future, ...extra },
    });
    const run = (input: Record<string, unknown>) => {
      mockLookups();
      clientQuery
        .mockResolvedValueOnce(result())
        .mockResolvedValueOnce(result([{ id: 50 }]))
        .mockResolvedValueOnce(result([{ id: 12, record_no: "SO-00000012" }]));
      return createSale(counter, input, "key-12345678");
    };
    const sqls = () => clientQuery.mock.calls.map(([sql]) => String(sql));

    it("stores terms, schedule rows, guarantors and a DOWN_PAYMENT row, no CASH_SALE", async () => {
      await run(hp("10", { guarantors: [{ fullName: "G", phone: "08" }] }));
      const sale = clientQuery.mock.calls.find(([sql]) => String(sql).includes("INSERT INTO app.sales"))!;
      // total 99.99, interest 10.00 (9.999 -> 10.00), financed 99.99
      expect(sale[1]).toEqual([2, 7, 4, "99.99", 50, null, 1, "INSTALLMENT", "10", "10", "10.00", "99.99", 3, "33.33", future]);
      const rows = clientQuery.mock.calls.find(([sql]) => String(sql).includes("sale_installments"))!;
      expect(rows[1]).toEqual([12, [1, 2, 3], [future, "2099-02-28", "2099-03-31"], ["33.33", "33.33", "33.33"]]);
      expect(sqls().some((sql) => sql.includes("sale_guarantors"))).toBe(true);
      const payment = clientQuery.mock.calls.find(([sql]) => String(sql).includes("INSERT INTO app.sale_payments"))!;
      expect(payment[1]).toEqual([12, "DOWN_PAYMENT", "CASH", "10", "R1", 1]);
    });
    it("records no payment when down payment is 0", async () => {
      await run(hp("0"));
      expect(sqls().some((sql) => sql.includes("INSERT INTO app.sale_payments"))).toBe(false);
      expect(sqls().some((sql) => sql.includes("sale_installments"))).toBe(true);
    });
    it("rejects a first due date before today", async () => {
      mockLookups();
      await expect(createSale(counter, hp("0", { firstDueOn: "2020-01-01" }), "key-12345678"))
        .rejects.toMatchObject({ status: 400 });
    });
  });

  it("replays the same sale for a repeated key", async () => {
    mockLookups();
    clientQuery.mockResolvedValueOnce(result()).mockResolvedValueOnce(result([{ id: 50 }])).mockResolvedValueOnce(result([{ id: 11, record_no: "x" }]));
    await createSale(counter, body, "key-12345678");
    const hash = clientQuery.mock.calls.find(([sql]) => String(sql).includes("idempotency_keys("))![1][2];
    clientQuery.mockReset();
    mockLookups();
    clientQuery.mockResolvedValueOnce(result([{ result_entity_id: 11, request_hash: hash, operation: "SALE_CREATE" }]));
    expect(await createSale(counter, body, "key-12345678")).toEqual({ id: 11, repeated: true });
    expect(postInventoryLine).toHaveBeenCalledTimes(1);
  });
});

describe("cancelSale", () => {
  it("rejects an already cancelled sale", async () => {
    clientQuery.mockResolvedValueOnce(result([{ branch_id: 7, cancelled_at: new Date(), inventory_document_id: 50 }]));
    await expect(cancelSale(actorOf("MANAGER"), 11, "mistake")).rejects.toMatchObject({ status: 409, code: "ALREADY_CANCELLED" });
  });
  it("requires a reason", async () => {
    await expect(cancelSale(actorOf("MANAGER"), 11, " ")).rejects.toMatchObject({ status: 400 });
  });
  it("blocks cancelling an installment bill that has installment payments", async () => {
    clientQuery
      .mockResolvedValueOnce(result([{ branch_id: 7, cancelled_at: null, inventory_document_id: 50, sale_type: "INSTALLMENT" }]))
      .mockResolvedValueOnce(result([{ id: 1 }]));
    await expect(cancelSale(actorOf("MANAGER"), 11, "mistake")).rejects.toMatchObject({ status: 409, code: "HAS_INSTALLMENT_PAYMENTS" });
  });
  it("reverses stock, voids payments and marks the sale cancelled", async () => {
    clientQuery
      .mockResolvedValueOnce(result([{ branch_id: 7, cancelled_at: null, inventory_document_id: 50 }]))
      .mockResolvedValueOnce(result([{ kind: "SALE", warehouse_id: 4, transfer_pair_id: null }]));
    await cancelSale(actorOf("MANAGER"), 11, "mistake");
    const sqls = clientQuery.mock.calls.map(([sql]) => String(sql));
    expect(sqls.some((sql) => sql.includes("UPDATE app.sale_payments SET voided_at"))).toBe(true);
    expect(sqls.some((sql) => sql.includes("UPDATE app.sales SET cancelled_at"))).toBe(true);
  });
});

describe("requireModuleEnabled", () => {
  it("returns 503 MODULE_DISABLED when the module is off", async () => {
    query.mockResolvedValue(result([{ is_enabled: false }]));
    await expect(requireModuleEnabled("sales")).rejects.toMatchObject({ status: 503, code: "MODULE_DISABLED" });
  });
  it("passes when enabled", async () => {
    query.mockResolvedValue(result([{ is_enabled: true }]));
    await expect(requireModuleEnabled("sales")).resolves.toBeUndefined();
  });
});

describe("listSellableStock", () => {
  const params = (init: Record<string, string>) => new URLSearchParams(init);
  it("requires a warehouseId", async () => {
    await expect(listSellableStock(counter, params({}))).rejects.toMatchObject({ status: 400 });
  });
  it("rejects EMPLOYEE with 403", async () => {
    await expect(listSellableStock(actorOf("EMPLOYEE"), params({ warehouseId: "4" }))).rejects.toMatchObject({ status: 403 });
  });
  it("rejects a warehouse outside the actor's branches", async () => {
    query.mockResolvedValueOnce(result([{ branch_id: 8 }]));
    await expect(listSellableStock(counter, params({ warehouseId: "4" }))).rejects.toMatchObject({ code: "FORBIDDEN_BRANCH" });
  });
  it("only returns in-stock products and AVAILABLE serials", async () => {
    query.mockResolvedValueOnce(result([{ branch_id: 7 }])).mockResolvedValueOnce(result([{ id: 9 }]));
    expect(await listSellableStock(counter, params({ warehouseId: "4", q: " ab " }))).toEqual([{ id: 9 }]);
    const [sql, values] = query.mock.calls[1];
    expect(sql).toContain("b.quantity > 0");
    expect(sql).toContain("s.status='AVAILABLE'");
    expect(values).toEqual([4, "ab"]);
  });
});

describe("listSales customerId filter", () => {
  it("passes customerId as the last param and rejects a bad one", async () => {
    query.mockResolvedValueOnce(result());
    await listSales(counter, new URLSearchParams({ customerId: "5" }));
    expect(query.mock.calls[0][1].at(-1)).toBe(5);
    await expect(listSales(counter, new URLSearchParams({ customerId: "abc" }))).rejects.toMatchObject({ status: 400 });
  });
});
