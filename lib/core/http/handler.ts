import { ApiError } from "@/lib/core/http/errors";
import { jsonError, jsonUnexpectedError } from "@/lib/core/http/response";

export function apiRoute<TContext = unknown>(
  handler: (request: Request, context: TContext) => Promise<Response>,
) {
  return async function route(
    request: Request,
    context: TContext,
  ): Promise<Response> {
    try {
      return await handler(request, context);
    } catch (error) {
      if (error instanceof ApiError) return jsonError(request, error);
      const databaseCode = error && typeof error === "object" && "code" in error ? String(error.code) : null;
      if (databaseCode === "23505") return jsonError(request, new ApiError(409, "DUPLICATE_RECORD", "This value is already in use."));
      if (databaseCode === "23503" || databaseCode === "23514" || databaseCode === "22P02") {
        return jsonError(request, new ApiError(400, "INVALID_REFERENCE", "A referenced value is missing or invalid."));
      }
      return jsonUnexpectedError(request, error);
    }
  };
}
