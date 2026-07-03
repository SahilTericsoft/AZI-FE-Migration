/**
 * Shared API types — the contract of the migrated FastAPI backend.
 *
 * Mirrors `core/api.py` on the backend:
 *   - success envelope:  { message, data }              (`ok()`)
 *   - list payload:      { page, limit, docs, total }   (`paginate()`)
 *   - error:             { detail: string | [...] }      (FastAPI; 422 on validation)
 */

/** Every successful response is wrapped in this envelope. */
export interface ApiResponse<T> {
  message: string;
  data: T;
}

/** Shape of `data` for any list/search endpoint that paginates. */
export interface Paginated<T> {
  page: number;
  limit: number;
  docs: T[];
  total: number;
}

/**
 * Generic list/search request body (backend `core/api.ListIn`).
 * Individual services accept extra typed filters on top of this.
 */
export interface ListRequest {
  page?: number;
  limit?: number;
  search?: string;
  filters?: Record<string, unknown>;
}

/** Normalised error thrown by the API client (see `client.ts`). */
export interface ApiError {
  /** HTTP status (0 when the request never reached the server). */
  status: number;
  /** Human-readable message, safe to show in a toast. */
  message: string;
  /** Per-field messages, populated from FastAPI 422 validation errors. */
  fieldErrors?: Record<string, string[]>;
  /** Raw response body, for debugging. */
  raw?: unknown;
}

/** Columns common to most backend entities (camelCase, matching the DB). */
export interface BaseEntity {
  id: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number | null;
  isActive?: boolean;
  isDeleted?: boolean;
}
