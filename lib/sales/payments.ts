import "server-only";

import { createHash } from "node:crypto";
import { timedPoolQuery } from "@/lib/core/http/request-timing";
import { withTransaction } from "@/lib/core/db/transaction";
import { ApiError, NotFoundError, ValidationError } from "@/lib/core/http/errors";
import {
  audit,
  date,
  idempotencyKey,
  money,
  optionalText,
  requireBranch,
  requireRole,
  text,
  type Actor,
} from "@/lib/warehouse/core";
import { salesRoles } from "@/lib/sales/customers";
import { bangkokToday, fromSatang, toSatang } from "@/lib/sales/sales";

const voidRoles = ["ADMIN", "CEO", "MANAGER"] as const;
const methods = ["TRANSFER", "CASH", "CREDIT_CARD"] as const;

export type Slot = { seq: number; amountSatang: bigint; paidSatang: bigint };
const ZERO = BigInt(0);

// Pay installments in seq order (oldest first); slots must be sorted by seq.
export function allocateFifo(slots: Slot[], paySatang: bigint): Slot[] {
  const outstanding = slots.reduce((sum, s) => sum + s.amountSatang - s.paidSatang, ZERO);
  if (paySatang > outstanding)
    throw new ApiError(409, "OVERPAYMENT", "The amount is more than the outstanding balance.");
  let left = paySatang;
  return slots.map((s) => {
    const take = left < s.amountSatang - s.paidSatang ? left : s.amountSatang - s.paidSatang;
    left -= take;
    return { ...s, paidSatang: s.paidSatang + take };
  });
}

// Allocation is always FIFO and only the latest payment can be voided, so the latest payment's
// allocation is exactly the tail of the paid amounts: take it back from the highest seq down.
export function unallocateTail(slots: Slot[], paySatang: bigint): Slot[] {
  let left = paySatang;
  const out = [...slots].reverse().map((s) => {
    const take = left < s.paidSatang ? left : s.paidSatang;
    left -= take;
    return { ...s, paidSatang: s.paidSatang - take };
  });
  if (left > ZERO) throw new ApiError(409, "PAYMENT_MISMATCH", "Paid amounts do not cover this payment.");
  return out.reverse();
}

type InstallmentRow = { seq: number; amount: string; paid_amount: string };
const toSlots = (rows: InstallmentRow[]): Slot[] =>
  rows.map((r) => ({ seq: r.seq, amountSatang: toSatang(r.amount), paidSatang: toSatang(r.paid_amount) }));

async function saveSlots(
  client: { query: (sql: string, values: unknown[]) => Promise<unknown> },
  saleId: number,
  before: Slot[],
  after: Slot[],
) {
  for (const [i, slot] of after.entries())
    if (slot.paidSatang !== before[i].paidSatang)
      await client.query(
        `UPDATE app.sale_installments SET paid_amount=$3 WHERE sale_id=$1 AND seq=$2`,
        [saleId, slot.seq, fromSatang(slot.paidSatang)],
      );
}

export async function recordInstallmentPayment(
  actor: Actor,
  saleId: number,
  body: Record<string, unknown>,
  key: string,
) {
  requireRole(actor, salesRoles);
  idempotencyKey(key);
  const amount = money(body.amount, "amount");
  const paySatang = toSatang(amount);
  if (paySatang <= ZERO) throw new ValidationError({ amount: "Amount must be more than 0." });
  if (!methods.includes(body.method as (typeof methods)[number]))
    throw new ValidationError({ method: "Choose TRANSFER, CASH or CREDIT_CARD." });
  const method = body.method as string;
  const paidOn = body.paidOn == null || body.paidOn === "" ? bangkokToday() : date(body.paidOn, "paidOn");
  if (paidOn > bangkokToday()) throw new ValidationError({ paidOn: "Payment date cannot be in the future." });
  const referenceNo = optionalText(body.referenceNo, "referenceNo", 100);
  const hash = createHash("sha256")
    .update(JSON.stringify({ actor: actor.id, saleId, amount, method, paidOn, referenceNo }))
    .digest("hex");

  return withTransaction(async (client) => {
    const prior = await client.query<{ result_entity_id: number; request_hash: string; operation: string }>(
      `SELECT result_entity_id,request_hash,operation FROM app.idempotency_keys WHERE key=$1 FOR UPDATE`,
      [key],
    );
    if (prior.rowCount) {
      if (prior.rows[0].request_hash !== hash || prior.rows[0].operation !== "INSTALLMENT_PAYMENT")
        throw new ApiError(409, "IDEMPOTENCY_CONFLICT", "This key was used with different data.");
      return { id: prior.rows[0].result_entity_id, repeated: true };
    }
    const sale = await client.query<{ branch_id: number; sale_type: string; cancelled_at: Date | null; closed_at: Date | null }>(
      `SELECT branch_id,sale_type,cancelled_at,closed_at FROM app.sales WHERE id=$1 FOR UPDATE`,
      [saleId],
    );
    if (!sale.rowCount) throw new NotFoundError("Sale");
    const row = sale.rows[0];
    requireBranch(actor, row.branch_id);
    if (row.sale_type !== "INSTALLMENT") throw new ApiError(409, "NOT_INSTALLMENT", "This bill is not an installment bill.");
    if (row.cancelled_at) throw new ApiError(409, "SALE_CANCELLED", "This sale was cancelled.");
    if (row.closed_at) throw new ApiError(409, "CONTRACT_CLOSED", "This contract is fully paid.");
    const installments = await client.query<InstallmentRow>(
      `SELECT seq,amount,paid_amount FROM app.sale_installments WHERE sale_id=$1 ORDER BY seq FOR UPDATE`,
      [saleId],
    );
    const before = toSlots(installments.rows);
    const after = allocateFifo(before, paySatang);
    await saveSlots(client, saleId, before, after);
    const payment = await client.query<{ id: number; record_no: string }>(
      `INSERT INTO app.sale_payments(sale_id,kind,method,amount,paid_on,reference_no,created_by_id)
      VALUES ($1,'INSTALLMENT',$2,$3,$4,$5,$6) RETURNING id,record_no`,
      [saleId, method, amount, paidOn, referenceNo, actor.id],
    );
    const paymentId = payment.rows[0].id;
    const closed = after.every((s) => s.paidSatang >= s.amountSatang);
    if (closed) await client.query(`UPDATE app.sales SET closed_at=now() WHERE id=$1`, [saleId]);
    await client.query(
      `INSERT INTO app.idempotency_keys(key,actor_user_id,operation,request_hash,result_entity_id) VALUES ($1,$2,'INSTALLMENT_PAYMENT',$3,$4)`,
      [key, actor.id, hash, paymentId],
    );
    await audit(client, actor, "INSTALLMENT_PAYMENT_RECORDED", "sale_payments", paymentId, { saleId, amount, method, closed });
    return { id: paymentId, recordNo: payment.rows[0].record_no, closed, repeated: false };
  });
}

