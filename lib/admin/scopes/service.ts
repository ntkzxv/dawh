import "server-only";

import type { PoolClient } from "pg";

import { AuthorizationError } from "@/lib/access/service";
import type { AccessContext } from "@/lib/access/types";
import type { FacilityScopeDto, FacilityScopeInput, UpdateFacilityScopeInput } from "@/lib/admin/scopes/types";
import { writeAuditLog } from "@/lib/audit/service";
import { withTransaction } from "@/lib/core/db/transaction";
import type { RequestContext } from "@/lib/core/http/context";
import { ConflictError, NotFoundError } from "@/lib/core/http/errors";

type ScopeRow = {
  id: string; user_id: string; facility_id: string; facility_code: string;
  scope_type: FacilityScopeDto["scopeType"]; valid_from: Date | null; valid_until: Date | null;
  version: number; created_at: Date; updated_at: Date;
};

function requireManage(context: AccessContext) {
  if (!context.permissions.includes("admin.users.manage")) throw new AuthorizationError();
}

function mapScope(row: ScopeRow): FacilityScopeDto {
  return {
    id: row.id, userId: row.user_id, facilityId: row.facility_id, facilityCode: row.facility_code,
    scopeType: row.scope_type, validFrom: row.valid_from?.toISOString() ?? null,
    validUntil: row.valid_until?.toISOString() ?? null, version: row.version,
    createdAt: row.created_at.toISOString(), updatedAt: row.updated_at.toISOString(),
  };
}

async function ensureTargets(client: PoolClient, context: AccessContext, userId: string, facilityId: string) {
  const [user, facility] = await Promise.all([
    client.query(`SELECT 1 FROM public."user" WHERE id=$1`, [userId]),
    client.query(`SELECT 1 FROM public.facilities WHERE id=$1 AND organization_id=$2 AND is_active`, [facilityId, context.organization.id]),
  ]);
  if (!user.rowCount) throw new NotFoundError("User");
  if (!facility.rowCount) throw new NotFoundError("Facility");
}

const selectScope = `SELECT s.id,s.user_id,s.facility_id,f.code facility_code,s.scope_type,s.valid_from,
  s.valid_until,s.version,s.created_at,s.updated_at
  FROM public.user_facility_scopes s JOIN public.facilities f ON f.id=s.facility_id`;

export async function createFacilityScope(
  context: AccessContext, requestContext: RequestContext, userId: string, input: FacilityScopeInput
): Promise<FacilityScopeDto> {
  requireManage(context);
  return withTransaction(async (client) => {
    await ensureTargets(client, context, userId, input.facilityId);
    const existing = await client.query<ScopeRow>(`${selectScope} WHERE s.user_id=$1 AND s.facility_id=$2 FOR UPDATE OF s`, [userId, input.facilityId]);
    if (existing.rows[0] && (!existing.rows[0].valid_until || existing.rows[0].valid_until > new Date())) {
      throw new ConflictError("CONFLICT", "An active facility scope already exists.");
    }
    const result = existing.rows[0]
      ? await client.query<ScopeRow>(
          `WITH changed AS (UPDATE public.user_facility_scopes SET scope_type=$3,valid_from=$4,valid_until=$5,
             version=version+1,updated_by=$6 WHERE user_id=$1 AND facility_id=$2 RETURNING *)
           SELECT c.id,c.user_id,c.facility_id,f.code facility_code,c.scope_type,c.valid_from,c.valid_until,
             c.version,c.created_at,c.updated_at FROM changed c JOIN public.facilities f ON f.id=c.facility_id`,
          [userId, input.facilityId, input.scopeType, input.validFrom, input.validUntil, context.user.id]
        )
      : await client.query<ScopeRow>(
          `WITH created AS (INSERT INTO public.user_facility_scopes(user_id,facility_id,scope_type,valid_from,valid_until,created_by,updated_by)
             VALUES($1,$2,$3,$4,$5,$6,$6) RETURNING *)
           SELECT c.id,c.user_id,c.facility_id,f.code facility_code,c.scope_type,c.valid_from,c.valid_until,
             c.version,c.created_at,c.updated_at FROM created c JOIN public.facilities f ON f.id=c.facility_id`,
          [userId, input.facilityId, input.scopeType, input.validFrom, input.validUntil, context.user.id]
        );
    const dto = mapScope(result.rows[0]);
    await writeAuditLog(client, {
      organizationId: context.organization.id, requestId: requestContext.requestId, actorUserId: context.user.id,
      action: existing.rows[0] ? "facility.scope.reactivated" : "facility.scope.created",
      entityType: "user_facility_scope", entityId: dto.id, facilityId: dto.facilityId,
      oldData: existing.rows[0] ? mapScope(existing.rows[0]) : null, newData: dto,
      ipAddress: requestContext.ipAddress, userAgent: requestContext.userAgent,
    });
    return dto;
  });
}

