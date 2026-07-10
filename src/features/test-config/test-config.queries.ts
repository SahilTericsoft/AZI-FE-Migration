"use client";

/** React Query hooks for the test-config catalog. */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, Paginated } from "@/core/api/types";

import { staticDataApi, testConfigApi } from "./test-config.api";
import type {
  Biomarker,
  BiomarkerReportConfiguration,
  CatalogListQuery,
  CptCode,
  IcdCode,
  CollectionDevice,
  ListLiteQuery,
  Panel,
  SampleTypeWithDevices,
  StaticOption,
  Test,
} from "./test-config.types";

export const testConfigKeys = {
  panels: ["test-config", "panels"] as const,
  panelLite: (q: ListLiteQuery) => ["test-config", "panels", "lite", q] as const,
  panelList: (q: CatalogListQuery) => ["test-config", "panels", "list", q] as const,
  panelDetail: (id: number | string) => ["test-config", "panels", "detail", id] as const,
  tests: ["test-config", "tests"] as const,
  testLite: (q: ListLiteQuery) => ["test-config", "tests", "lite", q] as const,
  testList: (q: CatalogListQuery) => ["test-config", "tests", "list", q] as const,
  testDetail: (id: number | string) => ["test-config", "tests", "detail", id] as const,
  biomarkers: ["test-config", "biomarkers"] as const,
  biomarkerList: (q: CatalogListQuery) => ["test-config", "biomarkers", "list", q] as const,
  biomarkerDetail: (id: number | string) => ["test-config", "biomarkers", "detail", id] as const,
  cptCodes: ["test-config", "cpt-codes"] as const,
  cptList: (q: CatalogListQuery) => ["test-config", "cpt-codes", "list", q] as const,
  icdCodes: ["test-config", "icd-codes"] as const,
  icdList: (q: CatalogListQuery) => ["test-config", "icd-codes", "list", q] as const,
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

/* ---------------------------------- detail ---------------------------------- */

export const useTest = (id: number | string | null | undefined) =>
  useQuery<Test, ApiError>({
    queryKey: testConfigKeys.testDetail(id ?? ""),
    queryFn: () => testConfigApi.tests.view(id!),
    enabled: id != null && id !== "",
  });

export const usePanel = (id: number | string | null | undefined) =>
  useQuery<Panel, ApiError>({
    queryKey: testConfigKeys.panelDetail(id ?? ""),
    queryFn: () => testConfigApi.panels.view(id!),
    enabled: id != null && id !== "",
  });

export const useBiomarker = (id: number | string | null | undefined) =>
  useQuery<Biomarker, ApiError>({
    queryKey: testConfigKeys.biomarkerDetail(id ?? ""),
    queryFn: () => testConfigApi.biomarkers.view(id!),
    enabled: id != null && id !== "",
  });

export const useUpdateTest = () => {
  const qc = useQueryClient();
  return useMutation<
    Test,
    ApiError,
    { id: number | string; body: Record<string, unknown> }
  >({
    mutationFn: ({ id, body }) => testConfigApi.tests.update(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: testConfigKeys.tests });
      qc.invalidateQueries({ queryKey: testConfigKeys.testDetail(id) });
    },
  });
};

export const useUpdatePanel = () => {
  const qc = useQueryClient();
  return useMutation<
    Panel,
    ApiError,
    { id: number | string; body: Record<string, unknown> }
  >({
    mutationFn: ({ id, body }) => testConfigApi.panels.update(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: testConfigKeys.panels });
      qc.invalidateQueries({ queryKey: testConfigKeys.panelDetail(id) });
    },
  });
};

export const useUpdateBiomarker = () => {
  const qc = useQueryClient();
  return useMutation<
    Biomarker,
    ApiError,
    { id: number | string; body: Record<string, unknown> }
  >({
    mutationFn: ({ id, body }) => testConfigApi.biomarkers.update(id, body),
    onSuccess: (_data, { id }) => {
      qc.invalidateQueries({ queryKey: testConfigKeys.biomarkers });
      qc.invalidateQueries({ queryKey: testConfigKeys.biomarkerDetail(id) });
    },
  });
};

/* ---------------------------------- delete ---------------------------------- */

export const useDeleteTest = () => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, number | string>({
    mutationFn: (id) => testConfigApi.tests.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: testConfigKeys.tests }),
  });
};

export const useDeletePanel = () => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, number | string>({
    mutationFn: (id) => testConfigApi.panels.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: testConfigKeys.panels }),
  });
};

export const useDeleteBiomarker = () => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, number | string>({
    mutationFn: (id) => testConfigApi.biomarkers.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: testConfigKeys.biomarkers }),
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

/* ------------------------------- CPT / ICD codes ---------------------------- */

export const useCptCodeList = (query: CatalogListQuery = {}) =>
  useQuery<Paginated<CptCode>, ApiError>({
    queryKey: testConfigKeys.cptList(query),
    queryFn: () => testConfigApi.cptCodes.list(query),
    placeholderData: (previous) => previous,
  });

export const useIcdCodeList = (query: CatalogListQuery = {}) =>
  useQuery<Paginated<IcdCode>, ApiError>({
    queryKey: testConfigKeys.icdList(query),
    queryFn: () => testConfigApi.icdCodes.list(query),
    placeholderData: (previous) => previous,
  });

export const useCreateCptCode = () => {
  const qc = useQueryClient();
  return useMutation<CptCode, ApiError, Record<string, unknown>>({
    mutationFn: (body) => testConfigApi.cptCodes.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: testConfigKeys.cptCodes }),
  });
};

