import { ValidationError } from "@/lib/core/http/errors";
import {
  optionalText,
  rejectUnknownFields,
  requiredBigIntId,
  requiredInteger,
  requiredText,
} from "@/lib/core/validation/fields";
import type {
  SafetyStockInput,
  SafetyStockUpdateInput,
} from "@/lib/safety-stock/types";
function dec(b: Record<string, unknown>, k: string, nullable = false) {
  const v = nullable ? optionalText(b, k) : requiredText(b, k);
  if (v !== null && !/^(?:0|[1-9]\d*)(?:\.\d+)?$/.test(v))
    throw new ValidationError({ [k]: "Use a non-negative decimal string." });
  return v;
}
export function parseCreateSafetyStock(
  b: Record<string, unknown>,
): SafetyStockInput {
  rejectUnknownFields(b, [
    "facilityId",
    "productId",
    "minimumQuantity",
    "maximumQuantity",
    "reorderPoint",
    "safetyQuantity",
  ]);
  return {
    facilityId: requiredBigIntId(b, "facilityId"),
    productId: requiredBigIntId(b, "productId"),
    minimumQuantity: dec(b, "minimumQuantity")!,
    maximumQuantity: dec(b, "maximumQuantity", true),
    reorderPoint: dec(b, "reorderPoint")!,
    safetyQuantity: dec(b, "safetyQuantity")!,
  };
}
export function parseUpdateSafetyStock(
  b: Record<string, unknown>,
): SafetyStockUpdateInput {
  rejectUnknownFields(b, [
    "minimumQuantity",
    "maximumQuantity",
    "reorderPoint",
    "safetyQuantity",
    "version",
  ]);
  const o: SafetyStockUpdateInput = {
    version: requiredInteger(b, "version", 1, 2147483647),
  };
  if (b.minimumQuantity !== undefined)
    o.minimumQuantity = dec(b, "minimumQuantity")!;
  if (b.maximumQuantity !== undefined)
    o.maximumQuantity = dec(b, "maximumQuantity", true);
  if (b.reorderPoint !== undefined) o.reorderPoint = dec(b, "reorderPoint")!;
  if (b.safetyQuantity !== undefined)
    o.safetyQuantity = dec(b, "safetyQuantity")!;
  if (Object.keys(o).length === 1)
    throw new ValidationError({
      body: "Provide at least one field to update.",
    });
  return o;
}
