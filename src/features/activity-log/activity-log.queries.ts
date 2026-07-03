"use client";

/** React Query hooks for activity logs. */

import { useQuery } from "@tanstack/react-query";

import type { ApiError, Paginated } from "@/core/api/types";

import { activityLogApi } from "./activity-log.api";
import type { ActivityLog, ActivityLogListQuery } from "./activity-log.types";

export const activityLogKeys = {
  all: ["activity-log"] as const,
  list: (query: ActivityLogListQuery) => ["activity-log", "list", query] as const,
};

/** Normalize the list response (the endpoint may return an array or a page). */
export function toLogArray(
  data: ActivityLog[] | Paginated<ActivityLog> | undefined,
): ActivityLog[] {
  if (!data) return [];
  return Array.isArray(data) ? data : data.docs;
}

export const useActivityLogs = (
  query: ActivityLogListQuery,
  enabled = true,
) =>
  useQuery<ActivityLog[] | Paginated<ActivityLog>, ApiError>({
    queryKey: activityLogKeys.list(query),
    queryFn: () => activityLogApi.list(query),
    enabled,
  });
