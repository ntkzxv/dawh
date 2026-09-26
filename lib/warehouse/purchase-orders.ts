import "server-only";

import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import { ApiError, NotFoundError, ValidationError } from "@/lib/core/http/errors";
import { audit, date, id, money, optionalText, quantity, recordRevision, requireRole, type Actor } from "@/lib/warehouse/core";

type NewLine = { productId: number; quantity: string; unitPrice: string };
function parseOrderLines(value: unknown): NewLine[] {
  if (!Array.isArray(value) || !value.length) throw new ValidationError({ lines: "Add at least one product." });
  const lines: NewLine[] = value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new ValidationError({ lines: "Each line must be an object." });
    const row = item as Record<string, unknown>;
    return { productId: id(row.productId, "productId"), quantity: quantity(row.quantity, "quantity"), unitPrice: money(row.unitPrice, "unitPrice") };
  });
  if (new Set(lines.map((line) => line.productId)).size !== lines.length) throw new ValidationError({ lines: "Each product may appear once per PO." });
  return lines;
}
export async function listPurchaseOrders(actor: Actor) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF", "EMPLOYEE"]);
  const result = await dbPool.query(`SELECT po.id,po.record_no,po.ordered_at,po.note,po.created_at,po.closed_at,
    s.name AS supplier_name, ceo_user.name AS ordered_by_ceo, recorder.name AS recorded_by,
    (SELECT count(*)::integer FROM app.carrier_receipts cr WHERE cr.purchase_order_id=po.id) AS carrier_receipt_count
    FROM app.purchase_orders po JOIN app.suppliers s ON s.id=po.supplier_id
    JOIN app.app_users ceo ON ceo.id=po.ordered_by_ceo_id JOIN public."user" ceo_user ON ceo_user.id=ceo.auth_user_id
    JOIN app.app_users recording_user ON recording_user.id=po.recorded_by_id JOIN public."user" recorder ON recorder.id=recording_user.auth_user_id
    ORDER BY po.id DESC LIMIT 500`);
  return result.rows;
}
export async function getPurchaseOrder(actor: Actor, poId: number) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF", "EMPLOYEE"]);
  const head = await dbPool.query(`SELECT po.*,s.code AS supplier_code,s.name AS supplier_name FROM app.purchase_orders po JOIN app.suppliers s ON s.id=po.supplier_id WHERE po.id=$1`, [poId]);
  if (!head.rowCount) throw new NotFoundError("Purchase order");
  const [lines, supplierReceipts, carrierReceipts, goodsReceipts, revisions] = await Promise.all([
    dbPool.query(`SELECT l.*,p.sku,p.name AS product_name,u.code AS unit_code,
      COALESCE((SELECT sum(srl.quantity) FROM app.supplier_receipt_lines srl WHERE srl.purchase_order_line_id=l.id),0) AS supplier_quantity,
      (SELECT sum(crl.quantity) FROM app.carrier_receipt_lines crl JOIN app.carrier_receipts cr ON cr.id=crl.carrier_receipt_id WHERE cr.purchase_order_id=l.purchase_order_id AND crl.product_id=l.product_id) AS carrier_document_quantity,
      COALESCE((SELECT sum(gl.good_quantity) FROM app.goods_receipt_lines gl JOIN app.goods_receipts gr ON gr.id=gl.goods_receipt_id WHERE gl.purchase_order_line_id=l.id AND gr.reversed_at IS NULL),0) AS counted_good_quantity,
      COALESCE((SELECT sum(gl.damaged_quantity) FROM app.goods_receipt_lines gl WHERE gl.purchase_order_line_id=l.id),0) AS damaged_quantity,
      COALESCE((SELECT sum(gl.wrong_quantity) FROM app.goods_receipt_lines gl WHERE gl.purchase_order_line_id=l.id),0) AS wrong_quantity,
      COALESCE((SELECT sum(gl.good_quantity) FROM app.goods_receipt_lines gl JOIN app.goods_receipts gr ON gr.id=gl.goods_receipt_id WHERE gl.purchase_order_line_id=l.id AND gr.posted_at IS NOT NULL AND gr.reversed_at IS NULL),0) AS posted_good_quantity,
      l.quantity-COALESCE((SELECT sum(gl.good_quantity) FROM app.goods_receipt_lines gl JOIN app.goods_receipts gr ON gr.id=gl.goods_receipt_id WHERE gl.purchase_order_line_id=l.id AND gr.reversed_at IS NULL),0) AS remaining_good_quantity
      FROM app.purchase_order_lines l JOIN app.products p ON p.id=l.product_id JOIN app.units u ON u.id=p.unit_id WHERE l.purchase_order_id=$1 ORDER BY l.id`, [poId]),
    dbPool.query(`SELECT * FROM app.supplier_receipts WHERE purchase_order_id=$1 ORDER BY id`, [poId]),
    dbPool.query(`SELECT cr.*,dc.receiving_branch_id,dc.received_at,dc.actual_package_count FROM app.carrier_receipts cr LEFT JOIN app.delivery_confirmations dc ON dc.carrier_receipt_id=cr.id WHERE cr.purchase_order_id=$1 ORDER BY cr.id`, [poId]),
    dbPool.query(`SELECT gr.* FROM app.goods_receipts gr JOIN app.carrier_receipts cr ON cr.id=gr.carrier_receipt_id WHERE cr.purchase_order_id=$1 ORDER BY gr.id`, [poId]),
    dbPool.query(`SELECT revision_no,before_data,after_data,changed_by_id,created_at FROM app.document_revisions WHERE entity_type='PURCHASE_ORDER' AND entity_id=$1 ORDER BY revision_no`, [poId]),
  ]);
  if (actor.role === "EMPLOYEE") {
    return {
      ...head.rows[0],
      lines: lines.rows.map((line) => Object.fromEntries(
        Object.entries(line).filter(([key]) => key !== "unit_price"),
      )),
      supplierReceipts: [],
      carrierReceipts: carrierReceipts.rows,
      goodsReceipts: [],
      revisions: [],
    };
  }
  return { ...head.rows[0], lines: lines.rows, supplierReceipts: supplierReceipts.rows, carrierReceipts: carrierReceipts.rows, goodsReceipts: goodsReceipts.rows, revisions: revisions.rows };
}

