import "server-only";

import { dbPool } from "@/lib/core/db/pool";
import { date, id, requireRole, type Actor } from "@/lib/warehouse/core";

export async function receiptReport(actor: Actor, search: URLSearchParams) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const supplierId = search.get("supplierId") ? id(search.get("supplierId"), "supplierId") : null;
  const productId = search.get("productId") ? id(search.get("productId"), "productId") : null;
  const branchId = search.get("branchId") ? id(search.get("branchId"), "branchId") : null;
  const from = search.get("from") ? date(search.get("from"), "from") : null;
  const to = search.get("to") ? date(search.get("to"), "to") : null;
  const global = actor.role === "ADMIN" || actor.role === "CEO";
  const result = await dbPool.query(`SELECT gr.id AS goods_receipt_id,gr.record_no AS goods_receipt_no,gr.counted_at,gr.posted_at,
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
    ORDER BY gr.id DESC,gl.id LIMIT 1000`, [global, actor.branchIds, supplierId, productId, branchId, from, to]);
  return result.rows;
}
export async function outstandingReport(actor: Actor) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const result = await dbPool.query(`SELECT po.id AS purchase_order_id,po.record_no AS purchase_order_no,po.ordered_at,s.name AS supplier_name,
    pl.id AS purchase_order_line_id,p.sku,p.name AS product_name,pl.quantity AS ordered_quantity,
    COALESCE((SELECT sum(gl.good_quantity) FROM app.goods_receipt_lines gl JOIN app.goods_receipts gr ON gr.id=gl.goods_receipt_id WHERE gl.purchase_order_line_id=pl.id AND gr.reversed_at IS NULL),0) AS counted_good_quantity,
    COALESCE((SELECT sum(gl.good_quantity) FROM app.goods_receipt_lines gl JOIN app.goods_receipts gr ON gr.id=gl.goods_receipt_id WHERE gl.purchase_order_line_id=pl.id AND gr.posted_at IS NOT NULL AND gr.reversed_at IS NULL),0) AS posted_good_quantity,
    pl.quantity-COALESCE((SELECT sum(gl.good_quantity) FROM app.goods_receipt_lines gl JOIN app.goods_receipts gr ON gr.id=gl.goods_receipt_id WHERE gl.purchase_order_line_id=pl.id AND gr.reversed_at IS NULL),0) AS remaining_good_quantity
    FROM app.purchase_order_lines pl JOIN app.purchase_orders po ON po.id=pl.purchase_order_id
    JOIN app.suppliers s ON s.id=po.supplier_id JOIN app.products p ON p.id=pl.product_id
    WHERE po.closed_at IS NULL ORDER BY po.id DESC,pl.id LIMIT 1000`);
  return result.rows;
}
