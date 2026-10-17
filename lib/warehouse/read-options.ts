import { ValidationError } from "@/lib/core/http/errors";

export function optionalBoolean(search: URLSearchParams, field: string) {
  const value = search.get(field);
  if (value === null) return null;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new ValidationError({ [field]: "Use true or false." });
}

export function readView<T extends string>(search: URLSearchParams, compact: T): "full" | T {
  const value = search.get("view");
  if (value === null || value === "full") return "full";
  if (value === compact) return compact;
  throw new ValidationError({ view: `Use full or ${compact}.` });
}
