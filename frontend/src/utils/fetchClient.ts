import { ApiResponse } from "../types/api";

const BASE_URL = ""; // Proxy handles path routing in vite dev, production routes mapped in deployment

interface FetchOptions extends RequestInit {
  json?: unknown;
}

/**
 * Standard HTTP Fetch Client for LifeLink.
 * Handles JSON parsing, CORS credentials, and token refresh interceptors.
 */
export async function fetchClient<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const headers = new Headers(options.headers || {});
  
  if (options.json && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
    options.body = JSON.stringify(options.json);
  }

  // Ensure HTTP credentials (cookies) are transmitted
  options.credentials = "include";
  options.headers = headers;

  const fullUrl = url.startsWith("http") ? url : `${BASE_URL}${url}`;
  let response = await fetch(fullUrl, options);

  // Auto token refresh logic on HTTP 401 Unauthorized
  if (response.status === 401 && !url.includes("/auth/login") && !url.includes("/auth/refresh")) {
    try {
      // Trigger token rotation refresh
      const refreshResponse = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include"
      });

      if (refreshResponse.ok) {
        // Retry the original request
        response = await fetch(fullUrl, options);
      } else {
        // Refresh token expired or revoked, throw AuthError handled by AuthContext
        throw new Error("Session expired");
      }
    } catch (refreshErr) {
      // Dispatch custom event to let AuthContext know auth failed
      window.dispatchEvent(new Event("auth-session-expired"));
      const errBody: ApiResponse<T> = {
        success: false,
        error: { message: "Session expired. Please log in again." }
      };
      return Promise.reject(errBody);
    }
  }

  const responseText = await response.text();
  let data: ApiResponse<T>;

  try {
    data = responseText ? JSON.parse(responseText) : {};
  } catch (err) {
    data = {
      success: false,
      error: { message: "Failed to parse API response" }
    };
  }

  if (!response.ok || !data.success) {
    return Promise.reject(data);
  }

  return data.data as T;
}

export default fetchClient;
