"use client";

/** React Query hooks for test orders. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, Paginated } from "@/core/api/types";

import { testOrderApi } from "./test-order.api";
import type {
  Order,
  OrderCreateRequest,
  OrderListQuery,
  OrderResult,
} from "./test-order.types";

export const orderKeys = {
  all: ["test-order"] as const,
  list: (query: OrderListQuery) => ["test-order", "list", query] as const,
  byPatient: (patientId: number | string) =>
    ["test-order", "by-patient", patientId] as const,
  detail: (id: number | string) => ["test-order", "detail", id] as const,
  results: (id: number | string) => ["test-order", "results", id] as const,
};

export const useOrderList = (query: OrderListQuery = {}) =>
  useQuery<Paginated<Order>, ApiError>({
    queryKey: orderKeys.list(query),
    queryFn: () => testOrderApi.list(query),
    placeholderData: (previous) => previous,
  });

export const useOrdersByPatient = (patientId: number | string, enabled = true) =>
  useQuery<Paginated<Order>, ApiError>({
    queryKey: orderKeys.byPatient(patientId),
    queryFn: () => testOrderApi.listByPatient(Number(patientId), { limit: 100 }),
    enabled: enabled && patientId !== undefined && patientId !== null && patientId !== "",
  });

export const useOrder = (id: number | string) =>
  useQuery<Order, ApiError>({
    queryKey: orderKeys.detail(id),
    queryFn: () => testOrderApi.get(id),
    enabled: id !== undefined && id !== null && id !== "",
  });

export const useOrderResults = (orderId: number | string, enabled = true) =>
  useQuery<OrderResult[], ApiError>({
    queryKey: orderKeys.results(orderId),
    queryFn: () => testOrderApi.results.byOrder(orderId),
    enabled: enabled && orderId !== undefined && orderId !== null && orderId !== "",
  });

export const useCreateOrder = () => {
  const qc = useQueryClient();
  return useMutation<Order, ApiError, OrderCreateRequest>({
    mutationFn: testOrderApi.create,
    onSuccess: () => qc.invalidateQueries({ queryKey: orderKeys.all }),
  });
};
