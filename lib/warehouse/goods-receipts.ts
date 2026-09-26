import "server-only";

import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import { ApiError, NotFoundError, ValidationError } from "@/lib/core/http/errors";
import { audit, id, idempotencyKey, optionalText, quantity, requireBranch, requireRole, text, type Actor } from "@/lib/warehouse/core";
import { attachEvidence } from "@/lib/warehouse/media";
import { postInventoryLine } from "@/lib/warehouse/ledger";

type CountLine = { poLineId: number; good: string; damaged: string; wrong: string; serialNumbers: string[]; note: string | null };
function parsedLines(value: unknown): CountLine[] {
  if (!Array.isArray(value) || !value.length) throw new ValidationError({ lines: "Enter at least one counted product." });
  const lines = value.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new ValidationError({ lines: "Each line must be an object." });
    const row = item as Record<string, unknown>;
    const good = quantity(row.goodQuantity ?? 0, "goodQuantity", true);
    const damaged = quantity(row.damagedQuantity ?? 0, "damagedQuantity", true);
    const wrong = quantity(row.wrongQuantity ?? 0, "wrongQuantity", true);
    if (Number(good) + Number(damaged) + Number(wrong) <= 0) throw new ValidationError({ lines: "A counted line needs a positive quantity." });
    if (row.serialNumbers != null && (!Array.isArray(row.serialNumbers) || row.serialNumbers.some((serial) => typeof serial !== "string" || !serial.trim()))) throw new ValidationError({ serialNumbers: "Use an array of serial numbers." });
    return { poLineId: id(row.purchaseOrderLineId, "purchaseOrderLineId"), good, damaged, wrong, serialNumbers: (row.serialNumbers as string[] | undefined ?? []).map((serial) => serial.trim()), note: optionalText(row.note, "note") };
  });
  if (new Set(lines.map((line) => line.poLineId)).size !== lines.length) throw new ValidationError({ lines: "Each PO line may appear once per count." });
  return lines;
}