export async function voidInstallmentPayment(actor: Actor, paymentId: number, reasonValue: unknown) {
  requireRole(actor, voidRoles);
  const reason = text(reasonValue, "reason", 2000);
  return withTransaction(async (client) => {
    const head = await client.query<{ sale_id: number }>(`SELECT sale_id FROM app.sale_payments WHERE id=$1`, [paymentId]);
    if (!head.rowCount) throw new NotFoundError("Payment");
    const saleId = head.rows[0].sale_id;
    const sale = await client.query<{ branch_id: number }>(`SELECT branch_id FROM app.sales WHERE id=$1 FOR UPDATE`, [saleId]);
    requireBranch(actor, sale.rows[0].branch_id);
    // Re-read under the sale lock so a concurrent void/payment cannot slip past the checks.
    const payment = await client.query<{ kind: string; amount: string; voided_at: Date | null }>(
      `SELECT kind,amount,voided_at FROM app.sale_payments WHERE id=$1`,
      [paymentId],
    );
    const p = payment.rows[0];
    if (p.kind !== "INSTALLMENT")
      throw new ApiError(409, "NOT_VOIDABLE", "Only installment payments can be voided here.");
    if (p.voided_at) throw new ApiError(409, "ALREADY_VOIDED", "This payment was already voided.");
    const latest = await client.query<{ id: number }>(
      `SELECT id FROM app.sale_payments WHERE sale_id=$1 AND kind='INSTALLMENT' AND voided_at IS NULL ORDER BY id DESC LIMIT 1`,
      [saleId],
    );
    if (latest.rows[0]?.id !== paymentId)
      throw new ApiError(409, "NOT_LATEST_PAYMENT", "Void the latest payment first.");
    const installments = await client.query<InstallmentRow>(
      `SELECT seq,amount,paid_amount FROM app.sale_installments WHERE sale_id=$1 ORDER BY seq FOR UPDATE`,
      [saleId],
    );
    const before = toSlots(installments.rows);
    await saveSlots(client, saleId, before, unallocateTail(before, toSatang(p.amount)));
    await client.query(
      `UPDATE app.sale_payments SET voided_at=now(),voided_by_id=$2,void_reason=$3 WHERE id=$1`,
      [paymentId, actor.id, reason],
    );
    await client.query(`UPDATE app.sales SET closed_at=NULL WHERE id=$1`, [saleId]);
    await audit(client, actor, "INSTALLMENT_PAYMENT_VOIDED", "sale_payments", paymentId, { saleId, reason });
    return { id: paymentId, saleId };
  });
}

// Receipt print data. Which installment seqs a payment covered is not stored, so it is not shown.
export async function getReceipt(actor: Actor, paymentId: number) {
  requireRole(actor, salesRoles);
  const res = await timedPoolQuery<Record<string, unknown> & { branch_id: number }>(
    `SELECT p.id,p.record_no,p.kind,p.method,p.amount,p.paid_on,p.reference_no,p.voided_at,p.void_reason,
      s.id AS sale_id,s.record_no AS sale_record_no,s.sale_type,s.sold_on,s.total_amount,s.cancelled_at,s.branch_id,
      c.full_name AS customer_name,c.phone AS customer_phone,c.address AS customer_address,b.name AS branch_name,
      cu.name AS created_by_name,
      (SELECT jsonb_build_object('name',o.name,'phone',o.phone,'address',o.address) FROM app.organization_settings o WHERE o.id=1) AS organization
    FROM app.sale_payments p JOIN app.sales s ON s.id=p.sale_id JOIN app.customers c ON c.id=s.customer_id
    JOIN app.branches b ON b.id=s.branch_id
    JOIN app.app_users au ON au.id=p.created_by_id JOIN public."user" cu ON cu.id=au.auth_user_id
    WHERE p.id=$1`,
    [paymentId],
  );
  if (!res.rowCount) throw new NotFoundError("Payment");
  requireBranch(actor, res.rows[0].branch_id);
  return res.rows[0];
}
