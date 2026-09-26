import { ApiError } from "@/lib/core/http/errors";
import { getRequestId } from "@/lib/core/http/request-id";

export type PageMeta = {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
};

export function jsonOk<T>(request: Request, data: T, status = 200) {
  const requestId = getRequestId(request);

  return Response.json(
    { data, meta: { requestId } },
    { status, headers: { "x-request-id": requestId } }
  );
}

export function jsonError(request: Request, error: ApiError) {
  const requestId = getRequestId(request);

  return Response.json(
    {
      error: {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
        requestId,
      },
    },
    { status: error.status, headers: { "x-request-id": requestId } }
  );
}

export function jsonUnexpectedError(request: Request, error: unknown) {
  const requestId = getRequestId(request);
  const message = error instanceof Error ? error.message : String(error);
  console.error(
    JSON.stringify({
      level: "error",
      event: "api.unhandled_error",
      requestId,
      method: request.method,
      path: new URL(request.url).pathname,
      message,
    }),
  );

  return Response.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred.",
        requestId,
      },
    },
    { status: 500, headers: { "x-request-id": requestId } }
  );
}
