/**
 * Lab API — every route in `services/lab/router.py`: labs (9), lab-users (5).
 */

import { http } from "@/core/api/client";
import { SERVICE } from "@/core/api/endpoints";
import type { Paginated } from "@/core/api/types";
import { createResourceApi } from "@/core/resource";

import type {
  Lab,
  LabCreateRequest,
  LabEditRequest,
  LabListLiteQuery,
  LabListQuery,
  LabToggleResult,
  LabUser,
  LabViewQuery,
} from "./lab.types";

const base = `${SERVICE.lab}/labs`;
const usersBase = `${SERVICE.lab}/lab-users`;

const resource = createResourceApi<Lab, LabCreateRequest, LabEditRequest>(base);

export const labApi = {
  // --- standard CRUD ---
  get: resource.get,
  create: resource.create,
  update: resource.update,
  remove: resource.remove,

  // --- lab-specific ---
  list: (body: LabListQuery = {}) =>
    http.post<Paginated<Lab>>(`${base}/list`, body).then((r) => r.data),
  listLite: (body: LabListLiteQuery = {}) =>
    http.post<Lab[]>(`${base}/list-lite`, body).then((r) => r.data),
  view: (body: LabViewQuery) =>
    http.post<Lab | null>(`${base}/view`, body).then((r) => r.data),
  byAdmin: (adminId: number | string) =>
    http.get<Lab | null>(`${base}/by-admin/${adminId}`).then((r) => r.data),
  toggle: (id: number | string) =>
    http.put<LabToggleResult>(`${base}/${id}/toggle`).then((r) => r.data),

  // --- lab-users sub-resource ---
  users: {
    add: (body: { labId: number; userId: number }) =>
      http.post<LabUser>(usersBase, body).then((r) => r.data),
    byLab: (labId: number | string) =>
      http.get<LabUser[]>(`${usersBase}/by-lab/${labId}`).then((r) => r.data),
    get: (id: number | string) =>
      http.get<LabUser>(`${usersBase}/${id}`).then((r) => r.data),
    update: (id: number | string, body: Partial<LabUser>) =>
      http.put<LabUser>(`${usersBase}/${id}`, body).then((r) => r.data),
    remove: (id: number | string) =>
      http.del<unknown>(`${usersBase}/${id}`).then((r) => r.data),
  },
};