export async function createPurchaseOrder(actor: Actor, body: Record<string, unknown>) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const supplierId = id(body.supplierId, "supplierId");
  const orderedByCeoId = id(body.orderedByCeoId, "orderedByCeoId");
  const orderedAt = date(body.orderedAt, "orderedAt");
  const note = optionalText(body.note, "note");
  const lines = parseOrderLines(body.lines);
  const [supplier, ceo, products] = await Promise.all([
    dbPool.query(`SELECT 1 FROM app.suppliers WHERE id=$1 AND active`, [supplierId]),
    dbPool.query(`SELECT 1 FROM app.app_users WHERE id=$1 AND role='CEO' AND deleted_at IS NULL`, [orderedByCeoId]),
    dbPool.query(`SELECT id FROM app.products WHERE active AND id=ANY($1::integer[])`, [lines.map((line) => line.productId)]),
  ]);
  if (!supplier.rowCount) throw new ValidationError({ supplierId: "Choose an active supplier." });
  if (!ceo.rowCount) throw new ValidationError({ orderedByCeoId: "Choose the CEO who actually ordered." });
  if (products.rowCount !== lines.length) throw new ValidationError({ lines: "One or more products are missing or inactive." });
  const poId = await withTransaction(async (client) => {
    const created = await client.query<{ id: number }>(`INSERT INTO app.purchase_orders(supplier_id,ordered_at,ordered_by_ceo_id,recorded_by_id,note) VALUES ($1,$2,$3,$4,$5) RETURNING id`, [supplierId, orderedAt, orderedByCeoId, actor.id, note]);
    const newId = created.rows[0].id;
    for (const line of lines) await client.query(`INSERT INTO app.purchase_order_lines(purchase_order_id,product_id,quantity,unit_price) VALUES ($1,$2,$3,$4)`, [newId, line.productId, line.quantity, line.unitPrice]);
    await audit(client, actor, "PO_RECORDED", "purchase_orders", newId, { supplierId, orderedAt, orderedByCeoId, lines });
    return newId;
  });
  return getPurchaseOrder(actor, poId);
}

