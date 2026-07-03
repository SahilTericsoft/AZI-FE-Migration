"use client";

/** React Query hooks for users. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, Paginated } from "@/core/api/types";

import { userApi } from "./user.api";
import type { User, UserCreateRequest, UserListQuery } from "./user.types";

export const userKeys = {
  all: ["user"] as const,
  list: (query: UserListQuery) => ["user", "list", query] as const,
};

export const useUserList = (query: UserListQuery = {}) =>
  useQuery<Paginated<User>, ApiError>({
    queryKey: userKeys.list(query),
    queryFn: () => userApi.list(query),
  });

/** Convenience: a sizable page of users for pickers/dropdowns. */
export const useUserOptions = (query: UserListQuery = {}) =>
  useUserList({ limit: 200, isActive: true, ...query });

export const useCreateUser = () => {
  const qc = useQueryClient();
  return useMutation<User, ApiError, UserCreateRequest>({
    mutationFn: (body) => userApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
};

export const useUpdateUser = () => {
  const qc = useQueryClient();
  return useMutation<User, ApiError, { userId: number } & Record<string, unknown>>({
    mutationFn: (body) => userApi.update(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: userKeys.all }),
  });
};
