/**
 * Lab Operations reference types — mirror `services/lab_os/models.py`.
 * These feed the Test/Panel configuration dropdowns (Department / Analyser /
 * Reagent); the Test stores the selected ids in departmentIds/instrumentIds/
 * reagentIds.
 */

import type { BaseEntity } from "@/core/api/types";

export interface Department extends BaseEntity {
  name: string | null;
  code: string | null;
  reportType?: string[] | null;
  reportFormat?: string[] | null;
}

export interface Instrument extends BaseEntity {
  instrument: string | null;
  asset_number?: string | null;
  manufacturer?: string | null;
  category?: string | null;
  model?: string | null;
  serial_number?: string | null;
  labId?: number | null;
  status?: string | null;
}

export interface Reagent extends BaseEntity {
  name: string | null;
  code?: string | null;
  inventory_category?: string | null;
  type?: string | null;
  manufacturer?: string | null;
  labId?: number | null;
}

/** Snapshot of a sample assigned to a worklist (stored in sample_config). */
export interface WorklistSample {
  id: number;
  sampleCode?: string | null;
  panel?: string | null;
  patient?: string | null;
  status?: string | null;
}

export interface WorklistSublist {
  name: string;
  sampleIds: number[];
}

export interface WorklistSampleConfig {
  name?: string;
  sampleIds?: number[];
  samples?: WorklistSample[];
  sublists?: WorklistSublist[];
}

/** A worklist (legacy "worklist" == LabSession). Columns are snake_case. */
export interface LabSession extends BaseEntity {
  rack_number?: string | null;
  protocol_type?: string | null;
  lab_id?: number | null;
  status?: string | null;
  sample_count?: number | null;
  is_processed?: boolean | null;
  comments?: string | null;
  sample_config?: WorklistSampleConfig | null;
  created_by?: number | null;
}
