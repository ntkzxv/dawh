import "server-only";

import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import { ApiError, NotFoundError, ValidationError } from "@/lib/core/http/errors";
import { audit, id, optionalCount, optionalDate, optionalMoney, optionalText, quantity, recordRevision, requireBranch, requireRole, text, type Actor } from "@/lib/warehouse/core";
import { duplicateWarnings } from "@/lib/warehouse/document-support";
import { attachEvidence } from "@/lib/warehouse/media";

export async function listCarrierReceipts(actor: Actor) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF", "EMPLOYEE"]);
  return (await dbPool.query(`SELECT cr.*,po.record_no AS purchase_order_no,dc.receiving_branch_id,dc.received_at,dc.actual_package_count FROM app.carrier_receipts cr JOIN app.purchase_orders po ON po.id=cr.purchase_order_id LEFT JOIN app.delivery_confirmations dc ON dc.carrier_receipt_id=cr.id ORDER BY cr.id DESC LIMIT 500`)).rows;
}
export async function getCarrierReceipt(actor: Actor, receiptId: number) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF", "EMPLOYEE"]);
  const head = await dbPool.query(`SELECT cr.*,po.record_no AS purchase_order_no FROM app.carrier_receipts cr JOIN app.purchase_orders po ON po.id=cr.purchase_order_id WHERE cr.id=$1`, [receiptId]);
  if (!head.rowCount) throw new NotFoundError("Carrier receipt");
  const [lines, confirmation, media, revisions] = await Promise.all([
    dbPool.query(`SELECT l.*,p.sku,p.name AS product_name FROM app.carrier_receipt_lines l JOIN app.products p ON p.id=l.product_id WHERE l.carrier_receipt_id=$1 ORDER BY l.id`, [receiptId]),
    dbPool.query(`SELECT * FROM app.delivery_confirmations WHERE carrier_receipt_id=$1`, [receiptId]),
    dbPool.query(`SELECT e.media_asset_id,e.page_number,m.sha256,m.mime_type FROM app.evidence_links e JOIN app.media_assets m ON m.id=e.media_asset_id WHERE e.carrier_receipt_id=$1 ORDER BY e.page_number`, [receiptId]),
    dbPool.query(`SELECT revision_no,before_data,after_data,changed_by_id,created_at FROM app.document_revisions WHERE entity_type='CARRIER_RECEIPT' AND entity_id=$1 ORDER BY revision_no`, [receiptId]),
  ]);
  return { ...head.rows[0], lines: lines.rows, confirmation: confirmation.rows[0] ?? null, media: media.rows, revisions: revisions.rows };
}

