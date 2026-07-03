"use client";

/** React Query hooks for locations (FacilityController analogue for locations). */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, Paginated } from "@/core/api/types";

import { locationApi } from "./location.api";
import type {
  Location,
  LocationCreateRequest,
  LocationEditRequest,
  LocationListLiteQuery,
  LocationListQuery,
  LocationToggleResult,
} from "./location.types";

export const locationKeys = {
  all: ["location"] as const,
  list: (query: LocationListQuery) => ["location", "list", query] as const,
  lite: (query: LocationListLiteQuery) => ["location", "lite", query] as const,
  detail: (id: number | string) => ["location", "detail", id] as const,
  view: (id: number | string) => ["location", "view", id] as const,
};

export const useLocationList = (query: LocationListQuery = {}) =>
  useQuery<Paginated<Location>, ApiError>({
    queryKey: locationKeys.list(query),
    queryFn: () => locationApi.list(query),
    placeholderData: (previous) => previous,
  });

export const useLocationLiteList = (query: LocationListLiteQuery = {}) =>
  useQuery<Location[], ApiError>({
    queryKey: locationKeys.lite(query),
    queryFn: () => locationApi.listLite(query),
  });

export const useLocation = (id: number | string) =>
  useQuery<Location, ApiError>({
    queryKey: locationKeys.detail(id),
    queryFn: () => locationApi.get(id),
    enabled: id !== undefined && id !== null && id !== "",
  });

/** Detail view with sub-details: facility/lab/admin/user details. */
export const useLocationView = (id: number | string, enabled = true) =>
  useQuery<Location | null, ApiError>({
    queryKey: locationKeys.view(id),
    queryFn: () =>
      locationApi.view({ locationId: Number(id), isSubDetailsRequired: true }),
    enabled: enabled && id !== undefined && id !== null && id !== "",
  });

export const useCreateLocation = () => {
  const qc = useQueryClient();
  return useMutation<Location, ApiError, LocationCreateRequest>({
    mutationFn: locationApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.all }),
  });
};

export const useUpdateLocation = () => {
  const qc = useQueryClient();
  return useMutation<
    Location,
    ApiError,
    { id: number | string; body: LocationEditRequest }
  >({
    mutationFn: ({ id, body }) => locationApi.update(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: locationKeys.all });
      qc.invalidateQueries({ queryKey: locationKeys.detail(id) });
      qc.invalidateQueries({ queryKey: locationKeys.view(id) });
    },
  });
};

export const useToggleLocation = () => {
  const qc = useQueryClient();
  return useMutation<LocationToggleResult, ApiError, number | string>({
    mutationFn: (id) => locationApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.all }),
  });
};

export const useDeleteLocation = () => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, number | string>({
    mutationFn: (id) => locationApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: locationKeys.all }),
  });
};
