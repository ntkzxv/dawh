import "server-only";

import type { PoolClient } from "pg";

import { AuthorizationError } from "@/lib/access/service";
import type { AccessContext } from "@/lib/access/types";
import type { AssignRoleInput, PermissionDto, RoleAssignmentDto, RoleDto } from "@/lib/admin/roles/types";
import { writeAuditLog } from "@/lib/audit/service";
import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import type { RequestContext } from "@/lib/core/http/context";
import { ConflictError, NotFoundError } from "@/lib/core/http/errors";

const canonicalRoles = [
  "SYSTEM_ADMINISTRATOR", "HQ_AREA_MANAGER", "WAREHOUSE_MANAGER", "STOCK_CONTROLLER",
  "PICKER_PACKER", "BRANCH_REQUESTER", "BRANCH_RECEIVER", "CLAIM_OFFICER", "AUDITOR",
] as const;

function requirePermission(context: AccessContext, permission: string) {
  if (!context.permissions.includes(permission)) throw new AuthorizationError();
}

export async function listRoles(context: AccessContext): Promise<RoleDto[]> {
  requirePermission(context, "admin.roles.read");
  const result = await dbPool.query<{
    id: string; code: string; name: string; description: string | null; is_system: boolean;
    version: number; permissions: string[];
  }>(
    `SELECT r.id,r.code,r.name,r.description,r.is_system,r.version,
      COALESCE(array_agg(p.code ORDER BY p.code) FILTER (WHERE p.code IS NOT NULL), ARRAY[]::text[]) permissions
     FROM public.roles r
     LEFT JOIN public.role_permissions rp ON rp.role_id=r.id
     LEFT JOIN public.permissions p ON p.id=rp.permission_id AND p.is_active
     WHERE r.is_active AND r.code=ANY($1::text[])
     GROUP BY r.id ORDER BY r.code`, [canonicalRoles]
  );
  return result.rows.map((row) => ({
    id: row.id, code: row.code, name: row.name, description: row.description,
    isSystem: row.is_system, version: row.version, permissions: row.permissions,
  }));
}

export async function listPermissions(context: AccessContext): Promise<PermissionDto[]> {
  requirePermission(context, "admin.roles.read");
  const result = await dbPool.query<PermissionDto>(
    `SELECT id,code,module,description FROM public.permissions WHERE is_active ORDER BY module,code`
  );
  return result.rows;
}

type AssignmentRow = {
  id: string; user_id: string; role_id: string; role_code: string;
  valid_from: Date | null; valid_until: Date | null; assigned_at: Date;
  assigned_by: string | null; revoked_at: Date | null; revoked_by: string | null; revoke_reason: string | null;
};

const assignmentSelect = `SELECT a.id,a.user_id,a.role_id,r.code role_code,a.valid_from,a.valid_until,
  a.assigned_at,a.assigned_by,a.revoked_at,a.revoked_by,a.revoke_reason
  FROM public.user_role_assignments a JOIN public.roles r ON r.id=a.role_id`;

function mapAssignment(row: AssignmentRow): RoleAssignmentDto {
  return {
    id: row.id, userId: row.user_id, roleId: row.role_id, roleCode: row.role_code,
    validFrom: row.valid_from?.toISOString() ?? null, validUntil: row.valid_until?.toISOString() ?? null,
    assignedAt: row.assigned_at.toISOString(), assignedBy: row.assigned_by,
    revokedAt: row.revoked_at?.toISOString() ?? null, revokedBy: row.revoked_by, revokeReason: row.revoke_reason,
  };
}

async function ensureUser(client: PoolClient, userId: string) {
  const user = await client.query(`SELECT 1 FROM public."user" WHERE id=$1`, [userId]);
  if (!user.rowCount) throw new NotFoundError("User");
}

