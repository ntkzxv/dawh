import "server-only";

import { dbPool } from "@/lib/core/db/pool";
import { date, id, requireRole, type Actor } from "@/lib/warehouse/core";
import { pageResult, parsePage } from "@/lib/warehouse/pagination";
import { isGlobalRole } from "@/lib/contracts/warehouse-policy";

function balanceFilters(actor: Actor, search?: URLSearchParams) {
  const branchId = search?.get("branchId")
    ? id(search.get("branchId"), "branchId")
    : null;
  const warehouseId = search?.get("warehouseId")
    ? id(search.get("warehouseId"), "warehouseId")
    : null;
  const productId = search?.get("productId")
    ? id(search.get("productId"), "productId")
    : null;
  return [
    isGlobalRole(actor.role),
    actor.branchIds,
    branchId,
    warehouseId,
    productId,
  ];
}

const balanceSelect = `SELECT sb.warehouse_id,sb.product_id,sb.quantity::text AS quantity,sb.updated_at,w.branch_id,w.name AS warehouse_name,b.name AS branch_name,p.sku,p.name AS product_name,u.code AS unit_code
  FROM app.stock_balances sb JOIN app.warehouses w ON w.id=sb.warehouse_id JOIN app.branches b ON b.id=w.branch_id
  JOIN app.products p ON p.id=sb.product_id JOIN app.units u ON u.id=p.unit_id
  WHERE ($1::boolean OR w.branch_id=ANY($2::integer[])) AND ($3::integer IS NULL OR w.branch_id=$3)
    AND ($4::integer IS NULL OR sb.warehouse_id=$4) AND ($5::integer IS NULL OR sb.product_id=$5)`;

export async function listBalances(actor: Actor, search?: URLSearchParams) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const result = await dbPool.query(
    `${balanceSelect} ORDER BY b.name,p.sku,sb.warehouse_id,sb.product_id LIMIT 1000`,
    balanceFilters(actor, search),
  );
  return result.rows;
}
export async function listBalancesPage(actor: Actor, search: URLSearchParams) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const { page, limit, offset } = parsePage(search);
  const result = await dbPool.query<{
    total: number;
    items: Record<string, unknown>[];
  }>(
    `
    WITH filtered AS (${balanceSelect})
    SELECT (SELECT COUNT(*)::integer FROM filtered) AS total,
      COALESCE((SELECT jsonb_agg(to_jsonb(rows) ORDER BY rows.branch_name,rows.sku,rows.warehouse_id,rows.product_id)
        FROM (SELECT * FROM filtered ORDER BY branch_name,sku,warehouse_id,product_id LIMIT $6 OFFSET $7) rows),'[]'::jsonb) AS items
  `,
    [...balanceFilters(actor, search), limit, offset],
  );
  return pageResult(result.rows[0].items, result.rows[0].total, page, limit);
}

function ledgerFilters(actor: Actor, search?: URLSearchParams) {
  const warehouseId = search?.get("warehouseId")
    ? id(search.get("warehouseId"), "warehouseId")
    : null;
  const productId = search?.get("productId")
    ? id(search.get("productId"), "productId")
    : null;
  const from = search?.get("from") ? date(search.get("from"), "from") : null;
  const to = search?.get("to") ? date(search.get("to"), "to") : null;
  return [
    isGlobalRole(actor.role),
    actor.branchIds,
    warehouseId,
    productId,
    from,
    to,
  ];
}

const ledgerSelect = `SELECT sm.id,sm.product_id,sm.warehouse_id,sm.quantity_delta::text AS quantity_delta,sm.occurred_at,
  doc.id AS document_id,doc.record_no,doc.kind,doc.goods_receipt_id,doc.reason,w.branch_id,w.name AS warehouse_name,p.sku,p.name AS product_name
  FROM app.stock_movements sm JOIN app.inventory_document_lines dl ON dl.id=sm.document_line_id
  JOIN app.inventory_documents doc ON doc.id=dl.document_id JOIN app.warehouses w ON w.id=sm.warehouse_id
  JOIN app.products p ON p.id=sm.product_id
  WHERE ($1::boolean OR w.branch_id=ANY($2::integer[])) AND ($3::integer IS NULL OR sm.warehouse_id=$3)
    AND ($4::integer IS NULL OR sm.product_id=$4) AND ($5::date IS NULL OR sm.occurred_at >= $5::date)
    AND ($6::date IS NULL OR sm.occurred_at < $6::date+interval '1 day')`;
export async function listLedger(actor: Actor, search?: URLSearchParams) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const result = await dbPool.query(
    `${ledgerSelect} ORDER BY sm.id DESC LIMIT 1000`,
    ledgerFilters(actor, search),
  );
  return result.rows;
}
export async function listLedgerPage(actor: Actor, search: URLSearchParams) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const { page, limit, offset } = parsePage(search);
  const result = await dbPool.query<{
    total: number;
    items: Record<string, unknown>[];
  }>(
    `
    WITH filtered AS (${ledgerSelect})
    SELECT (SELECT COUNT(*)::integer FROM filtered) AS total,
      COALESCE((SELECT jsonb_agg(to_jsonb(rows) ORDER BY rows.id DESC)
        FROM (SELECT * FROM filtered ORDER BY id DESC LIMIT $7 OFFSET $8) rows),'[]'::jsonb) AS items
  `,
    [...ledgerFilters(actor, search), limit, offset],
  );
  return pageResult(result.rows[0].items, result.rows[0].total, page, limit);
}
export async function listAudit(actor: Actor) {
  requireRole(actor, ["ADMIN", "CEO"]);
  return (
    await dbPool.query(
      `SELECT a.*,u.email AS actor_email FROM app.audit_events a LEFT JOIN app.app_users actor ON actor.id=a.actor_user_id LEFT JOIN public."user" u ON u.id=actor.auth_user_id ORDER BY a.id DESC LIMIT 1000`,
    )
  ).rows;
}
