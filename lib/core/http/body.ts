import "server-only";

import { ValidationError } from "@/lib/core/http/errors";

export async function parseJsonObject(request: Request): Promise<Record<string, unknown>> {
  let value: unknown;

  try {
    value = await request.json();
  } catch {
    throw new ValidationError({ body: "Use a valid JSON object." });
  }

  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError({ body: "Use a JSON object." });
  }

  return value as Record<string, unknown>;
}
