/**
 * Sample API (PHI) — every route in `services/sample/router.py`:
 * create, list, by-order, accession, view, edit, delete.
 */

import { http } from "@/core/api/client";
import { SERVICE } from "@/core/api/endpoints";
import type { Paginated } from "@/core/api/types";
import { createResourceApi } from "@/core/resource";

import type {
  AccessionRequest,
  Sample,
  SampleCreateRequest,
  SampleListQuery,
} from "./sample.types";

const base = `${SERVICE.sample}/samples`;

const resource = createResourceApi<Sample, SampleCreateRequest>(base);

export const sampleApi = {
  // standard CRUD (get/create/update/remove map to /{id})
  get: resource.get,
  create: resource.create,
  update: resource.update,
  remove: resource.remove,

  list: (body: SampleListQuery = {}) =>
    http.post<Paginated<Sample>>(`${base}/list`, body).then((r) => r.data),
  byOrder: (orderId: number | string) =>
    http.get<Sample[]>(`${base}/by-order/${orderId}`).then((r) => r.data),
  accession: (id: number | string, body: AccessionRequest) =>
    http.put<Sample>(`${base}/${id}/accession`, body).then((r) => r.data),
};
