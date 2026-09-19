import "server-only";

import { getRequestId } from "@/lib/core/http/request-id";

export type RequestContext = {
  requestId: string;
  ipAddress: string | null;
  userAgent: string | null;
};

export function getRequestContext(request: Request): RequestContext {
  const forwardedFor = request.headers
    .get("x-forwarded-for")
    ?.split(",")[0]
    ?.trim();

  return {
    requestId: getRequestId(request),
    ipAddress: forwardedFor || request.headers.get("x-real-ip")?.trim() || null,
    userAgent: request.headers.get("user-agent")?.trim() || null,
  };
}
