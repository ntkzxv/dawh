import "server-only";

import type { PoolClient } from "pg";
import { auth } from "@/lib/auth";
import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import { ApiError, ConflictError, NotFoundError, ValidationError } from "@/lib/core/http/errors";
import { audit, id, optionalDate, optionalText, requireRole, text, type Actor, type Role } from "@/lib/warehouse/core";

const roles: Role[] = ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF", "EMPLOYEE"];
type MemberRow = {
  id: number; auth_user_id: string; name: string; email: string; role: Role;
  branch_ids: number[]; must_change_password: boolean; deleted_at: Date | null;
  employee_code: string | null; phone: string | null; address: string | null;
  started_on: string | null; emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
};
type Profile = {
  employeeCode: string | null; phone: string | null; address: string | null;
  startedOn: string | null; emergencyContactName: string | null;
  emergencyContactPhone: string | null;
};
const profileKeys = ["employeeCode", "phone", "address", "startedOn", "emergencyContactName", "emergencyContactPhone"] as const;
const profileColumns: Record<typeof profileKeys[number], string> = {
  employeeCode: "employee_code", phone: "phone", address: "address",
  startedOn: "started_on", emergencyContactName: "emergency_contact_name",
  emergencyContactPhone: "emergency_contact_phone",
};

function parseRole(value: unknown): Role {
  if (typeof value !== "string" || !roles.includes(value as Role)) throw new ValidationError({ role: "Choose a valid role." });
  return value as Role;
}
function parseEmail(value: unknown): string {
  const email = text(value, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new ValidationError({ email: "Use a valid email address." });
  return email;
}
function parseBranchIds(value: unknown): number[] {
  if (!Array.isArray(value)) throw new ValidationError({ branchIds: "Use an array of branch IDs." });
  return [...new Set(value.map((item) => id(item, "branchIds")))];
}
function validateMembership(role: Role, branchIds: number[]) {
  if (!["ADMIN", "CEO"].includes(role) && branchIds.length === 0) throw new ValidationError({ branchIds: "At least one branch is required for this role." });
}
async function assertBranches(branchIds: number[]) {
  if (!branchIds.length) return;
  const result = await dbPool.query<{ id: number }>(`SELECT id FROM app.branches WHERE active AND id = ANY($1::integer[])`, [branchIds]);
  if (result.rowCount !== branchIds.length) throw new ValidationError({ branchIds: "One or more branches do not exist or are inactive." });
}
function profileOf(row: MemberRow): Profile {
  return {
    employeeCode: row.employee_code, phone: row.phone, address: row.address,
    startedOn: row.started_on, emergencyContactName: row.emergency_contact_name,
    emergencyContactPhone: row.emergency_contact_phone,
  };
}
function visibleBranches(actor: Actor, row: MemberRow) {
  return actor.role === "ADMIN" || actor.role === "CEO" || actor.id === row.id
    ? row.branch_ids
    : row.branch_ids.filter((branchId) => actor.branchIds.includes(branchId));
}
function map(actor: Actor, row: MemberRow) {
  const common = { id: row.id, name: row.name, role: row.role, branchIds: visibleBranches(actor, row) };
  if (!["ADMIN", "CEO", "MANAGER"].includes(actor.role) && actor.id !== row.id) {
    return { ...common, detailLevel: "SUMMARY" as const };
  }
  return {
    ...common, detailLevel: "FULL" as const, email: row.email,
    mustChangePassword: row.must_change_password, deletedAt: row.deleted_at,
    profile: profileOf(row),
  };
}
const select = `SELECT a.id, a.auth_user_id, u.name, u.email, a.role, a.must_change_password, a.deleted_at,
  p.employee_code, p.phone, p.address, p.started_on::text AS started_on,
  p.emergency_contact_name, p.emergency_contact_phone,
  ARRAY(SELECT m.branch_id FROM app.branch_memberships m WHERE m.user_id=a.id ORDER BY m.branch_id) AS branch_ids
  FROM app.app_users a JOIN public."user" u ON u.id = a.auth_user_id
  LEFT JOIN app.member_profiles p ON p.app_user_id = a.id`;
const visibility = `($1::text = 'ADMIN' OR a.deleted_at IS NULL) AND
  ($1::text IN ('ADMIN','CEO') OR a.id=$2 OR EXISTS (
    SELECT 1 FROM app.branch_memberships scope
    WHERE scope.user_id=a.id AND scope.branch_id=ANY($3::integer[])
  ))`;
function visibilityParams(actor: Actor) { return [actor.role, actor.id, actor.branchIds]; }

async function loadMember(actor: Actor, memberId: number) {
  const result = await dbPool.query<MemberRow>(`${select} WHERE a.id=$4 AND ${visibility}`, [...visibilityParams(actor), memberId]);
  const row = result.rows[0];
  if (!row) throw new NotFoundError("Member");
  return row;
}

function parseProfile(value: unknown, isAdmin: boolean): Partial<Profile> | null {
  if (value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new ValidationError({ profile: "Use a profile object." });
  const input = value as Record<string, unknown>;
  for (const key of Object.keys(input)) {
    if (!profileKeys.includes(key as typeof profileKeys[number])) throw new ValidationError({ profile: `Unknown profile field: ${key}.` });
  }
  if (!isAdmin && ("employeeCode" in input || "startedOn" in input)) throw new ApiError(403, "FORBIDDEN", "Only an admin can edit employment details.");
  if (!Object.keys(input).length) return null;
  const result: Partial<Profile> = {};
  if ("employeeCode" in input) result.employeeCode = optionalText(input.employeeCode, "employeeCode", 50);
  if ("phone" in input) result.phone = optionalText(input.phone, "phone", 30);
  if ("address" in input) result.address = optionalText(input.address, "address", 1000);
  if ("startedOn" in input) result.startedOn = optionalDate(input.startedOn, "startedOn");
  if ("emergencyContactName" in input) result.emergencyContactName = optionalText(input.emergencyContactName, "emergencyContactName", 160);
  if ("emergencyContactPhone" in input) result.emergencyContactPhone = optionalText(input.emergencyContactPhone, "emergencyContactPhone", 30);
  return result;
}

async function saveProfile(client: PoolClient, memberId: number, profile: Partial<Profile>) {
  const keys = Object.keys(profile) as Array<typeof profileKeys[number]>;
  const columns = keys.map((key) => profileColumns[key]);
  const placeholders = keys.map((_, index) => `$${index + 2}`);
  const updates = columns.map((column) => `${column}=EXCLUDED.${column}`);
  await client.query(`INSERT INTO app.member_profiles (app_user_id,${columns.join(",")})
    VALUES ($1,${placeholders.join(",")}) ON CONFLICT (app_user_id)
    DO UPDATE SET ${updates.join(",")},updated_at=now()`, [memberId, ...keys.map((key) => profile[key])]);
}

export async function listMembers(actor: Actor) {
  const result = await dbPool.query<MemberRow>(`${select} WHERE ${visibility} ORDER BY a.id`, visibilityParams(actor));
  return result.rows.map((row) => map(actor, row));
}
export async function getMember(actor: Actor, memberId: number) {
  return map(actor, await loadMember(actor, memberId));
}

export async function createMember(actor: Actor, body: Record<string, unknown>) {
  requireRole(actor, ["ADMIN"]);
  const name = text(body.name, "name", 160);
  const email = parseEmail(body.email);
  const role = parseRole(body.role);
  const branchIds = parseBranchIds(body.branchIds ?? []);
  const profile = parseProfile(body.profile, true);
  const password = text(body.initialPassword, "initialPassword", 128);
  if (password.length < 8) throw new ValidationError({ initialPassword: "Use at least eight characters." });
  validateMembership(role, branchIds);
  await assertBranches(branchIds);
  const existing = await dbPool.query(`SELECT 1 FROM public."user" WHERE lower(email) = $1`, [email]);
  if (existing.rowCount) throw new ConflictError("CONFLICT", "Email is already in use.");
  let authUserId: string | undefined;
  try {
    const created = await auth.api.createUser({ body: { name, email, password, role: "user", data: { emailVerified: true } } });
    authUserId = created.user.id;
    const memberId = await withTransaction(async (client) => {
      const result = await client.query<{ id: number }>(`INSERT INTO app.app_users(auth_user_id, role, must_change_password) VALUES ($1,$2,true) RETURNING id`, [authUserId, role]);
      const newId = result.rows[0].id;
      for (const branchId of branchIds) await client.query(`INSERT INTO app.branch_memberships(user_id,branch_id) VALUES ($1,$2)`, [newId, branchId]);
      if (profile) await saveProfile(client, newId, profile);
      await audit(client, actor, "MEMBER_CREATED", "app_users", newId, { role, branchIds, hasProfile: !!profile });
      return newId;
    });
    return getMember(actor, memberId);
  } catch (error) {
    if (authUserId) await dbPool.query(`DELETE FROM public."user" WHERE id = $1 AND NOT EXISTS (SELECT 1 FROM app.app_users WHERE auth_user_id = $1)`, [authUserId]).catch(() => undefined);
    throw error;
  }
}

export async function updateMember(actor: Actor, memberId: number, body: Record<string, unknown>) {
  const isAdmin = actor.role === "ADMIN";
  if (!isAdmin && actor.id !== memberId) throw new ApiError(403, "FORBIDDEN", "Only the member or an admin can edit this profile.");
  for (const key of Object.keys(body)) {
    if (!["name", "email", "role", "branchIds", "profile"].includes(key)) throw new ValidationError({ [key]: "Unknown member field." });
  }
  if (!isAdmin && ("email" in body || "role" in body || "branchIds" in body)) {
    throw new ApiError(403, "FORBIDDEN", "Only an admin can edit account access or email.");
  }
  const current = await loadMember(actor, memberId);
  if (current.deleted_at) throw new ApiError(409, "MEMBER_DELETED", "Restore this member before editing.");
  const role = body.role === undefined ? current.role : parseRole(body.role);
  const branchIds = body.branchIds === undefined ? current.branch_ids : parseBranchIds(body.branchIds);
  if (isAdmin) {
    validateMembership(role, branchIds);
    await assertBranches(branchIds);
  }
  const name = body.name === undefined ? current.name : text(body.name, "name", 160);
  const email = body.email === undefined ? current.email : parseEmail(body.email);
  const profile = parseProfile(body.profile, isAdmin);
  if (!Object.keys(body).length || (Object.keys(body).length === 1 && body.profile && !profile)) return map(actor, current);
  await withTransaction(async (client) => {
    if (current.role === "ADMIN" && role !== "ADMIN") await assertAnotherAdmin(client, memberId);
    if (body.email !== undefined && email.toLowerCase() !== current.email.toLowerCase()) {
      const duplicate = await client.query(`SELECT 1 FROM public."user" WHERE lower(email)=$1 AND id<>$2`, [email, current.auth_user_id]);
      if (duplicate.rowCount) throw new ConflictError("CONFLICT", "Email is already in use.");
    }
    if (body.name !== undefined && body.email !== undefined) {
      await client.query(`UPDATE public."user" SET name=$1,email=$2,"updatedAt"=now() WHERE id=$3`, [name, email, current.auth_user_id]);
    } else if (body.name !== undefined) {
      await client.query(`UPDATE public."user" SET name=$1,"updatedAt"=now() WHERE id=$2`, [name, current.auth_user_id]);
    } else if (body.email !== undefined) {
      await client.query(`UPDATE public."user" SET email=$1,"updatedAt"=now() WHERE id=$2`, [email, current.auth_user_id]);
    }
    if (isAdmin) {
      if (body.role !== undefined) await client.query(`UPDATE app.app_users SET role=$1,updated_at=now() WHERE id=$2`, [role, memberId]);
      if (body.branchIds !== undefined) {
        await client.query(`DELETE FROM app.branch_memberships WHERE user_id=$1`, [memberId]);
        for (const branchId of branchIds) await client.query(`INSERT INTO app.branch_memberships(user_id,branch_id) VALUES ($1,$2)`, [memberId, branchId]);
      }
    }
    if (profile) await saveProfile(client, memberId, profile);
    await audit(client, actor, "MEMBER_UPDATED", "app_users", memberId, {
      changedFields: Object.keys(body).filter((key) => key !== "profile"),
      profileFields: body.profile && typeof body.profile === "object" ? Object.keys(body.profile) : [],
    });
  });
  return getMember(actor, memberId);
}

async function assertAnotherAdmin(client: PoolClient, memberId: number) {
  const result = await client.query<{ id: number }>(`SELECT id FROM app.app_users WHERE role='ADMIN' AND deleted_at IS NULL ORDER BY id FOR UPDATE`);
  if (!result.rows.some((row) => row.id !== memberId)) throw new ApiError(409, "LAST_ADMIN", "The last admin cannot be removed.");
}
export async function softDeleteMember(actor: Actor, memberId: number) {
  requireRole(actor, ["ADMIN"]);
  if (actor.id === memberId) throw new ApiError(409, "SELF_DELETE", "You cannot delete your own account.");
  const current = await getMember(actor, memberId);
  if (current.detailLevel !== "FULL") throw new ApiError(403, "FORBIDDEN", "Only an admin can delete a member.");
  if (current.deletedAt) return current;
  await withTransaction(async (client) => {
    if (current.role === "ADMIN") await assertAnotherAdmin(client, memberId);
    await client.query(`UPDATE app.app_users SET deleted_at=now(),deleted_by_id=$1,updated_at=now() WHERE id=$2`, [actor.id, memberId]);
    await client.query(`UPDATE public."user" SET banned=true,"banReason"='Soft deleted by organization administrator',"updatedAt"=now() WHERE id=(SELECT auth_user_id FROM app.app_users WHERE id=$1)`, [memberId]);
    await client.query(`DELETE FROM public.session WHERE "userId"=(SELECT auth_user_id FROM app.app_users WHERE id=$1)`, [memberId]);
    await audit(client, actor, "MEMBER_DELETED", "app_users", memberId, undefined, current);
  });
  return getMember(actor, memberId);
}
export async function restoreMember(actor: Actor, memberId: number) {
  requireRole(actor, ["ADMIN"]);
  await loadMember(actor, memberId);
  await withTransaction(async (client) => {
    await client.query(`UPDATE app.app_users SET deleted_at=NULL,deleted_by_id=NULL,updated_at=now() WHERE id=$1`, [memberId]);
    await client.query(`UPDATE public."user" SET banned=false,"banReason"=NULL,"banExpires"=NULL,"updatedAt"=now() WHERE id=(SELECT auth_user_id FROM app.app_users WHERE id=$1)`, [memberId]);
    await audit(client, actor, "MEMBER_RESTORED", "app_users", memberId);
  });
  return getMember(actor, memberId);
}
export async function resetMemberPassword(actor: Actor, memberId: number, value: unknown) {
  requireRole(actor, ["ADMIN"]);
  await loadMember(actor, memberId);
  const password = text(value, "initialPassword", 128);
  if (password.length < 8) throw new ValidationError({ initialPassword: "Use at least eight characters." });
  const hash = await (await auth.$context).password.hash(password);
  await withTransaction(async (client) => {
    await client.query(`UPDATE public.account SET password=$1,"updatedAt"=now() WHERE "userId"=(SELECT auth_user_id FROM app.app_users WHERE id=$2) AND "providerId"='credential'`, [hash, memberId]);
    await client.query(`UPDATE app.app_users SET must_change_password=true,updated_at=now() WHERE id=$1`, [memberId]);
    await client.query(`DELETE FROM public.session WHERE "userId"=(SELECT auth_user_id FROM app.app_users WHERE id=$1)`, [memberId]);
    await audit(client, actor, "MEMBER_PASSWORD_RESET", "app_users", memberId);
  });
}
