import "server-only";

import { auth } from "@/lib/auth";
import { withTransaction } from "@/lib/core/db/transaction";
import { ApiError, ConflictError, ValidationError } from "@/lib/core/http/errors";
import { audit } from "@/lib/warehouse/audit";
import type { Actor } from "@/lib/warehouse/access";

type PasswordChangeAction = "PASSWORD_CHANGED" | "INITIAL_PASSWORD_CHANGED";

function passwordValue(value: unknown, field: string): string {
  if (typeof value !== "string" || value.length === 0 || value.length > 128) {
    throw new ValidationError({ [field]: "Provide a password of 1–128 characters." });
  }
  return value;
}

function emailValue(value: unknown, field: string): string {
  if (typeof value !== "string" || value.trim().length === 0 || value.trim().length > 254) {
    throw new ValidationError({ [field]: "Provide a valid email address." });
  }
  const email = value.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new ValidationError({ [field]: "Provide a valid email address." });
  }
  return email;
}

export function assertDirectEmailChangeAllowed() {
  if (process.env.AUTH_EMAIL_ENABLED === "true") {
    throw new ApiError(
      409,
      "EMAIL_VERIFICATION_REQUIRED",
      "Direct email changes are disabled while email verification is enabled.",
    );
  }
}

export async function changeOwnEmail(actor: Actor, body: Record<string, unknown>) {
  const currentPassword = passwordValue(body.currentPassword, "currentPassword");
  const email = emailValue(body.newEmail, "newEmail");
  const confirmEmail = emailValue(body.confirmNewEmail, "confirmNewEmail");
  if (email !== confirmEmail) {
    throw new ValidationError({ confirmNewEmail: "The email addresses do not match." });
  }
  assertDirectEmailChangeAllowed();

  return withTransaction(async (client) => {
    const account = await client.query<{ email: string; password: string | null }>(`
      SELECT u.email, a.password
      FROM public."user" u
      JOIN public.account a ON a."userId"=u.id AND a."providerId"='credential'
      WHERE u.id=$1
      FOR UPDATE OF u, a
    `, [actor.authUserId]);
    const row = account.rows[0];
    if (!row?.password) {
      throw new ApiError(400, "EMAIL_CHANGE_FAILED", "The password is incorrect or the account cannot change email.");
    }

    const context = await auth.$context;
    const passwordMatches = await context.password.verify({ hash: row.password, password: currentPassword });
    if (!passwordMatches) {
      throw new ApiError(400, "EMAIL_CHANGE_FAILED", "The password is incorrect or the account cannot change email.");
    }
    if (row.email.toLowerCase() === email) return { changed: false, email: row.email };

    const duplicate = await client.query(
      `SELECT 1 FROM public."user" WHERE lower(email)=$1 AND id<>$2`,
      [email, actor.authUserId],
    );
    if (duplicate.rowCount) throw new ConflictError("CONFLICT", "Email is already in use.");

    await client.query(
      `UPDATE public."user" SET email=$1,"emailVerified"=false,"updatedAt"=now() WHERE id=$2`,
      [email, actor.authUserId],
    );
    await audit(client, actor, "MEMBER_EMAIL_CHANGED", "app_users", actor.id, { changedFields: ["email"] });
    return { changed: true, email };
  });
}

export async function changeOwnPassword(
  actor: Actor,
  headers: Headers,
  body: Record<string, unknown>,
  options: { requireConfirmation: boolean; auditAction: PasswordChangeAction },
) {
  const currentPassword = passwordValue(body.currentPassword, "currentPassword");
  const newPassword = passwordValue(body.newPassword, "newPassword");
  if (newPassword.length < 8) {
    throw new ValidationError({ newPassword: "Use at least eight characters." });
  }
  if (options.requireConfirmation) {
    const confirmNewPassword = passwordValue(body.confirmNewPassword, "confirmNewPassword");
    if (newPassword !== confirmNewPassword) {
      throw new ValidationError({ confirmNewPassword: "The passwords do not match." });
    }
  }

  try {
    await auth.api.changePassword({
      headers,
      body: { currentPassword, newPassword, revokeOtherSessions: true },
    });
  } catch {
    throw new ApiError(400, "PASSWORD_CHANGE_FAILED", "Current password is incorrect or the new password is invalid.");
  }

  await withTransaction(async (client) => {
    await client.query(`UPDATE app.app_users SET must_change_password=false,updated_at=now() WHERE id=$1`, [actor.id]);
    await audit(client, actor, options.auditAction, "app_users", actor.id);
  });
  return { changed: true };
}
