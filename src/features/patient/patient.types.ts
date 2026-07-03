/**
 * Patient types (PHI) — mirror `services/patient/models.py` + `schemas.py`.
 * `ssn` / `password` / `drivingLicenseNumber` are never returned by the API.
 */

import type { BaseEntity } from "@/core/api/types";

export interface Patient extends BaseEntity {
  firstName: string | null;
  middleName?: string | null;
  lastName: string | null;
  dateOfBirth: string | null;
  mobileNumber?: string | null;
  mobileNumberCode?: string | null;
  secondaryMobileNumber?: string | null;
  businessMobileNumber?: string | null;
  emailId?: string | null;
  businessEmailId?: string | null;
  gender?: string | null;
  weight?: number | null;
  heightInFeet?: number | null;
  heightInInches?: number | null;
  heightInCms?: number | null;
  isDrivingLicenseAvailable?: boolean | null;
  dateOfDeath?: string | null;
  timeOfDeath?: string | null;
  ethnicity?: string | null;
  race?: string | null;
  code?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  state?: string | null;
  zipcode?: string | null;
  county?: string | null;
  country?: string | null;
  prefix?: string | null;
  suffix?: string | null;
  aliasName?: string | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  degree?: string | null;
  notes?: string | null;
  patientAccountNumber?: string | null;
  specialPatientType?: string | null;
  isSpecialPatient?: boolean | null;
  isInsuranceAvailable?: boolean | null;
  isPatientDead?: boolean | null;
  internalPatientId?: string | null;
  externalPatientId?: string | null;
  allergieIds?: number[] | null;
  // populated on list
  createdByDetails?: Record<string, unknown> | null;
  linkedLocations?: Record<string, unknown>[] | null;
  linkedFacilities?: Record<string, unknown>[] | null;
}

// ---- requests ----
export interface PatientCreateRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  loginUserId?: number;
  [key: string]: unknown;
}

export type PatientEditRequest = Partial<
  Omit<PatientCreateRequest, "loginUserId">
> & { [key: string]: unknown };

export interface PatientListQuery {
  page?: number;
  limit?: number;
  search?: string;
  genders?: string[];
  cities?: string[];
  createdByIds?: number[];
  specialPatientTypes?: string[];
  statuses?: string[]; // active | inactive | deleted
  isAlertPatientFlag?: boolean;
  facilityIds?: number[];
  locationIds?: number[];
  panelIds?: number[];
  testIds?: number[];
  startDate?: string;
  endDate?: string;
  sort?: Record<string, "ASC" | "DESC">;
}

export interface ValidatePatientRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
}

export interface PatientInsurance extends BaseEntity {
  patientId: number | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  dateOfBirth?: string | null;
  type?: string | null;
  insuranceCompany?: string | null;
  insurancePlan?: string | null;
  policyNumber?: string | null;
  payerId?: string | null;
  relationship?: string | null;
  networkPlanName?: string | null;
  groupName?: string | null;
  groupNetwork?: string | null;
  ipaMedicalGroupName?: string | null;
  groupId?: string | null;
  effectiveDate?: string | null;
}

export interface Allergy extends BaseEntity {
  name: string | null;
}

export interface PatientToggleResult {
  id: number;
  isActive: boolean;
}
