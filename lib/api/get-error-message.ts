import { ApiError } from "./errors";

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
}
