import { ApiError } from "@/lib/core/http/errors";
import { jsonError, jsonUnexpectedError } from "@/lib/core/http/response";

export function apiRoute(handler: (request: Request) => Promise<Response>) {
  return async function route(request: Request): Promise<Response> {
    try {
      return await handler(request);
    } catch (error) {
      if (error instanceof ApiError) return jsonError(request, error);
      return jsonUnexpectedError(request, error);
    }
  };
}
