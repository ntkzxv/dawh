import { ConflictError } from "@/lib/core/http/errors";

type PostgresError = { code?: unknown; constraint?: unknown };

export function isPostgresError(
  error: unknown,
  code: string,
): error is PostgresError {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as PostgresError).code === code
  );
}

/** Maps PostgreSQL unique-constraint failures to the public API contract. */
export function rethrowUniqueViolation(
  error: unknown,
  message = "A record with the same unique value already exists.",
): never {
  if (isPostgresError(error, "23505")) {
    throw new ConflictError("CONFLICT", message);
  }

  throw error;
}
