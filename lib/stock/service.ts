import "server-only";

import { dbPool } from "@/lib/core/db/pool";
import type { KeysetCursor } from "@/lib/core/http/pagination";
import type { AccessContext } from "@/lib/access/types";
import type { StockBalance } from "@/lib/stock/types";

type StockBalanceRow = {
  id: string;
  facility_id: string;
  facility_code: string;
  location_id: string | null;
  product_id: string;
  sku: string;
  product_name_th: string;
  lot_id: string | null;
  serial_id: string | null;
  shipment_id: string | null;
  stock_status: string;
  quantity: string;
  version: string;
  updated_at: Date;
};

export async function listScopedStockBalances(
  context: AccessContext,
  page: { limit: number; cursor: KeysetCursor | null },
  facilityId?: string
): Promise<StockBalance[]> {
  const scopedFacilityIds = context.facilityScopes.map((scope) => scope.facilityId);
  if (scopedFacilityIds.length === 0) return [];

  const result = await dbPool.query<StockBalanceRow>(
    `SELECT b.id, b.facility_id, f.code AS facility_code, b.location_id, b.product_id,
            p.sku, p.name_th AS product_name_th, b.lot_id, b.serial_id, b.shipment_id,
            b.stock_status, b.quantity::text, b.version::text, b.updated_at
     FROM public.stock_balances AS b
     JOIN public.facilities AS f ON f.id = b.facility_id
     JOIN public.products AS p ON p.id = b.product_id
     WHERE b.facility_id = ANY($1::bigint[])
       AND f.organization_id = $2
       AND p.organization_id = $2
       AND ($3::bigint IS NULL OR b.facility_id = $3::bigint)
       AND ($4::timestamptz IS NULL OR (b.updated_at, b.id) < ($4::timestamptz, $5::bigint))
     ORDER BY b.updated_at DESC, b.id DESC
     LIMIT $6`,
    [
      scopedFacilityIds,
      context.organization.id,
      facilityId ?? null,
      page.cursor?.timestamp ?? null,
      page.cursor?.id ?? null,
      page.limit + 1,
    ]
  );

  return result.rows.map((row) => ({
    id: row.id,
    facilityId: row.facility_id,
    facilityCode: row.facility_code,
    locationId: row.location_id,
    productId: row.product_id,
    sku: row.sku,
    productNameTh: row.product_name_th,
    lotId: row.lot_id,
    serialId: row.serial_id,
    shipmentId: row.shipment_id,
    stockStatus: row.stock_status,
    quantity: row.quantity,
    version: row.version,
    updatedAt: row.updated_at.toISOString(),
  }));
}
