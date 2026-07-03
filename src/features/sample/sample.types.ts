/**
 * Sample types (PHI) — mirror `services/sample/models.py` (OrderSample) +
 * schemas. A sample belongs to an order; its accession id is `sampleCode`.
 */

import type { BaseEntity } from "@/core/api/types";

export interface Sample extends BaseEntity {
  sampleCode: string | null;
  orderId: number | null;
  orderDetails?: Record<string, unknown> | null;
  panelId?: number | null;
  panelDetails?: Record<string, unknown> | null;
  physicianId?: number | null;
  physicianDetails?: Record<string, unknown> | null;
  sampleType?: string | null;
  billingMode?: string | null;
  externalReferenceNumber?: string | null;
  insuranceDetails?: Record<string, unknown> | null;
  rejectionDetails?: Record<string, unknown> | null;
  status: string | null;
  resultedMode?: string | null;
  isPriorityOrder?: boolean | null;
  isAccessioned?: boolean | null;
  isSendOut?: boolean | null;
  isConsentSigned?: boolean | null;
  isSubmitted?: boolean | null;
  barcode?: string | null;
  patientBarcode?: string | null;
  labBarcode?: string | null;
  typeOfBarcode?: string | null;
  dateOfCollection?: string | null;
  timeOfCollection?: string | null;
  dateTimeOfCollection?: string | null;
  accessionedBy?: number | null;
  accessionedLabId?: number | null;
  accessionedDate?: string | null;
  isPdfGenerated?: boolean | null;
  pdfGeneratedDate?: string | null;
  pdfDetails?: Record<string, unknown> | null;
  results?: Record<string, unknown> | null;
  icdCodes?: string[] | null;
  source?: string | null;
}

export interface SampleListQuery {
  page?: number;
  limit?: number;
  search?: string;
  orderId?: number;
  barcode?: string;
  barcodes?: string[];
  statuses?: string[];
  isAccessioned?: boolean;
}

export interface SampleCreateRequest {
  orderId: number;
  barcode: string;
  physicianId?: number;
  panelId?: number;
  testDetails?: Record<string, unknown>;
  panelDetails?: Record<string, unknown>;
  biomarkerDetails?: Record<string, unknown>;
  loginUserId?: number;
  [key: string]: unknown;
}

export interface AccessionRequest {
  accessionedBy: number;
  status?: string;
  accessionedLabId?: number;
}
