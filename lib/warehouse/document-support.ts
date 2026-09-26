import "server-only";

import { dbPool } from "@/lib/core/db/pool";
import { id } from "@/lib/warehouse/validation";

export async function duplicateWarnings(
  kind: "supplier" | "carrier",
  externalDocNo: string | null,
  supplierId: number | null,
  mediaAssetIds: unknown,
): Promise<string[]> {
  const warnings: string[] = [];
  if (externalDocNo) {
    const table = kind === "supplier" ? "supplier_receipts" : "carrier_receipts";
    const result = kind === "supplier"
      ? await dbPool.query(`
          SELECT 1 FROM app.supplier_receipts
          WHERE supplier_id = $1 AND external_doc_no = $2 LIMIT 1
        `, [supplierId, externalDocNo])
      : await dbPool.query(`
          SELECT 1 FROM app.carrier_receipts
          WHERE external_doc_no = $1 LIMIT 1
        `, [externalDocNo]);
    if (result.rowCount) warnings.push(`เลขเอกสารภายนอกนี้มีอยู่แล้วใน ${table}`);
  }

  if (Array.isArray(mediaAssetIds) && mediaAssetIds.length) {
    const ids = mediaAssetIds.map((value) => id(value, "mediaAssetIds"));
    const result = await dbPool.query(`
      SELECT 1
      FROM app.media_assets incoming
      JOIN app.media_assets prior ON prior.sha256 = incoming.sha256 AND prior.id <> incoming.id
      JOIN app.evidence_links link ON link.media_asset_id = prior.id
      WHERE incoming.id = ANY($1::integer[])
      LIMIT 1
    `, [ids]);
    if (result.rowCount) warnings.push("มีรูปหลักฐานที่มีเนื้อหาเหมือนเอกสารเดิม");
  }

  return warnings;
}
