import "server-only";

import { timedPoolQuery } from "@/lib/core/http/request-timing";
import { NotFoundError, ValidationError } from "@/lib/core/http/errors";
import { id, requireRole, type Actor } from "@/lib/warehouse/core";
import { isGlobalRole } from "@/lib/contracts/warehouse-policy";
import { cursorPageResult, parseCursorPage } from "@/lib/warehouse/cursor-pagination";
import { salesRoles } from "@/lib/sales/customers";
import { bangkokToday } from "@/lib/sales/sales";

const paymentKinds = ["CASH_SALE", "DOWN_PAYMENT", "INSTALLMENT"];

function searchText(search: URLSearchParams) {
  const q = search.get("q")?.trim() ?? "";
  if (q.length > 100) throw new ValidationError({ q: "Use at most 100 characters." });
  return q;
}

// All A/R reads count only non-cancelled sales and are limited to the actor's branches unless global.
export async function arOverview(actor: Actor) {
  requireRole(actor, salesRoles);
  const result = await timedPoolQuery(
    `WITH s AS (SELECT id,sale_type,customer_id,closed_at FROM app.sales WHERE cancelled_at IS NULL AND ($1::boolean OR branch_id=ANY($2::integer[]))),
    i AS (SELECT i.amount,i.paid_amount,i.due_on FROM app.sale_installments i JOIN s ON s.id=i.sale_id)
    SELECT
      (SELECT count(*)::int FROM s WHERE sale_type='INSTALLMENT' AND closed_at IS NULL) AS open_contracts,
      (SELECT COALESCE(SUM(amount-paid_amount),0) FROM i) AS outstanding,
      (SELECT count(*)::int FROM i WHERE due_on < $3::date AND paid_amount < amount) AS overdue_count,
      (SELECT COALESCE(SUM(amount-paid_amount),0) FROM i WHERE due_on < $3::date AND paid_amount < amount) AS overdue_amount,
      (SELECT count(DISTINCT customer_id)::int FROM s) AS customers,
      (SELECT COALESCE(json_agg(t),'[]'::json) FROM (
        SELECT p.id,p.record_no,p.kind,p.amount,p.paid_on,s.id AS sale_id,sa.record_no AS sale_record_no,c.full_name AS customer_name
        FROM app.sale_payments p JOIN s ON s.id=p.sale_id JOIN app.sales sa ON sa.id=p.sale_id JOIN app.customers c ON c.id=s.customer_id
        WHERE p.voided_at IS NULL ORDER BY p.id DESC LIMIT 5) t) AS recent_payments`,
    [isGlobalRole(actor.role), actor.branchIds, bangkokToday()],
  );
  return result.rows[0];
}

export async function listOverdue(actor: Actor, search: URLSearchParams) {
  requireRole(actor, salesRoles);
  const { limit, cursor } = parseCursorPage(search);
  const q = searchText(search);
  const result = await timedPoolQuery<Record<string, unknown> & { id: number }>(
    `SELECT i.id,i.sale_id,s.record_no,s.customer_id,c.full_name AS customer_name,c.phone,i.seq,i.due_on,i.amount,i.paid_amount,
      ($3::date - i.due_on)::int AS days_overdue
    FROM app.sale_installments i JOIN app.sales s ON s.id=i.sale_id JOIN app.customers c ON c.id=s.customer_id
    WHERE s.cancelled_at IS NULL AND ($1::boolean OR s.branch_id=ANY($2::integer[]))
      AND i.due_on < $3::date AND i.paid_amount < i.amount
      AND ($4::text = '' OR s.record_no ILIKE '%' || $4 || '%' OR c.full_name ILIKE '%' || $4 || '%' OR c.phone ILIKE '%' || $4 || '%')
      AND ($5::bigint IS NULL OR (i.due_on,i.id) > (SELECT x.due_on,x.id FROM app.sale_installments x WHERE x.id=$5))
    ORDER BY i.due_on,i.id LIMIT $6`,
    [isGlobalRole(actor.role), actor.branchIds, bangkokToday(), q, cursor?.parentId ?? null, limit + 1],
  );
  return cursorPageResult(result.rows, limit, (row) => ({ parentId: row.id }));
}

