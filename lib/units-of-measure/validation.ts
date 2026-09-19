import { ValidationError } from "@/lib/core/http/errors";
import {
  rejectUnknownFields,
  requiredBoolean,
  requiredInteger,
  requiredText,
} from "@/lib/core/validation/fields";
import type {
  UnitOfMeasureInput,
  UnitOfMeasureUpdateInput,
} from "@/lib/units-of-measure/types";
function code(b: Record<string, unknown>) {
  const v = requiredText(b, "code").toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{0,31}$/.test(v))
    throw new ValidationError({
      code: "Use 1-32 uppercase letters, numbers, underscores, or hyphens.",
    });
  return v;
}
export function parseCreateUnit(
  b: Record<string, unknown>,
): UnitOfMeasureInput {
  rejectUnknownFields(b, ["code", "name", "decimalScale", "isActive"]);
  return {
    code: code(b),
    name: requiredText(b, "name"),
    decimalScale: requiredInteger(b, "decimalScale", 0, 6),
    isActive: requiredBoolean(b, "isActive"),
  };
}
export function parseUpdateUnit(
  b: Record<string, unknown>,
): UnitOfMeasureUpdateInput {
  rejectUnknownFields(b, [
    "code",
    "name",
    "decimalScale",
    "isActive",
    "version",
  ]);
  const o: UnitOfMeasureUpdateInput = {
    version: requiredInteger(b, "version", 1, 2147483647),
  };
  if (b.code !== undefined) o.code = code(b);
  if (b.name !== undefined) o.name = requiredText(b, "name");
  if (b.decimalScale !== undefined)
    o.decimalScale = requiredInteger(b, "decimalScale", 0, 6);
  if (b.isActive !== undefined) o.isActive = requiredBoolean(b, "isActive");
  if (Object.keys(o).length === 1)
    throw new ValidationError({
      body: "Provide at least one field to update.",
    });
  return o;
}
