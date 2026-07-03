/**
 * Facility types — mirror `services/facility/models.py` + `schemas.py`.
 * Field names are camelCase, matching the backend / DB.
 */

import type { BaseEntity } from "@/core/api/types";

export interface FacilityAddressDetails {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  [key: string]: unknown;
}

export interface FacilityStatusObj {
  title: string | null;
  code: string | null;
}

export interface Facility extends BaseEntity {
  name: string | null;
  /** Original-cased display name (backend lowercases `name`, keeps `code`). */
  code: string | null;
  type: string | null;
  status: string | null;
  statusObj?: FacilityStatusObj;
  addressDetails?: FacilityAddressDetails | null;
  primaryContactDetails?: Record<string, unknown> | null;
  adminId?: number | null;
  physicians?: number[] | null;
  panels?: number[] | null;
  referenceLabId?: number | null;
  isDroidAllowed?: boolean | null;
  allowAdvancedFunctionality?: boolean | null;
  lastCompletedStep?: number | null;
  isInsuranceImageRequired?: boolean | null;
  // populated by `view` (with sub-detail flags) / rich `list`
  createdByDetails?: Record<string, unknown> | null;
  adminDetails?: Record<string, unknown> | null;
  userDetails?: Record<string, unknown>[] | null;
  physicianDetails?: Record<string, unknown>[] | null;
  userIds?: number[];
  numberOfLocations?: number;
}

// ---- requests ----
export interface FacilityCreateRequest {
  name: string;
  type: string;
  addressDetails: FacilityAddressDetails;
  loginUserId: number;
  [key: string]: unknown;
}

export type FacilityEditRequest = Partial<
  Omit<FacilityCreateRequest, "loginUserId">
> & { [key: string]: unknown };

export interface FacilityListQuery {
  page?: number;
  limit?: number;
  search?: string;
  types?: string[];
  createdByIds?: number[];
  cities?: string[];
  states?: string[];
  statuses?: string[];
  facilityIds?: number[];
  facilityId?: number;
  startDate?: string;
  endDate?: string;
  sort?: Record<string, "ASC" | "DESC">;
}

export interface FacilityListLiteQuery {
  search?: string;
  isActive?: boolean;
  facilityIds?: number[];
}

export interface FacilityViewQuery {
  facilityId?: number;
  adminId?: number;
  isSubDetailsRequired?: boolean;
  isPhysicianDetailsRequired?: boolean;
  isNumberOfLocationsRequired?: boolean;
}

export interface FacilityUser extends BaseEntity {
  facilityId: number | null;
  userId: number | null;
  locationIds?: number[] | null;
}

export interface ToggleResult {
  id: number;
  isActive: boolean;
}
