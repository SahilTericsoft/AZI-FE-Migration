/**
 * Location types — mirror `services/location/models.py` + `schemas.py`.
 */

import type { BaseEntity } from "@/core/api/types";

export interface LocationAddressDetails {
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  zipcode?: string;
  [key: string]: unknown;
}

export interface LocationStatusObj {
  title: string | null;
  code: string | null;
}

export interface Location extends BaseEntity {
  facilityId: number | null;
  name: string | null;
  type: string | null;
  code: string | null;
  adminId?: number | null;
  labId?: number | null;
  status: string | null;
  statusObj?: LocationStatusObj;
  addressDetails?: LocationAddressDetails | null;
  primaryContactDetails?: Record<string, unknown> | null;
  criticalDetails?: Record<string, unknown> | null;
  billingDetails?: Record<string, unknown> | null;
  accountPreferences?: Record<string, unknown> | null;
  bloodDrawInformation?: Record<string, unknown> | null;
  emergencyContactDetails?: Record<string, unknown>[] | null;
  panels?: number[] | null;
  internalLocationId?: string | null;
  purpose?: string | null;
  lastCompletedStep?: number | null;
  // populated by view / rich list
  createdByDetails?: Record<string, unknown> | null;
  facilityDetails?: Record<string, unknown> | null;
  labDetails?: Record<string, unknown> | null;
  adminDetails?: Record<string, unknown> | null;
  userDetails?: Record<string, unknown>[] | null;
  physicianDetails?: Record<string, unknown>[] | null;
  userIds?: number[];
}

// ---- requests ----
export interface LocationCreateRequest {
  name: string;
  type: string;
  addressDetails: LocationAddressDetails;
  facilityId: number;
  labId: number;
  loginUserId: number;
  isExternalLabFlow?: boolean;
  [key: string]: unknown;
}

export type LocationEditRequest = Partial<
  Omit<LocationCreateRequest, "loginUserId">
> & { [key: string]: unknown };

export interface LocationListQuery {
  page?: number;
  limit?: number;
  search?: string;
  types?: string[];
  createdByIds?: number[];
  cities?: string[];
  states?: string[];
  statuses?: string[];
  facilityId?: number;
  facilityIds?: number[];
  labId?: number;
  startDate?: string;
  endDate?: string;
  sort?: Record<string, "ASC" | "DESC">;
}

export interface LocationListLiteQuery {
  search?: string;
  isActive?: boolean;
  facilityId?: number;
  locationIds?: number[];
}

export interface LocationViewQuery {
  locationId?: number;
  adminId?: number;
  isSubDetailsRequired?: boolean;
}

export interface LocationUser extends BaseEntity {
  locationId: number | null;
  userId: number | null;
}

export interface LocationPhysician extends BaseEntity {
  locationId: number | null;
  physicianId: number | null;
  // `isActive` is inherited from BaseEntity
}

export interface LocationToggleResult {
  id: number;
  isActive: boolean;
}

export interface PhysicianLinkResult {
  id: number;
  physicianIds: number[];
}
