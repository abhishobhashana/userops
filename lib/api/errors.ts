export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "NETWORK_ERROR"
  | "TIMEOUT"
  | "UNKNOWN_ERROR";

export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly fields?: Record<string, string>;

  constructor(
    message: string,
    options: {
      code: ApiErrorCode;
      status: number;
      fields?: Record<string, string>;
    },
  ) {
    super(message);

    this.name = "ApiError";
    this.code = options.code;
    this.status = options.status;
    this.fields = options.fields;
  }
}
