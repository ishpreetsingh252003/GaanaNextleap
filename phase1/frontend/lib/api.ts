import { BACKEND_URL } from "./constants";

/** Shape returned by the /api/health endpoint */
export interface HealthResponse {
  status: string;
  message: string;
  environment: string;
  timestamp: string;
}

/** Generic error shape returned by the backend */
export interface ApiError {
  error_code: string;
  error_message: string;
  error_details?: string | null;
}

/**
 * Thin wrapper around fetch that:
 *  - Prepends the backend base URL
 *  - Sets JSON content-type on non-GET requests
 *  - Throws a typed error when the response is not ok
 */
async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BACKEND_URL}${path}`;

  const headers: HeadersInit = {
    Accept: "application/json",
    ...(options.method && options.method !== "GET"
      ? { "Content-Type": "application/json" }
      : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(url, { ...options, headers });

  if (!response.ok) {
    let errorBody: ApiError = {
      error_code: "HTTP_ERROR",
      error_message: `Request failed with status ${response.status}`,
    };
    try {
      errorBody = (await response.json()) as ApiError;
    } catch {
      // ignore JSON parse errors – use the default message above
    }
    const err = new Error(errorBody.error_message);
    (err as any).code = errorBody.error_code;
    throw err;
  }

  return response.json() as Promise<T>;
}

/** Check whether the backend is reachable */
export async function checkHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/api/health");
}
