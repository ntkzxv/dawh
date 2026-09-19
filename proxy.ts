import { NextResponse, type NextRequest } from "next/server";

const requestIdHeader = "x-request-id";
const validRequestId = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/;

function requestIdFrom(request: NextRequest) {
  const incoming = request.headers.get(requestIdHeader)?.trim();

  if (incoming && validRequestId.test(incoming)) return incoming;
  return crypto.randomUUID();
}

export function proxy(request: NextRequest) {
  const requestId = requestIdFrom(request);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(requestIdHeader, requestId);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set(requestIdHeader, requestId);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
