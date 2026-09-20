import { ApiError, type ApiErrorCode } from "./errors";
import type { ApiResponse, ApiSuccess } from "./types";

const API_TIMEOUT = 15_000;

interface RequestOptions extends RequestInit {
  timeout?: number;
}

function getErrorCode(status: number): ApiErrorCode {
  switch (status) {
    case 400:
      return "BAD_REQUEST";

    case 401:
      return "UNAUTHORIZED";

    case 403:
      return "FORBIDDEN";

    case 404:
      return "NOT_FOUND";

    case 409:
      return "CONFLICT";

    case 422:
      return "VALIDATION_ERROR";

    case 429:
      return "RATE_LIMITED";

    default:
      if (status >= 500) {
        return "SERVER_ERROR";
      }

      return "UNKNOWN_ERROR";
  }
}

function getNetworkErrorCode(error: unknown): ApiErrorCode {
  if (error instanceof DOMException && error.name === "AbortError") {
    return "TIMEOUT";
  }

  if (error instanceof TypeError) {
    return "NETWORK_ERROR";
  }

  return "UNKNOWN_ERROR";
}

async function parseResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    try {
      return await response.json();
    } catch {
      return null;
    }
  }

  try {
    const text = await response.text();

    if (!text) {
      return null;
    }

    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  } catch {
    return null;
  }
}

function getErrorMessage(body: unknown, status: number): string {
  if (typeof body === "object" && body !== null) {
    const responseBody = body as {
      message?: unknown;
      error?: {
        message?: unknown;
      };
    };

    if (responseBody.error && typeof responseBody.error.message === "string") {
      return responseBody.error.message;
    }

    if (typeof responseBody.message === "string") {
      return responseBody.message;
    }
  }

  if (typeof body === "string" && body.trim()) {
    return body;
  }

  return `Request failed with status ${status}.`;
}

function getErrorFields(body: unknown): Record<string, string> | undefined {
  if (typeof body !== "object" || body === null) {
    return undefined;
  }

  const responseBody = body as {
    error?: {
      fields?: unknown;
    };
  };

  if (
    typeof responseBody.error?.fields === "object" &&
    responseBody.error.fields !== null
  ) {
    return responseBody.error.fields as Record<string, string>;
  }

  return undefined;
}

function getErrorCodeFromBody(body: unknown, status: number): ApiErrorCode {
  if (typeof body === "object" && body !== null) {
    const responseBody = body as {
      error?: {
        code?: unknown;
      };
    };

    const code = responseBody.error?.code;

    if (
      typeof code === "string" &&
      [
        "BAD_REQUEST",
        "UNAUTHORIZED",
        "FORBIDDEN",
        "NOT_FOUND",
        "CONFLICT",
        "VALIDATION_ERROR",
        "RATE_LIMITED",
        "SERVER_ERROR",
        "NETWORK_ERROR",
        "TIMEOUT",
        "UNKNOWN_ERROR",
      ].includes(code)
    ) {
      return code as ApiErrorCode;
    }
  }

  return getErrorCode(status);
}

function isApiSuccess<T>(body: unknown): body is ApiSuccess<T> {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    (body as { success?: unknown }).success === true
  );
}

function isApiFailure(body: unknown): boolean {
  return (
    typeof body === "object" &&
    body !== null &&
    "success" in body &&
    (body as { success?: unknown }).success === false
  );
}

export async function apiClient<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { timeout = API_TIMEOUT, headers, body, ...fetchOptions } = options;

  const controller = new AbortController();

  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, timeout);

  const requestHeaders = new Headers(headers);

  if (
    body &&
    !(body instanceof FormData) &&
    !requestHeaders.has("Content-Type")
  ) {
    requestHeaders.set("Content-Type", "application/json");
  }

  let requestBody = body;

  if (
    body &&
    typeof body !== "string" &&
    !(body instanceof FormData) &&
    !(body instanceof Blob) &&
    !(body instanceof ArrayBuffer)
  ) {
    requestBody = JSON.stringify(body);
  }

  try {
    const response = await fetch(path, {
      ...fetchOptions,
      headers: requestHeaders,
      body: requestBody,
      credentials: "include",
      signal: controller.signal,
    });

    const responseBody = await parseResponseBody(response);

    if (!response.ok) {
      throw new ApiError(getErrorMessage(responseBody, response.status), {
        status: response.status,
        code: getErrorCodeFromBody(responseBody, response.status),
        fields: getErrorFields(responseBody),
      });
    }

    /*
     * Empty responses are valid for endpoints such as
     * logout where there may be no response body.
     */
    if (responseBody === null) {
      return undefined as T;
    }

    /*
     * Preferred API contract:
     *
     * {
     *   success: true,
     *   data: ...
     * }
     */
    if (isApiSuccess<T>(responseBody)) {
      return responseBody.data;
    }

    /*
     * Handle the API's failure envelope even if the
     * HTTP status happens to be successful.
     */
    if (isApiFailure(responseBody)) {
      throw new ApiError(getErrorMessage(responseBody, response.status), {
        status: response.status,
        code: getErrorCodeFromBody(responseBody, response.status),
        fields: getErrorFields(responseBody),
      });
    }

    /*
     * Migration compatibility:
     *
     * Some existing endpoints may still return their
     * payload directly instead of:
     *
     * {
     *   success: true,
     *   data: ...
     * }
     *
     * Keep this fallback while the backend is being
     * standardized.
     */
    return responseBody as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    const code = getNetworkErrorCode(error);

    if (code === "TIMEOUT") {
      throw new ApiError("The request timed out. Please try again.", {
        status: 408,
        code: "TIMEOUT",
      });
    }

    if (code === "NETWORK_ERROR") {
      throw new ApiError(
        "Unable to connect to the server. Please check your connection and try again.",
        {
          status: 0,
          code: "NETWORK_ERROR",
        },
      );
    }

    throw new ApiError("Something went wrong. Please try again.", {
      status: 0,
      code: "UNKNOWN_ERROR",
    });
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const api = {
  get<T>(path: string, options: RequestOptions = {}) {
    return apiClient<T>(path, {
      ...options,
      method: "GET",
    });
  },

  post<T>(path: string, body?: unknown, options: RequestOptions = {}) {
    return apiClient<T>(path, {
      ...options,
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  },

  put<T>(path: string, body?: unknown, options: RequestOptions = {}) {
    return apiClient<T>(path, {
      ...options,
      method: "PUT",
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  },

  patch<T>(path: string, body?: unknown, options: RequestOptions = {}) {
    return apiClient<T>(path, {
      ...options,
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  },

  delete<T>(path: string, options: RequestOptions = {}) {
    return apiClient<T>(path, {
      ...options,
      method: "DELETE",
    });
  },
};
