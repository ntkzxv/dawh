export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends ApiError {
  constructor(details: Record<string, unknown>) {
    super(400, "VALIDATION_ERROR", "The request is invalid.", details);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = "Resource") {
    super(404, "NOT_FOUND", `${resource} was not found.`);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends ApiError {
  constructor(
    code: "CONFLICT" | "VERSION_CONFLICT",
    message: string,
    details?: Record<string, unknown>
  ) {
    super(409, code, message, details);
    this.name = "ConflictError";
  }
}

export class AccountStatusError extends ApiError {
  constructor(status: "SUSPENDED" | "TERMINATED") {
    super(403, "ACCOUNT_SUSPENDED", "This account cannot use WMS APIs.", { status });
    this.name = "AccountStatusError";
  }
}
