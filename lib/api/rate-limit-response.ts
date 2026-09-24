import type { RateLimitResult } from "./rate-limit";

export function rateLimitResponse(result: RateLimitResult) {
  return Response.json(
    {
      success: false,
      error: {
        code: "RATE_LIMITED",
        message: "Too many requests. Please try again later.",
      },
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(result.retryAfterSeconds),
      },
    },
  );
}
