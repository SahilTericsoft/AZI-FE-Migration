/**
 * Facility API — one function per backend route (`/facility/facilities/*`).
 * Mirrors `services/facility/router.py`.
 *
 * The standard verbs (get/create/update/remove) reuse `createResourceApi`;
 * the entity-specific routes (rich list, list-lite, view-by-body, toggle,
 * physicians, admin) are spelled out with `http`.
 */

import { http } from "@/core/api/client";
import { SERVICE } from "@/core/api/endpoints";
import type { Paginated } from "@/core/api/types";
import { createResourceApi } from "@/core/resource";

import type {
  Facility,
  FacilityCreateRequest,
  FacilityEditRequest,
  FacilityListLiteQuery,
  FacilityListQuery,
  FacilityViewQuery,
  ToggleResult,
} from "./facility.types";

const base = `${SERVICE.facility}/facilities`;

const resource = createResourceApi<
  Facility,
  FacilityCreateRequest,
  FacilityEditRequest
>(base);

export const facilityApi = {
  // --- standard CRUD (from the shared factory) ---
  get: resource.get,
  create: resource.create,
  update: resource.update,
  remove: resource.remove,

  // --- facility-specific routes ---
  /** Rich, paginated list with the facility filter set. */
  list: (body: FacilityListQuery = {}) =>
    http.post<Paginated<Facility>>(`${base}/list`, body).then((r) => r.data),

  /** Lightweight, unpaginated list (id/name) for dropdowns. */
  listLite: (body: FacilityListLiteQuery = {}) =>
    http.post<Facility[]>(`${base}/list-lite`, body).then((r) => r.data),

  /** View one (by id/adminId) with optional sub-details. */
  view: (body: FacilityViewQuery) =>
    http.post<Facility | null>(`${base}/view`, body).then((r) => r.data),

  /** Flip active status (cascades to completed locations server-side). */
  toggle: (id: number | string) =>
    http.put<ToggleResult>(`${base}/${id}/toggle`).then((r) => r.data),

  /** Link physicians (idempotent append). */
  addPhysicians: (id: number | string, physicians: number[]) =>
    http
      .post<{ id: number; physicians: number[] }>(`${base}/${id}/physicians`, {
        physicians,
      })
      .then((r) => r.data),

  /** Unlink a physician. */
  removePhysician: (id: number | string, physicianId: number) =>
    http
      .del<unknown>(`${base}/${id}/physicians/${physicianId}`)
      .then((r) => r.data),

  /** Assign the facility admin (ensures a FacilityUser link). */
  setAdmin: (id: number | string, adminId: number) =>
    http.put<Facility>(`${base}/${id}/admin`, { adminId }).then((r) => r.data),

  /** Link a user to the facility (Facility User). */
  addUser: (facilityId: number, userId: number) =>
    http
      .post<unknown>(`${SERVICE.facility}/facility-users`, { facilityId, userId })
      .then((r) => r.data),

  /** Look up a provider by NPI via the public CMS registry. */
  npiLookup: (npi: string) =>
    http
      .get<{
        npiNumber: string;
        firstName: string;
        middleName: string;
        lastName: string;
        mobileNumber: string;
        faxNumber: string;
      }>(`${SERVICE.facility}/physicians/npi-lookup`, { params: { npi } })
      .then((r) => r.data),
};
