import "server-only";

import type { PoolClient } from "pg";
import { auth } from "@/lib/auth";
import { assertDirectEmailChangeAllowed } from "@/lib/auth/account-security";
import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import {
  ApiError,
  ConflictError,
  ValidationError,
} from "@/lib/core/http/errors";
import {
  audit,
  id,
  requireRole,
  text,
  type Actor,
  type Role,
} from "@/lib/warehouse/core";
import {
  parseEmail,
  parseProfile,
  saveProfile,
} from "@/lib/warehouse/member-profile";
import {
  getMember,
  loadMember,
  mapMember,
} from "@/lib/warehouse/member-queries";
import { warehouseRoles } from "@/lib/contracts/warehouse";
export { getMember, listMembers } from "@/lib/warehouse/member-queries";

function parseRole(value: unknown): Role {
  if (typeof value !== "string" || !warehouseRoles.includes(value as Role))
    throw new ValidationError({ role: "Choose a valid role." });
  return value as Role;
}
function parseBranchIds(value: unknown): number[] {
  if (!Array.isArray(value))
    throw new ValidationError({ branchIds: "Use an array of branch IDs." });
  return [...new Set(value.map((item) => id(item, "branchIds")))];
}
function validateMembership(role: Role, branchIds: number[]) {
  if (!["ADMIN", "CEO"].includes(role) && branchIds.length === 0)
    throw new ValidationError({
      branchIds: "At least one branch is required for this role.",
    });
}
async function assertBranches(branchIds: number[]) {
  if (!branchIds.length) return;
  const result = await dbPool.query<{ id: number }>(
    `SELECT id FROM app.branches WHERE active AND id = ANY($1::integer[])`,
    [branchIds],
  );
  if (result.rowCount !== branchIds.length)
    throw new ValidationError({
      branchIds: "One or more branches do not exist or are inactive.",
    });
}
export async function createMember(
  actor: Actor,
  body: Record<string, unknown>,
) {
  requireRole(actor, ["ADMIN"]);
  const name = text(body.name, "name", 160);
  const email = parseEmail(body.email);
  const role = parseRole(body.role);
  const branchIds = parseBranchIds(body.branchIds ?? []);
  const profile = parseProfile(body.profile);
  const password = text(body.initialPassword, "initialPassword", 128);
  if (password.length < 8)
    throw new ValidationError({
      initialPassword: "Use at least eight characters.",
    });
  validateMembership(role, branchIds);
  await assertBranches(branchIds);
  const existing = await dbPool.query(
    `SELECT 1 FROM public."user" WHERE lower(email) = $1`,
    [email],
  );
  if (existing.rowCount)
    throw new ConflictError("CONFLICT", "Email is already in use.");
  let authUserId: string | undefined;
  try {
    const created = await auth.api.createUser({
      body: {
        name,
        email,
        password,
        role: "user",
        data: { emailVerified: true },
      },
    });
    authUserId = created.user.id;
    const memberId = await withTransaction(async (client) => {
      const result = await client.query<{ id: number }>(
        `INSERT INTO app.app_users(auth_user_id, role) VALUES ($1,$2) RETURNING id`,
        [authUserId, role],
      );
      const newId = result.rows[0].id;
      for (const branchId of branchIds)
        await client.query(
          `INSERT INTO app.branch_memberships(user_id,branch_id) VALUES ($1,$2)`,
          [newId, branchId],
        );
      if (profile) await saveProfile(client, newId, profile);
      await audit(client, actor, "MEMBER_CREATED", "app_users", newId, {
        role,
        branchIds,
        hasProfile: !!profile,
      });
      return newId;
    });
    return getMember(actor, memberId);
  } catch (error) {
    if (authUserId)
      await dbPool
        .query(
          `DELETE FROM public."user" WHERE id = $1 AND NOT EXISTS (SELECT 1 FROM app.app_users WHERE auth_user_id = $1)`,
          [authUserId],
        )
        .catch(() => undefined);
    throw error;
  }
}

