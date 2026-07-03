"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, Paginated } from "@/core/api/types";

import { resultApi } from "./result.api";
import type { ResultControl, ResultSample, ResultSession } from "./result.types";

export const resultKeys = {
  all: ["result"] as const,
  sessions: (q: Record<string, unknown>) => ["result", "sessions", q] as const,
  session: (id: number | string) => ["result", "session", id] as const,
  samples: (id: number | string) => ["result", "samples", id] as const,
  controls: (id: number | string) => ["result", "controls", id] as const,
};

export const useResultSessions = (query: { page?: number; limit?: number; search?: string; statuses?: string[] }) =>
  useQuery<Paginated<ResultSession>, ApiError>({
    queryKey: resultKeys.sessions(query),
    queryFn: () => resultApi.listSessions(query),
    placeholderData: (p) => p,
  });

export const useResultSession = (id: number | string) =>
  useQuery<ResultSession, ApiError>({
    queryKey: resultKeys.session(id),
    queryFn: () => resultApi.session(id),
    enabled: id !== undefined && id !== null && id !== "",
  });

export const useResultSamples = (id: number | string) =>
  useQuery<ResultSample[], ApiError>({
    queryKey: resultKeys.samples(id),
    queryFn: () => resultApi.sessionSamples(id),
    enabled: id !== undefined && id !== null && id !== "",
  });

export const useResultControls = (id: number | string) =>
  useQuery<ResultControl[], ApiError>({
    queryKey: resultKeys.controls(id),
    queryFn: () => resultApi.sessionControls(id),
    enabled: id !== undefined && id !== null && id !== "",
  });

export const useResultMutation = <T,>(fn: (arg: T) => Promise<unknown>) => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, T>({
    mutationFn: fn,
    onSuccess: () => qc.invalidateQueries({ queryKey: resultKeys.all }),
  });
};
