"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, Paginated } from "@/core/api/types";

import { inventoryApi } from "./inventory.api";
import type {
  InventoryItem,
  InventoryListQuery,
  InventoryQuantity,
  InventorySubItem,
} from "./inventory.types";

export const inventoryKeys = {
  all: ["inventory"] as const,
  list: (q: InventoryListQuery) => ["inventory", "list", q] as const,
  item: (id: number | string) => ["inventory", "item", id] as const,
  subItems: (id: number | string) => ["inventory", "sub-items", id] as const,
  quantities: (id: number | string) => ["inventory", "quantities", id] as const,
};

export const useInventoryItems = (query: InventoryListQuery = {}) =>
  useQuery<Paginated<InventoryItem>, ApiError>({
    queryKey: inventoryKeys.list(query),
    queryFn: () => inventoryApi.list(query),
    placeholderData: (p) => p,
  });

export const useInventoryItem = (id: number | string) =>
  useQuery<InventoryItem, ApiError>({
    queryKey: inventoryKeys.item(id),
    queryFn: () => inventoryApi.get(id),
    enabled: id !== undefined && id !== null && id !== "",
  });

export const useSubItems = (id: number | string) =>
  useQuery<InventorySubItem[], ApiError>({
    queryKey: inventoryKeys.subItems(id),
    queryFn: () => inventoryApi.subItems(id),
    enabled: id !== undefined && id !== null && id !== "",
  });

export const useQuantities = (id: number | string) =>
  useQuery<InventoryQuantity[], ApiError>({
    queryKey: inventoryKeys.quantities(id),
    queryFn: () => inventoryApi.quantities(id),
    enabled: id !== undefined && id !== null && id !== "",
  });

export const useCreateItem = () => {
  const qc = useQueryClient();
  return useMutation<InventoryItem, ApiError, Record<string, unknown>>({
    mutationFn: (body) => inventoryApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.all }),
  });
};

export const useUpdateItem = () => {
  const qc = useQueryClient();
  return useMutation<InventoryItem, ApiError, { id: number | string; body: Record<string, unknown> }>({
    mutationFn: ({ id, body }) => inventoryApi.update(id, body),
    onSuccess: (_d, { id }) => {
      qc.invalidateQueries({ queryKey: inventoryKeys.all });
      qc.invalidateQueries({ queryKey: inventoryKeys.item(id) });
    },
  });
};

export const useToggleItem = () => {
  const qc = useQueryClient();
  return useMutation<{ id: number; isActive: boolean }, ApiError, number | string>({
    mutationFn: (id) => inventoryApi.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: inventoryKeys.all }),
  });
};