export async function updateMember(
  actor: Actor,
  memberId: number,
  body: Record<string, unknown>,
) {
  const isAdmin = actor.role === "ADMIN";
  if (!isAdmin && actor.id !== memberId)
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Only the member or an admin can edit this profile.",
    );
  for (const key of Object.keys(body)) {
    if (
      !["name", "email", "role", "branchIds", "profile", "image"].includes(key)
    )
      throw new ValidationError({ [key]: "Unknown member field." });
  }
  if (!isAdmin && ("email" in body || "role" in body || "branchIds" in body)) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      "Only an admin can edit account access or email.",
    );
  }
  const current = await loadMember(actor, memberId);
  if (current.deleted_at)
    throw new ApiError(
      409,
      "MEMBER_DELETED",
      "Restore this member before editing.",
    );
  const role = body.role === undefined ? current.role : parseRole(body.role);
  const branchIds =
    body.branchIds === undefined
      ? current.branch_ids
      : parseBranchIds(body.branchIds);
  if (isAdmin) {
    validateMembership(role, branchIds);
    await assertBranches(branchIds);
  }
  const name =
    body.name === undefined ? current.name : text(body.name, "name", 160);
  const email =
    body.email === undefined ? current.email : parseEmail(body.email);
  const image =
    body.image === undefined
      ? undefined
      : body.image === null
        ? null
        : typeof body.image === "string"
          ? body.image.trim()
          : undefined;
  const emailChanged =
    body.email !== undefined &&
    email.toLowerCase() !== current.email.toLowerCase();
  if (emailChanged) assertDirectEmailChangeAllowed();
  const profile = parseProfile(body.profile);
  if (
    !Object.keys(body).length ||
    (Object.keys(body).length === 1 && body.profile && !profile)
  )
    return mapMember(actor, current);
  await withTransaction(async (client) => {
    if (current.role === "ADMIN" && role !== "ADMIN")
      await assertAnotherAdmin(client, memberId);
    if (emailChanged) {
      const duplicate = await client.query(
        `SELECT 1 FROM public."user" WHERE lower(email)=$1 AND id<>$2`,
        [email, current.auth_user_id],
      );
      if (duplicate.rowCount)
        throw new ConflictError("CONFLICT", "Email is already in use.");
    }
    if (body.name !== undefined && body.email !== undefined) {
      await client.query(
        `UPDATE public."user" SET name=$1,email=$2,"emailVerified"=CASE WHEN $3 THEN false ELSE "emailVerified" END,"updatedAt"=now() WHERE id=$4`,
        [name, email, emailChanged, current.auth_user_id],
      );
    } else if (body.name !== undefined) {
      await client.query(
        `UPDATE public."user" SET name=$1,"updatedAt"=now() WHERE id=$2`,
        [name, current.auth_user_id],
      );
    } else if (emailChanged) {
      await client.query(
        `UPDATE public."user" SET email=$1,"emailVerified"=false,"updatedAt"=now() WHERE id=$2`,
        [email, current.auth_user_id],
      );
    }
    if (image !== undefined) {
      await client.query(
        `UPDATE public."user" SET image=$1,"updatedAt"=now() WHERE id=$2`,
        [image, current.auth_user_id],
      );
    }
    if (isAdmin) {
      if (body.role !== undefined)
        await client.query(
          `UPDATE app.app_users SET role=$1,updated_at=now() WHERE id=$2`,
          [role, memberId],
        );
      if (body.branchIds !== undefined) {
        await client.query(
          `DELETE FROM app.branch_memberships WHERE user_id=$1`,
          [memberId],
        );
        for (const branchId of branchIds)
          await client.query(
            `INSERT INTO app.branch_memberships(user_id,branch_id) VALUES ($1,$2)`,
            [memberId, branchId],
          );
      }
    }
    if (profile) await saveProfile(client, memberId, profile);
    await audit(client, actor, "MEMBER_UPDATED", "app_users", memberId, {
      changedFields: Object.keys(body).filter(
        (key) => key !== "profile" && (key !== "email" || emailChanged),
      ),
      profileFields:
        body.profile && typeof body.profile === "object"
          ? Object.keys(body.profile)
          : [],
    });
  });
  return getMember(actor, memberId);
}

