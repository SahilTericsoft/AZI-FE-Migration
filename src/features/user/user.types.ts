/**
 * User types — mirror `services/user_service` Users (subset we consume).
 * Used for pickers (e.g. lab admin) and, later, the User Management module.
 */

import type { BaseEntity } from "@/core/api/types";

export interface UserRole {
  id?: number;
  title?: string | null;
  code?: string | null;
}

export interface User extends BaseEntity {
  firstName: string | null;
  middleName?: string | null;
  lastName: string | null;
  emailId?: string | null;
  mobileNumber?: string | null;
  secondaryMobileNumber?: string | null;
  faxNumber?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  zipcode?: string | null;
  city?: string | null;
  state?: string | null;
  npiNumber?: string | null;
  designation?: string | null;
  roleId?: number | null;
  roleObj?: UserRole | null;
  isPhysician?: boolean | null;
  internalUserId?: string | null;
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  roleId?: number;
  roleIds?: number[];
  roleCodes?: string[];
  userIds?: number[];
  isPhysician?: boolean;
  isActive?: boolean;
}

export interface UserCreateRequest {
  firstName: string;
  lastName: string;
  loginUserId: number;
  [key: string]: unknown;
}

export interface UserViewQuery {
  userId?: number;
  emailId?: string;
  npiNumber?: string;
}

/** Display name for a user. */
export function userFullName(user: Pick<User, "firstName" | "middleName" | "lastName" | "emailId">): string {
  const name = [user.firstName, user.middleName, user.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return name || user.emailId || "Unnamed user";
}
