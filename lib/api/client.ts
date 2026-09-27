"use client";

export type ApiMeta = { requestId: string };

export type ApiPage = {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
  total?: number;
  page?: number;
};

export type ApiEnvelope<T> = {
  data: T;
  meta: ApiMeta;
  page?: ApiPage;
};

export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
};

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: unknown;
  readonly requestId?: string;

  constructor(status: number, error: ApiErrorBody) {
    super(error.message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = error.code;
    this.details = error.details;
    this.requestId = error.requestId;
  }
}

export class ApiTimeoutError extends Error {
  readonly timeoutMs: number;

  constructor(timeoutMs: number) {
    super(`The request timed out after ${timeoutMs / 1000} seconds. Please retry.`);
    this.name = "ApiTimeoutError";
    this.timeoutMs = timeoutMs;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) return null;
  return response.json().catch(() => null);
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<ApiEnvelope<T>> {
  const headers = new Headers(init.headers);
  if (init.body && !(init.body instanceof FormData) && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  headers.set("accept", "application/json");

  const method = (init.method ?? "GET").toUpperCase();
  const timeoutMs = method === "GET" ? 20_000 : null;
  const controller = timeoutMs == null ? null : new AbortController();
  let timedOut = false;
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const onCallerAbort = () => controller?.abort(init.signal?.reason);
  if (controller && init.signal?.aborted) onCallerAbort();
  else if (controller && init.signal) {
    init.signal.addEventListener("abort", onCallerAbort, { once: true });
  }
  if (controller) {
    timeout = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, timeoutMs!);
  }

  let response: Response;
  let payload: unknown;
  try {
    response = await fetch(path, {
      ...init,
      headers,
      signal: controller?.signal ?? init.signal,
      credentials: "include",
      cache: init.cache ?? "no-store",
    });
    payload = await parseResponse(response);
  } catch (cause) {
    if (timedOut) throw new ApiTimeoutError(timeoutMs!);
    throw cause;
  } finally {
    if (timeout) clearTimeout(timeout);
    if (controller && init.signal) {
      init.signal.removeEventListener("abort", onCallerAbort);
    }
  }
  if (!response.ok) {
    const body = isRecord(payload) && isRecord(payload.error) ? payload.error : {};
    throw new ApiRequestError(response.status, {
      code: typeof body.code === "string" ? body.code : "HTTP_ERROR",
      message:
        typeof body.message === "string"
          ? body.message
          : `Request failed with status ${response.status}.`,
      details: body.details,
      requestId:
        typeof body.requestId === "string"
          ? body.requestId
          : response.headers.get("x-request-id") ?? undefined,
    });
  }

  if (!isRecord(payload) || !("data" in payload)) {
    throw new ApiRequestError(response.status, {
      code: "INVALID_API_RESPONSE",
      message: "The API returned an invalid response.",
      requestId: response.headers.get("x-request-id") ?? undefined,
    });
  }

  return payload as unknown as ApiEnvelope<T>;
}

export async function apiGet<T>(path: string, init?: RequestInit) {
  return apiRequest<T>(path, { ...init, method: "GET" });
}

export async function apiPost<T>(path: string, body: unknown, init?: RequestInit) {
  return apiRequest<T>(path, { ...init, method: "POST", body: JSON.stringify(body) });
}

export async function apiPut<T>(path: string, body: unknown, init?: RequestInit) {
  return apiRequest<T>(path, { ...init, method: "PUT", body: JSON.stringify(body) });
}

export async function apiPatch<T>(path: string, body: unknown, init?: RequestInit) {
  return apiRequest<T>(path, { ...init, method: "PATCH", body: JSON.stringify(body) });
}

export async function apiDelete<T>(path: string, init?: RequestInit) {
  return apiRequest<T>(path, { ...init, method: "DELETE" });
}
