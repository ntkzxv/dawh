import { ValidationError } from "@/lib/core/http/errors";
import {
  rejectUnknownFields,
  requiredBoolean,
  requiredInteger,
  requiredText,
} from "@/lib/core/validation/fields";
import type {
  DepartmentInput,
  DepartmentUpdateInput,
} from "@/lib/departments/types";
function code(body: Record<string, unknown>) {
  const v = requiredText(body, "code").toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{0,31}$/.test(v))
    throw new ValidationError({
      code: "Use 1-32 uppercase letters, numbers, underscores, or hyphens.",
    });
  return v;
}
export function parseCreateDepartment(
  body: Record<string, unknown>,
): DepartmentInput {
  rejectUnknownFields(body, ["code", "name", "isActive"]);
  return {
    code: code(body),
    name: requiredText(body, "name"),
    isActive: requiredBoolean(body, "isActive"),
  };
}
export function parseUpdateDepartment(
  body: Record<string, unknown>,
): DepartmentUpdateInput {
  rejectUnknownFields(body, ["code", "name", "isActive", "version"]);
  const o: DepartmentUpdateInput = {
    version: requiredInteger(body, "version", 1, 2147483647),
  };
  if (body.code !== undefined) o.code = code(body);
  if (body.name !== undefined) o.name = requiredText(body, "name");
  if (body.isActive !== undefined)
    o.isActive = requiredBoolean(body, "isActive");
  if (Object.keys(o).length === 1)
    throw new ValidationError({
      body: "Provide at least one field to update.",
    });
  return o;
}