export async function updateCarrierReceipt(actor: Actor, receiptId: number, body: Record<string, unknown>) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF", "EMPLOYEE"]);
  const allowed = ["externalDocNo", "documentDate", "carrierName", "trackingNo", "packageCount", "freightAmount", "note", "lines", "mediaAssetIds"];
  if (!Object.keys(body).length || Object.keys(body).some((key) => !allowed.includes(key))) throw new ValidationError({ body: "Only carrier document fields and additional evidence may be revised." });
  await withTransaction(async (client) => {
    const current = await client.query(`SELECT * FROM app.carrier_receipts WHERE id=$1 FOR UPDATE`, [receiptId]);
    if (!current.rowCount) throw new NotFoundError("Carrier receipt");
    const confirmation = await client.query(`SELECT id,receiving_branch_id FROM app.delivery_confirmations WHERE carrier_receipt_id=$1`, [receiptId]);
    if (confirmation.rowCount) {
      requireBranch(actor, confirmation.rows[0].receiving_branch_id);
      if (body.lines !== undefined || body.packageCount !== undefined) throw new ApiError(409, "DELIVERY_CONFIRMED", "Carrier quantities cannot change after delivery confirmation.");
    }
    const row = current.rows[0];
    const oldLines = await client.query(`SELECT product_id,quantity FROM app.carrier_receipt_lines WHERE carrier_receipt_id=$1 ORDER BY id`, [receiptId]);
    const oldMedia = await client.query(`SELECT media_asset_id,page_number FROM app.evidence_links WHERE carrier_receipt_id=$1 ORDER BY page_number`, [receiptId]);
    const updated = await client.query(`UPDATE app.carrier_receipts SET external_doc_no=$1,document_date=$2,carrier_name=$3,tracking_no=$4,package_count=$5,freight_amount=$6,note=$7 WHERE id=$8 RETURNING *`, [body.externalDocNo === undefined ? row.external_doc_no : optionalText(body.externalDocNo, "externalDocNo", 100), body.documentDate === undefined ? row.document_date : optionalDate(body.documentDate, "documentDate"), body.carrierName === undefined ? row.carrier_name : optionalText(body.carrierName, "carrierName", 160), body.trackingNo === undefined ? row.tracking_no : optionalText(body.trackingNo, "trackingNo", 160), body.packageCount === undefined ? row.package_count : optionalCount(body.packageCount, "packageCount"), body.freightAmount === undefined ? row.freight_amount : optionalMoney(body.freightAmount, "freightAmount"), body.note === undefined ? row.note : optionalText(body.note, "note"), receiptId]);
    if (body.lines !== undefined) {
      if (!Array.isArray(body.lines)) throw new ValidationError({ lines: "Use an array; leave it empty if the document has no SKU." });
      await client.query(`DELETE FROM app.carrier_receipt_lines WHERE carrier_receipt_id=$1`, [receiptId]);
      for (const item of body.lines) {
        if (!item || typeof item !== "object" || Array.isArray(item)) throw new ValidationError({ lines: "Each line must be an object." });
        const input = item as Record<string, unknown>;
        await client.query(`INSERT INTO app.carrier_receipt_lines(carrier_receipt_id,product_id,quantity) VALUES ($1,$2,$3)`, [receiptId, id(input.productId, "productId"), input.quantity == null ? null : quantity(input.quantity, "quantity", true)]);
      }
    }
    if (body.mediaAssetIds !== undefined) await attachEvidence(client, actor, "carrier_receipt_id", receiptId, body.mediaAssetIds);
    const newLines = await client.query(`SELECT product_id,quantity FROM app.carrier_receipt_lines WHERE carrier_receipt_id=$1 ORDER BY id`, [receiptId]);
    const newMedia = await client.query(`SELECT media_asset_id,page_number FROM app.evidence_links WHERE carrier_receipt_id=$1 ORDER BY page_number`, [receiptId]);
    const beforeData = { header: row, lines: oldLines.rows, media: oldMedia.rows };
    const afterData = { header: updated.rows[0], lines: newLines.rows, media: newMedia.rows };
    await recordRevision(client, actor, "CARRIER_RECEIPT", receiptId, beforeData, afterData);
    await audit(client, actor, "CARRIER_RECEIPT_REVISED", "carrier_receipts", receiptId, afterData, beforeData);
  });
  return getCarrierReceipt(actor, receiptId);
}
export async function createCarrierReceipt(actor: Actor, body: Record<string, unknown>) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF", "EMPLOYEE"]);
  const poCode = text(body.purchaseOrderCode, "purchaseOrderCode", 50).toUpperCase();
  const po = await dbPool.query<{ id: number; closed_at: Date | null }>(`SELECT id,closed_at FROM app.purchase_orders WHERE record_no=$1`, [poCode]);
  if (!po.rowCount) throw new NotFoundError("Purchase order");
  if (po.rows[0].closed_at) throw new ApiError(409, "PO_CLOSED", "Purchase order is closed.");
  const externalDocNo = optionalText(body.externalDocNo, "externalDocNo", 100);
  const warnings = await duplicateWarnings("carrier", externalDocNo, null, body.mediaAssetIds);
  const rawLines = body.lines == null ? [] : body.lines;
  if (!Array.isArray(rawLines)) throw new ValidationError({ lines: "Use an array of lines or leave it empty if the carrier document has no SKU." });
  const lines = rawLines.map((value) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError({ lines: "Each line must be an object." });
    const row = value as Record<string, unknown>;
    return { productId: id(row.productId, "productId"), quantity: row.quantity == null ? null : quantity(row.quantity, "quantity", true) };
  });
  const receiptId = await withTransaction(async (client) => {
    const lockedPo = await client.query<{ closed_at: Date | null }>(`SELECT closed_at FROM app.purchase_orders WHERE id=$1 FOR UPDATE`, [po.rows[0].id]);
    if (lockedPo.rows[0].closed_at) throw new ApiError(409, "PO_CLOSED", "Purchase order is closed.");
    const created = await client.query<{ id: number }>(`INSERT INTO app.carrier_receipts(purchase_order_id,external_doc_no,document_date,carrier_name,tracking_no,package_count,freight_amount,note,recorded_by_id) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`, [po.rows[0].id, externalDocNo, optionalDate(body.documentDate, "documentDate"), optionalText(body.carrierName, "carrierName", 160), optionalText(body.trackingNo, "trackingNo", 160), optionalCount(body.packageCount, "packageCount"), optionalMoney(body.freightAmount, "freightAmount"), optionalText(body.note, "note"), actor.id]);
    const newId = created.rows[0].id;
    for (const line of lines) await client.query(`INSERT INTO app.carrier_receipt_lines(carrier_receipt_id,product_id,quantity) VALUES ($1,$2,$3)`, [newId, line.productId, line.quantity]);
    await attachEvidence(client, actor, "carrier_receipt_id", newId, body.mediaAssetIds, true);
    await audit(client, actor, "CARRIER_RECEIPT_RECORDED", "carrier_receipts", newId, { purchaseOrderCode: poCode, lines });
    return newId;
  });
  return { ...await getCarrierReceipt(actor, receiptId), warnings };
}
export async function confirmDelivery(actor: Actor, receiptId: number, body: Record<string, unknown>) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF", "EMPLOYEE"]);
  const branchId = id(body.receivingBranchId, "receivingBranchId");
  requireBranch(actor, branchId);
  const packageCount = optionalCount(body.actualPackageCount, "actualPackageCount");
  if (packageCount == null) throw new ValidationError({ actualPackageCount: "Enter the number of packages received." });
  const condition = text(body.packageCondition, "packageCondition", 500);
  const result = await withTransaction(async (client) => {
    const carrier = await client.query(`SELECT id FROM app.carrier_receipts WHERE id=$1 FOR UPDATE`, [receiptId]);
    if (!carrier.rowCount) throw new NotFoundError("Carrier receipt");
    const existing = await client.query(`SELECT id FROM app.delivery_confirmations WHERE carrier_receipt_id=$1`, [receiptId]);
    if (existing.rowCount) throw new ApiError(409, "ALREADY_CONFIRMED", "Delivery is already confirmed.");
    const branch = await client.query(`SELECT id FROM app.branches WHERE id=$1 AND active`, [branchId]);
    if (!branch.rowCount) throw new ValidationError({ receivingBranchId: "Choose an active branch." });
    const created = await client.query<{ id: number }>(`INSERT INTO app.delivery_confirmations(carrier_receipt_id,receiving_branch_id,received_by_id,actual_package_count,package_condition,note) VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`, [receiptId, branchId, actor.id, packageCount, condition, optionalText(body.note, "note")]);
    await attachEvidence(client, actor, "delivery_confirmation_id", created.rows[0].id, body.mediaAssetIds);
    await audit(client, actor, "DELIVERY_CONFIRMED", "delivery_confirmations", created.rows[0].id, { carrierReceiptId: receiptId, branchId, packageCount, condition });
    return created.rows[0].id;
  });
  return (await dbPool.query(`SELECT * FROM app.delivery_confirmations WHERE id=$1`, [result])).rows[0];
}
