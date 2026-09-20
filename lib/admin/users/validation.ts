import { ValidationError } from "@/lib/core/http/errors";
import { isBigIntId } from "@/lib/core/ids/bigint";
import {
  encodeCursor,
  parsePageRequest,
} from "@/lib/core/http/pagination";
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
  const rawStatus = url.searchParams.get("status");
  const status = rawStatus?.toUpperCase() as AccountStatus | undefined;
  if (status && !statuses.has(status))
    throw new ValidationError({
      status: "Use ACTIVE, SUSPENDED, or TERMINATED.",
    });
  const facilityId = url.searchParams.get("facilityId");
  if (facilityId && !isBigIntId(facilityId))
    throw new ValidationError({ facilityId: "Use a positive integer ID." });
  const departmentId = url.searchParams.get("departmentId");
  if (departmentId && !isBigIntId(departmentId))
    throw new ValidationError({ departmentId: "Use a positive integer ID." });
  const rawComplete = url.searchParams.get("profileComplete");
  if (rawComplete && rawComplete !== "true" && rawComplete !== "false") {
    throw new ValidationError({ profileComplete: "Use true or false." });
  }
  const rawRoleAssigned = url.searchParams.get("roleAssigned");
  if (rawRoleAssigned && rawRoleAssigned !== "true" && rawRoleAssigned !== "false") {
    throw new ValidationError({ roleAssigned: "Use true or false." });
  }

  return {
    page: parsePageRequest(url, { cursorIdKind: "text" }),
    filters: {
      search: url.searchParams.get("search")?.trim() || null,
      status: status ?? null,
      roleCode: url.searchParams.get("roleCode")?.trim().toUpperCase() || null,
      roleAssigned:
        rawRoleAssigned === null ? null : rawRoleAssigned === "true",
      facilityId,
      departmentId,
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
  return encodeCursor({ timestamp: user.createdAt, id: user.id });
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
