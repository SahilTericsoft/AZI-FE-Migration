/** System Settings types. */

import type { BaseEntity } from "@/core/api/types";

/** A single generic dropdown value ({title, code}). */
export interface DropdownOption {
  title: string;
  code: string;
  [k: string]: unknown;
}

/** Zipcode / address row (geo store). */
export interface GeoRow {
  zipcode: string;
  city: string;
  state: string;
  county: string;
  country: string;
}

export interface Department extends BaseEntity {
  name: string | null;
  code?: string | null;
  reportType?: string[] | null;
  reportFormat?: string[] | null;
}

export interface OrderReportHeader extends BaseEntity {
  triggerType?: string | null;
  name: string | null;
  layout?: string | null;
  testIds?: number[] | null;
  testDetails?: { id: number; name: string; code?: string }[] | null;
  createdBy?: number | null;
  createdByDetails?: Record<string, unknown> | null;
}

export interface OrderReportListQuery {
  page?: number;
  limit?: number;
  search?: string;
  createdByIds?: number[];
  startDate?: string;
  endDate?: string;
}
