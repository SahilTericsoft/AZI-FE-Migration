"use client";

/** React Query hooks for sendout batches. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, Paginated } from "@/core/api/types";

import { sendoutApi } from "./sendout.api";
import type {
  SendoutBatch,
  SendoutBatchCreateRequest,
  SendoutListQuery,
} from "./sendout.types";

export const sendoutKeys = {
  all: ["sendout"] as const,
  list: (query: SendoutListQuery) => ["sendout", "list", query] as const,
  byLab: (labId: number | string) => ["sendout", "by-lab", labId] as const,
  detail: (id: number | string) => ["sendout", "detail", id] as const,
};

export const useSendoutList = (query: SendoutListQuery = {}) =>
  useQuery<Paginated<SendoutBatch>, ApiError>({
    queryKey: sendoutKeys.list(query),
    queryFn: () => sendoutApi.list(query),
    placeholderData: (previous) => previous,
  });

export const useSendoutBatch = (id: number | string) =>
  useQuery<SendoutBatch, ApiError>({
    queryKey: sendoutKeys.detail(id),
    queryFn: () => sendoutApi.get(id),
    enabled: id !== undefined && id !== null && id !== "",
  });

export const useSendoutsByLab = (labId: number | string, enabled = true) =>
  useQuery<SendoutBatch[], ApiError>({
    queryKey: sendoutKeys.byLab(labId),
    queryFn: () => sendoutApi.byLab(labId),
    enabled: enabled && labId !== undefined && labId !== null && labId !== "",
  });

export const useCreateSendoutBatch = () => {
  const qc = useQueryClient();
  return useMutation<SendoutBatch, ApiError, SendoutBatchCreateRequest>({
    mutationFn: (body) => sendoutApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: sendoutKeys.all }),
  });
};
