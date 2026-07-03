/**
 * Access Control types — mirror `services/user_service/access_control.py`.
 * The ACL catalog (modules/features) + roles + the per-role / per-user grants
 * that `build_access_modules` turns into the session's `userAccessModules`.
 */

import type { BaseEntity } from "@/core/api/types";

/** One feature in the ACL catalog (from `GET /access-control/modules`). */
export interface AclModule {
  module: string;
  feature: string | null;
  code: string;
  description?: string | null;
  isPrimary?: boolean | null;
}

export interface Role extends BaseEntity {
  title: string | null;
  code: string | null;
  isSdiRole?: boolean | null;
}

/** A grant to send when (re)writing a role's or user's permissions. */
export interface AclRule {
  module: string;
  code: string;
  feature?: string | null;
  isAccessible?: boolean;
}

/** A stored grant row (`RoleAcl` / `UserAcl`). */
export interface AclGrantRow {
  id?: number;
  roleId?: number | null;
  userId?: number | null;
  moduleAccess: string;
  featureAccess: string;
  apiAccess?: string[] | null;
}

export interface RoleListQuery {
  search?: string;
  page?: number;
  limit?: number;
}

export interface AssignUserRoleRequest {
  roleId: number;
  aclRules?: AclRule[];
  isHybrid?: boolean;
  isActive?: boolean;
}
