import axios from "axios";
import { API_BASE_URL, REQUEST_TIMEOUT_MS, STORAGE_KEYS } from "../config.js";

/* =====================================================
   API CLIENT (Axios)
   ---------------------------------------------------
   Every real (non-mock) network call in the app goes
   through apiRequest() below, so auth headers, timeouts,
   and error shapes stay consistent everywhere.

   Backend contract this expects:
   - JSON in, JSON out (Content-Type: application/json)
   - Auth via `Authorization: Bearer <token>` header
   - Errors returned as JSON: { "message": "..." } with a
     non-2xx HTTP status
   See BACKEND_API.md for the full endpoint list.
===================================================== */

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

// Single Axios instance for the whole app — base URL and timeout
// are read from config.js, which is env-driven (see .env.example).
const httpClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: REQUEST_TIMEOUT_MS,
  headers: { "Content-Type": "application/json" },
});

// Attach the bearer token (if present) to every outgoing request.
httpClient.interceptors.request.use((requestConfig) => {
  if (requestConfig.auth !== false) {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    if (token) {
      requestConfig.headers = requestConfig.headers || {};
      requestConfig.headers["Authorization"] = `Bearer ${token}`;
    }
  }
  return requestConfig;
});

/**
 * apiRequest(path, { method, body, auth, headers })
 * Thin wrapper around the Axios instance that normalizes every
 * failure (network, timeout, HTTP error) into an ApiError with a
 * human-readable message and a status code, so callers (src/api/*)
 * and the UI never need to know Axios is underneath.
 */
export async function apiRequest(path, { method = "GET", body, auth = true, headers = {} } = {}) {
  try {
    const response = await httpClient.request({
      url: path,
      method,
      data: body,
      headers,
      auth, // read by the request interceptor above
    });
    return response.data;
  } catch (err) {
    if (axios.isCancel(err)) {
      throw new ApiError("Request was cancelled.", 0);
    }
    if (err.code === "ECONNABORTED") {
      throw new ApiError("Request timed out. Please try again.", 0);
    }
    if (err.response) {
      const data = err.response.data;
      const message = (data && (data.message || data.error)) || `Request failed (${err.response.status})`;
      throw new ApiError(message, err.response.status);
    }
    throw new ApiError(err.message || "Network error — please check your connection.", 0);
  }
}
