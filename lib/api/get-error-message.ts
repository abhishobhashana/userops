import { ApiError } from "./errors";

export function getApiErrorMessage(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallback;
}

export function getApiFieldErrors(
  error: unknown,
): Record<string, string> | undefined {
  if (!(error instanceof ApiError)) {
    return undefined;
  }

  return error.fields;
}
