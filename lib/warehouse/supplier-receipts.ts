import "server-only";

import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import { ApiError, NotFoundError, ValidationError } from "@/lib/core/http/errors";
import { audit, id, money, optionalDate, optionalMoney, optionalText, quantity, recordRevision, requireRole, type Actor } from "@/lib/warehouse/core";
import { duplicateWarnings } from "@/lib/warehouse/document-support";
import { attachEvidence } from "@/lib/warehouse/media";

export async function listSupplierReceipts(actor: Actor) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  return (await dbPool.query(`SELECT sr.*,po.record_no AS purchase_order_no,s.name AS supplier_name FROM app.supplier_receipts sr JOIN app.purchase_orders po ON po.id=sr.purchase_order_id JOIN app.suppliers s ON s.id=sr.supplier_id ORDER BY sr.id DESC LIMIT 500`)).rows;
}
export async function getSupplierReceipt(actor: Actor, receiptId: number) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const head = await dbPool.query(`SELECT * FROM app.supplier_receipts WHERE id=$1`, [receiptId]);
  if (!head.rowCount) throw new NotFoundError("Supplier receipt");
  const [lines, media, revisions] = await Promise.all([
    dbPool.query(`SELECT l.*,p.sku,p.name AS product_name FROM app.supplier_receipt_lines l JOIN app.products p ON p.id=l.product_id WHERE l.supplier_receipt_id=$1 ORDER BY l.id`, [receiptId]),
    dbPool.query(`SELECT e.media_asset_id,e.page_number,m.sha256,m.mime_type FROM app.evidence_links e JOIN app.media_assets m ON m.id=e.media_asset_id WHERE e.supplier_receipt_id=$1 ORDER BY e.page_number`, [receiptId]),
    dbPool.query(`SELECT revision_no,before_data,after_data,changed_by_id,created_at FROM app.document_revisions WHERE entity_type='SUPPLIER_RECEIPT' AND entity_id=$1 ORDER BY revision_no`, [receiptId]),
  ]);
  return { ...head.rows[0], lines: lines.rows, media: media.rows, revisions: revisions.rows };
}

