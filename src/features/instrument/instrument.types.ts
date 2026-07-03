/** Instrument module types — mirror `services/lab_os` Instrument. */

import type { BaseEntity } from "@/core/api/types";

export interface MaintenanceLog {
  date?: string | null;
  performedBy?: string | null;
  activity?: string | null;
  notes?: string | null;
}

export interface InstrumentAttachment {
  attachmentName: string;
  secureUrl: string;
  mimeType?: string | null;
  size?: number | null;
}

export interface Instrument extends BaseEntity {
  instrument: string | null;
  model?: string | null;
  asset_number?: string | null;
  serial_number?: string | null;
  location?: string | null;
  purchase_date?: string | null;
  manufacturer?: string | null;
  category?: string | null;
  isLinked?: boolean | null;
  plateType?: string | null;
  last_calibration_date?: string | null;
  next_calibration_date?: string | null;
  calibration_frequency?: string | null;
  calibration_type?: string | null;
  vendor_name?: string | null;
  vendor_phone_number?: string | null;
  vendor_email_address?: string | null;
  status?: string | null;
  labId?: number | null;
  attachments?: InstrumentAttachment[] | null;
  maintenanceLogs?: MaintenanceLog[] | null;
  created_by?: number | null;
  createdByDetails?: Record<string, unknown> | null;
}

export interface InstrumentSearchQuery {
  page?: number;
  limit?: number;
  search?: string;
  labId?: number;
  categories?: string[];
  statuses?: string[];
  createdByIds?: number[];
  startDate?: string;
  endDate?: string;
}

export const INSTRUMENT_CATEGORIES = ["Analyser", "Other"] as const;
export const PLATE_TYPES = ["Biorad", "Quanstudio"] as const;
export const CALIBRATION_TYPES = ["Internal", "External"] as const;