export async function assignRole(
  context: AccessContext, requestContext: RequestContext, userId: string, input: AssignRoleInput
): Promise<RoleAssignmentDto> {
  requirePermission(context, "admin.roles.manage");
  return withTransaction(async (client) => {
    await ensureUser(client, userId);
    const role = await client.query<{ id: string; code: string }>(
      `SELECT id,code FROM public.roles WHERE id=$1 AND is_active AND code=ANY($2::text[])`,
      [input.roleId, canonicalRoles]
    );
    if (!role.rows[0]) throw new NotFoundError("Role");
    const duplicate = await client.query(
      `SELECT 1 FROM public.user_role_assignments WHERE user_id=$1 AND role_id=$2 AND revoked_at IS NULL`,
      [userId, input.roleId]
    );
    if (duplicate.rowCount) throw new ConflictError("CONFLICT", "The role is already assigned to this user.");
    const result = await client.query<AssignmentRow>(
      `WITH created AS (
         INSERT INTO public.user_role_assignments(user_id,role_id,valid_from,valid_until,assigned_by)
         VALUES($1,$2,$3,$4,$5) RETURNING *
       )
       SELECT c.id,c.user_id,c.role_id,r.code role_code,c.valid_from,c.valid_until,c.assigned_at,
         c.assigned_by,c.revoked_at,c.revoked_by,c.revoke_reason
       FROM created c JOIN public.roles r ON r.id=c.role_id`,
      [userId, input.roleId, input.validFrom, input.validUntil, context.user.id]
    );
    const dto = mapAssignment(result.rows[0]);
    await writeAuditLog(client, {
      organizationId: context.organization.id, requestId: requestContext.requestId,
      actorUserId: context.user.id, action: "role.assignment.created", entityType: "user_role_assignment",
      entityId: dto.id, newData: dto, ipAddress: requestContext.ipAddress, userAgent: requestContext.userAgent,
    });
    return dto;
  });
}

export async function revokeRole(
  context: AccessContext, requestContext: RequestContext, userId: string, assignmentId: string, reason: string
): Promise<RoleAssignmentDto> {
  requirePermission(context, "admin.roles.manage");
  return withTransaction(async (client) => {
    const locked = await client.query<AssignmentRow>(
      `${assignmentSelect} WHERE a.id=$1 AND a.user_id=$2 FOR UPDATE OF a`, [assignmentId, userId]
    );
    const before = locked.rows[0];
    if (!before || before.revoked_at) throw new NotFoundError("Active role assignment");
    if (before.role_code === "SYSTEM_ADMINISTRATOR") {
      if (userId === context.user.id) {
        throw new ConflictError("CONFLICT", "You cannot revoke your own system administrator role.");
      }
      const admins = await client.query<{ count: number }>(
        `SELECT count(DISTINCT a.user_id)::int count
         FROM public.user_role_assignments a JOIN public.roles r ON r.id=a.role_id
         LEFT JOIN public.user_access_controls c ON c.user_id=a.user_id
         WHERE r.code='SYSTEM_ADMINISTRATOR' AND a.revoked_at IS NULL
           AND COALESCE(c.status,'ACTIVE')='ACTIVE'
           AND (a.valid_from IS NULL OR a.valid_from<=now()) AND (a.valid_until IS NULL OR a.valid_until>now())`
      );
      if ((admins.rows[0]?.count ?? 0) <= 1) {
        throw new ConflictError("CONFLICT", "The last active system administrator role cannot be revoked.");
      }
    }
    const result = await client.query<AssignmentRow>(
      `WITH changed AS (
         UPDATE public.user_role_assignments SET revoked_at=now(),revoked_by=$3,revoke_reason=$4
         WHERE id=$1 AND user_id=$2 RETURNING *
       )
       SELECT c.id,c.user_id,c.role_id,r.code role_code,c.valid_from,c.valid_until,c.assigned_at,
         c.assigned_by,c.revoked_at,c.revoked_by,c.revoke_reason
       FROM changed c JOIN public.roles r ON r.id=c.role_id`,
      [assignmentId, userId, context.user.id, reason]
    );
    const dto = mapAssignment(result.rows[0]);
    await writeAuditLog(client, {
      organizationId: context.organization.id, requestId: requestContext.requestId,
      actorUserId: context.user.id, action: "role.assignment.revoked", entityType: "user_role_assignment",
      entityId: dto.id, oldData: mapAssignment(before), newData: dto,
      ipAddress: requestContext.ipAddress, userAgent: requestContext.userAgent,
    });
    return dto;
  });
}
