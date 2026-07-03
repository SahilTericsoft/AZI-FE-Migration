/**
 * The single HTTP client for the whole app.
 *
 * FE analogue of the old `shared/services/api.service.ts`, rebuilt for the
 * migrated backend:
 *   - base URL from env, JWT bearer attached per request
 *   - responses are the `{ message, data }` envelope; helpers return it typed
 *   - errors are normalised to `ApiError` (FastAPI `{ detail }` / 422 arrays)
 *   - 401 clears the token and bounces to /login (client-side only)
 *
 * Feature modules import `http` and build their own typed calls — exactly like
 * each backend service has its own explicit `router.py`.
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
} from "axios";

import { env } from "@/config/env";
import { clearToken, getToken } from "@/core/auth/token";

import type { ApiError, ApiResponse } from "./types";

export const axiosInstance: AxiosInstance = axios.create({
  baseURL: env.apiBaseUrl,
  headers: { Accept: "application/json", "Content-Type": "application/json" },
});

// --- attach the JWT bearer (PHI routers require it) ------------------------
axiosInstance.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- normalise errors + handle expired sessions ----------------------------
axiosInstance.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const apiError = normalizeError(error);
    if (apiError.status === 401 && typeof window !== "undefined") {
      clearToken();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign("/login");
      }
    }
    return Promise.reject(apiError);
  },
);

interface FastApiValidationItem {
  loc?: (string | number)[];
  msg?: string;
}

function normalizeError(error: AxiosError): ApiError {
  const status = error.response?.status ?? 0;
  const body = error.response?.data as
    | { detail?: unknown; message?: string }
    | undefined;

  let message = error.message || "Something went wrong";
  let fieldErrors: Record<string, string[]> | undefined;

  const detail = body?.detail;
  if (typeof detail === "string") {
    message = detail;
  } else if (Array.isArray(detail)) {
    // FastAPI 422: [{ loc: ["body", "field"], msg }]
    message = "Validation failed";
    fieldErrors = {};
    for (const item of detail as FastApiValidationItem[]) {
      const loc = item.loc ?? [];
      const field = String(loc[loc.length - 1] ?? "non_field");
      (fieldErrors[field] ??= []).push(item.msg ?? "Invalid value");
    }
  } else if (detail && typeof detail === "object") {
    // Conflict shape: { field: [messages] }
    message = "Validation failed";
    fieldErrors = detail as Record<string, string[]>;
  } else if (body?.message) {
    message = body.message;
  }

  return { status, message, fieldErrors, raw: body };
}

/**
 * Typed verbs. Each resolves to the `{ message, data }` envelope so callers can
 * read `res.data` (and `res.message` for toasts). Unwrap helpers live in
 * `createResourceApi` for the common CRUD case.
 */
export const http = {
  get: <T>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.get<ApiResponse<T>>(url, config).then((r) => r.data),
  post: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.post<ApiResponse<T>>(url, body, config).then((r) => r.data),
  put: <T>(url: string, body?: unknown, config?: AxiosRequestConfig) =>
    axiosInstance.put<ApiResponse<T>>(url, body, config).then((r) => r.data),
  del: <T>(url: string, config?: AxiosRequestConfig) =>
    axiosInstance.delete<ApiResponse<T>>(url, config).then((r) => r.data),
};
