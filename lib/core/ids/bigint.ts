import { ValidationError } from "@/lib/core/http/errors";

const positiveBigIntIdPattern = /^[1-9]\d*$/;
const postgresBigIntMax = "9223372036854775807";

export function isBigIntId(value: string): boolean {
  if (!positiveBigIntIdPattern.test(value)) return false;
  if (value.length !== postgresBigIntMax.length) return value.length < postgresBigIntMax.length;
  return value <= postgresBigIntMax;
}

/**
 * Validates an identity-column value received from a dynamic route segment.
 * Keep identifiers as strings in TypeScript: JavaScript numbers cannot safely
 * represent every PostgreSQL bigint value.
 */
export function parseRouteBigIntId(
  value: string | undefined,
  field = "id",
): string {
  if (!value || !isBigIntId(value)) {
    throw new ValidationError({ [field]: "Use a positive integer ID." });
  }

  return value;
}
