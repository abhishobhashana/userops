import { ApiError, type ApiErrorCode } from "./errors";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
  timeout?: number;
};

const DEFAULT_TIMEOUT = 15_000;

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

async function parseResponse<T>(response: Response): Promise<T> {
  const contentType = response.headers.get("content-type");
  const isJson = contentType?.includes("application/json");

  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok) {
    const error = body?.error;

    throw new ApiError(
      error?.message ?? `Request failed with status ${response.status}.`,
      {
        status: response.status,
        code: error?.code ?? getErrorCode(response.status),
        fields: error?.fields,
      },
    );
  }

  /*
   * All UserOps APIs should eventually use:
   *
   * {
   *   success: true,
   *   data: ...
   * }
   */

  if (body && typeof body === "object" && "success" in body) {
    if (!body.success) {
      throw new ApiError(body.error?.message ?? "Something went wrong.", {
        status: response.status,
        code: body.error?.code ?? "UNKNOWN_ERROR",
        fields: body.error?.fields,
      });
    }

    return body.data;
  }

  /*
   * Keep this fallback temporarily so the client
   * can coexist with existing endpoints while we
   * migrate them to the unified response contract.
   */
  return body;
}

export async function apiClient<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const {
    body,
    timeout = DEFAULT_TIMEOUT,
    headers,
    ...requestOptions
  } = options;

  const controller = new AbortController();

  const timeoutId = window.setTimeout(() => {
    controller.abort();
  }, timeout);

  try {
    const response = await fetch(url, {
      ...requestOptions,

      credentials: "include",

      headers: {
        Accept: "application/json",

        ...(body !== undefined
          ? {
              "Content-Type": "application/json",
            }
          : {}),

        ...headers,
      },

      body: body !== undefined ? JSON.stringify(body) : undefined,

      signal: controller.signal,
    });

    return await parseResponse<T>(response);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof DOMException && error.name === "AbortError") {
      throw new ApiError("The request took too long. Please try again.", {
        code: "TIMEOUT",
        status: 0,
      });
    }

    throw new ApiError(
      "Unable to connect to UserOps. Please check your connection and try again.",
      {
        code: "NETWORK_ERROR",
        status: 0,
      },
    );
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export const api = {
  get<T>(url: string, options?: RequestOptions) {
    return apiClient<T>(url, {
      ...options,
      method: "GET",
    });
  },

  post<T>(url: string, body?: unknown, options?: RequestOptions) {
    return apiClient<T>(url, {
      ...options,
      method: "POST",
      body,
    });
  },

  put<T>(url: string, body?: unknown, options?: RequestOptions) {
    return apiClient<T>(url, {
      ...options,
      method: "PUT",
      body,
    });
  },

  patch<T>(url: string, body?: unknown, options?: RequestOptions) {
    return apiClient<T>(url, {
      ...options,
      method: "PATCH",
      body,
    });
  },

  delete<T>(url: string, options?: RequestOptions) {
    return apiClient<T>(url, {
      ...options,
      method: "DELETE",
    });
  },
};