async function assertAnotherAdmin(client: PoolClient, memberId: number) {
  const result = await client.query<{ id: number }>(
    `SELECT id FROM app.app_users WHERE role='ADMIN' AND deleted_at IS NULL ORDER BY id FOR UPDATE`,
  );
  if (!result.rows.some((row) => row.id !== memberId))
    throw new ApiError(409, "LAST_ADMIN", "The last admin cannot be removed.");
}
export async function softDeleteMember(actor: Actor, memberId: number) {
  requireRole(actor, ["ADMIN"]);
  if (actor.id === memberId)
    throw new ApiError(
      409,
      "SELF_DELETE",
      "You cannot delete your own account.",
    );
  const current = await getMember(actor, memberId);
  if (current.detailLevel !== "FULL")
    throw new ApiError(403, "FORBIDDEN", "Only an admin can delete a member.");
  if (current.deletedAt) return current;
  await withTransaction(async (client) => {
    if (current.role === "ADMIN") await assertAnotherAdmin(client, memberId);
    await client.query(
      `UPDATE app.app_users SET deleted_at=now(),deleted_by_id=$1,updated_at=now() WHERE id=$2`,
      [actor.id, memberId],
    );
    await client.query(
      `UPDATE public."user" SET banned=true,"banReason"='Soft deleted by organization administrator',"updatedAt"=now() WHERE id=(SELECT auth_user_id FROM app.app_users WHERE id=$1)`,
      [memberId],
    );
    await client.query(
      `DELETE FROM public.session WHERE "userId"=(SELECT auth_user_id FROM app.app_users WHERE id=$1)`,
      [memberId],
    );
    await audit(client, actor, "MEMBER_DELETED", "app_users", memberId, {
      deleted: true,
    });
  });
  return getMember(actor, memberId);
}
export async function restoreMember(actor: Actor, memberId: number) {
  requireRole(actor, ["ADMIN"]);
  await loadMember(actor, memberId);
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE app.app_users SET deleted_at=NULL,deleted_by_id=NULL,updated_at=now() WHERE id=$1`,
      [memberId],
    );
    await client.query(
      `UPDATE public."user" SET banned=false,"banReason"=NULL,"banExpires"=NULL,"updatedAt"=now() WHERE id=(SELECT auth_user_id FROM app.app_users WHERE id=$1)`,
      [memberId],
    );
    await audit(client, actor, "MEMBER_RESTORED", "app_users", memberId);
  });
  return getMember(actor, memberId);
}
export async function resetMemberPassword(
  actor: Actor,
  memberId: number,
  value: unknown,
) {
  requireRole(actor, ["ADMIN"]);
  await loadMember(actor, memberId);
  const password = text(value, "initialPassword", 128);
  if (password.length < 8)
    throw new ValidationError({
      initialPassword: "Use at least eight characters.",
    });
  const hash = await (await auth.$context).password.hash(password);
  await withTransaction(async (client) => {
    await client.query(
      `UPDATE public.account SET password=$1,"updatedAt"=now() WHERE "userId"=(SELECT auth_user_id FROM app.app_users WHERE id=$2) AND "providerId"='credential'`,
      [hash, memberId],
    );
    await client.query(
      `UPDATE app.app_users SET updated_at=now() WHERE id=$1`,
      [memberId],
    );
    await client.query(
      `DELETE FROM public.session WHERE "userId"=(SELECT auth_user_id FROM app.app_users WHERE id=$1)`,
      [memberId],
    );
    await audit(client, actor, "MEMBER_PASSWORD_RESET", "app_users", memberId);
  });
}