export async function listPayments(actor: Actor, search: URLSearchParams) {
  requireRole(actor, salesRoles);
  const { limit, cursor } = parseCursorPage(search);
  const q = searchText(search);
  const kind = search.get("kind") ?? "";
  if (kind && !paymentKinds.includes(kind))
    throw new ValidationError({ kind: "Use CASH_SALE, DOWN_PAYMENT or INSTALLMENT." });
  const customerId = search.get("customerId") ? id(search.get("customerId"), "customerId") : null;
  const voided = search.get("includeVoided");
  if (voided != null && voided !== "true" && voided !== "false")
    throw new ValidationError({ includeVoided: "Use true or false." });
  const result = await timedPoolQuery<Record<string, unknown> & { id: number }>(
    `SELECT p.id,p.record_no,p.kind,p.method,p.amount,p.paid_on,p.reference_no,p.voided_at,
      s.id AS sale_id,s.record_no AS sale_record_no,s.customer_id,c.full_name AS customer_name
    FROM app.sale_payments p JOIN app.sales s ON s.id=p.sale_id JOIN app.customers c ON c.id=s.customer_id
    WHERE ($1::boolean OR s.branch_id=ANY($2::integer[]))
      AND ($3::text = '' OR p.kind=$3) AND ($4::integer IS NULL OR s.customer_id=$4)
      AND ($5::boolean OR p.voided_at IS NULL)
      AND ($6::text = '' OR p.record_no ILIKE '%' || $6 || '%' OR s.record_no ILIKE '%' || $6 || '%' OR c.full_name ILIKE '%' || $6 || '%' OR c.phone ILIKE '%' || $6 || '%')
      AND ($7::bigint IS NULL OR p.id < $7)
    ORDER BY p.id DESC LIMIT $8`,
    [isGlobalRole(actor.role), actor.branchIds, kind, customerId, voided === "true", q, cursor?.parentId ?? null, limit + 1],
  );
  return cursorPageResult(result.rows, limit, (row) => ({ parentId: row.id }));
}

export async function getCustomerProfile(actor: Actor, customerId: number) {
  requireRole(actor, salesRoles);
  const global = isGlobalRole(actor.role);
  const [customer, sales, debt] = await Promise.all([
    timedPoolQuery(
      `SELECT id,full_name,phone,citizen_id,address,note,created_branch_id,created_at,updated_at FROM app.customers WHERE id=$1`,
      [customerId],
    ),
    timedPoolQuery(
      `SELECT count(*) FILTER (WHERE sale_type='CASH')::int AS cash_count,
        count(*) FILTER (WHERE sale_type='INSTALLMENT')::int AS installment_count,
        COALESCE(SUM(total_amount),0) AS total_purchased
      FROM app.sales WHERE customer_id=$1 AND cancelled_at IS NULL AND ($2::boolean OR branch_id=ANY($3::integer[]))`,
      [customerId, global, actor.branchIds],
    ),
    timedPoolQuery(
      `SELECT COALESCE(SUM(i.amount-i.paid_amount),0) AS outstanding,
        COALESCE(SUM(i.amount-i.paid_amount) FILTER (WHERE i.due_on < $4::date),0) AS overdue_amount
      FROM app.sale_installments i JOIN app.sales s ON s.id=i.sale_id
      WHERE s.customer_id=$1 AND s.cancelled_at IS NULL AND ($2::boolean OR s.branch_id=ANY($3::integer[]))`,
      [customerId, global, actor.branchIds, bangkokToday()],
    ),
  ]);
  if (!customer.rowCount) throw new NotFoundError("Customer");
  return { ...customer.rows[0], summary: { ...sales.rows[0], ...debt.rows[0] } };
}
