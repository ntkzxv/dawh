import "server-only";

import type { Pool, PoolClient } from "pg";

import { AuthorizationError, requireAccess } from "@/lib/access/service";
import type { AccessContext } from "@/lib/access/types";
import type { AdminUserSummary, ChangeAccountStatusInput, UserFilters, UserPageRequest } from "@/lib/admin/users/types";
import { writeAuditLog } from "@/lib/audit/service";
import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import type { RequestContext } from "@/lib/core/http/context";
import { ConflictError, NotFoundError } from "@/lib/core/http/errors";

type QueryExecutor = Pick<Pool | PoolClient, "query">;

type UserRow = {
  id: string;
  name: string;
  email: string;
  email_verified: boolean;
  account_status: AdminUserSummary["accountStatus"];
  profile_complete: boolean;
  username: string | null;
  facility_id: string | null;
  facility_code: string | null;
  facility_name: string | null;
  department_id: string | null;
  department_code: string | null;
  department_name: string | null;
  roles: AdminUserSummary["roles"];
  facility_scopes: AdminUserSummary["facilityScopes"];
  created_at: Date;
};

const selectUser = `
  SELECT u.id, u.name, u.email, u."emailVerified" AS email_verified,
    COALESCE(control.status, 'ACTIVE') AS account_status,
    (profile.profile_completed_at IS NOT NULL AND profile.facility_id IS NOT NULL) AS profile_complete,
    profile.username, facility.id::text AS facility_id, facility.code AS facility_code,
    facility.name AS facility_name, department.id::text AS department_id,
    department.code AS department_code, department.name AS department_name,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'assignmentId', assignment.id::text, 'roleId', role.id::text,
        'code', role.code, 'name', role.name, 'validFrom', assignment.valid_from,
        'validUntil', assignment.valid_until
      ) ORDER BY role.code)
      FROM public.user_role_assignments assignment
      JOIN public.roles role ON role.id=assignment.role_id AND role.is_active
      WHERE assignment.user_id=u.id AND assignment.revoked_at IS NULL
        AND (assignment.valid_from IS NULL OR assignment.valid_from <= now())
        AND (assignment.valid_until IS NULL OR assignment.valid_until > now())
    ), '[]'::jsonb) AS roles,
    COALESCE((
      SELECT jsonb_agg(jsonb_build_object(
        'id', scope.id::text, 'facilityId', scoped_facility.id::text,
        'facilityCode', scoped_facility.code, 'scopeType', scope.scope_type,
        'validFrom', scope.valid_from, 'validUntil', scope.valid_until,
        'version', scope.version
      ) ORDER BY scoped_facility.code)
      FROM public.user_facility_scopes scope
      JOIN public.facilities scoped_facility ON scoped_facility.id=scope.facility_id
      WHERE scope.user_id=u.id
        AND (scope.valid_from IS NULL OR scope.valid_from <= now())
        AND (scope.valid_until IS NULL OR scope.valid_until > now())
    ), '[]'::jsonb) AS facility_scopes,
    u."createdAt" AS created_at
  FROM public."user" u
  LEFT JOIN public.user_access_controls control ON control.user_id=u.id
  LEFT JOIN public.employee_profiles profile ON profile.user_id=u.id
  LEFT JOIN public.facilities facility ON facility.id=profile.facility_id
  LEFT JOIN public.departments department ON department.id=profile.department_id`;

function mapUser(row: UserRow): AdminUserSummary {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    emailVerified: row.email_verified,
    accountStatus: row.account_status,
    profileComplete: row.profile_complete,
    username: row.username,
    facility: row.facility_id && row.facility_code && row.facility_name
      ? { id: row.facility_id, code: row.facility_code, name: row.facility_name }
      : null,
    department: row.department_id && row.department_code && row.department_name
      ? { id: row.department_id, code: row.department_code, name: row.department_name }
      : null,
    roles: row.roles,
    facilityScopes: row.facility_scopes,
    createdAt: row.created_at.toISOString(),
  };
}

