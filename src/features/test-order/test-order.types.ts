/**
 * Test Order types (PHI) — mirror `services/test_order/models.py` + schemas.
 * Orders carry denormalized facility/location/physician/createdBy details.
 */

import type { BaseEntity } from "@/core/api/types";

export interface PartyDetails {
  name?: string;
  firstName?: string;
  lastName?: string;
  npiNumber?: string;
  npi?: string;
  code?: string;
  [key: string]: unknown;
}

export interface Order extends BaseEntity {
  code: string | null;
  facilityId: number | null;
  locationId: number | null;
  facilityDetails?: PartyDetails | null;
  locationDetails?: PartyDetails | null;
  patientId: number | null;
  patientDetails?: Record<string, unknown> | null;
  status: string | null;
  numberOfSamplesOrdered?: number | null;
  numberOfSamplesResulted?: number | null;
  physicianId?: number | null;
  physicianDetails?: PartyDetails | null;
  labDetails?: PartyDetails | null;
  isPriorityOrder?: boolean | null;
  isConsentSigned?: boolean | null;
  source?: string | null;
  orderPlacedTime?: string | null;
  createdByDetails?: PartyDetails | null;
  attachments?: { attachmentName: string; secureUrl: string; mimeType?: string | null; size?: number | null }[] | null;
}

export interface OrderCreateRequest {
  facilityId: number;
  locationId: number;
  patientId: number;
  patientDetails: Record<string, unknown>;
  loginUserId?: number;
  [key: string]: unknown;
}

export type OrderEditRequest = Partial<Omit<OrderCreateRequest, "loginUserId">> & {
  [key: string]: unknown;
};

export interface OrderListQuery {
  page?: number;
  limit?: number;
  search?: string;
  facilityId?: number;
  locationId?: number;
  patientId?: number;
  statuses?: string[];
  startDate?: string;
  endDate?: string;
}

export interface OrderResult extends BaseEntity {
  orderId: number | null;
  sampleId?: number | null;
  results?: Record<string, unknown> | null;
  resultedMode?: string | null;
  pdfGeneratedDate?: string | null;
}

export interface Guarantor extends BaseEntity {
  orderId: string | null;
  familyName?: string | null;
  givenName?: string | null;
  relationshipIdentifier?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface PatientVisit extends BaseEntity {
  orderId: number | null;
  attendingDoctorFamilyName?: string | null;
  attendingDoctorGivenName?: string | null;
  patientType?: string | null;
  visitNumberId?: string | null;
}
