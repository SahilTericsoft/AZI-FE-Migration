/** React Query hooks for System Settings. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { settingsApi } from "./system-settings.api";
import type { OrderReportListQuery } from "./system-settings.types";

const KEY = "system-settings";

// --- generic dropdowns ---
export function useDropdown(code: string | null, enabled = true) {
  return useQuery({
    queryKey: [KEY, "dropdown", code],
    queryFn: () => settingsApi.getDropdown(code as string),
    enabled: Boolean(code) && enabled,
  });
}

// --- address / geo ---
export function useGeo(search: string, enabled = true) {
  return useQuery({
    queryKey: [KEY, "geo", search],
    queryFn: () => settingsApi.getGeo(search || undefined),
    enabled,
  });
}

// --- departments ---
export function useDepartments(search: string, enabled = true) {
  return useQuery({
    queryKey: [KEY, "departments", search],
    queryFn: () => settingsApi.listDepartments(search || undefined),
    enabled,
  });
}

// --- order reports ---
export function useOrderReports(query: OrderReportListQuery) {
  return useQuery({
    queryKey: [KEY, "order-reports", query],
    queryFn: () => settingsApi.listOrderReports(query),
  });
}

export function usePanelsLite(enabled = true) {
  return useQuery({
    queryKey: [KEY, "panels-lite"],
    queryFn: () => settingsApi.panelsLite(),
    enabled,
  });
}

/** Invalidate everything under the system-settings key. */
export function useSettingsInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: [KEY] });
}
