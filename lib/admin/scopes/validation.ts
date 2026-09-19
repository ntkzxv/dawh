import { ValidationError } from "@/lib/core/http/errors";
import { optionalText, rejectUnknownFields, requiredBigIntId, requiredInteger, requiredText } from "@/lib/core/validation/fields";
import type { FacilityScopeInput, UpdateFacilityScopeInput } from "@/lib/admin/scopes/types";
import type { FacilityScopeType } from "@/lib/access/types";

const scopeTypes = new Set<FacilityScopeType>(["READ", "OPERATE", "APPROVE", "ADMIN"]);

function parseTimestamp(body: Record<string, unknown>, key: string) {
  const value = optionalText(body, key);
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) throw new ValidationError({ [key]: "Use a valid ISO-8601 timestamp or null." });
  return date.toISOString();
}

function common(body: Record<string, unknown>) {
  const scopeType = requiredText(body, "scopeType").toUpperCase() as FacilityScopeType;
  if (!scopeTypes.has(scopeType)) throw new ValidationError({ scopeType: "Use READ, OPERATE, APPROVE, or ADMIN." });
  const validFrom = parseTimestamp(body, "validFrom");
  const validUntil = parseTimestamp(body, "validUntil");
  if (validFrom && validUntil && validFrom >= validUntil) throw new ValidationError({ validUntil: "Must be later than validFrom." });
  return { scopeType, validFrom, validUntil };
}

export function parseCreateFacilityScope(body: Record<string, unknown>): FacilityScopeInput {
  rejectUnknownFields(body, ["facilityId", "scopeType", "validFrom", "validUntil"]);
  return { facilityId: requiredBigIntId(body, "facilityId"), ...common(body) };
}

export function parseUpdateFacilityScope(body: Record<string, unknown>): UpdateFacilityScopeInput {
  rejectUnknownFields(body, ["scopeType", "validFrom", "validUntil", "version"]);
  return { ...common(body), version: requiredInteger(body, "version", 1, 2147483647) };
}

export function parseRevokeFacilityScope(body: Record<string, unknown>): { version: number; reason: string } {
  rejectUnknownFields(body, ["version", "reason"]);
  return {
    version: requiredInteger(body, "version", 1, 2147483647),
    reason: requiredText(body, "reason"),
  };
}
