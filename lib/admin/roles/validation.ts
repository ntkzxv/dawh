import { ValidationError } from "@/lib/core/http/errors";
import {
  optionalText,
  rejectUnknownFields,
  requiredBigIntId,
  requiredText,
} from "@/lib/core/validation/fields";
import type { AssignRoleInput } from "@/lib/admin/roles/types";

function timestamp(value: string | null, key: string): string | null {
  if (value === null) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf()))
    throw new ValidationError({
      [key]: "Use a valid ISO-8601 timestamp or null.",
    });
  return date.toISOString();
}

export function parseAssignRole(
  body: Record<string, unknown>,
): AssignRoleInput {
  rejectUnknownFields(body, ["roleId", "validFrom", "validUntil"]);
  const validFrom = timestamp(optionalText(body, "validFrom"), "validFrom");
  const validUntil = timestamp(optionalText(body, "validUntil"), "validUntil");
  if (validFrom && validUntil && validFrom >= validUntil) {
    throw new ValidationError({ validUntil: "Must be later than validFrom." });
  }
  return { roleId: requiredBigIntId(body, "roleId"), validFrom, validUntil };
}

export function parseRevokeRole(body: Record<string, unknown>): string {
  rejectUnknownFields(body, ["reason"]);
  const reason = requiredText(body, "reason");
  if (reason.length > 500)
    throw new ValidationError({ reason: "Use at most 500 characters." });
  return reason;
}
