import { ValidationError } from "@/lib/core/http/errors";

export function id(value: unknown, field = "id"): number {
  const parsed = typeof value === "string" && value.trim() !== "" ? Number(value) : value;
  if (typeof parsed !== "number" || !Number.isSafeInteger(parsed) || parsed < 1 || parsed > 2147483647) {
    throw new ValidationError({ [field]: "Use a positive integer ID." });
  }
  return parsed;
}

export function text(value: unknown, field: string, max = 500): string {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max) {
    throw new ValidationError({ [field]: `Use nonempty text of at most ${max} characters.` });
  }
  return value.trim();
}

export function optionalText(value: unknown, field: string, max = 2000): string | null {
  if (value == null || value === "") return null;
  return text(value, field, max);
}

export function quantity(value: unknown, field: string, allowZero = false): string {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new ValidationError({ [field]: "Use a numeric quantity." });
  }
  const raw = String(value);
  if (!/^\d{1,15}(?:\.\d{1,3})?$/.test(raw) || (allowZero ? Number(raw) < 0 : Number(raw) <= 0)) {
    throw new ValidationError({ [field]: "Use a positive quantity with at most three decimal places." });
  }
  return raw;
}

export function money(value: unknown, field: string): string {
  if (typeof value !== "string" && typeof value !== "number") {
    throw new ValidationError({ [field]: "Use a THB amount." });
  }
  const raw = String(value);
  if (!/^\d{1,16}(?:\.\d{1,2})?$/.test(raw)) {
    throw new ValidationError({ [field]: "Use a nonnegative THB amount with at most two decimal places." });
  }
  return raw;
}

export function date(value: unknown, field: string): string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00Z`))) {
    throw new ValidationError({ [field]: "Use a date in YYYY-MM-DD format." });
  }
  return value;
}

export function optionalDate(value: unknown, field: string): string | null {
  return value == null || value === "" ? null : date(value, field);
}

export function optionalMoney(value: unknown, field: string): string | null {
  return value == null || value === "" ? null : money(value, field);
}

export function optionalCount(value: unknown, field: string): number | null {
  if (value == null || value === "") return null;
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new ValidationError({ [field]: "Use a nonnegative whole number." });
  }
  return value;
}

export function idempotencyKey(value: string): string {
  if (!/^[A-Za-z0-9_-]{8,120}$/.test(value)) {
    throw new ValidationError({ idempotencyKey: "Send an Idempotency-Key header of 8–120 characters." });
  }
  return value;
}
