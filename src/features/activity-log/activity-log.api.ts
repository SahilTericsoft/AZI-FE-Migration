/**
 * Activity Log API — every route in `services/activity_log/router.py`:
 * create, bulk-create, list, get, delete.
 */

import { http } from "@/core/api/client";
import { SERVICE } from "@/core/api/endpoints";
import type { Paginated } from "@/core/api/types";

import type {
  ActivityLog,
  ActivityLogCreateRequest,
  ActivityLogListQuery,
} from "./activity-log.types";

const base = `${SERVICE.activityLog}/logs`;

export const activityLogApi = {
  create: (body: ActivityLogCreateRequest) =>
    http.post<ActivityLog>(base, body).then((r) => r.data),
  bulkCreate: (logs: Record<string, unknown>[]) =>
    http.post<ActivityLog[]>(`${base}/bulk`, { logs }).then((r) => r.data),
  list: (body: ActivityLogListQuery = {}) =>
    http
      .post<ActivityLog[] | Paginated<ActivityLog>>(`${base}/list`, body)
      .then((r) => r.data),
  get: (id: number | string) =>
    http.get<ActivityLog>(`${base}/${id}`).then((r) => r.data),
  remove: (id: number | string) =>
    http.del<unknown>(`${base}/${id}`).then((r) => r.data),
};
