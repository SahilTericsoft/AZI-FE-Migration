/**
 * Access Control API — `services/user_service/access_control.py`
 * (mounted at `/user-service/access-control`).
 */

import { http } from "@/core/api/client";
import { USER_SERVICE } from "@/core/api/endpoints";
import type { Paginated } from "@/core/api/types";

import type {
  AclGrantRow,
  AclModule,
  AclRule,
  AssignUserRoleRequest,
  Role,
  RoleListQuery,
} from "./access-control.types";

const base = USER_SERVICE.accessControl;

export const accessControlApi = {
  /** The full ACL catalog (every gateable feature). */
  modules: () => http.get<AclModule[]>(`${base}/modules`).then((r) => r.data),

  /** Seed the default catalog (idempotent-ish; used once on a fresh DB). */
  seedModules: () =>
    http.post<unknown>(`${base}/modules`, { seed: true }).then((r) => r.data),

  roles: {
    list: (query: RoleListQuery = {}) =>
      http
        .get<Role[] | Paginated<Role>>(`${base}/roles`, { params: query })
        .then((r) => r.data),
    view: (roleId: number | string) =>
      http.get<Role>(`${base}/roles`, { params: { roleId } }).then((r) => r.data),
    create: (role: string, aclRules: AclRule[]) =>
      http
        .post<AclRule[]>(`${base}/roles`, { role, aclRules })
        .then((r) => r.data),
    permissions: (roleId: number | string) =>
      http
        .get<AclGrantRow[]>(`${base}/roles/${roleId}/permissions`)
        .then((r) => r.data),
    setPermissions: (roleId: number | string, aclRules: AclRule[]) =>
      http
        .put<AclRule[]>(`${base}/roles/${roleId}/permissions`, { aclRules })
        .then((r) => r.data),
  },

  users: {
    permissions: (userId: number | string) =>
      http
        .get<AclGrantRow[]>(`${base}/users/${userId}/permissions`)
        .then((r) => r.data),
    assignRole: (userId: number | string, body: AssignUserRoleRequest) =>
      http
        .put<unknown>(`${base}/users/${userId}/role`, body)
        .then((r) => r.data),
  },
};
