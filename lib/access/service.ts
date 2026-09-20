import "server-only";

import { requireSession } from "@/lib/auth/session";
import { dbPool } from "@/lib/core/db/pool";
import { AccountStatusError, ApiError } from "@/lib/core/http/errors";
import { getEmployeeProfile } from "@/lib/profiles/service";
import type {
  AccessContext,
  FacilityScope,
  FacilityScopeType,
} from "@/lib/access/types";

export class ProfileIncompleteError extends ApiError {
  constructor() {
    super(
      403,
      "PROFILE_INCOMPLETE",
      "Complete your employee profile before using WMS modules.",
    );
    this.name = "ProfileIncompleteError";
  }
}

export class AuthorizationError extends ApiError {
  constructor(code: "FORBIDDEN" | "FORBIDDEN_FACILITY_SCOPE" = "FORBIDDEN") {
    super(403, code, "You do not have permission to perform this action.");
    this.name = "AuthorizationError";
  }
}

type RolePermissionRow = {
  role_code: string;
  permission_code: string | null;
};

type FacilityScopeRow = {
  facility_id: string;
  scope_type: FacilityScopeType;
};

type OrganizationRow = {
  id: string;
  code: string;
};

type AccountStatusRow = {
  status: AccessContext["accountStatus"];
};

export type AccessRequirement = {
  permission: string;
  facilityId?: string;
  facilityScope?: FacilityScopeType;
};

export async function getAccessContext(
  request: Request,
): Promise<AccessContext> {
  const session = await requireSession(request);
  const userId = session.user.id;

  const organizations = await dbPool.query<OrganizationRow>(
    `SELECT id, code
     FROM public.organizations
     WHERE is_active = true
     ORDER BY created_at, id
     LIMIT 2`,
  );

  if (organizations.rowCount !== 1) {
    throw new ApiError(
      503,
      "ORGANIZATION_CONFIGURATION_ERROR",
      "The backend requires exactly one active organization.",
    );
  }

  const organization = organizations.rows[0];

  const [profile, rolePermissions, facilityScopes, accountStatusResult] =
    await Promise.all([
      getEmployeeProfile(userId),
      dbPool.query<RolePermissionRow>(
        `SELECT DISTINCT r.code AS role_code, p.code AS permission_code
       FROM public.user_role_assignments AS assignment
       JOIN public.roles AS r ON r.id = assignment.role_id AND r.is_active = true
       LEFT JOIN public.role_permissions AS mapping ON mapping.role_id = r.id
       LEFT JOIN public.permissions AS p ON p.id = mapping.permission_id AND p.is_active = true
       WHERE assignment.user_id = $1
         AND assignment.revoked_at IS NULL
         AND (assignment.valid_from IS NULL OR assignment.valid_from <= now())
         AND (assignment.valid_until IS NULL OR assignment.valid_until > now())`,
        [userId],
      ),
      dbPool.query<FacilityScopeRow>(
        `SELECT scope.facility_id, scope.scope_type
       FROM public.user_facility_scopes AS scope
       JOIN public.facilities AS facility ON facility.id = scope.facility_id
       WHERE scope.user_id = $1
         AND facility.organization_id = $2
         AND facility.is_active = true
         AND (scope.valid_from IS NULL OR scope.valid_from <= now())
         AND (scope.valid_until IS NULL OR scope.valid_until > now())`,
        [userId, organization.id],
      ),
      dbPool.query<AccountStatusRow>(
        `SELECT status
       FROM public.user_access_controls
       WHERE user_id = $1`,
        [userId],
      ),
    ]);

  const accountStatus = accountStatusResult.rows[0]?.status ?? "ACTIVE";
  if (accountStatus !== "ACTIVE") throw new AccountStatusError(accountStatus);
  const roles = [
    ...new Set(rolePermissions.rows.map((row) => row.role_code)),
  ].sort();

  return {
    user: {
      id: userId,
      email: session.user.email,
      name: session.user.name,
    },
    sessionId: session.session.id,
    accountStatus,
    isSystemAdministrator: roles.includes("SYSTEM_ADMINISTRATOR"),
    organization,
    profile,
    roles,
    permissions: [
      ...new Set(
        rolePermissions.rows.flatMap((row) =>
          row.permission_code ? [row.permission_code] : [],
        ),
      ),
    ].sort(),
    facilityScopes: facilityScopes.rows.map((scope): FacilityScope => ({
      facilityId: scope.facility_id,
      scopeType: scope.scope_type,
    })),
  };
}

export async function requireAccess(
  request: Request,
  requirement: AccessRequirement,
): Promise<AccessContext> {
  const context = await getAccessContext(request);

  if (!context.profile?.is_complete) throw new ProfileIncompleteError();
  if (!context.permissions.includes(requirement.permission))
    throw new AuthorizationError();
  if (
    requirement.facilityId &&
    !canAccessFacility(
      context,
      requirement.facilityId,
      requirement.facilityScope ?? "READ",
    )
  ) {
    throw new AuthorizationError("FORBIDDEN_FACILITY_SCOPE");
  }

  return context;
}

/** Authorization helpers for domain services that already have an AccessContext. */
export function requirePermission(
  context: AccessContext,
  permission: string,
): AccessContext {
  if (!context.permissions.includes(permission)) throw new AuthorizationError();
  return context;
}

export function requireAnyPermission(
  context: AccessContext,
  permissions: readonly string[],
): AccessContext {
  if (!permissions.some((permission) => context.permissions.includes(permission))) {
    throw new AuthorizationError();
  }
  return context;
}

export function requireFacilityAccess(
  context: AccessContext,
  facilityId: string,
  requiredScope: FacilityScopeType,
): AccessContext {
  if (!canAccessFacility(context, facilityId, requiredScope)) {
    throw new AuthorizationError("FORBIDDEN_FACILITY_SCOPE");
  }
  return context;
}

export function canAccessFacility(
  context: AccessContext,
  facilityId: string,
  requiredScope: FacilityScopeType,
): boolean {
  return (
    context.isSystemAdministrator ||
    hasFacilityScope(context.facilityScopes, facilityId, requiredScope)
  );
}

export function visibleFacilityIds(context: AccessContext): string[] | null {
  if (context.isSystemAdministrator) return null;
  return [...new Set(context.facilityScopes.map((scope) => scope.facilityId))];
}

const scopeRank: Record<FacilityScopeType, number> = {
  READ: 1,
  OPERATE: 2,
  APPROVE: 3,
  ADMIN: 4,
};

export function hasFacilityScope(
  scopes: FacilityScope[],
  facilityId: string,
  requiredScope: FacilityScopeType,
): boolean {
  return scopes.some(
    (scope) =>
      scope.facilityId === facilityId &&
      scopeRank[scope.scopeType] >= scopeRank[requiredScope],
  );
}
