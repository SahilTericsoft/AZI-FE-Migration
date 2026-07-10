/**
 * Test Config types — mirror `services/test_config/models.py` + schemas.
 * The catalog of what can be ordered: panels, tests, biomarkers, CPT, ICD.
 */

import type { BaseEntity } from "@/core/api/types";

/** Populated `createdBy` user summary the list endpoints attach to each row. */
export interface CreatedByDetails {
  id?: number;
  firstName?: string | null;
  lastName?: string | null;
}

/** An uploaded document record (test attachments). */
export interface Attachment {
  attachmentName: string;
  secureUrl: string;
  mimeType?: string | null;
  size?: number | null;
}

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
  createdByDetails?: CreatedByDetails | null;
}

export interface Test extends BaseEntity {
  name: string | null;
  code: string | null;
  sampleType?: string | null;
  sampleCollectionDeviceName?: string | null;
  sampleQuantity?: string | null;
  reportFormat?: string | null;
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
  attachments?: Attachment[] | null;
  createdByDetails?: CreatedByDetails | null;
}

export interface Biomarker extends BaseEntity {
  name: string | null;
  code: string | null;
  sampleType?: string | null;
  sampleCollectionDeviceName?: string | null;
  reportFormat?: string | null;
  description?: string | null;
  status?: string | null;
  // Basic Details — reference links (ids into lab_os Departments/Reagents/Instruments).
  departmentIds?: number[] | null;
  reagentIds?: number[] | null;
  instrumentIds?: number[] | null;
  // Report Type flags (derived from reportFormat: Manual → POC, Quantitative → config).
  isPocConfigReq?: boolean | null;
  isConfigurationRequired?: boolean | null;
  pocConfigArr?: string[] | null;
  // Report Type — layout designer payload.
  biomarkerLayoutDetails?: Array<Record<string, unknown>> | null;
  isIndividuallyOffered?: boolean | null;
  internalBiomarkerId?: string | null;
  createdByDetails?: CreatedByDetails | null;
}

/** One reference-range configuration rule (qualitative adds result + color). */
export interface BiomarkerConfigRule {
  value1?: string | null;
  value2?: string | null;
  expression?: string | null;
  units?: string | null;
  result?: string | null;
  color?: string | null;
}

/** A per-biomarker reference-range configuration (`/biomarkers/{id}/configurations`). */
export interface BiomarkerReportConfiguration extends BaseEntity {
  biomarkerId?: number | null;
  gender?: string | null;
  age?: string | null;
  rules?: BiomarkerConfigRule[] | null;
  expectedResults?: string | null;
  isBiomarkerNoteAvailable?: boolean | null;
  biomarkerNotes?: string | null;
}

/** A static option (title/code) from the static-data endpoints. */
export interface StaticOption {
  title: string;
  code: string | boolean;
}

/** A collection device option. */
export interface CollectionDevice {
  title: string;
  code: string;
}

/** A sample type with the collection devices allowed for it (legacy linkage). */
export interface SampleTypeWithDevices {
  /** Present when the row is DB-backed (seeded/created); absent for defaults. */
  id?: number;
  sampleType: string;
  sampleCollectionDeviceName: CollectionDevice[];
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
  sampleTypes?: string[];
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
