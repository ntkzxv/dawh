import "server-only";

import { requireSession } from "@/lib/auth/session";
import { dbPool } from "@/lib/core/db/pool";
import { ApiError } from "@/lib/core/http/errors";

export type Role = "ADMIN" | "CEO" | "MANAGER" | "COUNTER_STAFF" | "EMPLOYEE";
export type Actor = {
  id: number;
  authUserId: string;
  role: Role;
  branchIds: number[];
  mustChangePassword: boolean;
};

export async function getActor(request?: Request, allowPasswordChange = false): Promise<Actor> {
  const session = await requireSession(request);
  const result = await dbPool.query<{
    id: number;
    auth_user_id: string;
    role: Role;
    must_change_password: boolean;
    deleted_at: Date | null;
    banned: boolean;
  }>(`
    SELECT a.*, u.banned
    FROM app.app_users a
    JOIN public."user" u ON u.id = a.auth_user_id
    WHERE a.auth_user_id = $1
  `, [session.user.id]);

  const user = result.rows[0];
  if (!user || user.deleted_at || user.banned) {
    throw new ApiError(403, "ACCOUNT_DISABLED", "This account cannot use the warehouse.");
  }
  if (user.must_change_password && !allowPasswordChange) {
    throw new ApiError(403, "PASSWORD_CHANGE_REQUIRED", "Change your initial password first.");
  }

  const branches = await dbPool.query<{ branch_id: number }>(
    `SELECT branch_id FROM app.branch_memberships WHERE user_id = $1`,
    [user.id],
  );
  return {
    id: user.id,
    authUserId: user.auth_user_id,
    role: user.role,
    branchIds: branches.rows.map((row) => row.branch_id),
    mustChangePassword: user.must_change_password,
  };
}

export function requireRole(actor: Actor, roles: Role[]) {
  if (!roles.includes(actor.role)) {
    throw new ApiError(403, "FORBIDDEN", "You do not have permission for this action.");
  }
}

export function canUseBranch(actor: Actor, branchId: number) {
  return actor.role === "ADMIN" || actor.role === "CEO" || actor.branchIds.includes(branchId);
}

export function requireBranch(actor: Actor, branchId: number) {
  if (!canUseBranch(actor, branchId)) {
    throw new ApiError(403, "FORBIDDEN_BRANCH", "You do not have access to this branch.");
  }
}
