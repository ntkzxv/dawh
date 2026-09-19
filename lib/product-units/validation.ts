import { ValidationError } from "@/lib/core/http/errors";
import {
  optionalText,
  rejectUnknownFields,
  requiredBigIntId,
  requiredBoolean,
  requiredInteger,
} from "@/lib/core/validation/fields";
import type {
  ProductUnitInput,
  ProductUnitUpdateInput,
} from "@/lib/product-units/types";
const fields = [
  "unitId",
  "baseQuantity",
  "lengthCm",
  "widthCm",
  "heightCm",
  "weightKg",
  "isActive",
] as const;
function dec(b: Record<string, unknown>, k: string, required = false) {
  const v = optionalText(b, k);
  if (
    (required && v === null) ||
    (v !== null && (!/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(v) || !/[1-9]/.test(v)))
  )
    throw new ValidationError({ [k]: "Use a positive decimal string." });
  return v;
}
export function parseCreateProductUnit(
  b: Record<string, unknown>,
): ProductUnitInput {
  rejectUnknownFields(b, fields);
  return {
    unitId: requiredBigIntId(b, "unitId"),
    baseQuantity: dec(b, "baseQuantity", true)!,
    lengthCm: dec(b, "lengthCm"),
    widthCm: dec(b, "widthCm"),
    heightCm: dec(b, "heightCm"),
    weightKg: dec(b, "weightKg"),
    isActive: requiredBoolean(b, "isActive"),
  };
}
export function parseUpdateProductUnit(
  b: Record<string, unknown>,
): ProductUnitUpdateInput {
  rejectUnknownFields(b, [...fields, "version"]);
  const o: ProductUnitUpdateInput = {
    version: requiredInteger(b, "version", 1, 2147483647),
  };
  if (b.unitId !== undefined) o.unitId = requiredBigIntId(b, "unitId");
  if (b.baseQuantity !== undefined)
    o.baseQuantity = dec(b, "baseQuantity", true)!;
  for (const k of ["lengthCm", "widthCm", "heightCm", "weightKg"] as const)
    if (b[k] !== undefined) o[k] = dec(b, k);
  if (b.isActive !== undefined) o.isActive = requiredBoolean(b, "isActive");
  if (Object.keys(o).length === 1)
    throw new ValidationError({
      body: "Provide at least one field to update.",
    });
  return o;
}
