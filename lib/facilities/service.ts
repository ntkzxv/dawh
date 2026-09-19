import "server-only";

import { dbPool } from "@/lib/core/db/pool";
import type { KeysetCursor } from "@/lib/core/http/pagination";
import type { AccessContext } from "@/lib/access/types";
import type { Facility } from "@/lib/facilities/types";

type FacilityRow = {
  id: string;
  organization_id: string;
  organization_code: string;
  code: string;
  name: string;
  facility_type: Facility["facilityType"];
  province: string | null;
  is_active: boolean;
  version: number;
  created_at: Date;
};

export async function listVisibleFacilities(
  context: AccessContext,
  page: { limit: number; cursor: KeysetCursor | null }
): Promise<Facility[]> {
  const canReadAll = context.permissions.includes("admin.facilities.read");
  const facilityIds = context.facilityScopes.map((scope) => scope.facilityId);

  if (!canReadAll && facilityIds.length === 0) return [];

  const result = await dbPool.query<FacilityRow>(
    `SELECT f.id, f.organization_id, o.code AS organization_code, f.code, f.name,
            f.facility_type, f.province, f.is_active, f.version, f.created_at
     FROM public.facilities AS f
     JOIN public.organizations AS o ON o.id = f.organization_id
     WHERE f.organization_id = $1
       AND ($2::boolean OR f.id = ANY($3::bigint[]))
       AND ($4::timestamptz IS NULL OR (f.created_at, f.id) < ($4::timestamptz, $5::bigint))
     ORDER BY f.created_at DESC, f.id DESC
     LIMIT $6`,
    [
      context.organization.id,
      canReadAll,
      facilityIds,
      page.cursor?.timestamp ?? null,
      page.cursor?.id ?? null,
      page.limit + 1,
    ]
  );

  return result.rows.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    organizationCode: row.organization_code,
    code: row.code,
    name: row.name,
    facilityType: row.facility_type,
    province: row.province,
    isActive: row.is_active,
    version: row.version,
    createdAt: row.created_at.toISOString(),
  }));
}
