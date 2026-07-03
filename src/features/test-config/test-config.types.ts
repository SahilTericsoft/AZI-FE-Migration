/**
 * Test Config types — mirror `services/test_config/models.py` + schemas.
 * The catalog of what can be ordered: panels, tests, biomarkers, CPT, ICD.
 */

import type { BaseEntity } from "@/core/api/types";

export interface Panel extends BaseEntity {
  name: string | null;
  code: string | null;
  testIds?: number[] | null;
  biomarkerIds?: number[] | null;
  sampleType?: string | null;
  description?: string | null;
  internalPanelId?: string | null;
  status?: string | null;
  hasOrderingLimit?: boolean | null;
  alertLimit?: number | null;
  maxLimit?: number | null;
}

export interface Test extends BaseEntity {
  name: string | null;
  code: string | null;
  sampleType?: string | null;
  sampleCollectionDeviceName?: string | null;
  sampleQuantity?: string | null;
  biomarkerIds?: number[] | null;
  testCategory?: string | null;
  description?: string | null;
  status?: string | null;
  // Basic Details — reference links (ids into lab_os Departments/Reagents/Instruments).
  departmentIds?: number[] | null;
  reagentIds?: number[] | null;
  instrumentIds?: number[] | null;
  resultingMode?: string | null;
  // Report Configuration — state reporting + intake form.
  isStateReportingRequired?: boolean | null;
  stateReporting?: Record<string, unknown> | null;
  isIntakeFormRequired?: boolean | null;
  formId?: number | null;
  isBulkImportRequired?: boolean | null;
  // ICD / CPT linking.
  isIcdCodeRequired?: boolean | null;
  icdCodes?: number[] | null;
  isCptCodeRequired?: boolean | null;
  cptCodes?: number[] | null;
  cptCodeDetails?: Array<Record<string, unknown>> | null;
  // Report Type — layout designer payload.
  testLayoutDetails?: Array<Record<string, unknown>> | null;
}

export interface Biomarker extends BaseEntity {
  name: string | null;
  code: string | null;
  sampleType?: string | null;
  reportFormat?: string | null;
  description?: string | null;
  status?: string | null;
}

export interface CptCode extends BaseEntity {
  cptCode: string | null;
  description?: string | null;
}

export interface IcdCode extends BaseEntity {
  icdCode: string | null;
  description?: string | null;
}

export interface CatalogListQuery {
  page?: number;
  limit?: number;
  search?: string;
  createdByIds?: number[];
  statuses?: string[];
  startDate?: string;
  endDate?: string;
  sort?: Record<string, "ASC" | "DESC">;
}

export interface ListLiteQuery {
  ids?: number[];
  search?: string;
  isActive?: boolean;
  appliedAttributes?: string[];
}
