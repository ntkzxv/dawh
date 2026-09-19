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
