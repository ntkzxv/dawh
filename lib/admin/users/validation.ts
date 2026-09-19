import { ValidationError } from "@/lib/core/http/errors";
import { isBigIntId } from "@/lib/core/ids/bigint";
import {
  rejectUnknownFields,
  requiredText,
} from "@/lib/core/validation/fields";
import type {
  AccountStatus,
  ChangeAccountStatusInput,
  UserFilters,
  UserPageRequest,
} from "@/lib/admin/users/types";

const statuses = new Set<AccountStatus>(["ACTIVE", "SUSPENDED", "TERMINATED"]);

export function parseUserQuery(url: URL): {
  page: UserPageRequest;
  filters: UserFilters;
} {
  const rawLimit = url.searchParams.get("limit");
  const limit = rawLimit ? Number(rawLimit) : 50;
  if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
    throw new ValidationError({ limit: "Use an integer from 1 to 200." });
  }

  const rawStatus = url.searchParams.get("status");
  const status = rawStatus?.toUpperCase() as AccountStatus | undefined;
  if (status && !statuses.has(status))
    throw new ValidationError({
      status: "Use ACTIVE, SUSPENDED, or TERMINATED.",
    });
  const facilityId = url.searchParams.get("facilityId");
  if (facilityId && !isBigIntId(facilityId))
    throw new ValidationError({ facilityId: "Use a positive integer ID." });
  const rawComplete = url.searchParams.get("profileComplete");
  if (rawComplete && rawComplete !== "true" && rawComplete !== "false") {
    throw new ValidationError({ profileComplete: "Use true or false." });
  }

  let cursor: UserPageRequest["cursor"] = null;
  const rawCursor = url.searchParams.get("cursor");
  if (rawCursor) {
    try {
      const value = JSON.parse(
        Buffer.from(rawCursor, "base64url").toString("utf8"),
      ) as { timestamp?: unknown; id?: unknown };
      if (
        typeof value.timestamp !== "string" ||
        Number.isNaN(Date.parse(value.timestamp)) ||
        typeof value.id !== "string" ||
        !value.id
      ) {
        throw new Error("invalid");
      }
      cursor = { timestamp: value.timestamp, id: value.id };
    } catch {
      throw new ValidationError({ cursor: "The cursor is invalid." });
    }
  }

  return {
    page: { limit, cursor },
    filters: {
      search: url.searchParams.get("search")?.trim() || null,
      status: status ?? null,
      roleCode: url.searchParams.get("roleCode")?.trim().toUpperCase() || null,
      facilityId,
      profileComplete: rawComplete === null ? null : rawComplete === "true",
    },
  };
}

export function encodeUserCursor(
  user: Pick<
    import("@/lib/admin/users/types").AdminUserSummary,
    "id" | "createdAt"
  >,
) {
  return Buffer.from(
    JSON.stringify({ timestamp: user.createdAt, id: user.id }),
  ).toString("base64url");
}

export function parseChangeAccountStatus(
  body: Record<string, unknown>,
): ChangeAccountStatusInput {
  rejectUnknownFields(body, ["status", "reason"]);
  const status = requiredText(body, "status").toUpperCase() as AccountStatus;
  if (!statuses.has(status))
    throw new ValidationError({
      status: "Use ACTIVE, SUSPENDED, or TERMINATED.",
    });
  const reason = requiredText(body, "reason");
  if (reason.length > 500)
    throw new ValidationError({ reason: "Use at most 500 characters." });
  return { status, reason };
}
