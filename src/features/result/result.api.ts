/** Result API — `services/result` (Upload Result + Result Review). */

import { http } from "@/core/api/client";
import { SERVICE } from "@/core/api/endpoints";
import type { Paginated } from "@/core/api/types";

import type {
  ManualTemplate,
  ResultControl,
  ResultSample,
  ResultSession,
  WorklistOption,
} from "./result.types";

const base = SERVICE.result;

export const resultApi = {
  worklistByTestPanel: (body: { testId?: number; biomarkerId?: number; sampleType?: string }) =>
    http.post<WorklistOption[]>(`${base}/worklist-by-test-panel`, body).then((r) => r.data),

  manualTemplate: (body: { worklistId: number; testId?: number; biomarkerId?: number }) =>
    http.post<ManualTemplate>(`${base}/manual-template`, body).then((r) => r.data),

  manualSubmit: (body: {
    worklistId?: number;
    testId?: number;
    biomarkerId?: number;
    biomarkerDetails: { id: number | null; name: string | null }[];
    accessionIds: string[];
    results: Record<string, Record<string, string>>;
  }) => http.post<ResultSession>(`${base}/manual-submit`, body).then((r) => r.data),

  uploadRunfile: (file: File, worklistId?: number, cqCutoff?: number) => {
    const fd = new FormData();
    fd.append("file", file);
    if (worklistId != null) fd.append("worklistId", String(worklistId));
    if (cqCutoff != null) fd.append("cqCutoff", String(cqCutoff));
    return http.post<ResultSession>(`${base}/upload-runfile`, fd).then((r) => r.data);
  },

  listSessions: (body: { page?: number; limit?: number; search?: string; statuses?: string[] }) =>
    http.post<Paginated<ResultSession>>(`${base}/sessions/list`, body).then((r) => r.data),

  session: (id: number | string) =>
    http.get<ResultSession>(`${base}/sessions/${id}`).then((r) => r.data),
  sessionSamples: (id: number | string) =>
    http.get<ResultSample[]>(`${base}/sessions/${id}/samples`).then((r) => r.data),
  sessionControls: (id: number | string) =>
    http.get<ResultControl[]>(`${base}/sessions/${id}/controls`).then((r) => r.data),

  editSample: (id: number | string, body: Record<string, unknown>) =>
    http.put<ResultSample>(`${base}/result-samples/${id}`, body).then((r) => r.data),
  editControl: (id: number | string, body: Record<string, unknown>) =>
    http.put<ResultControl>(`${base}/result-controls/${id}`, body).then((r) => r.data),

  recalculateControls: (id: number | string, cqCutoff: number) =>
    http.put<{ id: number; cqCutoff: number }>(`${base}/sessions/${id}/recalculate-controls`, { cqCutoff }).then((r) => r.data),
  rejectSample: (id: number | string, accessionId: string, reasonForRejection: string) =>
    http.put<unknown>(`${base}/sessions/${id}/reject-sample`, { accessionId, reasonForRejection }).then((r) => r.data),
  markRerun: (id: number | string, accessionIds: string[]) =>
    http.put<unknown>(`${base}/sessions/${id}/mark-rerun`, { accessionIds }).then((r) => r.data),
  generateReport: (id: number | string, accessionIds?: string[]) =>
    http.put<unknown>(`${base}/sessions/${id}/generate-report`, { accessionIds }).then((r) => r.data),
  discard: (id: number | string) =>
    http.put<unknown>(`${base}/sessions/${id}/discard`, {}).then((r) => r.data),
};
