"use client";

/** React Query hooks for the lab-os reference picklists. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, Paginated } from "@/core/api/types";

import { labOsApi } from "./lab-os.api";
import type { Department, Instrument, LabSession, Reagent } from "./lab-os.types";

const unwrap = <T>(data: T[] | Paginated<T>): T[] =>
  Array.isArray(data) ? data : data.docs;

export const useDepartmentOptions = () =>
  useQuery<Department[], ApiError>({
    queryKey: ["lab-os", "departments"],
    queryFn: () => labOsApi.departments({ limit: 200 }).then(unwrap),
    staleTime: 5 * 60 * 1000,
  });

export const useInstrumentOptions = () =>
  useQuery<Instrument[], ApiError>({
    queryKey: ["lab-os", "instruments"],
    queryFn: () => labOsApi.instruments(),
    staleTime: 5 * 60 * 1000,
  });

export const useReagentOptions = () =>
  useQuery<Reagent[], ApiError>({
    queryKey: ["lab-os", "reagents"],
    queryFn: () => labOsApi.reagents(),
    staleTime: 5 * 60 * 1000,
  });

export const useCreateInstrument = () => {
  const qc = useQueryClient();
  return useMutation<Instrument, ApiError, Record<string, unknown>>({
    mutationFn: (body) => labOsApi.createInstrument(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lab-os", "instruments"] }),
  });
};

// --- worklists (LabSessions) ---
const worklistKeys = {
  all: ["lab-os", "sessions"] as const,
  detail: (id: number | string) => ["lab-os", "sessions", id] as const,
};

export const useWorklists = (body: Record<string, unknown> = {}) =>
  useQuery<LabSession[], ApiError>({
    queryKey: [...worklistKeys.all, "list", body],
    queryFn: () => labOsApi.sessions.list({ limit: 200, ...body }).then(unwrap),
  });

export const useWorklist = (id: number | string) =>
  useQuery<LabSession, ApiError>({
    queryKey: worklistKeys.detail(id),
    queryFn: () => labOsApi.sessions.get(id),
    enabled: id !== undefined && id !== null && id !== "",
  });

export const useCreateWorklist = () => {
  const qc = useQueryClient();
  return useMutation<LabSession, ApiError, Record<string, unknown>>({
    mutationFn: (body) => labOsApi.sessions.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: worklistKeys.all }),
  });
};

export const useUpdateWorklist = () => {
  const qc = useQueryClient();
  return useMutation<LabSession, ApiError, { id: number | string; body: Record<string, unknown> }>({
    mutationFn: ({ id, body }) => labOsApi.sessions.update(id, body),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: worklistKeys.all });
      qc.invalidateQueries({ queryKey: worklistKeys.detail(id) });
    },
  });
};
