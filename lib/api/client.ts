"use client";

export type ApiMeta = { requestId: string };

export type ApiPage = {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
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
  if (init.body && !headers.has("content-type")) {
    headers.set("content-type", "application/json");
  }
  headers.set("accept", "application/json");

  const response = await fetch(path, {
    ...init,
    headers,
    credentials: "include",
    cache: init.cache ?? "no-store",
  });
  const payload = await parseResponse(response);

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