export const useUpdateCptCode = () => {
  const qc = useQueryClient();
  return useMutation<CptCode, ApiError, { id: number | string; body: Record<string, unknown> }>({
    mutationFn: ({ id, body }) => testConfigApi.cptCodes.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: testConfigKeys.cptCodes }),
  });
};

export const useDeleteCptCode = () => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, number | string>({
    mutationFn: (id) => testConfigApi.cptCodes.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: testConfigKeys.cptCodes }),
  });
};

export const useCreateIcdCode = () => {
  const qc = useQueryClient();
  return useMutation<IcdCode, ApiError, Record<string, unknown>>({
    mutationFn: (body) => testConfigApi.icdCodes.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: testConfigKeys.icdCodes }),
  });
};

export const useUpdateIcdCode = () => {
  const qc = useQueryClient();
  return useMutation<IcdCode, ApiError, { id: number | string; body: Record<string, unknown> }>({
    mutationFn: ({ id, body }) => testConfigApi.icdCodes.update(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: testConfigKeys.icdCodes }),
  });
};

export const useDeleteIcdCode = () => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, number | string>({
    mutationFn: (id) => testConfigApi.icdCodes.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: testConfigKeys.icdCodes }),
  });
};

/* ---------------------- biomarker report configurations --------------------- */

const biomarkerConfigKey = (biomarkerId: number | string) =>
  ["test-config", "biomarkers", "configs", biomarkerId] as const;

export const useBiomarkerConfigs = (biomarkerId: number | string | null | undefined) =>
  useQuery<BiomarkerReportConfiguration[], ApiError>({
    queryKey: biomarkerConfigKey(biomarkerId ?? ""),
    queryFn: () => testConfigApi.biomarkerConfigs.listForBiomarker(biomarkerId!),
    enabled: biomarkerId != null && biomarkerId !== "",
  });

export const useAddBiomarkerConfig = (biomarkerId: number | string) => {
  const qc = useQueryClient();
  return useMutation<BiomarkerReportConfiguration, ApiError, Record<string, unknown>>({
    mutationFn: (body) => testConfigApi.biomarkerConfigs.add(biomarkerId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: biomarkerConfigKey(biomarkerId) }),
  });
};

export const useEditBiomarkerConfig = (biomarkerId: number | string) => {
  const qc = useQueryClient();
  return useMutation<
    BiomarkerReportConfiguration,
    ApiError,
    { id: number | string; body: Record<string, unknown> }
  >({
    mutationFn: ({ id, body }) => testConfigApi.biomarkerConfigs.edit(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: biomarkerConfigKey(biomarkerId) }),
  });
};

export const useDeleteBiomarkerConfig = (biomarkerId: number | string) => {
  const qc = useQueryClient();
  return useMutation<unknown, ApiError, number | string>({
    mutationFn: (id) => testConfigApi.biomarkerConfigs.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: biomarkerConfigKey(biomarkerId) }),
  });
};

/* -------------------------------- static data ------------------------------- */

const STATIC_STALE = 30 * 60 * 1000; // enums almost never change

export const useExpressions = () =>
  useQuery<StaticOption[], ApiError>({
    queryKey: ["static-data", "expressions"],
    queryFn: () => staticDataApi.expressions(),
    staleTime: STATIC_STALE,
  });

export const useAgeList = () =>
  useQuery<StaticOption[], ApiError>({
    queryKey: ["static-data", "age-list"],
    queryFn: () => staticDataApi.ageList(),
    staleTime: STATIC_STALE,
  });

export const useGenderOptions = () =>
  useQuery<StaticOption[], ApiError>({
    queryKey: ["static-data", "gender"],
    queryFn: () => staticDataApi.gender(),
    staleTime: STATIC_STALE,
  });

/**
 * Sample types + the collection devices allowed for each (legacy
 * `sampleTypeWithCollectionDevices`). Drives the Sample Type dropdown and the
 * dependent Sample Collection Device dropdown in the Test/Panel wizards.
 */
export const useSampleTypesWithDevices = () =>
  useQuery<SampleTypeWithDevices[], ApiError>({
    queryKey: ["static-data", "sample-types"],
    queryFn: () => staticDataApi.sampleTypes(),
    staleTime: STATIC_STALE,
  });

const sampleTypesKey = ["static-data", "sample-types"];

export const useCreateSampleType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { sampleType: string; sampleCollectionDeviceName: CollectionDevice[] }) =>
      staticDataApi.createSampleType(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: sampleTypesKey }),
  });
};

export const useUpdateSampleType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number;
      body: { sampleType?: string; sampleCollectionDeviceName?: CollectionDevice[] };
    }) => staticDataApi.updateSampleType(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: sampleTypesKey }),
  });
};

export const useDeleteSampleType = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => staticDataApi.deleteSampleType(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: sampleTypesKey }),
  });
};

/**
 * Collection devices allowed for the given sample type (legacy
 * `extractCollectionDevicesFromSampleType`). Case-insensitive so stored
 * lowercase values resolve against the title-cased catalog.
 */
export const devicesForSampleType = (
  sampleType: string,
  catalog: SampleTypeWithDevices[] | undefined,
): { title: string; code: string }[] => {
  if (!sampleType || !catalog) return [];
  const match = catalog.find(
    (s) => s.sampleType.toLowerCase() === sampleType.toLowerCase(),
  );
  return match?.sampleCollectionDeviceName ?? [];
};