export async function updateSupplierReceipt(actor: Actor, receiptId: number, body: Record<string, unknown>) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const allowed = ["externalDocNo", "documentDate", "totalAmount", "note", "lines", "mediaAssetIds"];
  if (!Object.keys(body).length || Object.keys(body).some((key) => !allowed.includes(key))) throw new ValidationError({ body: "Only supplier document fields and additional evidence may be revised." });
  await withTransaction(async (client) => {
    const current = await client.query(`SELECT * FROM app.supplier_receipts WHERE id=$1 FOR UPDATE`, [receiptId]);
    if (!current.rowCount) throw new NotFoundError("Supplier receipt");
    const oldLines = await client.query(`SELECT purchase_order_line_id,product_id,quantity,unit_price FROM app.supplier_receipt_lines WHERE supplier_receipt_id=$1 ORDER BY id`, [receiptId]);
    const oldMedia = await client.query(`SELECT media_asset_id,page_number FROM app.evidence_links WHERE supplier_receipt_id=$1 ORDER BY page_number`, [receiptId]);
    const row = current.rows[0];
    const updated = await client.query(`UPDATE app.supplier_receipts SET external_doc_no=$1,document_date=$2,total_amount=$3,note=$4 WHERE id=$5 RETURNING *`, [body.externalDocNo === undefined ? row.external_doc_no : optionalText(body.externalDocNo, "externalDocNo", 100), body.documentDate === undefined ? row.document_date : optionalDate(body.documentDate, "documentDate"), body.totalAmount === undefined ? row.total_amount : optionalMoney(body.totalAmount, "totalAmount"), body.note === undefined ? row.note : optionalText(body.note, "note"), receiptId]);
    if (body.lines !== undefined) {
      if (!Array.isArray(body.lines) || !body.lines.length) throw new ValidationError({ lines: "Enter at least one supplier line." });
      const poLines = await client.query<{ id: number; product_id: number }>(`SELECT id,product_id FROM app.purchase_order_lines WHERE purchase_order_id=$1`, [row.purchase_order_id]);
      const productByLine = new Map(poLines.rows.map((line) => [line.id, line.product_id]));
      const lines = body.lines.map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) throw new ValidationError({ lines: "Each line must be an object." });
        const input = item as Record<string, unknown>;
        const poLineId = id(input.purchaseOrderLineId, "purchaseOrderLineId");
        if (!productByLine.has(poLineId)) throw new ValidationError({ lines: "A line does not belong to this PO." });
        return { poLineId, productId: productByLine.get(poLineId), amount: quantity(input.quantity, "quantity", true), price: input.unitPrice == null ? null : money(input.unitPrice, "unitPrice") };
      });
      await client.query(`DELETE FROM app.supplier_receipt_lines WHERE supplier_receipt_id=$1`, [receiptId]);
      for (const line of lines) await client.query(`INSERT INTO app.supplier_receipt_lines(supplier_receipt_id,purchase_order_line_id,product_id,quantity,unit_price) VALUES ($1,$2,$3,$4,$5)`, [receiptId, line.poLineId, line.productId, line.amount, line.price]);
    }
    if (body.mediaAssetIds !== undefined) await attachEvidence(client, actor, "supplier_receipt_id", receiptId, body.mediaAssetIds);
    const newLines = await client.query(`SELECT purchase_order_line_id,product_id,quantity,unit_price FROM app.supplier_receipt_lines WHERE supplier_receipt_id=$1 ORDER BY id`, [receiptId]);
    const newMedia = await client.query(`SELECT media_asset_id,page_number FROM app.evidence_links WHERE supplier_receipt_id=$1 ORDER BY page_number`, [receiptId]);
    const beforeData = { header: row, lines: oldLines.rows, media: oldMedia.rows };
    const afterData = { header: updated.rows[0], lines: newLines.rows, media: newMedia.rows };
    await recordRevision(client, actor, "SUPPLIER_RECEIPT", receiptId, beforeData, afterData);
    await audit(client, actor, "SUPPLIER_RECEIPT_REVISED", "supplier_receipts", receiptId, afterData, beforeData);
  });
  return getSupplierReceipt(actor, receiptId);
}
export async function createSupplierReceipt(actor: Actor, body: Record<string, unknown>) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const poId = id(body.purchaseOrderId, "purchaseOrderId");
  const po = await dbPool.query<{ supplier_id: number; closed_at: Date | null }>(`SELECT supplier_id,closed_at FROM app.purchase_orders WHERE id=$1`, [poId]);
  if (!po.rowCount) throw new NotFoundError("Purchase order");
  if (po.rows[0].closed_at) throw new ApiError(409, "PO_CLOSED", "Purchase order is closed.");
  const supplierId = id(body.supplierId, "supplierId");
  if (supplierId !== po.rows[0].supplier_id) throw new ValidationError({ supplierId: "Supplier must match the purchase order." });
  const externalDocNo = optionalText(body.externalDocNo, "externalDocNo", 100);
  const warnings = await duplicateWarnings("supplier", externalDocNo, supplierId, body.mediaAssetIds);
  if (!Array.isArray(body.lines) || !body.lines.length) throw new ValidationError({ lines: "Enter the supplier document lines." });
  const lines = body.lines.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError({ lines: "Each line must be an object." });
    const row = value as Record<string, unknown>;
    return { poLineId: id(row.purchaseOrderLineId, "purchaseOrderLineId"), quantity: quantity(row.quantity, "quantity", true), unitPrice: row.unitPrice == null ? null : money(row.unitPrice, "unitPrice") };
  });
  const receiptId = await withTransaction(async (client) => {
    const lockedPo = await client.query<{ closed_at: Date | null; supplier_id: number }>(`SELECT closed_at,supplier_id FROM app.purchase_orders WHERE id=$1 FOR UPDATE`, [poId]);
    if (lockedPo.rows[0].closed_at || lockedPo.rows[0].supplier_id !== supplierId) throw new ApiError(409, "PO_CHANGED", "Purchase order changed or closed. Reload and try again.");
    const poLines = await client.query<{ id: number; product_id: number }>(`SELECT id,product_id FROM app.purchase_order_lines WHERE purchase_order_id=$1`, [poId]);
    const productByLine = new Map(poLines.rows.map((line) => [line.id, line.product_id]));
    if (lines.some((line) => !productByLine.has(line.poLineId))) throw new ValidationError({ lines: "A line does not belong to this purchase order." });
    const result = await client.query<{ id: number }>(`INSERT INTO app.supplier_receipts(purchase_order_id,supplier_id,external_doc_no,document_date,total_amount,note,recorded_by_id) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`, [poId, supplierId, externalDocNo, optionalDate(body.documentDate, "documentDate"), optionalMoney(body.totalAmount, "totalAmount"), optionalText(body.note, "note"), actor.id]);
    const newId = result.rows[0].id;
    for (const line of lines) await client.query(`INSERT INTO app.supplier_receipt_lines(supplier_receipt_id,purchase_order_line_id,product_id,quantity,unit_price) VALUES ($1,$2,$3,$4,$5)`, [newId, line.poLineId, productByLine.get(line.poLineId), line.quantity, line.unitPrice]);
    await attachEvidence(client, actor, "supplier_receipt_id", newId, body.mediaAssetIds, true);
    await audit(client, actor, "SUPPLIER_RECEIPT_RECORDED", "supplier_receipts", newId, { purchaseOrderId: poId, lines });
    return newId;
  });
  return { ...await getSupplierReceipt(actor, receiptId), warnings };
}

