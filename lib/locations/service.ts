import "server-only";
import type { Pool, PoolClient } from "pg";
import { AuthorizationError, canAccessFacility } from "@/lib/access/service";
import type { AccessContext } from "@/lib/access/types";
import { writeAuditLog } from "@/lib/audit/service";
import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import type { RequestContext } from "@/lib/core/http/context";
import { ConflictError, NotFoundError } from "@/lib/core/http/errors";
import type {
  LocationDto,
  LocationInput,
  LocationUpdateInput,
} from "@/lib/locations/types";
type Executor = Pick<Pool | PoolClient, "query">;
type Row = {
  id: string;
  facility_id: string;
  facility_code: string;
  parent_id: string | null;
  code: string;
  name: string;
  hierarchy_type: LocationDto["hierarchyType"];
  location_type: LocationDto["locationType"];
  path: string;
  depth: number;
  max_volume: string | null;
  max_weight: string | null;
  status: LocationDto["status"];
  is_active: boolean;
  version: number;
  created_at: Date;
  updated_at: Date;
};
const select = `SELECT l.id,l.facility_id,f.code facility_code,l.parent_id,l.code,l.name,l.hierarchy_type,l.location_type,l.path,l.depth,l.max_volume::text,l.max_weight::text,l.status,l.is_active,l.version,l.created_at,l.updated_at FROM public.warehouse_locations l JOIN public.facilities f ON f.id=l.facility_id`;
function map(r: Row): LocationDto {
  return {
    id: r.id,
    facilityId: r.facility_id,
    facilityCode: r.facility_code,
    parentId: r.parent_id,
    code: r.code,
    name: r.name,
    hierarchyType: r.hierarchy_type,
    locationType: r.location_type,
    path: r.path,
    depth: r.depth,
    maxVolume: r.max_volume,
    maxWeight: r.max_weight,
    status: r.status,
    isActive: r.is_active,
    version: r.version,
    createdAt: r.created_at.toISOString(),
    updatedAt: r.updated_at.toISOString(),
  };
}
function manage(c: AccessContext) {
  if (!c.permissions.includes("admin.facilities.manage"))
    throw new AuthorizationError();
}
function duplicate(e: unknown): never {
  if ((e as { code?: string }).code === "23505")
    throw new ConflictError(
      "CONFLICT",
      "The location code already exists in this facility.",
    );
  throw e;
}
async function parent(
  client: PoolClient,
  facilityId: string,
  parentId: string | null,
) {
  if (!parentId) return { path: "", depth: -1 };
  const r = await client.query<{ path: string; depth: number }>(
    `SELECT path,depth FROM public.warehouse_locations WHERE id=$1 AND facility_id=$2 AND is_active`,
    [parentId, facilityId],
  );
  if (!r.rows[0]) throw new NotFoundError("Parent location");
  return r.rows[0];
}
export async function listLocations(c: AccessContext, facilityId: string) {
  if (
    !canAccessFacility(c, facilityId, "READ") &&
    !c.permissions.includes("admin.facilities.read")
  )
    throw new AuthorizationError("FORBIDDEN_FACILITY_SCOPE");
  const r = await dbPool.query<Row>(
    `${select} WHERE l.facility_id=$1 AND f.organization_id=$2 ORDER BY l.path,l.id`,
    [facilityId, c.organization.id],
  );
  if (!r.rowCount) {
    const facility = await dbPool.query(
      `SELECT 1 FROM public.facilities WHERE id=$1 AND organization_id=$2`,
      [facilityId, c.organization.id],
    );
    if (!facility.rowCount) throw new NotFoundError("Facility");
  }
  return r.rows.map(map);
}
export async function getLocation(
  c: AccessContext,
  id: string,
  executor: Executor = dbPool,
) {
  const r = await executor.query<Row>(
    `${select} WHERE l.id=$1 AND f.organization_id=$2`,
    [id, c.organization.id],
  );
  if (!r.rows[0]) throw new NotFoundError("Location");
  if (
    !canAccessFacility(c, r.rows[0].facility_id, "READ") &&
    !c.permissions.includes("admin.facilities.read")
  )
    throw new AuthorizationError("FORBIDDEN_FACILITY_SCOPE");
  return map(r.rows[0]);
}
export async function createLocation(
  c: AccessContext,
  rc: RequestContext,
  facilityId: string,
  input: LocationInput,
) {
  manage(c);
  try {
    return await withTransaction(async (client) => {
      const facility = await client.query(
        `SELECT 1 FROM public.facilities WHERE id=$1 AND organization_id=$2 AND is_active`,
        [facilityId, c.organization.id],
      );
      if (!facility.rowCount) throw new NotFoundError("Facility");
      const p = await parent(client, facilityId, input.parentId);
      const path = p.path ? `${p.path}.${input.code}` : input.code;
      const r = await client.query<Row>(
        `WITH x AS (INSERT INTO public.warehouse_locations(facility_id,parent_id,code,name,hierarchy_type,location_type,path,depth,max_volume,max_weight,status,is_active,created_by,updated_by) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9::numeric,$10::numeric,$11,$12,$13,$13) RETURNING *) SELECT x.id,x.facility_id,f.code facility_code,x.parent_id,x.code,x.name,x.hierarchy_type,x.location_type,x.path,x.depth,x.max_volume::text,x.max_weight::text,x.status,x.is_active,x.version,x.created_at,x.updated_at FROM x JOIN public.facilities f ON f.id=x.facility_id`,
        [
          facilityId,
          input.parentId,
          input.code,
          input.name,
          input.hierarchyType,
          input.locationType,
          path,
          p.depth + 1,
          input.maxVolume,
          input.maxWeight,
          input.status,
          input.isActive,
          c.user.id,
        ],
      );
      const dto = map(r.rows[0]);
      await writeAuditLog(client, {
        organizationId: c.organization.id,
        requestId: rc.requestId,
        actorUserId: c.user.id,
        action: "location.created",
        entityType: "warehouse_location",
        entityId: dto.id,
        facilityId,
        newData: dto,
        ipAddress: rc.ipAddress,
        userAgent: rc.userAgent,
      });
      return dto;
    });
  } catch (e) {
    return duplicate(e);
  }
}
export async function updateLocation(
  c: AccessContext,
  rc: RequestContext,
  id: string,
  input: LocationUpdateInput,
) {
  manage(c);
  try {
    return await withTransaction(async (client) => {
      const before = await getLocation(c, id, client);
      const m = { ...before, ...input };
      if (m.parentId === id)
        throw new ConflictError(
          "CONFLICT",
          "A location cannot be its own parent.",
        );
      if (m.parentId) {
        const descendants = await client.query(
          `WITH RECURSIVE d AS (SELECT id FROM public.warehouse_locations WHERE parent_id=$1 UNION ALL SELECT l.id FROM public.warehouse_locations l JOIN d ON l.parent_id=d.id) SELECT 1 FROM d WHERE id=$2`,
          [id, m.parentId],
        );
        if (descendants.rowCount)
          throw new ConflictError(
            "CONFLICT",
            "A location cannot be moved under its descendant.",
          );
      }
      const p = await parent(client, before.facilityId, m.parentId);
      const path = p.path ? `${p.path}.${m.code}` : m.code;
      const r = await client.query<Row>(
        `WITH x AS (UPDATE public.warehouse_locations SET parent_id=$3,code=$4,name=$5,hierarchy_type=$6,location_type=$7,path=$8,depth=$9,max_volume=$10::numeric,max_weight=$11::numeric,status=$12,is_active=$13,version=version+1,updated_by=$14 WHERE id=$1 AND facility_id=$2 AND version=$15 RETURNING *) SELECT x.id,x.facility_id,f.code facility_code,x.parent_id,x.code,x.name,x.hierarchy_type,x.location_type,x.path,x.depth,x.max_volume::text,x.max_weight::text,x.status,x.is_active,x.version,x.created_at,x.updated_at FROM x JOIN public.facilities f ON f.id=x.facility_id`,
        [
          id,
          before.facilityId,
          m.parentId,
          m.code,
          m.name,
          m.hierarchyType,
          m.locationType,
          path,
          p.depth + 1,
          m.maxVolume,
          m.maxWeight,
          m.status,
          m.isActive,
          c.user.id,
          input.version,
        ],
      );
      if (!r.rows[0])
        throw new ConflictError(
          "VERSION_CONFLICT",
          "The location was updated by another request.",
        );
      const dto = map(r.rows[0]);
      if (before.path !== dto.path) {
        await client.query(
          `WITH RECURSIVE d AS (SELECT id,parent_id,path,depth FROM public.warehouse_locations WHERE parent_id=$1 UNION ALL SELECT l.id,l.parent_id,l.path,l.depth FROM public.warehouse_locations l JOIN d ON l.parent_id=d.id) UPDATE public.warehouse_locations l SET path=$2||substring(l.path from length($3)+1),depth=l.depth+($4-$5),updated_by=$6 FROM d WHERE l.id=d.id`,
          [id, dto.path, before.path, dto.depth, before.depth, c.user.id],
        );
      }
      await writeAuditLog(client, {
        organizationId: c.organization.id,
        requestId: rc.requestId,
        actorUserId: c.user.id,
        action: "location.updated",
        entityType: "warehouse_location",
        entityId: id,
        facilityId: before.facilityId,
        oldData: before,
        newData: dto,
        ipAddress: rc.ipAddress,
        userAgent: rc.userAgent,
      });
      return dto;
    });
  } catch (e) {
    return duplicate(e);
  }
}
