/**
 * Lab types — mirror `services/lab/models.py` + `schemas.py`.
 */

import type { BaseEntity } from "@/core/api/types";

export type LabRole = "sendLab" | "receiveLab" | "sendReceiveLab";

export interface LabStatusObj {
  title: string | null;
  code: string | null;
}

export interface LabAttachment {
  attachmentName: string;
  secureUrl: string;
  mimeType?: string | null;
  size?: number | null;
}

export interface Lab extends BaseEntity {
  name: string | null;
  code: string | null;
  labExternalId?: string | null;
  npiNumber?: string | null;
  cliaId?: string | null;
  capId?: string | null;
  colaId?: string | null;
  labType?: string | null;
  isSdiLab?: boolean | null;
  emailId?: string | null;
  status: string | null;
  statusObj?: LabStatusObj;
  mobileNumber?: string | null;
  secondaryMobileNumber?: string | null;
  faxNumber?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  zipcode?: string | null;
  state?: string | null;
  city?: string | null;
  adminId?: number | null;
  logo?: Record<string, unknown> | null;
  themeColor?: string | null;
  directorDetails?: Record<string, unknown> | null;
  primaryContact?: Record<string, unknown> | null;
  lastCompletedStep?: number | null;
  labRole?: LabRole | string | null;
  referenceFacilityId?: number | null;
  referenceLocationId?: number | null;
  attachments?: LabAttachment[] | null;
  // populated
  createdByDetails?: Record<string, unknown> | null;
  adminDetails?: Record<string, unknown> | null;
}

// ---- requests ----
export interface LabCreateRequest {
  name: string;
  cliaId: string;
  emailId: string;
  mobileNumber: string;
  addressLine1: string;
  zipcode: string;
  state: string;
  city: string;
  labRole: LabRole;
  labType?: string;
  loginUserId?: number;
  [key: string]: unknown;
}

export type LabEditRequest = Partial<Omit<LabCreateRequest, "loginUserId">> & {
  [key: string]: unknown;
};

export interface LabListQuery {
  page?: number;
  limit?: number;
  search?: string;
  labTypes?: string[];
  cities?: string[];
  statuses?: string[];
  createdByIds?: number[];
  startDate?: string;
  endDate?: string;
  sort?: Record<string, "ASC" | "DESC">;
}

export interface LabListLiteQuery {
  search?: string;
  isActive?: boolean;
  labType?: string;
  labIds?: number[];
}

export interface LabViewQuery {
  labId?: number;
  code?: string;
  labType?: string;
  adminId?: number;
  isActive?: boolean;
}

export interface LabUser extends BaseEntity {
  labId: number | null;
  userId: number | null;
  locationIds?: number[] | null;
}

export interface LabToggleResult {
  id: number;
  isActive: boolean;
}
