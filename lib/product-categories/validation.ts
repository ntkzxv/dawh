import { ValidationError } from "@/lib/core/http/errors";
import {
  optionalBigIntId,
  optionalText,
  rejectUnknownFields,
  requiredBoolean,
  requiredInteger,
  requiredText,
} from "@/lib/core/validation/fields";
import type {
  ProductCategoryInput,
  ProductCategoryUpdateInput,
} from "@/lib/product-categories/types";
function code(b: Record<string, unknown>) {
  const v = requiredText(b, "code").toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{0,31}$/.test(v))
    throw new ValidationError({
      code: "Use 1-32 uppercase letters, numbers, underscores, or hyphens.",
    });
  return v;
}
export function parseCreateProductCategory(
  b: Record<string, unknown>,
): ProductCategoryInput {
  rejectUnknownFields(b, [
    "parentId",
    "code",
    "name",
    "description",
    "isActive",
  ]);
  return {
    parentId: optionalBigIntId(b, "parentId"),
    code: code(b),
    name: requiredText(b, "name"),
    description: optionalText(b, "description"),
    isActive: requiredBoolean(b, "isActive"),
  };
}
export function parseUpdateProductCategory(
  b: Record<string, unknown>,
): ProductCategoryUpdateInput {
  rejectUnknownFields(b, [
    "parentId",
    "code",
    "name",
    "description",
    "isActive",
    "version",
  ]);
  const o: ProductCategoryUpdateInput = {
    version: requiredInteger(b, "version", 1, 2147483647),
  };
  if (b.parentId !== undefined) o.parentId = optionalBigIntId(b, "parentId");
  if (b.code !== undefined) o.code = code(b);
  if (b.name !== undefined) o.name = requiredText(b, "name");
  if (b.description !== undefined)
    o.description = optionalText(b, "description");
  if (b.isActive !== undefined) o.isActive = requiredBoolean(b, "isActive");
  if (Object.keys(o).length === 1)
    throw new ValidationError({
      body: "Provide at least one field to update.",
    });
  return o;
}
