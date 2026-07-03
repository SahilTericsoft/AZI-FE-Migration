"use client";

/** React Query hooks for the test-config catalog. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, Paginated } from "@/core/api/types";

import { testConfigApi } from "./test-config.api";
import type {
  Biomarker,
  CatalogListQuery,
  CptCode,
  IcdCode,
  ListLiteQuery,
  Panel,
  Test,
} from "./test-config.types";

export const testConfigKeys = {
  panels: ["test-config", "panels"] as const,
  panelLite: (q: ListLiteQuery) => ["test-config", "panels", "lite", q] as const,
  panelList: (q: CatalogListQuery) => ["test-config", "panels", "list", q] as const,
  tests: ["test-config", "tests"] as const,
  testLite: (q: ListLiteQuery) => ["test-config", "tests", "lite", q] as const,
  testList: (q: CatalogListQuery) => ["test-config", "tests", "list", q] as const,
  biomarkers: ["test-config", "biomarkers"] as const,
  biomarkerList: (q: CatalogListQuery) => ["test-config", "biomarkers", "list", q] as const,
};

const OPTIONS_STALE = 5 * 60 * 1000; // reference picklists change rarely

export const usePanelOptions = (query: ListLiteQuery = {}) =>
  useQuery<Panel[], ApiError>({
    queryKey: testConfigKeys.panelLite(query),
    queryFn: () => testConfigApi.panels.listLite({ isActive: true, ...query }),
    staleTime: OPTIONS_STALE,
  });

export const useTestOptions = (query: ListLiteQuery = {}) =>
  useQuery<Test[], ApiError>({
    queryKey: testConfigKeys.testLite(query),
    queryFn: () => testConfigApi.tests.listLite({ isActive: true, ...query }),
    staleTime: OPTIONS_STALE,
  });

export const useBiomarkerOptions = (query: ListLiteQuery = {}) =>
  useQuery<Biomarker[], ApiError>({
    queryKey: ["test-config", "biomarkers", "lite", query],
    queryFn: () => testConfigApi.biomarkers.listLite({ isActive: true, ...query }),
    staleTime: OPTIONS_STALE,
  });

export const useIcdCodeOptions = (query: CatalogListQuery = { limit: 100 }) =>
  useQuery<CptCode[] | IcdCode[], ApiError>({
    queryKey: ["test-config", "icd-codes", query],
    queryFn: () => testConfigApi.icdCodes.list(query).then((r) => r.docs),
  });

export const useCptCodeOptions = (query: CatalogListQuery = { limit: 100 }) =>
  useQuery<CptCode[], ApiError>({
    queryKey: ["test-config", "cpt-codes", query],
    queryFn: () => testConfigApi.cptCodes.list(query).then((r) => r.docs),
  });

export const useUpdateTest = () => {
  const qc = useQueryClient();
  return useMutation<
    Test,
    ApiError,
    { id: number | string; body: Record<string, unknown> }
  >({
    mutationFn: ({ id, body }) => testConfigApi.tests.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: testConfigKeys.tests }),
  });
};

export const usePanelList = (query: CatalogListQuery = {}) =>
  useQuery<Paginated<Panel>, ApiError>({
    queryKey: testConfigKeys.panelList(query),
    queryFn: () => testConfigApi.panels.list(query),
    placeholderData: (previous) => previous,
  });

export const useTestList = (query: CatalogListQuery = {}) =>
  useQuery<Paginated<Test>, ApiError>({
    queryKey: testConfigKeys.testList(query),
    queryFn: () => testConfigApi.tests.list(query),
    placeholderData: (previous) => previous,
  });

/* --------------------------------- mutations -------------------------------- */

export const useCreatePanel = () => {
  const qc = useQueryClient();
  return useMutation<Panel, ApiError, Record<string, unknown>>({
    mutationFn: (body) => testConfigApi.panels.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: testConfigKeys.panels }),
  });
};

export const useCreateTest = () => {
  const qc = useQueryClient();
  return useMutation<Test, ApiError, Record<string, unknown>>({
    mutationFn: (body) => testConfigApi.tests.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: testConfigKeys.tests }),
  });
};

export const useTogglePanel = () => {
  const qc = useQueryClient();
  return useMutation<{ id: number; isActive: boolean }, ApiError, number | string>({
    mutationFn: (id) => testConfigApi.panels.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: testConfigKeys.panels }),
  });
};

export const useBiomarkerList = (query: CatalogListQuery = {}) =>
  useQuery<Paginated<Biomarker>, ApiError>({
    queryKey: testConfigKeys.biomarkerList(query),
    queryFn: () => testConfigApi.biomarkers.list(query),
    placeholderData: (previous) => previous,
  });

export const useCreateBiomarker = () => {
  const qc = useQueryClient();
  return useMutation<Biomarker, ApiError, Record<string, unknown>>({
    mutationFn: (body) => testConfigApi.biomarkers.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: testConfigKeys.biomarkers }),
  });
};

export const useToggleBiomarker = () => {
  const qc = useQueryClient();
  return useMutation<{ id: number; isActive: boolean }, ApiError, number | string>({
    mutationFn: (id) => testConfigApi.biomarkers.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: testConfigKeys.biomarkers }),
  });
};

export const useToggleTest = () => {
  const qc = useQueryClient();
  return useMutation<{ id: number; isActive: boolean }, ApiError, number | string>({
    mutationFn: (id) => testConfigApi.tests.toggle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: testConfigKeys.tests }),
  });
};
