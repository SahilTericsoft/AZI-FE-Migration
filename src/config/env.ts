/**
 * Centralised, typed access to environment configuration.
 *
 * Mirrors the backend's `core/config.py` (settings). Only `NEXT_PUBLIC_*`
 * variables are available in the browser; keep server-only secrets out of here.
 */

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

export const env = {
  /** Base URL of the FastAPI monorepo (no trailing slash). */
  apiBaseUrl: apiBaseUrl.replace(/\/$/, ""),
} as const;

export type Env = typeof env;