export async function listAdminUsers(
  request: Request,
  page: UserPageRequest,
  filters: UserFilters
): Promise<{ context: AccessContext; users: AdminUserSummary[] }> {
  const context = await requireAccess(request, { permission: "admin.users.read" });
  const result = await dbPool.query<UserRow>(
    `${selectUser}
     WHERE ($1::text IS NULL OR u.email ILIKE '%' || $1 || '%' OR u.name ILIKE '%' || $1 || '%' OR profile.username ILIKE '%' || $1 || '%')
       AND ($2::text IS NULL OR COALESCE(control.status, 'ACTIVE')=$2)
       AND ($3::text IS NULL OR EXISTS (
         SELECT 1 FROM public.user_role_assignments a JOIN public.roles r ON r.id=a.role_id
         WHERE a.user_id=u.id AND r.code=$3 AND a.revoked_at IS NULL
           AND (a.valid_from IS NULL OR a.valid_from<=now()) AND (a.valid_until IS NULL OR a.valid_until>now())
       ))
       AND ($4::bigint IS NULL OR EXISTS (
         SELECT 1 FROM public.user_facility_scopes s WHERE s.user_id=u.id AND s.facility_id=$4::bigint
           AND (s.valid_from IS NULL OR s.valid_from<=now()) AND (s.valid_until IS NULL OR s.valid_until>now())
       ))
       AND ($5::boolean IS NULL OR (profile.profile_completed_at IS NOT NULL AND profile.facility_id IS NOT NULL)=$5)
       AND ($6::timestamptz IS NULL OR (u."createdAt",u.id)<($6::timestamptz,$7::text))
     ORDER BY u."createdAt" DESC,u.id DESC LIMIT $8`,
    [filters.search, filters.status, filters.roleCode, filters.facilityId,
     filters.profileComplete, page.cursor?.timestamp ?? null, page.cursor?.id ?? null, page.limit + 1]
  );
  return { context, users: result.rows.map(mapUser) };
}

export async function getAdminUser(
  context: AccessContext,
  userId: string,
  executor: QueryExecutor = dbPool
): Promise<AdminUserSummary> {
  if (!context.permissions.includes("admin.users.read")) throw new AuthorizationError();
  const result = await executor.query<UserRow>(`${selectUser} WHERE u.id=$1`, [userId]);
  if (!result.rows[0]) throw new NotFoundError("User");
  return mapUser(result.rows[0]);
}

export async function changeAccountStatus(
  context: AccessContext,
  requestContext: RequestContext,
  userId: string,
  input: ChangeAccountStatusInput
): Promise<AdminUserSummary> {
  if (!context.permissions.includes("admin.users.manage")) throw new AuthorizationError();
  if (userId === context.user.id) throw new ConflictError("CONFLICT", "You cannot change your own account status.");

  await withTransaction(async (client) => {
    const target = await client.query<{ id: string }>(`SELECT id FROM public."user" WHERE id=$1 FOR UPDATE`, [userId]);
    if (!target.rows[0]) throw new NotFoundError("User");
    const isSystemAdmin = await client.query(
      `SELECT 1 FROM public.user_role_assignments a JOIN public.roles r ON r.id=a.role_id
       WHERE a.user_id=$1 AND r.code='SYSTEM_ADMINISTRATOR' AND a.revoked_at IS NULL
         AND (a.valid_from IS NULL OR a.valid_from<=now()) AND (a.valid_until IS NULL OR a.valid_until>now())`,
      [userId]
    );
    if (input.status !== "ACTIVE" && isSystemAdmin.rowCount) {
      const activeAdmins = await client.query(
        `SELECT count(DISTINCT a.user_id)::int AS count
         FROM public.user_role_assignments a JOIN public.roles r ON r.id=a.role_id
         LEFT JOIN public.user_access_controls c ON c.user_id=a.user_id
         WHERE r.code='SYSTEM_ADMINISTRATOR' AND a.revoked_at IS NULL
           AND COALESCE(c.status,'ACTIVE')='ACTIVE'
           AND (a.valid_from IS NULL OR a.valid_from<=now()) AND (a.valid_until IS NULL OR a.valid_until>now())`
      );
      if ((activeAdmins.rows[0]?.count ?? 0) <= 1) {
        throw new ConflictError("CONFLICT", "The last active system administrator cannot be disabled.");
      }
    }
    const previous = await client.query<{ status: string; reason: string | null }>(
      `SELECT status,reason FROM public.user_access_controls WHERE user_id=$1`, [userId]
    );
    await client.query(
      `INSERT INTO public.user_access_controls(user_id,status,reason,changed_at,changed_by)
       VALUES($1,$2,$3,now(),$4)
       ON CONFLICT(user_id) DO UPDATE SET status=EXCLUDED.status,reason=EXCLUDED.reason,
         changed_at=now(),changed_by=EXCLUDED.changed_by,updated_at=now()`,
      [userId, input.status, input.reason, context.user.id]
    );
    await writeAuditLog(client, {
      organizationId: context.organization.id, requestId: requestContext.requestId,
      actorUserId: context.user.id, action: "user.status.changed", entityType: "user_access",
      oldData: { targetUserId: userId, ...(previous.rows[0] ?? { status: "ACTIVE", reason: null }) },
      newData: { targetUserId: userId, ...input }, ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
    });
  });
  return getAdminUser(context, userId);
}
