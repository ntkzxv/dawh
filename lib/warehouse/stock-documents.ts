import "server-only";

import { createHash } from "node:crypto";
import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import { ApiError, NotFoundError, ValidationError } from "@/lib/core/http/errors";
import { audit, id, idempotencyKey, optionalText, quantity, requireBranch, requireRole, type Actor } from "@/lib/warehouse/core";
import { postInventoryLine } from "@/lib/warehouse/ledger";

type Kind = "ISSUE" | "ADJUSTMENT" | "TRANSFER";
type Line = { productId: number; delta: string; serialNumbers: string[] };
function parseLines(kind: Kind, raw: unknown): Line[] {
  if (!Array.isArray(raw) || !raw.length) throw new ValidationError({ lines: "Enter at least one product." });
  const lines = raw.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) throw new ValidationError({ lines: "Each line must be an object." });
    const row = item as Record<string, unknown>;
    let delta: string;
    if (kind === "ADJUSTMENT") {
      const value = String(row.quantityDelta ?? "");
      if (!/^-?\d{1,15}(?:\.\d{1,3})?$/.test(value) || Number(value) === 0) throw new ValidationError({ quantityDelta: "Use a nonzero quantity with at most three decimals." });
      delta = value;
    } else delta = `-${quantity(row.quantity, "quantity")}`;
    if (row.serialNumbers != null && (!Array.isArray(row.serialNumbers) || row.serialNumbers.some((serial) => typeof serial !== "string" || !serial.trim()))) throw new ValidationError({ serialNumbers: "Use an array of serials." });
    return { productId: id(row.productId, "productId"), delta, serialNumbers: (row.serialNumbers as string[] | undefined ?? []).map((serial) => serial.trim()) };
  });
  if (new Set(lines.map((line) => line.productId)).size !== lines.length) throw new ValidationError({ lines: "Use one line per product." });
  return lines;
}
export async function postStockDocument(actor: Actor, body: Record<string, unknown>, key: string) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER"]);
  idempotencyKey(key);
  const kind = body.kind;
  if (kind !== "ISSUE" && kind !== "ADJUSTMENT" && kind !== "TRANSFER") throw new ValidationError({ kind: "Choose ISSUE, ADJUSTMENT or TRANSFER." });
  const warehouseId = id(body.warehouseId, "warehouseId");
  const destinationId = kind === "TRANSFER" ? id(body.destinationWarehouseId, "destinationWarehouseId") : null;
  if (destinationId === warehouseId) throw new ValidationError({ destinationWarehouseId: "Choose another warehouse." });
  const reason = optionalText(body.reason, "reason", 2000);
  if (!reason) throw new ValidationError({ reason: "Enter the reason for the movement." });
  const lines = parseLines(kind, body.lines);
  const warehouses = await dbPool.query<{ id: number; branch_id: number }>(`SELECT id,branch_id FROM app.warehouses WHERE id=ANY($1::integer[]) AND active`, [[warehouseId, ...(destinationId ? [destinationId] : [])]]);
  if (warehouses.rowCount !== (destinationId ? 2 : 1)) throw new ValidationError({ warehouseId: "Choose active warehouses." });
  for (const warehouse of warehouses.rows) requireBranch(actor, warehouse.branch_id);
  const products = await dbPool.query<{ id: number; serial_tracked: boolean }>(`SELECT id,serial_tracked FROM app.products WHERE id=ANY($1::integer[]) AND active`, [lines.map((line) => line.productId)]);
  if (products.rowCount !== lines.length) throw new ValidationError({ lines: "One or more products are inactive or missing." });
  const tracked = new Map(products.rows.map((product) => [product.id, product.serial_tracked]));
  for (const line of lines) {
    if (tracked.get(line.productId)) {
      if (!Number.isInteger(Math.abs(Number(line.delta))) || line.serialNumbers.length !== Math.abs(Number(line.delta)) || new Set(line.serialNumbers).size !== line.serialNumbers.length) throw new ValidationError({ serialNumbers: "Provide one unique serial per item." });
    } else if (line.serialNumbers.length) throw new ValidationError({ serialNumbers: "This product does not track serials." });
  }
  const hash = createHash("sha256").update(JSON.stringify({ kind, warehouseId, destinationId, reason, lines })).digest("hex");
  return withTransaction(async (client) => {
    const prior = await client.query<{ result_entity_id: number; request_hash: string }>(`SELECT result_entity_id,request_hash FROM app.idempotency_keys WHERE key=$1 FOR UPDATE`, [key]);
    if (prior.rowCount) {
      if (prior.rows[0].request_hash !== hash) throw new ApiError(409, "IDEMPOTENCY_CONFLICT", "This key was used with different data.");
      return { inventoryDocumentId: prior.rows[0].result_entity_id, repeated: true };
    }
    const document = await client.query<{ id: number }>(`INSERT INTO app.inventory_documents(kind,warehouse_id,reason,posted_by_id) VALUES ($1,$2,$3,$4) RETURNING id`, [kind, warehouseId, reason, actor.id]);
    const sourceDocId = document.rows[0].id;
    let destinationDocId: number | null = null;
    if (destinationId) {
      const paired = await client.query<{ id: number }>(`INSERT INTO app.inventory_documents(kind,warehouse_id,reason,posted_by_id,transfer_pair_id) VALUES ('TRANSFER',$1,$2,$3,$4) RETURNING id`, [destinationId, reason, actor.id, sourceDocId]);
      destinationDocId = paired.rows[0].id;
      await client.query(`UPDATE app.inventory_documents SET transfer_pair_id=$1 WHERE id=$2`, [destinationDocId, sourceDocId]);
    }
    for (const line of lines) {
      await postInventoryLine(client, { documentId: sourceDocId, warehouseId, productId: line.productId, quantity: line.delta, serialNumbers: line.serialNumbers });
      if (destinationDocId && destinationId) {
        await postInventoryLine(client, { documentId: destinationDocId, warehouseId: destinationId, productId: line.productId, quantity: line.delta.slice(1), serialNumbers: line.serialNumbers });
      }
      if (!tracked.get(line.productId)) continue;
      if (Number(line.delta) < 0) {
        for (const serial of line.serialNumbers) {
          const moved = await client.query(`UPDATE app.product_serials SET warehouse_id=$1,status=$2 WHERE product_id=$3 AND serial_no=$4 AND warehouse_id=$5 AND status='AVAILABLE' RETURNING id`, [destinationId, destinationId ? "AVAILABLE" : "ISSUED", line.productId, serial, warehouseId]);
          if (!moved.rowCount) throw new ApiError(409, "SERIAL_NOT_AVAILABLE", `Serial ${serial} is unavailable in this warehouse.`);
        }
      } else {
        for (const serial of line.serialNumbers) await client.query(`INSERT INTO app.product_serials(product_id,serial_no,warehouse_id,received_at) VALUES ($1,$2,$3,now())`, [line.productId, serial, warehouseId]);
      }
    }
    await client.query(`INSERT INTO app.idempotency_keys(key,actor_user_id,operation,request_hash,result_entity_id) VALUES ($1,$2,$3,$4,$5)`, [key, actor.id, `STOCK_${kind}`, hash, sourceDocId]);
    await audit(client, actor, "STOCK_DOCUMENT_POSTED", "inventory_documents", sourceDocId, { kind, warehouseId, destinationId, lines });
    return { inventoryDocumentId: sourceDocId, destinationDocumentId: destinationDocId, repeated: false };
  });
}

