"use client";

/** React Query hooks for samples. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, Paginated } from "@/core/api/types";

import { sampleApi } from "./sample.api";
import type { AccessionRequest, Sample, SampleListQuery } from "./sample.types";

export const sampleKeys = {
  all: ["sample"] as const,
  list: (query: SampleListQuery) => ["sample", "list", query] as const,
  byOrder: (orderId: number | string) => ["sample", "by-order", orderId] as const,
  detail: (id: number | string) => ["sample", "detail", id] as const,
};

export const useSampleList = (query: SampleListQuery = {}) =>
  useQuery<Paginated<Sample>, ApiError>({
    queryKey: sampleKeys.list(query),
    queryFn: () => sampleApi.list(query),
    placeholderData: (previous) => previous,
  });

export const useSamplesByOrder = (orderId: number | string, enabled = true) =>
  useQuery<Sample[], ApiError>({
    queryKey: sampleKeys.byOrder(orderId),
    queryFn: () => sampleApi.byOrder(orderId),
    enabled: enabled && orderId !== undefined && orderId !== null && orderId !== "",
  });

export const useSample = (id: number | string) =>
  useQuery<Sample, ApiError>({
    queryKey: sampleKeys.detail(id),
    queryFn: () => sampleApi.get(id),
    enabled: id !== undefined && id !== null && id !== "",
  });

export const useAccessionSample = () => {
  const qc = useQueryClient();
  return useMutation<Sample, ApiError, { id: number | string; body: AccessionRequest }>({
    mutationFn: ({ id, body }) => sampleApi.accession(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: sampleKeys.all }),
  });
};

export const useUpdateSample = () => {
  const qc = useQueryClient();
  return useMutation<Sample, ApiError, { id: number | string; body: Record<string, unknown> }>({
    mutationFn: ({ id, body }) => sampleApi.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: sampleKeys.all }),
  });
};
