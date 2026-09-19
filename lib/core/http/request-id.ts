const requestIdHeader = "x-request-id";
const maxRequestIdLength = 128;

export function getRequestId(request: Request): string {
  const requestId = request.headers.get(requestIdHeader)?.trim();

  if (requestId && requestId.length <= maxRequestIdLength) return requestId;
  return crypto.randomUUID();
}

export function requestIdHeaders(request: Request): HeadersInit {
  return { [requestIdHeader]: getRequestId(request) };
}