export async function updateFacilityScope(
  context: AccessContext, requestContext: RequestContext, userId: string, scopeId: string, input: UpdateFacilityScopeInput
): Promise<FacilityScopeDto> {
  requireManage(context);
  return withTransaction(async (client) => {
    const old = await client.query<ScopeRow>(
      `${selectScope} WHERE s.id=$1 AND s.user_id=$2 AND f.organization_id=$3 FOR UPDATE OF s`,
      [scopeId, userId, context.organization.id]
    );
    if (!old.rows[0]) throw new NotFoundError("Facility scope");
    const result = await client.query<ScopeRow>(
      `WITH changed AS (UPDATE public.user_facility_scopes SET scope_type=$3,valid_from=$4,valid_until=$5,
         version=version+1,updated_by=$6 WHERE id=$1 AND user_id=$2 AND version=$7 RETURNING *)
       SELECT c.id,c.user_id,c.facility_id,f.code facility_code,c.scope_type,c.valid_from,c.valid_until,
         c.version,c.created_at,c.updated_at FROM changed c JOIN public.facilities f ON f.id=c.facility_id`,
      [scopeId, userId, input.scopeType, input.validFrom, input.validUntil, context.user.id, input.version]
    );
    if (!result.rows[0]) throw new ConflictError("VERSION_CONFLICT", "The facility scope was updated by another request.");
    const dto = mapScope(result.rows[0]);
    await writeAuditLog(client, {
      organizationId: context.organization.id, requestId: requestContext.requestId, actorUserId: context.user.id,
      action: "facility.scope.updated", entityType: "user_facility_scope", entityId: dto.id,
      facilityId: dto.facilityId, oldData: mapScope(old.rows[0]), newData: dto,
      ipAddress: requestContext.ipAddress, userAgent: requestContext.userAgent,
    });
    return dto;
  });
}

export async function revokeFacilityScope(
  context: AccessContext, requestContext: RequestContext, userId: string, scopeId: string,
  input: { version: number; reason: string }
): Promise<FacilityScopeDto> {
  requireManage(context);
  return withTransaction(async (client) => {
    const old = await client.query<ScopeRow>(
      `${selectScope} WHERE s.id=$1 AND s.user_id=$2 AND f.organization_id=$3 FOR UPDATE OF s`,
      [scopeId, userId, context.organization.id]
    );
    if (!old.rows[0]) throw new NotFoundError("Facility scope");
    const result = await client.query<ScopeRow>(
      `WITH changed AS (UPDATE public.user_facility_scopes SET valid_until=now(),version=version+1,updated_by=$3
         WHERE id=$1 AND user_id=$2 AND version=$4 RETURNING *)
       SELECT c.id,c.user_id,c.facility_id,f.code facility_code,c.scope_type,c.valid_from,c.valid_until,
         c.version,c.created_at,c.updated_at FROM changed c JOIN public.facilities f ON f.id=c.facility_id`,
      [scopeId, userId, context.user.id, input.version]
    );
    if (!result.rows[0]) throw new ConflictError("VERSION_CONFLICT", "The facility scope was updated by another request.");
    const dto = mapScope(result.rows[0]);
    await writeAuditLog(client, {
      organizationId: context.organization.id, requestId: requestContext.requestId, actorUserId: context.user.id,
      action: "facility.scope.revoked", entityType: "user_facility_scope", entityId: dto.id,
      facilityId: dto.facilityId, oldData: mapScope(old.rows[0]), newData: { ...dto, reason: input.reason },
      ipAddress: requestContext.ipAddress, userAgent: requestContext.userAgent,
    });
    return dto;
  });
}
