import "server-only";

import { requireSession } from "@/lib/auth/session";
import { dbPool } from "@/lib/core/db/pool";
import { ApiError } from "@/lib/core/http/errors";
import type { Role } from "@/lib/contracts/warehouse";
import { isGlobalRole } from "@/lib/contracts/warehouse-policy";

export type { Role } from "@/lib/contracts/warehouse";
export type Actor = {
  id: number;
  authUserId: string;
  role: Role;
  branchIds: number[];
  name: string;
  email: string;
  image: string | null;
};

export async function getActor(request?: Request): Promise<Actor> {
  const session = await requireSession(request);
  const result = await dbPool.query<{
    id: number;
    auth_user_id: string;
    role: Role;
    deleted_at: Date | null;
    banned: boolean;
    branch_ids: number[];
    name: string;
    email: string;
    image: string | null;
  }>(
    `
    SELECT a.id, a.auth_user_id, a.role, a.deleted_at,
      u.banned, u.name, u.email, u.image,
      ARRAY(SELECT m.branch_id FROM app.branch_memberships m WHERE m.user_id=a.id ORDER BY m.branch_id) AS branch_ids
    FROM app.app_users a
    JOIN public."user" u ON u.id = a.auth_user_id
    WHERE a.auth_user_id = $1
  `,
    [session.user.id],
  );

  const user = result.rows[0];
  if (!user || user.deleted_at || user.banned) {
    throw new ApiError(
      403,
      "ACCOUNT_DISABLED",
      "This account cannot use the warehouse.",
    );
  }
  return {
    id: user.id,
    authUserId: user.auth_user_id,
    role: user.role,
    branchIds: user.branch_ids,
    name: user.name,
    email: user.email,
    image: user.image,
  };
}

export function requireRole(actor: Actor, roles: readonly Role[]) {
  if (!roles.includes(actor.role)) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "You do not have permission for this action.",
    );
  }
}

export function canUseBranch(actor: Actor, branchId: number) {
  return isGlobalRole(actor.role) || actor.branchIds.includes(branchId);
}

export function requireBranch(actor: Actor, branchId: number) {
  if (!canUseBranch(actor, branchId)) {
    throw new ApiError(
      403,
      "FORBIDDEN_BRANCH",
      "You do not have access to this branch.",
    );
  }
}
