export type ApiMeta = {
  requestId: string;
};

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

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "ACCOUNT_SUSPENDED"
  | "PROFILE_INCOMPLETE"
  | "FORBIDDEN"
  | "FORBIDDEN_FACILITY_SCOPE"
  | "VALIDATION_ERROR"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VERSION_CONFLICT"
  | "INTERNAL_ERROR"
  | "INVALID_API_RESPONSE"
  | "HTTP_ERROR"
  | string;

export type ApiErrorBody = {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
  requestId?: string;
};

export type ApiErrorEnvelope = {
  error: ApiErrorBody;
};
