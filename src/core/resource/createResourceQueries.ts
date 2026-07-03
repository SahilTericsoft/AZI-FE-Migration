/**
 * `createResourceQueries` — standard React Query hooks for a ResourceApi.
 *
 * Gives every feature a uniform set of server-state hooks
 * (useList / useDetail / useCreate / useUpdate / useRemove) with sensible cache
 * invalidation — the FE analogue of the backend's shared `BaseController`.
 * Features can also write bespoke hooks for non-standard endpoints.
 */

import {
  useMutation,
  useQuery,
  useQueryClient,
  type UseQueryOptions,
} from "@tanstack/react-query";

import type { ApiError, ListRequest, Paginated } from "@/core/api/types";

import type { ResourceApi } from "./createResourceApi";

type ListOptions<T> = Omit<
  UseQueryOptions<Paginated<T>, ApiError>,
  "queryKey" | "queryFn"
>;
type DetailOptions<T> = Omit<
  UseQueryOptions<T, ApiError>,
  "queryKey" | "queryFn"
>;

export function createResourceQueries<T, C, U>(
  key: string,
  api: ResourceApi<T, C, U>,
) {
  const keys = {
    all: [key] as const,
    list: (body?: ListRequest) => [key, "list", body ?? {}] as const,
    detail: (id: number | string) => [key, "detail", id] as const,
  };

  const useList = (body?: ListRequest, options?: ListOptions<T>) =>
    useQuery<Paginated<T>, ApiError>({
      queryKey: keys.list(body),
      queryFn: () => api.list(body),
      ...options,
    });

  const useDetail = (id: number | string, options?: DetailOptions<T>) =>
    useQuery<T, ApiError>({
      queryKey: keys.detail(id),
      queryFn: () => api.get(id),
      enabled: id !== undefined && id !== null && id !== "",
      ...options,
    });

  const useCreate = () => {
    const qc = useQueryClient();
    return useMutation<T, ApiError, C>({
      mutationFn: (body) => api.create(body),
      onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
  };

  const useUpdate = () => {
    const qc = useQueryClient();
    return useMutation<T, ApiError, { id: number | string; body: U }>({
      mutationFn: ({ id, body }) => api.update(id, body),
      onSuccess: (_data, { id }) => {
        qc.invalidateQueries({ queryKey: keys.all });
        qc.invalidateQueries({ queryKey: keys.detail(id) });
      },
    });
  };

  const useRemove = () => {
    const qc = useQueryClient();
    return useMutation<unknown, ApiError, number | string>({
      mutationFn: (id) => api.remove(id),
      onSuccess: () => qc.invalidateQueries({ queryKey: keys.all }),
    });
  };

  return { keys, useList, useDetail, useCreate, useUpdate, useRemove };
}
