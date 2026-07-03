/**
 * Location API — every route in `services/location/router.py`:
 * locations (10), location-users (4), location-physicians (4).
 */

import { http } from "@/core/api/client";
import { SERVICE } from "@/core/api/endpoints";
import type { Paginated } from "@/core/api/types";
import { createResourceApi } from "@/core/resource";

import type {
  Location,
  LocationCreateRequest,
  LocationEditRequest,
  LocationListLiteQuery,
  LocationListQuery,
  LocationPhysician,
  LocationToggleResult,
  LocationUser,
  LocationViewQuery,
  PhysicianLinkResult,
} from "./location.types";

const base = `${SERVICE.location}/locations`;
const usersBase = `${SERVICE.location}/location-users`;
const physiciansBase = `${SERVICE.location}/location-physicians`;

const resource = createResourceApi<
  Location,
  LocationCreateRequest,
  LocationEditRequest
>(base);

export const locationApi = {
  // --- standard CRUD ---
  get: resource.get,
  create: resource.create,
  update: resource.update,
  remove: resource.remove,

  // --- location-specific ---
  list: (body: LocationListQuery = {}) =>
    http.post<Paginated<Location>>(`${base}/list`, body).then((r) => r.data),
  listLite: (body: LocationListLiteQuery = {}) =>
    http.post<Location[]>(`${base}/list-lite`, body).then((r) => r.data),
  view: (body: LocationViewQuery) =>
    http.post<Location | null>(`${base}/view`, body).then((r) => r.data),
  toggle: (id: number | string) =>
    http.put<LocationToggleResult>(`${base}/${id}/toggle`).then((r) => r.data),
  addPhysician: (id: number | string, physicianId: number) =>
    http
      .post<PhysicianLinkResult>(`${base}/${id}/physicians`, { physicianId })
      .then((r) => r.data),
  addPhysiciansBulk: (id: number | string, physicianIds: number[]) =>
    http
      .post<PhysicianLinkResult>(`${base}/${id}/physicians/bulk`, {
        physicianIds,
      })
      .then((r) => r.data),

  // --- location-users sub-resource ---
  users: {
    create: (body: { locationId: number; userId: number }) =>
      http.post<LocationUser>(usersBase, body).then((r) => r.data),
    get: (id: number | string) =>
      http.get<LocationUser>(`${usersBase}/${id}`).then((r) => r.data),
    update: (id: number | string, body: Partial<LocationUser>) =>
      http.put<LocationUser>(`${usersBase}/${id}`, body).then((r) => r.data),
    remove: (id: number | string) =>
      http.del<unknown>(`${usersBase}/${id}`).then((r) => r.data),
  },

  // --- location-physicians sub-resource ---
  physicians: {
    create: (body: { locationId: number; physicianId: number }) =>
      http.post<LocationPhysician>(physiciansBase, body).then((r) => r.data),
    get: (id: number | string) =>
      http
        .get<LocationPhysician>(`${physiciansBase}/${id}`)
        .then((r) => r.data),
    update: (id: number | string, body: Partial<LocationPhysician>) =>
      http
        .put<LocationPhysician>(`${physiciansBase}/${id}`, body)
        .then((r) => r.data),
    remove: (id: number | string) =>
      http.del<unknown>(`${physiciansBase}/${id}`).then((r) => r.data),
  },
};
