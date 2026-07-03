"use client";

/** Dashboard hooks. Gated by `enabled` so nothing fetches until the user clicks
 *  "Load Dashboard Data" (the API calls are heavy aggregations). */

import { useQuery } from "@tanstack/react-query";

import type { ApiError } from "@/core/api/types";

import { dashboardApi } from "./dashboard.api";

const STALE = 5 * 60 * 1000; // matches the 5-min refresh cooldown

export const useOnboardingCount = (enabled: boolean) =>
  useQuery({
    queryKey: ["dashboard", "onboarding"],
    queryFn: dashboardApi.onboarding,
    enabled,
    staleTime: STALE,
  });

export const useOrderStatusCount = (enabled: boolean) =>
  useQuery({
    queryKey: ["dashboard", "order-status"],
    queryFn: dashboardApi.orderStatus,
    enabled,
    staleTime: STALE,
  });

export const useOrdersByYear = (year: number, enabled: boolean) =>
  useQuery({
    queryKey: ["dashboard", "orders-by-year", year],
    queryFn: () => dashboardApi.ordersByYear(year),
    enabled,
    staleTime: STALE,
  });

export const useSampleWorkflow = (enabled: boolean) =>
  useQuery({
    queryKey: ["dashboard", "workflow"],
    queryFn: dashboardApi.workflow,
    enabled,
    staleTime: STALE,
  });

export const useSendoutAnalysis = (enabled: boolean) =>
  useQuery<Awaited<ReturnType<typeof dashboardApi.sendout>>, ApiError>({
    queryKey: ["dashboard", "sendout"],
    queryFn: dashboardApi.sendout,
    enabled,
    staleTime: STALE,
  });
