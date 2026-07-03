/**
 * Lab Operations API — `services/lab_os/router.py` (mounted at `/lab-os`).
 * Only the reference picklists the Test/Panel wizard needs.
 */

import { http } from "@/core/api/client";
import { SERVICE } from "@/core/api/endpoints";
import type { Paginated } from "@/core/api/types";

import type { Department, Instrument, LabSession, Reagent } from "./lab-os.types";

const base = SERVICE.labOs;

export const labOsApi = {
  departments: (body: Record<string, unknown> = {}) =>
    http
      .post<Department[] | Paginated<Department>>(`${base}/departments/list`, body)
      .then((r) => r.data),
  instruments: () =>
    http.get<Instrument[]>(`${base}/instruments/list-lite`).then((r) => r.data),
  createInstrument: (body: Record<string, unknown>) =>
    http.post<Instrument>(`${base}/instruments`, body).then((r) => r.data),
  reagents: () =>
    http.get<Reagent[]>(`${base}/reagents/list-lite`).then((r) => r.data),
  createReagent: (body: Record<string, unknown>) =>
    http.post<Reagent>(`${base}/reagents`, body).then((r) => r.data),

  // --- worklists (LabSessions) ---
  sessions: {
    list: (body: Record<string, unknown> = {}) =>
      http.post<LabSession[] | Paginated<LabSession>>(`${base}/sessions/list`, body).then((r) => r.data),
    get: (id: number | string) =>
      http.get<LabSession>(`${base}/sessions/${id}`).then((r) => r.data),
    create: (body: Record<string, unknown>) =>
      http.post<LabSession>(`${base}/sessions`, body).then((r) => r.data),
    update: (id: number | string, body: Record<string, unknown>) =>
      http.put<LabSession>(`${base}/sessions/${id}`, body).then((r) => r.data),
    remove: (id: number | string) =>
      http.del<unknown>(`${base}/sessions/${id}`).then((r) => r.data),
  },
};
