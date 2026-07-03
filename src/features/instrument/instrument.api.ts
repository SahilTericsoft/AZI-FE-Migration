/** Instrument API — `services/lab_os` instruments. */

import { http } from "@/core/api/client";
import { SERVICE } from "@/core/api/endpoints";
import type { Paginated } from "@/core/api/types";

import type { Instrument, InstrumentSearchQuery, MaintenanceLog } from "./instrument.types";

const base = `${SERVICE.labOs}/instruments`;

export const instrumentApi = {
  search: (body: InstrumentSearchQuery = {}) =>
    http.post<Paginated<Instrument>>(`${base}/search`, body).then((r) => r.data),
  get: (id: number | string) => http.get<Instrument>(`${base}/${id}`).then((r) => r.data),
  create: (body: Record<string, unknown>) => http.post<Instrument>(base, body).then((r) => r.data),
  update: (id: number | string, body: Record<string, unknown>) =>
    http.put<Instrument>(`${base}/${id}`, body).then((r) => r.data),
  remove: (id: number | string) => http.del<unknown>(`${base}/${id}`).then((r) => r.data),
  toggle: (id: number | string) =>
    http.put<{ id: number; status: string }>(`${base}/${id}/toggle`).then((r) => r.data),
  addMaintenanceLog: (id: number | string, log: MaintenanceLog) =>
    http.post<MaintenanceLog>(`${base}/${id}/maintenance-logs`, log).then((r) => r.data),
  addAttachment: (id: number | string, attachmentName: string, file: File) => {
    const fd = new FormData();
    fd.append("attachmentName", attachmentName);
    fd.append("file", file);
    return http.post<{ secureUrl: string }>(`${base}/${id}/attachments`, fd).then((r) => r.data);
  },
};
