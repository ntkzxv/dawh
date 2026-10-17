import "server-only";

import { timedPoolQuery } from "@/lib/core/http/request-timing";
import { date, id, requireRole, type Actor } from "@/lib/warehouse/core";
import { cursorPageResult, parseCursorPage } from "@/lib/warehouse/cursor-pagination";

export async function receiptReport(actor: Actor, search: URLSearchParams) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const { limit, cursor } = parseCursorPage(search);
  const supplierId = search.get("supplierId") ? id(search.get("supplierId"), "supplierId") : null;
  const productId = search.get("productId") ? id(search.get("productId"), "productId") : null;
  const branchId = search.get("branchId") ? id(search.get("branchId"), "branchId") : null;
  const from = search.get("from") ? date(search.get("from"), "from") : null;
  const to = search.get("to") ? date(search.get("to"), "to") : null;
  const global = actor.role === "ADMIN" || actor.role === "CEO";
  const result = await timedPoolQuery<Record<string, unknown> & { goods_receipt_id: number; goods_receipt_line_id: number }>(`SELECT gr.id AS goods_receipt_id,gl.id AS goods_receipt_line_id,gr.record_no AS goods_receipt_no,gr.counted_at,gr.posted_at,
    cr.id AS carrier_receipt_id,cr.record_no AS carrier_receipt_no,po.id AS purchase_order_id,po.record_no AS purchase_order_no,
    s.id AS supplier_id,s.name AS supplier_name,b.id AS branch_id,b.name AS branch_name,w.id AS warehouse_id,w.name AS warehouse_name,
    p.id AS product_id,p.sku,p.name AS product_name,gl.good_quantity,gl.damaged_quantity,gl.wrong_quantity,pl.unit_price
    FROM app.goods_receipt_lines gl JOIN app.goods_receipts gr ON gr.id=gl.goods_receipt_id
    JOIN app.carrier_receipts cr ON cr.id=gr.carrier_receipt_id JOIN app.purchase_orders po ON po.id=cr.purchase_order_id
    JOIN app.suppliers s ON s.id=po.supplier_id JOIN app.purchase_order_lines pl ON pl.id=gl.purchase_order_line_id
    JOIN app.products p ON p.id=pl.product_id JOIN app.branches b ON b.id=gr.receiving_branch_id JOIN app.warehouses w ON w.id=gr.warehouse_id
    WHERE ($1::boolean OR gr.receiving_branch_id=ANY($2::integer[])) AND ($3::integer IS NULL OR s.id=$3)
      AND ($4::integer IS NULL OR p.id=$4) AND ($5::integer IS NULL OR b.id=$5)
      AND ($6::date IS NULL OR gr.counted_at >= $6::date) AND ($7::date IS NULL OR gr.counted_at < $7::date+interval '1 day')
      AND ($8::bigint IS NULL OR gr.id < $8 OR (gr.id = $8 AND gl.id > $9))
    ORDER BY gr.id DESC,gl.id ASC LIMIT $10`,
  [global, actor.branchIds, supplierId, productId, branchId, from, to, cursor?.parentId ?? null, cursor?.childId ?? 0, limit + 1]);
  return cursorPageResult(result.rows, limit, (row) => ({ parentId: row.goods_receipt_id, childId: row.goods_receipt_line_id }));
}
export async function outstandingReport(actor: Actor, search: URLSearchParams) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const { limit, cursor } = parseCursorPage(search);
  const result = await timedPoolQuery<Record<string, unknown> & { purchase_order_id: number; purchase_order_line_id: number }>(`SELECT po.id AS purchase_order_id,po.record_no AS purchase_order_no,po.ordered_at,s.name AS supplier_name,
    pl.id AS purchase_order_line_id,p.sku,p.name AS product_name,pl.quantity AS ordered_quantity,
    COALESCE((SELECT sum(gl.good_quantity) FROM app.goods_receipt_lines gl JOIN app.goods_receipts gr ON gr.id=gl.goods_receipt_id WHERE gl.purchase_order_line_id=pl.id AND gr.reversed_at IS NULL),0) AS counted_good_quantity,
    COALESCE((SELECT sum(gl.good_quantity) FROM app.goods_receipt_lines gl JOIN app.goods_receipts gr ON gr.id=gl.goods_receipt_id WHERE gl.purchase_order_line_id=pl.id AND gr.posted_at IS NOT NULL AND gr.reversed_at IS NULL),0) AS posted_good_quantity,
    pl.quantity-COALESCE((SELECT sum(gl.good_quantity) FROM app.goods_receipt_lines gl JOIN app.goods_receipts gr ON gr.id=gl.goods_receipt_id WHERE gl.purchase_order_line_id=pl.id AND gr.reversed_at IS NULL),0) AS remaining_good_quantity
    FROM app.purchase_order_lines pl JOIN app.purchase_orders po ON po.id=pl.purchase_order_id
    JOIN app.suppliers s ON s.id=po.supplier_id JOIN app.products p ON p.id=pl.product_id
    WHERE po.closed_at IS NULL
      AND ($1::bigint IS NULL OR po.id < $1 OR (po.id = $1 AND pl.id > $2))
    ORDER BY po.id DESC,pl.id ASC LIMIT $3`, [cursor?.parentId ?? null, cursor?.childId ?? 0, limit + 1]);
  return cursorPageResult(result.rows, limit, (row) => ({ parentId: row.purchase_order_id, childId: row.purchase_order_line_id }));
}
