import "server-only";

import { requireSession } from "@/lib/auth/session";
import { ApiError } from "@/lib/core/http/errors";
import { addRequestTiming, timedPoolQuery } from "@/lib/core/http/request-timing";
import type { Role } from "@/lib/contracts/warehouse";
import { isGlobalRole } from "@/lib/contracts/warehouse-policy";

export type { Role } from "@/lib/contracts/warehouse";
export type Actor = {
  id: number;
  authUserId: string;
  role: Role;
  branchIds: number[];
  name: string;
  nameTh?: string | null;
  nameEn?: string | null;
  email: string;
  image: string | null;
};

export async function getActor(
  request?: Request,
  options: { includeLocalizedNames?: boolean } = {},
): Promise<Actor> {
  const session = await requireSession(request);
  const actorStartedAt = performance.now();
  try {
    const result = await timedPoolQuery<{
      id: number;
      auth_user_id: string;
      role: Role;
      deleted_at: Date | null;
      banned: boolean;
      branch_ids: number[];
      name: string;
      first_name_th: string | null;
      last_name_th: string | null;
      first_name_en: string | null;
      last_name_en: string | null;
      email: string;
      image: string | null;
    }>(
      `
    SELECT a.id, a.auth_user_id, a.role, a.deleted_at,
      u.banned, u.name, u.email, u.image,
      ${options.includeLocalizedNames ? "p.first_name_th, p.last_name_th, p.first_name_en, p.last_name_en" : "NULL::text AS first_name_th, NULL::text AS last_name_th, NULL::text AS first_name_en, NULL::text AS last_name_en"},
      ARRAY(SELECT m.branch_id FROM app.branch_memberships m WHERE m.user_id=a.id ORDER BY m.branch_id) AS branch_ids
    FROM app.app_users a
    JOIN public."user" u ON u.id = a.auth_user_id
    ${options.includeLocalizedNames ? "LEFT JOIN app.member_profiles p ON p.app_user_id = a.id" : ""}
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
      ...(options.includeLocalizedNames
        ? {
            nameTh:
              [user.first_name_th, user.last_name_th]
                .filter(Boolean)
                .join(" ") || null,
            nameEn:
              [user.first_name_en, user.last_name_en]
                .filter(Boolean)
                .join(" ") || null,
          }
        : {}),
      email: user.email,
      image: user.image,
    };
  } finally {
    addRequestTiming("actorMs", performance.now() - actorStartedAt);
  }
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