export async function reverseStockDocument(actor: Actor, documentId: number, reasonValue: unknown) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER"]);
  const reason = optionalText(reasonValue, "reason", 2000);
  if (!reason) throw new ValidationError({ reason: "Enter a reversal reason." });
  const original = await dbPool.query<{ id: number; kind: string; warehouse_id: number; transfer_pair_id: number | null; branch_id: number }>(`SELECT doc.*,w.branch_id FROM app.inventory_documents doc JOIN app.warehouses w ON w.id=doc.warehouse_id WHERE doc.id=$1`, [documentId]);
  if (!original.rowCount) throw new NotFoundError("Inventory document");
  requireBranch(actor, original.rows[0].branch_id);
  if (original.rows[0].kind === "REVERSAL") throw new ApiError(409, "ALREADY_REVERSAL", "A reversal cannot be reversed directly.");
  const originalIds = original.rows[0].transfer_pair_id ? [documentId, original.rows[0].transfer_pair_id] : [documentId];
  return withTransaction(async (client) => {
    const originals = await client.query<{ id: number; warehouse_id: number; kind: string }>(`SELECT id,warehouse_id,kind FROM app.inventory_documents WHERE id=ANY($1::integer[]) ORDER BY id FOR UPDATE`, [originalIds]);
    if (originals.rowCount !== originalIds.length) throw new NotFoundError("Transfer pair");
    for (const doc of originals.rows) {
      const warehouse = await client.query<{ branch_id: number }>(`SELECT branch_id FROM app.warehouses WHERE id=$1`, [doc.warehouse_id]);
      requireBranch(actor, warehouse.rows[0].branch_id);
      const existing = await client.query(`SELECT id FROM app.inventory_documents WHERE reverses_document_id=$1`, [doc.id]);
      if (existing.rowCount) throw new ApiError(409, "ALREADY_REVERSED", "This document was already reversed.");
    }
    const reverseIds: number[] = [];
    for (const doc of originals.rows) {
      const reversal = await client.query<{ id: number }>(`INSERT INTO app.inventory_documents(kind,warehouse_id,reverses_document_id,reason,posted_by_id) VALUES ('REVERSAL',$1,$2,$3,$4) RETURNING id`, [doc.warehouse_id, doc.id, reason, actor.id]);
      const reverseId = reversal.rows[0].id;
      reverseIds.push(reverseId);
      const lines = await client.query<{ product_id: number; quantity: string; serial_numbers: string[] }>(`SELECT product_id,quantity,serial_numbers FROM app.inventory_document_lines WHERE document_id=$1`, [doc.id]);
      for (const line of lines.rows) {
        await postInventoryLine(client, {
          documentId: reverseId,
          warehouseId: doc.warehouse_id,
          productId: line.product_id,
          quantity: line.quantity.startsWith("-") ? line.quantity.slice(1) : `-${line.quantity}`,
          serialNumbers: line.serial_numbers,
        });
      }
      await audit(client, actor, "STOCK_DOCUMENT_REVERSED", "inventory_documents", reverseId, { reversesDocumentId: doc.id, reason });
    }
    if (reverseIds.length === 2) {
      await client.query(`UPDATE app.inventory_documents SET transfer_pair_id=$1 WHERE id=$2`, [reverseIds[1], reverseIds[0]]);
      await client.query(`UPDATE app.inventory_documents SET transfer_pair_id=$1 WHERE id=$2`, [reverseIds[0], reverseIds[1]]);
    }
    // Serial records are updated after all balance movements succeed.
    if (original.rows[0].kind === "TRANSFER") {
      const transferLines = await client.query<{ warehouse_id: number; product_id: number; quantity: string; serial_numbers: string[] }>(`
        SELECT doc.warehouse_id,dl.product_id,dl.quantity,dl.serial_numbers
        FROM app.inventory_document_lines dl JOIN app.inventory_documents doc ON doc.id=dl.document_id
        WHERE doc.id=ANY($1::integer[])`, [originalIds]);
      for (const line of transferLines.rows.filter((item) => item.quantity.startsWith("-"))) {
        const destination = transferLines.rows.find((item) => item.product_id === line.product_id && !item.quantity.startsWith("-"));
        if (!destination) throw new ApiError(409, "TRANSFER_INCOMPLETE", "Transfer pair is incomplete.");
        for (const serial of line.serial_numbers) {
          const changed = await client.query(`UPDATE app.product_serials SET warehouse_id=$1 WHERE product_id=$2 AND serial_no=$3 AND warehouse_id=$4 AND status='AVAILABLE' RETURNING id`, [line.warehouse_id, line.product_id, serial, destination.warehouse_id]);
          if (!changed.rowCount) throw new ApiError(409, "SERIAL_NOT_AVAILABLE", `Serial ${serial} cannot be reversed.`);
        }
      }
    } else {
      const serials = await client.query<{ product_id: number; quantity: string; serial_numbers: string[] }>(`SELECT product_id,quantity,serial_numbers FROM app.inventory_document_lines WHERE document_id=$1`, [documentId]);
      for (const line of serials.rows) for (const serial of line.serial_numbers) {
        const positive = !line.quantity.startsWith("-");
        const changed = positive
          ? await client.query(`UPDATE app.product_serials SET warehouse_id=NULL,status='REVERSED' WHERE product_id=$1 AND serial_no=$2 AND warehouse_id=$3 AND status='AVAILABLE' RETURNING id`, [line.product_id, serial, original.rows[0].warehouse_id])
          : await client.query(`UPDATE app.product_serials SET warehouse_id=$1,status='AVAILABLE' WHERE product_id=$2 AND serial_no=$3 AND status='ISSUED' RETURNING id`, [original.rows[0].warehouse_id, line.product_id, serial]);
        if (!changed.rowCount) throw new ApiError(409, "SERIAL_NOT_AVAILABLE", `Serial ${serial} cannot be reversed.`);
      }
    }
    if (original.rows[0].kind === "GOODS_RECEIPT") {
      await client.query(`UPDATE app.goods_receipts SET reversed_at=now(),reversed_by_id=$1 WHERE id=(SELECT goods_receipt_id FROM app.inventory_documents WHERE id=$2)`, [actor.id, documentId]);
    }
    return { reversalDocumentIds: reverseIds };
  });
}
