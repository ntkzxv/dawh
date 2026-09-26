import "server-only";

import { dbPool } from "@/lib/core/db/pool";
import { date, id, requireRole, type Actor } from "@/lib/warehouse/core";

export async function listBalances(actor: Actor, search?: URLSearchParams) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const branchId = search?.get("branchId") ? id(search.get("branchId"), "branchId") : null;
  const warehouseId = search?.get("warehouseId") ? id(search.get("warehouseId"), "warehouseId") : null;
  const productId = search?.get("productId") ? id(search.get("productId"), "productId") : null;
  const global = actor.role === "ADMIN" || actor.role === "CEO";
  const result = await dbPool.query(`SELECT sb.warehouse_id,sb.product_id,sb.quantity,sb.updated_at,w.branch_id,w.name AS warehouse_name,b.name AS branch_name,p.sku,p.name AS product_name,u.code AS unit_code
    FROM app.stock_balances sb JOIN app.warehouses w ON w.id=sb.warehouse_id JOIN app.branches b ON b.id=w.branch_id
    JOIN app.products p ON p.id=sb.product_id JOIN app.units u ON u.id=p.unit_id
    WHERE ($1::boolean OR w.branch_id=ANY($2::integer[])) AND ($3::integer IS NULL OR w.branch_id=$3)
      AND ($4::integer IS NULL OR sb.warehouse_id=$4) AND ($5::integer IS NULL OR sb.product_id=$5)
    ORDER BY b.name,p.sku LIMIT 1000`, [global, actor.branchIds, branchId, warehouseId, productId]);
  return result.rows;
}
export async function listLedger(actor: Actor, search?: URLSearchParams) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const warehouseId = search?.get("warehouseId") ? id(search.get("warehouseId"), "warehouseId") : null;
  const productId = search?.get("productId") ? id(search.get("productId"), "productId") : null;
  const from = search?.get("from") ? date(search.get("from"), "from") : null;
  const to = search?.get("to") ? date(search.get("to"), "to") : null;
  const global = actor.role === "ADMIN" || actor.role === "CEO";
  const result = await dbPool.query(`SELECT sm.id,sm.product_id,sm.warehouse_id,sm.quantity_delta,sm.occurred_at,
    doc.id AS document_id,doc.record_no,doc.kind,doc.goods_receipt_id,doc.reason,w.branch_id,w.name AS warehouse_name,p.sku,p.name AS product_name
    FROM app.stock_movements sm JOIN app.inventory_document_lines dl ON dl.id=sm.document_line_id
    JOIN app.inventory_documents doc ON doc.id=dl.document_id JOIN app.warehouses w ON w.id=sm.warehouse_id
    JOIN app.products p ON p.id=sm.product_id
    WHERE ($1::boolean OR w.branch_id=ANY($2::integer[])) AND ($3::integer IS NULL OR sm.warehouse_id=$3)
      AND ($4::integer IS NULL OR sm.product_id=$4) AND ($5::date IS NULL OR sm.occurred_at >= $5::date)
      AND ($6::date IS NULL OR sm.occurred_at < $6::date+interval '1 day')
    ORDER BY sm.id DESC LIMIT 1000`, [global, actor.branchIds, warehouseId, productId, from, to]);
  return result.rows;
}
export async function listAudit(actor: Actor) {
  requireRole(actor, ["ADMIN", "CEO"]);
  return (await dbPool.query(`SELECT a.*,u.email AS actor_email FROM app.audit_events a LEFT JOIN app.app_users actor ON actor.id=a.actor_user_id LEFT JOIN public."user" u ON u.id=actor.auth_user_id ORDER BY a.id DESC LIMIT 1000`)).rows;
}
