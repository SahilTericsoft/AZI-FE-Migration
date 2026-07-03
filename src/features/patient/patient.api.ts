/**
 * Patient API (PHI) — every route in `services/patient/router.py`:
 * patients (8), patient-insurances (5), allergies (5). Requests carry the JWT
 * (the client attaches it); patients/insurances require auth server-side.
 */

import { http } from "@/core/api/client";
import { SERVICE } from "@/core/api/endpoints";
import type { ListRequest, Paginated } from "@/core/api/types";
import { createResourceApi } from "@/core/resource";

import type {
  Allergy,
  Patient,
  PatientCreateRequest,
  PatientEditRequest,
  PatientInsurance,
  PatientListQuery,
  PatientToggleResult,
  ValidatePatientRequest,
} from "./patient.types";

const base = `${SERVICE.patient}/patients`;
const insBase = `${SERVICE.patient}/patient-insurances`;
const algBase = `${SERVICE.patient}/allergies`;

const resource = createResourceApi<
  Patient,
  PatientCreateRequest,
  PatientEditRequest
>(base);

export const patientApi = {
  // --- standard CRUD (GET/POST/PUT/DELETE /patients[/{id}]) ---
  get: resource.get,
  create: resource.create,
  update: resource.update,
  remove: resource.remove, // DELETE = soft delete

  // --- patient-specific ---
  list: (body: PatientListQuery = {}) =>
    http.post<Paginated<Patient>>(`${base}/list`, body).then((r) => r.data),
  validate: (body: ValidatePatientRequest) =>
    http.post<Patient | null>(`${base}/validate`, body).then((r) => r.data),
  toggle: (id: number | string) =>
    http.put<PatientToggleResult>(`${base}/${id}/toggle`).then((r) => r.data),
  recover: (id: number | string) =>
    http.put<{ id: number }>(`${base}/${id}/recover`).then((r) => r.data),

  /** Counts of patients who crossed the alert / max sample limit. */
  flaggedCount: () =>
    http
      .get<{ alertLimitCount: number; maxLimitCount: number }>(`${base}/flagged-count`)
      .then((r) => r.data),

  /** Bulk-create patients from a CSV file. */
  bulkUpload: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return http
      .post<{ created: number; skipped: number; errors: { row: number; error: string }[] }>(
        `${base}/bulk-upload`,
        fd,
      )
      .then((r) => r.data);
  },

  // --- patient-insurances sub-resource ---
  insurances: {
    byPatient: (patientId: number | string) =>
      http
        .get<PatientInsurance[]>(`${insBase}/by-patient/${patientId}`)
        .then((r) => r.data),
    create: (body: { patientId: number } & Record<string, unknown>) =>
      http.post<PatientInsurance>(insBase, body).then((r) => r.data),
    get: (id: number | string) =>
      http.get<PatientInsurance>(`${insBase}/${id}`).then((r) => r.data),
    update: (id: number | string, body: Partial<PatientInsurance>) =>
      http.put<PatientInsurance>(`${insBase}/${id}`, body).then((r) => r.data),
    remove: (id: number | string) =>
      http.del<unknown>(`${insBase}/${id}`).then((r) => r.data),
  },

  // --- allergies (reference data, open) ---
  allergies: {
    list: (body: ListRequest = {}) =>
      http.post<Allergy[] | Paginated<Allergy>>(`${algBase}/list`, body).then((r) => r.data),
    create: (body: { name: string }) =>
      http.post<Allergy>(algBase, body).then((r) => r.data),
    get: (id: number | string) =>
      http.get<Allergy>(`${algBase}/${id}`).then((r) => r.data),
    update: (id: number | string, body: Partial<Allergy>) =>
      http.put<Allergy>(`${algBase}/${id}`, body).then((r) => r.data),
    remove: (id: number | string) =>
      http.del<unknown>(`${algBase}/${id}`).then((r) => r.data),
  },
};
