import { ValidationError } from "@/lib/core/http/errors";
import {
  rejectUnknownFields,
  requiredBoolean,
  requiredInteger,
  requiredText,
} from "@/lib/core/validation/fields";
import type {
  FacilityFilters,
  FacilityInput,
  FacilityType,
  FacilityUpdateInput,
} from "@/lib/facilities/types";

const fields = [
  "code",
  "name",
  "facilityType",
  "addressLine1",
  "addressLine2",
  "province",
  "district",
  "subdistrict",
  "postalCode",
  "latitude",
  "longitude",
  "isActive",
] as const;
const codePattern = /^[A-Z0-9][A-Z0-9_-]{1,31}$/;
const decimalPattern = /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/;

function optional(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string")
    throw new ValidationError({ [key]: "Use text or null." });
  return value.trim() || null;
}
function code(body: Record<string, unknown>) {
  const value = requiredText(body, "code").toUpperCase();
  if (!codePattern.test(value))
    throw new ValidationError({
      code: "Use 2-32 uppercase letters, numbers, underscores, or hyphens.",
    });
  return value;
}
function type(body: Record<string, unknown>) {
  const value = requiredText(
    body,
    "facilityType",
  ).toUpperCase() as FacilityType;
  if (value !== "CENTRAL_WAREHOUSE" && value !== "BRANCH")
    throw new ValidationError({
      facilityType: "Use CENTRAL_WAREHOUSE or BRANCH.",
    });
  return value;
}
function decimal(
  body: Record<string, unknown>,
  key: string,
  min: number,
  max: number,
) {
  const value = optional(body, key);
  if (value === null) return null;
  const parsed = Number(value);
  if (
    !decimalPattern.test(value) ||
    !Number.isFinite(parsed) ||
    parsed < min ||
    parsed > max
  ) {
    throw new ValidationError({
      [key]: `Use a decimal string from ${min} to ${max}.`,
    });
  }
  return value;
}
function values(body: Record<string, unknown>): FacilityInput {
  const postalCode = optional(body, "postalCode");
  if (postalCode && !/^\d{5}$/.test(postalCode))
    throw new ValidationError({ postalCode: "Use a five-digit postal code." });
  return {
    code: code(body),
    name: requiredText(body, "name"),
    facilityType: type(body),
    addressLine1: optional(body, "addressLine1"),
    addressLine2: optional(body, "addressLine2"),
    province: optional(body, "province"),
    district: optional(body, "district"),
    subdistrict: optional(body, "subdistrict"),
    postalCode,
    latitude: decimal(body, "latitude", -90, 90),
    longitude: decimal(body, "longitude", -180, 180),
    isActive: requiredBoolean(body, "isActive"),
  };
}
export function parseCreateFacility(
  body: Record<string, unknown>,
): FacilityInput {
  rejectUnknownFields(body, fields);
  return values(body);
}
export function parseUpdateFacility(
  body: Record<string, unknown>,
): FacilityUpdateInput {
  rejectUnknownFields(body, [...fields, "version"]);
  const output: FacilityUpdateInput = {
    version: requiredInteger(body, "version", 1, 2147483647),
  };
  if (body.code !== undefined) output.code = code(body);
  if (body.name !== undefined) output.name = requiredText(body, "name");
  if (body.facilityType !== undefined) output.facilityType = type(body);
  for (const key of [
    "addressLine1",
    "addressLine2",
    "province",
    "district",
    "subdistrict",
  ] as const) {
    if (body[key] !== undefined) output[key] = optional(body, key);
  }
  if (body.postalCode !== undefined) {
    output.postalCode = optional(body, "postalCode");
    if (output.postalCode && !/^\d{5}$/.test(output.postalCode))
      throw new ValidationError({
        postalCode: "Use a five-digit postal code.",
      });
  }
  if (body.latitude !== undefined)
    output.latitude = decimal(body, "latitude", -90, 90);
  if (body.longitude !== undefined)
    output.longitude = decimal(body, "longitude", -180, 180);
  if (body.isActive !== undefined)
    output.isActive = requiredBoolean(body, "isActive");
  if (Object.keys(output).length === 1)
    throw new ValidationError({
      body: "Provide at least one field to update.",
    });
  return output;
}
export function parseFacilityFilters(url: URL): FacilityFilters {
  const rawType = url.searchParams.get("facilityType")?.toUpperCase() as
    FacilityType | undefined;
  if (rawType && rawType !== "CENTRAL_WAREHOUSE" && rawType !== "BRANCH")
    throw new ValidationError({
      facilityType: "Use CENTRAL_WAREHOUSE or BRANCH.",
    });
  const rawActive = url.searchParams.get("active");
  if (rawActive !== null && rawActive !== "true" && rawActive !== "false")
    throw new ValidationError({ active: "Use true or false." });
  return {
    search: url.searchParams.get("search")?.trim() || null,
    facilityType: rawType ?? null,
    active: rawActive === null ? null : rawActive === "true",
  };
}
