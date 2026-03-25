/**
 * API Client - Base fetch wrapper with authentication handling
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

// Token storage keys
const ACCESS_TOKEN_KEY = "fleetoptima_access_token";
const REFRESH_TOKEN_KEY = "fleetoptima_refresh_token";

export interface ApiError {
  error: string;
  message: string;
  details?: Record<string, unknown>;
}

export class ApiClientError extends Error {
  status: number;
  error: string;
  details?: Record<string, unknown>;

  constructor(status: number, error: string, message: string, details?: Record<string, unknown>) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.error = error;
    this.details = details;
  }
}

// Token management
export const tokenStorage = {
  getAccessToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  },

  getRefreshToken: (): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens: (accessToken: string, refreshToken: string): void => {
    if (typeof window === "undefined") return;
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  },

  clearTokens: (): void => {
    if (typeof window === "undefined") return;
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },

  isAuthenticated: (): boolean => {
    return !!tokenStorage.getAccessToken();
  },
};

// Request options type
interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  params?: Record<string, string | number | boolean | undefined>;
}

// Build URL with query params
function buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
  const url = new URL(`${API_URL}${endpoint}`);

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.append(key, String(value));
      }
    });
  }

  return url.toString();
}

// Flag to prevent multiple refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<boolean> | null = null;

// Try to refresh token
async function tryRefreshToken(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const response = await fetch(buildUrl("/auth/refresh", {}), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) return false;

    const tokens = await response.json();
    tokenStorage.setTokens(tokens.access_token, tokens.refresh_token);
    return true;
  } catch {
    return false;
  }
}

// Main fetch wrapper
async function fetchApi<T>(endpoint: string, options: RequestOptions = {}, isRetry = false): Promise<T> {
  const { body, params, headers: customHeaders, ...restOptions } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...customHeaders as Record<string, string>,
  };

  // Add auth token if available
  const token = tokenStorage.getAccessToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const url = buildUrl(endpoint, params);

  const response = await fetch(url, {
    ...restOptions,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // Handle 401 - try to refresh token and retry once
  if (response.status === 401 && !isRetry && !endpoint.includes("/auth/")) {
    // Use single refresh attempt for concurrent requests
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = tryRefreshToken();
    }

    const refreshed = await refreshPromise;
    isRefreshing = false;
    refreshPromise = null;

    if (refreshed) {
      // Retry the request with new token
      return fetchApi<T>(endpoint, options, true);
    }
    // Refresh failed - clear tokens and redirect to login (except for POS)
    tokenStorage.clearTokens();
    if (typeof window !== "undefined" && !window.location.pathname.startsWith("/fleet/pos")) {
      window.location.href = "/login";
    }
  }

  // Handle 204 No Content
  if (response.status === 204) {
    return undefined as T;
  }

  // Try to parse JSON response
  let data: T | ApiError;
  try {
    data = await response.json();
  } catch {
    if (!response.ok) {
      throw new ApiClientError(
        response.status,
        "parse_error",
        `Request failed with status ${response.status}`
      );
    }
    return undefined as T;
  }

  // Handle error responses
  if (!response.ok) {
    const errorData = data as ApiError;
    throw new ApiClientError(
      response.status,
      errorData.error || "unknown_error",
      errorData.message || `Request failed with status ${response.status}`,
      errorData.details
    );
  }

  return data as T;
}

// API client methods
export const apiClient = {
  get: <T>(endpoint: string, options?: RequestOptions) =>
    fetchApi<T>(endpoint, { ...options, method: "GET" }),

  post: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    fetchApi<T>(endpoint, { ...options, method: "POST", body }),

  patch: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    fetchApi<T>(endpoint, { ...options, method: "PATCH", body }),

  put: <T>(endpoint: string, body?: unknown, options?: RequestOptions) =>
    fetchApi<T>(endpoint, { ...options, method: "PUT", body }),

  delete: <T>(endpoint: string, options?: RequestOptions) =>
    fetchApi<T>(endpoint, { ...options, method: "DELETE" }),
};

export default apiClient;
