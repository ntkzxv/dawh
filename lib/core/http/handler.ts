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
      return jsonUnexpectedError(request, error);
    }
  };
}
