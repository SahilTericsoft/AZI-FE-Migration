/**
 * Sendout API (PHI) — every route in `services/sendout/router.py`:
 * create, list, by-lab, view, edit. (No delete route on the backend.)
 */

import { http } from "@/core/api/client";
import { SERVICE } from "@/core/api/endpoints";
import type { Paginated } from "@/core/api/types";
import { createResourceApi } from "@/core/resource";

import type {
  SendoutBatch,
  SendoutBatchCreateRequest,
  SendoutListQuery,
} from "./sendout.types";

const base = `${SERVICE.sendout}/batches`;

const resource = createResourceApi<SendoutBatch, SendoutBatchCreateRequest>(base);

export const sendoutApi = {
  // standard CRUD (get/create/update map to /{id})
  get: resource.get,
  create: resource.create,
  update: resource.update,

  list: (body: SendoutListQuery = {}) =>
    http.post<Paginated<SendoutBatch>>(`${base}/list`, body).then((r) => r.data),
  byLab: (labId: number | string) =>
    http.get<SendoutBatch[]>(`${base}/by-lab/${labId}`).then((r) => r.data),
};