export async function listGoodsReceipts(actor: Actor) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const result = await dbPool.query(`SELECT gr.*,cr.record_no AS carrier_receipt_no,po.record_no AS purchase_order_no,b.name AS branch_name,w.name AS warehouse_name
    FROM app.goods_receipts gr JOIN app.carrier_receipts cr ON cr.id=gr.carrier_receipt_id
    JOIN app.purchase_orders po ON po.id=cr.purchase_order_id JOIN app.branches b ON b.id=gr.receiving_branch_id
    JOIN app.warehouses w ON w.id=gr.warehouse_id
    WHERE ($1::boolean OR gr.receiving_branch_id=ANY($2::integer[])) ORDER BY gr.id DESC LIMIT 500`, [actor.role === "ADMIN" || actor.role === "CEO", actor.branchIds]);
  return result.rows;
}
export async function getGoodsReceipt(actor: Actor, receiptId: number) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const head = await dbPool.query(`SELECT gr.*,cr.purchase_order_id,cr.record_no AS carrier_receipt_no FROM app.goods_receipts gr JOIN app.carrier_receipts cr ON cr.id=gr.carrier_receipt_id WHERE gr.id=$1`, [receiptId]);
  if (!head.rowCount) throw new NotFoundError("Goods receipt");
  requireBranch(actor, head.rows[0].receiving_branch_id);
  const [lines, discrepancies, media, issues] = await Promise.all([
    dbPool.query(`SELECT gl.*,p.sku,p.name AS product_name FROM app.goods_receipt_lines gl JOIN app.purchase_order_lines pl ON pl.id=gl.purchase_order_line_id JOIN app.products p ON p.id=pl.product_id WHERE gl.goods_receipt_id=$1 ORDER BY gl.id`, [receiptId]),
    dbPool.query(`SELECT d.* FROM app.receipt_discrepancies d JOIN app.goods_receipt_lines gl ON gl.id=d.goods_receipt_line_id WHERE gl.goods_receipt_id=$1 ORDER BY d.id`, [receiptId]),
    dbPool.query(`SELECT e.media_asset_id,e.page_number,m.sha256,m.mime_type FROM app.evidence_links e JOIN app.media_assets m ON m.id=e.media_asset_id WHERE e.goods_receipt_id=$1 ORDER BY e.page_number`, [receiptId]),
    dbPool.query(`SELECT id,title,status FROM app.issue_reports WHERE goods_receipt_id=$1 ORDER BY id`, [receiptId]),
  ]);
  return { ...head.rows[0], lines: lines.rows, discrepancies: discrepancies.rows, media: media.rows, issues: issues.rows };
}
export async function createGoodsReceipt(actor: Actor, body: Record<string, unknown>) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const carrierId = id(body.carrierReceiptId, "carrierReceiptId");
  const warehouseId = id(body.warehouseId, "warehouseId");
  const lines = parsedLines(body.lines);
  const reference = await dbPool.query<{ purchase_order_id: number; receiving_branch_id: number }>(`
    SELECT cr.purchase_order_id,dc.receiving_branch_id FROM app.carrier_receipts cr JOIN app.delivery_confirmations dc ON dc.carrier_receipt_id=cr.id WHERE cr.id=$1`, [carrierId]);
  if (!reference.rowCount) throw new ApiError(409, "DELIVERY_NOT_CONFIRMED", "Confirm delivery from the carrier first.");
  const branchId = reference.rows[0].receiving_branch_id;
  requireBranch(actor, branchId);
  const warehouse = await dbPool.query(`SELECT id FROM app.warehouses WHERE id=$1 AND branch_id=$2 AND active`, [warehouseId, branchId]);
  if (!warehouse.rowCount) throw new ValidationError({ warehouseId: "Choose an active warehouse in the receiving branch." });
  const poLines = await dbPool.query<{ id: number; serial_tracked: boolean }>(`SELECT pl.id,p.serial_tracked FROM app.purchase_order_lines pl JOIN app.products p ON p.id=pl.product_id WHERE pl.purchase_order_id=$1`, [reference.rows[0].purchase_order_id]);
  const poMap = new Map(poLines.rows.map((row) => [row.id, row.serial_tracked]));
  for (const line of lines) {
    if (!poMap.has(line.poLineId)) throw new ValidationError({ lines: "A counted product does not belong to this PO." });
    if (poMap.get(line.poLineId) && (!Number.isInteger(Number(line.good)) || line.serialNumbers.length !== Number(line.good))) throw new ValidationError({ serialNumbers: "Provide one serial for each good serial-tracked item." });
    if (!poMap.get(line.poLineId) && line.serialNumbers.length) throw new ValidationError({ serialNumbers: "This product does not track serials." });
    if (new Set(line.serialNumbers).size !== line.serialNumbers.length) throw new ValidationError({ serialNumbers: "Serial numbers must be unique." });
  }
  const hasDamage = lines.some((line) => Number(line.damaged) + Number(line.wrong) > 0);
  if (hasDamage && (!Array.isArray(body.mediaAssetIds) || !body.mediaAssetIds.length)) throw new ValidationError({ mediaAssetIds: "Attach photos of damaged or wrong products." });
  const issueTitle = hasDamage ? text(body.issueTitle, "issueTitle", 200) : null;
  const issueDetail = hasDamage ? text(body.issueDetail, "issueDetail", 10000) : null;
  const receiptId = await withTransaction(async (client) => {
    const created = await client.query<{ id: number }>(`INSERT INTO app.goods_receipts(carrier_receipt_id,receiving_branch_id,warehouse_id,counted_by_id,note) VALUES ($1,$2,$3,$4,$5) RETURNING id`, [carrierId, branchId, warehouseId, actor.id, optionalText(body.note, "note")]);
    const newId = created.rows[0].id;
    for (const line of lines) {
      const saved = await client.query<{ id: number }>(`INSERT INTO app.goods_receipt_lines(goods_receipt_id,purchase_order_line_id,good_quantity,damaged_quantity,wrong_quantity,serial_numbers,note) VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`, [newId, line.poLineId, line.good, line.damaged, line.wrong, line.serialNumbers, line.note]);
      if (Number(line.damaged) > 0) await client.query(`INSERT INTO app.receipt_discrepancies(goods_receipt_line_id,kind,quantity,detail) VALUES ($1,'DAMAGED',$2,$3)`, [saved.rows[0].id, line.damaged, line.note]);
      if (Number(line.wrong) > 0) await client.query(`INSERT INTO app.receipt_discrepancies(goods_receipt_line_id,kind,quantity,detail) VALUES ($1,'WRONG_ITEM',$2,$3)`, [saved.rows[0].id, line.wrong, line.note]);
    }
    await attachEvidence(client, actor, "goods_receipt_id", newId, body.mediaAssetIds, hasDamage);
    if (hasDamage) {
      const amount = await client.query<{ quantity: string }>(`SELECT sum(damaged_quantity+wrong_quantity)::numeric AS quantity FROM app.goods_receipt_lines WHERE goods_receipt_id=$1`, [newId]);
      const issue = await client.query<{ id: number }>(`INSERT INTO app.issue_reports(title,detail,kind,purchase_order_id,carrier_receipt_id,goods_receipt_id,quantity,reported_by_id) VALUES ($1,$2,'GOODS_DISCREPANCY',$3,$4,$5,$6,$7) RETURNING id`, [issueTitle, issueDetail, reference.rows[0].purchase_order_id, carrierId, newId, amount.rows[0].quantity, actor.id]);
      await client.query(`INSERT INTO app.issue_events(issue_report_id,status,note,performed_by_id) VALUES ($1,'OPEN',$2,$3)`, [issue.rows[0].id, issueDetail, actor.id]);
      await attachEvidence(client, actor, "issue_report_id", issue.rows[0].id, body.mediaAssetIds, true);
      await audit(client, actor, "ISSUE_REPORTED", "issue_reports", issue.rows[0].id, { goodsReceiptId: newId, title: issueTitle });
    }
    await audit(client, actor, "GOODS_COUNTED", "goods_receipts", newId, { carrierId, branchId, warehouseId, lines });
    return newId;
  });
  return getGoodsReceipt(actor, receiptId);
}

