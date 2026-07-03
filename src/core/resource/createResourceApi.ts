/**
 * `createResourceApi` — the common CRUD verbs for a backend entity.
 *
 * The migrated backend exposes a near-uniform surface per entity, nested under
 * its service prefix, e.g. for facilities (`basePath = "/facility/facilities"`):
 *
 *   POST   {base}          create
 *   POST   {base}/list     list / search (paginates when page/limit given)
 *   GET    {base}/{id}     view one
 *   PUT    {base}/{id}     update one
 *   DELETE {base}/{id}     delete (soft when the model has isDeleted)
 *
 * Each verb unwraps the `{ message, data }` envelope and returns `data`.
 * Entity-specific routes (toggle, list-lite, view-by-body, sub-resources) are
 * added in the feature's own api file by calling `http` directly — mirroring how
 * each backend `router.py` adds explicit routes beyond the standard set.
 */

import { http } from "@/core/api/client";
import type { ListRequest, Paginated } from "@/core/api/types";

export interface ResourceApi<T, C, U> {
  /** Entity base path, e.g. `${SERVICE.facility}/facilities`. */
  basePath: string;
  /** Paginated list — use when sending `page`/`limit`. */
  list: (body?: ListRequest) => Promise<Paginated<T>>;
  /** Flat list — use for "lite"/unpaginated list responses (arrays). */
  listAll: (body?: ListRequest) => Promise<T[]>;
  get: (id: number | string) => Promise<T>;
  create: (body: C) => Promise<T>;
  update: (id: number | string, body: U) => Promise<T>;
  remove: (id: number | string) => Promise<unknown>;
}

export function createResourceApi<T, C = Partial<T>, U = Partial<T>>(
  basePath: string,
): ResourceApi<T, C, U> {
  return {
    basePath,
    list: (body = {}) =>
      http.post<Paginated<T>>(`${basePath}/list`, body).then((r) => r.data),
    listAll: (body = {}) =>
      http.post<T[]>(`${basePath}/list`, body).then((r) => r.data),
    get: (id) => http.get<T>(`${basePath}/${id}`).then((r) => r.data),
    create: (body) => http.post<T>(basePath, body).then((r) => r.data),
    update: (id, body) => http.put<T>(`${basePath}/${id}`, body).then((r) => r.data),
    remove: (id) => http.del<unknown>(`${basePath}/${id}`).then((r) => r.data),
  };
}