export async function updatePurchaseOrder(actor: Actor, poId: number, body: Record<string, unknown>) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  if (!Object.keys(body).length) throw new ValidationError({ body: "Enter fields to change." });
  const lines = body.lines === undefined ? null : parseOrderLines(body.lines);
  await withTransaction(async (client) => {
    const current = await client.query(`SELECT * FROM app.purchase_orders WHERE id=$1 FOR UPDATE`, [poId]);
    if (!current.rowCount) throw new NotFoundError("Purchase order");
    if (current.rows[0].closed_at) throw new ApiError(409, "PO_CLOSED", "Purchase order is closed.");
    const evidence = await client.query(`SELECT 1 FROM app.supplier_receipts WHERE purchase_order_id=$1 UNION ALL SELECT 1 FROM app.carrier_receipts WHERE purchase_order_id=$1 LIMIT 1`, [poId]);
    if (evidence.rowCount) throw new ApiError(409, "PO_HAS_EVIDENCE", "Create a correction report after documents have been linked.");
    const oldLines = await client.query(`SELECT product_id,quantity,unit_price FROM app.purchase_order_lines WHERE purchase_order_id=$1 ORDER BY id`, [poId]);
    const supplierId = body.supplierId === undefined ? current.rows[0].supplier_id : id(body.supplierId, "supplierId");
    const ceoId = body.orderedByCeoId === undefined ? current.rows[0].ordered_by_ceo_id : id(body.orderedByCeoId, "orderedByCeoId");
    const supplier = await client.query(`SELECT 1 FROM app.suppliers WHERE id=$1 AND active`, [supplierId]);
    const ceo = await client.query(`SELECT 1 FROM app.app_users WHERE id=$1 AND role='CEO' AND deleted_at IS NULL`, [ceoId]);
    if (!supplier.rowCount || !ceo.rowCount) throw new ValidationError({ header: "Choose an active supplier and CEO." });
    if (lines) {
      const products = await client.query(`SELECT id FROM app.products WHERE active AND id=ANY($1::integer[])`, [lines.map((line) => line.productId)]);
      if (products.rowCount !== lines.length) throw new ValidationError({ lines: "One or more products are inactive or missing." });
    }
    const updated = await client.query(`UPDATE app.purchase_orders SET supplier_id=$1,ordered_by_ceo_id=$2,ordered_at=$3,note=$4 WHERE id=$5 RETURNING *`, [supplierId, ceoId, body.orderedAt === undefined ? current.rows[0].ordered_at : date(body.orderedAt, "orderedAt"), body.note === undefined ? current.rows[0].note : optionalText(body.note, "note"), poId]);
    if (lines) {
      await client.query(`DELETE FROM app.purchase_order_lines WHERE purchase_order_id=$1`, [poId]);
      for (const line of lines) await client.query(`INSERT INTO app.purchase_order_lines(purchase_order_id,product_id,quantity,unit_price) VALUES ($1,$2,$3,$4)`, [poId, line.productId, line.quantity, line.unitPrice]);
    }
    const newLines = await client.query(`SELECT product_id,quantity,unit_price FROM app.purchase_order_lines WHERE purchase_order_id=$1 ORDER BY id`, [poId]);
    const beforeData = { header: current.rows[0], lines: oldLines.rows };
    const afterData = { header: updated.rows[0], lines: newLines.rows };
    await recordRevision(client, actor, "PURCHASE_ORDER", poId, beforeData, afterData);
    await audit(client, actor, "PO_REVISED", "purchase_orders", poId, afterData, beforeData);
  });
  return getPurchaseOrder(actor, poId);
}

export async function closePurchaseOrder(actor: Actor, poId: number) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER"]);
  const po = await getPurchaseOrder(actor, poId);
  if (po.closed_at) throw new ApiError(409, "PO_CLOSED", "Purchase order is already closed.");
  await withTransaction(async (client) => {
    await client.query(`UPDATE app.purchase_orders SET closed_at=now() WHERE id=$1`, [poId]);
    await audit(client, actor, "PO_CLOSED", "purchase_orders", poId);
  });
  return getPurchaseOrder(actor, poId);
}
