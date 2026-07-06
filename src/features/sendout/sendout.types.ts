/**
 * Sendout types (PHI) — mirror `services/sendout/models.py` (SendoutBatch) +
 * schemas. A batch groups the samples/panels shipped to a reference ("sendout")
 * lab. Migrated from the legacy GkSendoutService.
 */

import type { BaseEntity, ListRequest } from "@/core/api/types";

export interface SendoutBatch extends BaseEntity {
  /** Reference lab the batch is sent to (FK to Labs). */
  sendoutLabId: number | null;
  /** Number of samples in the batch (derived from `sampleIds` when omitted). */
  sampleCount: number | null;
  /** Panels represented in the batch (opaque JSON entries on the backend). */
  panelIds?: unknown[] | null;
  /** Samples included in the batch. */
  sampleIds?: number[] | null;
}

export interface SendoutListQuery extends ListRequest {
  filters?: Record<string, unknown>;
}

export interface SendoutBatchCreateRequest {
  sendoutLabId: number;
  sampleIds?: number[];
  panelIds?: unknown[];
  sampleCount?: number;
  createdBy?: number;
  [key: string]: unknown;
}
