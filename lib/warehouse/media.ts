import "server-only";

import { createHash, randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import type { PoolClient } from "pg";
import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import { ApiError, NotFoundError, ValidationError } from "@/lib/core/http/errors";
import { audit, id, type Actor } from "@/lib/warehouse/core";

const bucket = "warehouse-evidence";
const allowed = new Map([["image/jpeg", "jpg"], ["image/png", "png"], ["image/webp", "webp"], ["application/pdf", "pdf"]]);
function storage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new ApiError(503, "STORAGE_NOT_CONFIGURED", "Configure SUPABASE_SERVICE_ROLE_KEY for evidence storage.");
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }).storage.from(bucket);
}
export async function uploadEvidence(actor: Actor, file: File) {
  if (!allowed.has(file.type) || file.size < 1 || file.size > 10 * 1024 * 1024) throw new ValidationError({ file: "Upload a JPG, PNG, WebP or PDF file up to 10 MB." });
  const bytes = Buffer.from(await file.arrayBuffer());
  const sha256 = createHash("sha256").update(bytes).digest("hex");
  const objectPath = `${new Date().getUTCFullYear()}/${randomUUID()}.${allowed.get(file.type)}`;
  const store = storage();
  const uploaded = await store.upload(objectPath, bytes, { contentType: file.type, upsert: false });
  if (uploaded.error) throw new ApiError(502, "STORAGE_UPLOAD_FAILED", uploaded.error.message);
  try {
    return await withTransaction(async (client) => {
      const result = await client.query(`INSERT INTO app.media_assets(object_path,sha256,mime_type,byte_size,uploaded_by_id) VALUES ($1,$2,$3,$4,$5) RETURNING id,sha256,mime_type,byte_size,uploaded_at`, [objectPath, sha256, file.type, file.size, actor.id]);
      await audit(client, actor, "EVIDENCE_UPLOADED", "media_assets", result.rows[0].id, { sha256, mimeType: file.type, byteSize: file.size });
      return result.rows[0];
    });
  } catch (error) {
    await store.remove([objectPath]).catch(() => undefined);
    throw error;
  }
}
export async function attachEvidence(client: PoolClient, actor: Actor, ownerColumn: "supplier_receipt_id" | "carrier_receipt_id" | "delivery_confirmation_id" | "goods_receipt_id" | "issue_report_id", ownerId: number, value: unknown, required = false) {
  if (!Array.isArray(value)) {
    if (required) throw new ValidationError({ mediaAssetIds: "Upload every document page before saving." });
    return;
  }
  const assetIds = [...new Set(value.map((item) => id(item, "mediaAssetIds")))];
  if (required && !assetIds.length) throw new ValidationError({ mediaAssetIds: "Upload at least one document page." });
  const page = await client.query<{ last: number }>(`SELECT COALESCE(max(page_number),0)::integer AS last FROM app.evidence_links WHERE ${ownerColumn}=$1`, [ownerId]);
  for (let index = 0; index < assetIds.length; index++) {
    const asset = await client.query(`SELECT id FROM app.media_assets WHERE id=$1 AND uploaded_by_id=$2`, [assetIds[index], actor.id]);
    if (!asset.rowCount) throw new ValidationError({ mediaAssetIds: "Evidence file is missing or belongs to another uploader." });
    await client.query(`INSERT INTO app.evidence_links(media_asset_id,${ownerColumn},page_number) VALUES ($1,$2,$3)`, [assetIds[index], ownerId, page.rows[0].last + index + 1]);
  }
}
export async function getEvidenceUrl(actor: Actor, assetId: number) {
  const result = await dbPool.query<{ object_path: string; uploaded_by_id: number; supplier_receipt_id: number | null; carrier_receipt_id: number | null; delivery_confirmation_id: number | null; goods_receipt_id: number | null; issue_report_id: number | null; delivery_branch_id: number | null; goods_branch_id: number | null; issue_branch_id: number | null }>(`
    SELECT m.object_path,m.uploaded_by_id,e.supplier_receipt_id,e.carrier_receipt_id,e.delivery_confirmation_id,e.goods_receipt_id,e.issue_report_id,
      dc.receiving_branch_id AS delivery_branch_id,gr.receiving_branch_id AS goods_branch_id,
      COALESCE(igr.receiving_branch_id,idc.receiving_branch_id) AS issue_branch_id
    FROM app.media_assets m LEFT JOIN app.evidence_links e ON e.media_asset_id=m.id
    LEFT JOIN app.delivery_confirmations dc ON dc.id=e.delivery_confirmation_id
    LEFT JOIN app.goods_receipts gr ON gr.id=e.goods_receipt_id
    LEFT JOIN app.issue_reports i ON i.id=e.issue_report_id
    LEFT JOIN app.goods_receipts igr ON igr.id=i.goods_receipt_id
    LEFT JOIN app.delivery_confirmations idc ON idc.carrier_receipt_id=i.carrier_receipt_id
    WHERE m.id=$1`, [assetId]);
  if (!result.rowCount) throw new NotFoundError("Evidence");
  const permitted = result.rows.some((row) => {
    if (row.uploaded_by_id === actor.id || actor.role === "ADMIN" || actor.role === "CEO") return true;
    if (row.carrier_receipt_id != null) return true;
    if (row.delivery_confirmation_id != null) return row.delivery_branch_id != null && actor.branchIds.includes(row.delivery_branch_id);
    if (actor.role === "EMPLOYEE") return false;
    if (row.supplier_receipt_id != null) return true;
    if (row.goods_receipt_id != null) return row.goods_branch_id != null && actor.branchIds.includes(row.goods_branch_id);
    if (row.issue_report_id != null) return row.issue_branch_id == null || actor.branchIds.includes(row.issue_branch_id);
    return false;
  });
  if (!permitted) throw new ApiError(403, "FORBIDDEN", "You cannot view this evidence.");
  const signed = await storage().createSignedUrl(result.rows[0].object_path, 60);
  if (signed.error || !signed.data?.signedUrl) throw new ApiError(502, "STORAGE_READ_FAILED", signed.error?.message ?? "Could not open evidence.");
  return signed.data.signedUrl;
}
