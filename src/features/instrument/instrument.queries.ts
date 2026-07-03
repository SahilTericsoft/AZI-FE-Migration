"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, Paginated } from "@/core/api/types";

import { instrumentApi } from "./instrument.api";
import type { Instrument, InstrumentSearchQuery } from "./instrument.types";

export const instrumentKeys = {
  all: ["instrument"] as const,
  list: (q: InstrumentSearchQuery) => ["instrument", "list", q] as const,
  detail: (id: number | string) => ["instrument", "detail", id] as const,
};

export const useInstruments = (query: InstrumentSearchQuery = {}) =>
  useQuery<Paginated<Instrument>, ApiError>({
    queryKey: instrumentKeys.list(query),
    queryFn: () => instrumentApi.search(query),
    placeholderData: (p) => p,
  });

export const useInstrument = (id: number | string) =>
  useQuery<Instrument, ApiError>({
    queryKey: instrumentKeys.detail(id),
    queryFn: () => instrumentApi.get(id),
    enabled: id !== undefined && id !== null && id !== "",
  });

export const useCreateInstrument = () => {
  const qc = useQueryClient();
  return useMutation<Instrument, ApiError, Record<string, unknown>>({
    mutationFn: (body) => instrumentApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: instrumentKeys.all }),
  });
};

export const useUpdateInstrument = () => {
  const qc = useQueryClient();
  return useMutation<Instrument, ApiError, { id: number | string; body: Record<string, unknown> }>({
    mutationFn: ({ id, body }) => instrumentApi.update(id, body),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: instrumentKeys.all });
      qc.invalidateQueries({ queryKey: instrumentKeys.detail(id) });
    },
  });
};

export const useToggleInstrument = () => {
  const qc = useQueryClient();
  return useMutation<{ id: number; status: string }, ApiError, number | string>({
    mutationFn: (id) => instrumentApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: instrumentKeys.all }),
  });
};
