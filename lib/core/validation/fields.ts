import "server-only";

import { ValidationError } from "@/lib/core/http/errors";
import { isBigIntId } from "@/lib/core/ids/bigint";

export function rejectUnknownFields(
  body: Record<string, unknown>,
  allowed: readonly string[]
) {
  const allowedSet = new Set(allowed);
  const unknown = Object.keys(body).filter((key) => !allowedSet.has(key));
  if (unknown.length) throw new ValidationError({ unknownFields: unknown });
}

export function requiredText(body: Record<string, unknown>, key: string): string {
  const value = body[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new ValidationError({ [key]: "This field is required." });
  }
  return value.trim();
}

export function optionalText(body: Record<string, unknown>, key: string): string | null {
  const value = body[key];
  if (value === undefined || value === null || value === "") return null;
  if (typeof value !== "string") {
    throw new ValidationError({ [key]: "Use text or null." });
  }
  return value.trim() || null;
}

export function requiredBigIntId(body: Record<string, unknown>, key: string): string {
  const value = requiredText(body, key);
  if (!isBigIntId(value)) throw new ValidationError({ [key]: "Use a positive integer ID." });
  return value;
}

export function optionalBigIntId(body: Record<string, unknown>, key: string): string | null {
  const value = optionalText(body, key);
  if (value === null) return null;
  if (!isBigIntId(value)) throw new ValidationError({ [key]: "Use a positive integer ID." });
  return value;
}

export function requiredInteger(
  body: Record<string, unknown>,
  key: string,
  min: number,
  max: number
): number {
  const value = body[key];
  if (!Number.isInteger(value) || (value as number) < min || (value as number) > max) {
    throw new ValidationError({ [key]: `Use an integer from ${min} to ${max}.` });
  }
  return value as number;
}

export function requiredBoolean(body: Record<string, unknown>, key: string): boolean {
  const value = body[key];
  if (typeof value !== "boolean") {
    throw new ValidationError({ [key]: "Use true or false." });
  }
  return value;
}

export function optionalBoolean(body: Record<string, unknown>, key: string): boolean | null {
  const value = body[key];
  if (value === undefined || value === null) return null;
  if (typeof value !== "boolean") {
    throw new ValidationError({ [key]: "Use true, false, or null." });
  }
  return value;
}
