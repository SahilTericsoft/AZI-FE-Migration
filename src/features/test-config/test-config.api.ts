/**
 * Test Config API — `services/test_config/router.py`.
 * panels/tests/biomarkers share a uniform catalog surface; cpt/icd are simpler.
 */

import { http } from "@/core/api/client";
import { SERVICE } from "@/core/api/endpoints";
import type { Paginated } from "@/core/api/types";

import type {
  Attachment,
  Biomarker,
  BiomarkerReportConfiguration,
  CatalogListQuery,
  CptCode,
  IcdCode,
  ListLiteQuery,
  Panel,
  StaticOption,
  Test,
} from "./test-config.types";

/** The shared panel/test/biomarker route set. */
function createCatalogApi<T>(base: string) {
  return {
    list: (body: CatalogListQuery = {}) =>
      http.post<Paginated<T>>(`${base}/list`, body).then((r) => r.data),
    listLite: (body: ListLiteQuery = {}) =>
      http.post<T[]>(`${base}/list-lite`, body).then((r) => r.data),
    view: (id: number | string) => http.get<T>(`${base}/${id}`).then((r) => r.data),
    create: (body: Record<string, unknown>) =>
      http.post<T>(base, body).then((r) => r.data),
    update: (id: number | string, body: Record<string, unknown>) =>
      http.put<T>(`${base}/${id}`, body).then((r) => r.data),
    toggle: (id: number | string) =>
      http.put<{ id: number; isActive: boolean }>(`${base}/${id}/toggle`).then((r) => r.data),
    remove: (id: number | string) =>
      http.del<unknown>(`${base}/${id}`).then((r) => r.data),
    checkCode: (code: string) =>
      http.post<unknown>(`${base}/check-code`, { code }).then((r) => r.data),
  };
}

/** CPT / ICD code lookups (no list-lite / toggle / check-code). */
function createCodeApi<T>(base: string) {
  return {
    list: (body: CatalogListQuery = {}) =>
      http.post<Paginated<T>>(`${base}/list`, body).then((r) => r.data),
    view: (id: number | string) => http.get<T>(`${base}/${id}`).then((r) => r.data),
    create: (body: Record<string, unknown>) =>
      http.post<T>(base, body).then((r) => r.data),
    update: (id: number | string, body: Record<string, unknown>) =>
      http.put<T>(`${base}/${id}`, body).then((r) => r.data),
    remove: (id: number | string) =>
      http.del<unknown>(`${base}/${id}`).then((r) => r.data),
  };
}

/** Per-biomarker reference-range configurations (`/biomarkers/{id}/configurations`). */
const biomarkerConfigApi = {
  listForBiomarker: (biomarkerId: number | string) =>
    http
      .get<BiomarkerReportConfiguration[]>(
        `${SERVICE.testConfig}/biomarkers/${biomarkerId}/configurations`,
      )
      .then((r) => r.data),
  add: (biomarkerId: number | string, body: Record<string, unknown>) =>
    http
      .post<BiomarkerReportConfiguration>(
        `${SERVICE.testConfig}/biomarkers/${biomarkerId}/configurations`,
        body,
      )
      .then((r) => r.data),
  edit: (configId: number | string, body: Record<string, unknown>) =>
    http
      .put<BiomarkerReportConfiguration>(`${SERVICE.testConfig}/configurations/${configId}`, body)
      .then((r) => r.data),
  remove: (configId: number | string) =>
    http.del<unknown>(`${SERVICE.testConfig}/configurations/${configId}`).then((r) => r.data),
};

/** Small UI option catalogs served by the static-data endpoints. */
export const staticDataApi = {
  expressions: () =>
    http.get<StaticOption[]>(`${SERVICE.staticData}/expressions`).then((r) => r.data),
  ageList: () => http.get<StaticOption[]>(`${SERVICE.staticData}/age-list`).then((r) => r.data),
  gender: () => http.get<StaticOption[]>(`${SERVICE.staticData}/gender`).then((r) => r.data),
  yesNo: () => http.get<StaticOption[]>(`${SERVICE.staticData}/yes-no`).then((r) => r.data),
};

/** Test (FE "Panel") document attachments — multipart upload + remove. */
const testAttachmentsApi = {
  upload: (testId: number | string, attachmentName: string, file: File) => {
    const fd = new FormData();
    fd.append("attachmentName", attachmentName);
    fd.append("file", file);
    return http
      .post<Attachment>(`${SERVICE.testConfig}/tests/${testId}/attachments`, fd)
      .then((r) => r.data);
  },
  remove: (testId: number | string, index: number) =>
    http
      .del<unknown>(`${SERVICE.testConfig}/tests/${testId}/attachments/${index}`)
      .then((r) => r.data),
};

export const testConfigApi = {
  panels: createCatalogApi<Panel>(`${SERVICE.testConfig}/panels`),
  tests: createCatalogApi<Test>(`${SERVICE.testConfig}/tests`),
  testAttachments: testAttachmentsApi,
  biomarkers: createCatalogApi<Biomarker>(`${SERVICE.testConfig}/biomarkers`),
  biomarkerConfigs: biomarkerConfigApi,
  cptCodes: createCodeApi<CptCode>(`${SERVICE.testConfig}/cpt-codes`),
  icdCodes: createCodeApi<IcdCode>(`${SERVICE.testConfig}/icd-codes`),
};
