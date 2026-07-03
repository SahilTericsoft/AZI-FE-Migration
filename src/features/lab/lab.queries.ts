"use client";

/** React Query hooks for labs + lab-users (LabController analogue). */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, Paginated } from "@/core/api/types";

import { labApi } from "./lab.api";
import type {
  Lab,
  LabCreateRequest,
  LabEditRequest,
  LabListLiteQuery,
  LabListQuery,
  LabToggleResult,
  LabUser,
} from "./lab.types";

export const labKeys = {
  all: ["lab"] as const,
  list: (query: LabListQuery) => ["lab", "list", query] as const,
  lite: (query: LabListLiteQuery) => ["lab", "lite", query] as const,
  detail: (id: number | string) => ["lab", "detail", id] as const,
  view: (id: number | string) => ["lab", "view", id] as const,
  byAdmin: (adminId: number | string) => ["lab", "byAdmin", adminId] as const,
  users: (labId: number | string) => ["lab", "users", labId] as const,
};

export const useLabList = (query: LabListQuery = {}) =>
  useQuery<Paginated<Lab>, ApiError>({
    queryKey: labKeys.list(query),
    queryFn: () => labApi.list(query),
    placeholderData: (previous) => previous,
  });

export const useLabLiteList = (query: LabListLiteQuery = {}) =>
  useQuery<Lab[], ApiError>({
    queryKey: labKeys.lite(query),
    queryFn: () => labApi.listLite(query),
  });

export const useLab = (id: number | string) =>
  useQuery<Lab, ApiError>({
    queryKey: labKeys.detail(id),
    queryFn: () => labApi.get(id),
    enabled: id !== undefined && id !== null && id !== "",
  });

/** Detail view — includes populated `adminDetails` (the admin user). */
export const useLabView = (id: number | string, enabled = true) =>
  useQuery<Lab | null, ApiError>({
    queryKey: labKeys.view(id),
    queryFn: () => labApi.view({ labId: Number(id) }),
    enabled: enabled && id !== undefined && id !== null && id !== "",
  });

export const useLabByAdmin = (adminId: number | string) =>
  useQuery<Lab | null, ApiError>({
    queryKey: labKeys.byAdmin(adminId),
    queryFn: () => labApi.byAdmin(adminId),
    enabled: adminId !== undefined && adminId !== null && adminId !== "",
  });

export const useCreateLab = () => {
  const qc = useQueryClient();
  return useMutation<Lab, ApiError, LabCreateRequest>({
    mutationFn: labApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: labKeys.all }),
  });
};

export const useUpdateLab = () => {
  const qc = useQueryClient();
  return useMutation<
    Lab,
    ApiError,
    { id: number | string; body: LabEditRequest }
  >({
    mutationFn: ({ id, body }) => labApi.update(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: labKeys.all });
      qc.invalidateQueries({ queryKey: labKeys.detail(id) });
      qc.invalidateQueries({ queryKey: labKeys.view(id) });
    },
  });
};

export const useToggleLab = () => {
  const qc = useQueryClient();
  return useMutation<LabToggleResult, ApiError, number | string>({
    mutationFn: (id) => labApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: labKeys.all }),
  });
};

export const useDeleteLab = () => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, number | string>({
    mutationFn: (id) => labApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: labKeys.all }),
  });
};

// --- lab-users ---
export const useLabUsers = (labId: number | string) =>
  useQuery<LabUser[], ApiError>({
    queryKey: labKeys.users(labId),
    queryFn: () => labApi.users.byLab(labId),
    enabled: labId !== undefined && labId !== null && labId !== "",
  });

export const useAddLabUser = () => {
  const qc = useQueryClient();
  return useMutation<LabUser, ApiError, { labId: number; userId: number }>({
    mutationFn: (body) => labApi.users.add(body),
    onSuccess: (_data, { labId }) =>
      qc.invalidateQueries({ queryKey: labKeys.users(labId) }),
  });
};

export const useRemoveLabUser = () => {
  const qc = useQueryClient();
  return useMutation<
    unknown,
    ApiError,
    { id: number | string; labId: number | string }
  >({
    mutationFn: ({ id }) => labApi.users.remove(id),
    onSuccess: (_data, { labId }) =>
      qc.invalidateQueries({ queryKey: labKeys.users(labId) }),
  });
};
