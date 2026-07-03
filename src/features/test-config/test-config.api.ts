/**
 * Test Config API — `services/test_config/router.py`.
 * panels/tests/biomarkers share a uniform catalog surface; cpt/icd are simpler.
 */

import { http } from "@/core/api/client";
import { SERVICE } from "@/core/api/endpoints";
import type { Paginated } from "@/core/api/types";

import type {
  Biomarker,
  CatalogListQuery,
  CptCode,
  IcdCode,
  ListLiteQuery,
  Panel,
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

export const testConfigApi = {
  panels: createCatalogApi<Panel>(`${SERVICE.testConfig}/panels`),
  tests: createCatalogApi<Test>(`${SERVICE.testConfig}/tests`),
  biomarkers: createCatalogApi<Biomarker>(`${SERVICE.testConfig}/biomarkers`),
  cptCodes: createCodeApi<CptCode>(`${SERVICE.testConfig}/cpt-codes`),
  icdCodes: createCodeApi<IcdCode>(`${SERVICE.testConfig}/icd-codes`),
};
