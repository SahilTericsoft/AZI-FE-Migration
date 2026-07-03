/** Result module types — mirror `services/result` (sessions, samples, controls). */

import type { BaseEntity } from "@/core/api/types";

export type ResultSessionStatus = "draft" | "pendingReview" | "completed" | "discarded" | "rejected";

export interface BiomarkerDetail {
  id: number | null;
  name: string | null;
}

export interface ResultSession extends BaseEntity {
  worklistId?: number | null;
  worklistDetails?: Record<string, unknown> | null;
  testId?: number | null;
  biomarkerId?: number | null;
  testCode?: string | null;
  biomarkerCode?: string | null;
  biomarkerDetails?: BiomarkerDetail[] | null;
  accessionIds?: string[] | null;
  sampleType?: string | null;
  status?: ResultSessionStatus | string | null;
  isManual?: boolean | null;
  isDiscarded?: boolean | null;
  fileName?: string | null;
  runMetadata?: Record<string, string> | null;
  cqCutoff?: number | null;
  createdBy?: number | null;
  createdByDetails?: Record<string, unknown> | null;
}

export interface ResultSample extends BaseEntity {
  uploadResultSessionId?: number | null;
  accessionId?: string | null;
  sampleId?: number | null;
  orderId?: number | null;
  isGenerated?: boolean | null;
  testCode?: string | null;
  biomarkerCode?: string | null;
  targetName?: string | null;
  biomarkerName?: string | null;
  fluorophore?: string | null;
  wellPosition?: string | null;
  cqValue?: number | null;
  result?: string | null;
  value?: string | null;
  isMarkForReview?: boolean | null;
  reasonForRejection?: string | null;
  isManual?: boolean | null;
  isRejected?: boolean | null;
  isValid?: boolean | null;
  isRerun?: boolean | null;
  comments?: string | null;
  reviewerNote?: string | null;
}

export interface ResultControl extends BaseEntity {
  uploadResultSessionId?: number | null;
  testPanelCode?: string | null;
  wellPosition?: string | null;
  control?: string | null;
  targetName?: string | null;
  biomarkerName?: string | null;
  fluorophore?: string | null;
  ctValue?: number | null;
  result?: string | null;
  comments?: string | null;
  reasonForChange?: string | null;
}

export interface WorklistOption {
  id: number;
  worklistId: number;
  workListId: number;
  batchName: string;
  accessionCount: number;
}

export interface ManualTemplate {
  accessionIds: string[];
  biomarkerDetails: BiomarkerDetail[];
  existingResultData: Record<string, Record<string, string>>;
}
