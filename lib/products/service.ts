import "server-only";

import { dbPool } from "@/lib/core/db/pool";
import type { KeysetCursor } from "@/lib/core/http/pagination";
import type { Product } from "@/lib/products/types";

type ProductRow = {
  id: string;
  organization_id: string;
  sku: string;
  name_th: string;
  name_en: string | null;
  tracking_method: Product["trackingMethod"];
  picking_strategy: Product["pickingStrategy"];
  is_active: boolean;
  version: number;
  created_at: Date;
};

export async function listProducts(
  organizationId: string,
  page: { limit: number; cursor: KeysetCursor | null }
): Promise<Product[]> {
  const result = await dbPool.query<ProductRow>(
    `SELECT id, organization_id, sku, name_th, name_en, tracking_method,
            picking_strategy, is_active, version, created_at
     FROM public.products
     WHERE organization_id = $1
       AND ($2::timestamptz IS NULL OR (created_at, id) < ($2::timestamptz, $3::bigint))
     ORDER BY created_at DESC, id DESC
     LIMIT $4`,
    [organizationId, page.cursor?.timestamp ?? null, page.cursor?.id ?? null, page.limit + 1]
  );

  return result.rows.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    sku: row.sku,
    nameTh: row.name_th,
    nameEn: row.name_en,
    trackingMethod: row.tracking_method,
    pickingStrategy: row.picking_strategy,
    isActive: row.is_active,
    version: row.version,
    createdAt: row.created_at.toISOString(),
  }));
}