export async function postGoodsReceipt(actor: Actor, receiptId: number, key: string) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  idempotencyKey(key);
  const documentId = await withTransaction(async (client) => {
    const receipt = await client.query<{ id: number; carrier_receipt_id: number; receiving_branch_id: number; warehouse_id: number; posted_at: Date | null; purchase_order_id: number }>(`
      SELECT gr.*,cr.purchase_order_id FROM app.goods_receipts gr JOIN app.carrier_receipts cr ON cr.id=gr.carrier_receipt_id WHERE gr.id=$1 FOR UPDATE OF gr`, [receiptId]);
    if (!receipt.rowCount) throw new NotFoundError("Goods receipt");
    const gr = receipt.rows[0];
    requireBranch(actor, gr.receiving_branch_id);
    const po = await client.query<{ closed_at: Date | null }>(`SELECT closed_at FROM app.purchase_orders WHERE id=$1 FOR UPDATE`, [gr.purchase_order_id]);
    const prior = await client.query<{ operation: string; result_entity_id: number }>(`SELECT operation,result_entity_id FROM app.idempotency_keys WHERE key=$1 FOR UPDATE`, [key]);
    if (prior.rowCount) {
      if (prior.rows[0].operation !== `POST_GOODS_RECEIPT:${receiptId}`) throw new ApiError(409, "IDEMPOTENCY_CONFLICT", "This key was used for another operation.");
      return prior.rows[0].result_entity_id;
    }
    if (gr.posted_at) {
      const existing = await client.query<{ id: number }>(`SELECT id FROM app.inventory_documents WHERE goods_receipt_id=$1`, [receiptId]);
      return existing.rows[0].id;
    }
    if (po.rows[0].closed_at) throw new ApiError(409, "PO_CLOSED", "Purchase order is closed.");
    const lines = await client.query<{ id: number; purchase_order_line_id: number; product_id: number; good_quantity: string; unit_price: string; serial_numbers: string[]; ordered_quantity: string }>(`
      SELECT gl.id,gl.purchase_order_line_id,pl.product_id,gl.good_quantity,pl.unit_price,gl.serial_numbers,pl.quantity AS ordered_quantity
      FROM app.goods_receipt_lines gl JOIN app.purchase_order_lines pl ON pl.id=gl.purchase_order_line_id
      WHERE gl.goods_receipt_id=$1 ORDER BY gl.id`, [receiptId]);
    for (const line of lines.rows) {
      const previous = await client.query<{ allowed: boolean }>(`
        SELECT COALESCE(sum(other_line.good_quantity),0)+$2::numeric<=$3::numeric AS allowed
        FROM app.goods_receipt_lines other_line JOIN app.goods_receipts other_receipt ON other_receipt.id=other_line.goods_receipt_id
        WHERE other_line.purchase_order_line_id=$1 AND other_receipt.posted_at IS NOT NULL AND other_receipt.reversed_at IS NULL`, [line.purchase_order_line_id, line.good_quantity, line.ordered_quantity]);
      if (!previous.rows[0].allowed) throw new ApiError(409, "PO_QUANTITY_EXCEEDED", "Good quantity would exceed the ordered quantity.");
    }
    const doc = await client.query<{ id: number }>(`INSERT INTO app.inventory_documents(kind,warehouse_id,goods_receipt_id,posted_by_id) VALUES ('GOODS_RECEIPT',$1,$2,$3) RETURNING id`, [gr.warehouse_id, receiptId, actor.id]);
    const newDocId = doc.rows[0].id;
    for (const line of lines.rows) {
      if (Number(line.good_quantity) <= 0) continue;
      await postInventoryLine(client, {
        documentId: newDocId,
        warehouseId: gr.warehouse_id,
        productId: line.product_id,
        quantity: line.good_quantity,
        unitCost: line.unit_price,
        serialNumbers: line.serial_numbers,
      });
      for (const serial of line.serial_numbers) await client.query(`INSERT INTO app.product_serials(product_id,serial_no,warehouse_id,received_at) VALUES ($1,$2,$3,now())`, [line.product_id, serial, gr.warehouse_id]);
    }
    await client.query(`UPDATE app.goods_receipts SET posted_at=now(),posted_by_id=$1 WHERE id=$2`, [actor.id, receiptId]);
    await client.query(`INSERT INTO app.idempotency_keys(key,actor_user_id,operation,result_entity_id) VALUES ($1,$2,$3,$4)`, [key, actor.id, `POST_GOODS_RECEIPT:${receiptId}`, newDocId]);
    await audit(client, actor, "STOCK_POSTED", "inventory_documents", newDocId, { goodsReceiptId: receiptId });
    return newDocId;
  });
  return { inventoryDocumentId: documentId, goodsReceipt: await getGoodsReceipt(actor, receiptId) };
}
