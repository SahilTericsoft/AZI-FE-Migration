"use client";

/**
 * React Query hooks for facilities — the FE analogue of FacilityController.
 * Standard list/detail/create/update + facility-specific toggle/delete, each
 * with cache invalidation.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, Paginated } from "@/core/api/types";

import { facilityApi } from "./facility.api";
import type {
  Facility,
  FacilityCreateRequest,
  FacilityEditRequest,
  FacilityListLiteQuery,
  FacilityListQuery,
  ToggleResult,
} from "./facility.types";

export const facilityKeys = {
  all: ["facility"] as const,
  list: (query: FacilityListQuery) => ["facility", "list", query] as const,
  lite: (query: FacilityListLiteQuery) => ["facility", "lite", query] as const,
  detail: (id: number | string) => ["facility", "detail", id] as const,
  view: (id: number | string) => ["facility", "view", id] as const,
};

export const useFacilityList = (query: FacilityListQuery = {}) =>
  useQuery<Paginated<Facility>, ApiError>({
    queryKey: facilityKeys.list(query),
    queryFn: () => facilityApi.list(query),
    placeholderData: (previous) => previous, // keep rows visible while paging/searching
  });

export const useFacilityLiteList = (query: FacilityListLiteQuery = {}) =>
  useQuery<Facility[], ApiError>({
    queryKey: facilityKeys.lite(query),
    queryFn: () => facilityApi.listLite(query),
  });

export const useFacility = (id: number | string) =>
  useQuery<Facility, ApiError>({
    queryKey: facilityKeys.detail(id),
    queryFn: () => facilityApi.get(id),
    enabled: id !== undefined && id !== null && id !== "",
  });

/** Detail view with sub-details: adminDetails, userDetails, physicianDetails, count. */
export const useFacilityView = (id: number | string, enabled = true) =>
  useQuery<Facility | null, ApiError>({
    queryKey: facilityKeys.view(id),
    queryFn: () =>
      facilityApi.view({
        facilityId: Number(id),
        isSubDetailsRequired: true,
        isPhysicianDetailsRequired: true,
        isNumberOfLocationsRequired: true,
      }),
    enabled: enabled && id !== undefined && id !== null && id !== "",
  });

export const useCreateFacility = () => {
  const qc = useQueryClient();
  return useMutation<Facility, ApiError, FacilityCreateRequest>({
    mutationFn: facilityApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: facilityKeys.all }),
  });
};

export const useUpdateFacility = () => {
  const qc = useQueryClient();
  return useMutation<
    Facility,
    ApiError,
    { id: number | string; body: FacilityEditRequest }
  >({
    mutationFn: ({ id, body }) => facilityApi.update(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: facilityKeys.all });
      qc.invalidateQueries({ queryKey: facilityKeys.detail(id) });
      qc.invalidateQueries({ queryKey: facilityKeys.view(id) });
    },
  });
};

export const useToggleFacility = () => {
  const qc = useQueryClient();
  return useMutation<ToggleResult, ApiError, number | string>({
    mutationFn: (id) => facilityApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: facilityKeys.all }),
  });
};

export const useDeleteFacility = () => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, number | string>({
    mutationFn: (id) => facilityApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: facilityKeys.all }),
  });
};
