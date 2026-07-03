"use client";

/** React Query hooks for the ACL admin (roles + per-role/user permissions). */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { ApiError, Paginated } from "@/core/api/types";

import { accessControlApi } from "./access-control.api";
import type {
  AclGrantRow,
  AclModule,
  AclRule,
  AssignUserRoleRequest,
  Role,
  RoleListQuery,
} from "./access-control.types";

export const aclKeys = {
  modules: ["acl", "modules"] as const,
  roles: (q: RoleListQuery) => ["acl", "roles", q] as const,
  rolePerms: (roleId: number | string) => ["acl", "role-perms", roleId] as const,
  userPerms: (userId: number | string) => ["acl", "user-perms", userId] as const,
};

export const useAclModules = () =>
  useQuery<AclModule[], ApiError>({
    queryKey: aclKeys.modules,
    queryFn: () => accessControlApi.modules(),
    staleTime: 5 * 60 * 1000,
  });

export const useRoles = (query: RoleListQuery = {}) =>
  useQuery<Role[] | Paginated<Role>, ApiError>({
    queryKey: aclKeys.roles(query),
    queryFn: () => accessControlApi.roles.list(query),
    placeholderData: (previous) => previous,
  });

export const useRolePermissions = (roleId: number | string | null) =>
  useQuery<AclGrantRow[], ApiError>({
    queryKey: aclKeys.rolePerms(roleId ?? "none"),
    queryFn: () => accessControlApi.roles.permissions(roleId as number),
    enabled: roleId != null,
  });

export const useCreateRole = () => {
  const qc = useQueryClient();
  return useMutation<AclRule[], ApiError, { role: string; aclRules: AclRule[] }>({
    mutationFn: ({ role, aclRules }) => accessControlApi.roles.create(role, aclRules),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["acl", "roles"] }),
  });
};

export const useSetRolePermissions = () => {
  const qc = useQueryClient();
  return useMutation<
    AclRule[],
    ApiError,
    { roleId: number | string; aclRules: AclRule[] }
  >({
    mutationFn: ({ roleId, aclRules }) =>
      accessControlApi.roles.setPermissions(roleId, aclRules),
    onSuccess: (_data, { roleId }) =>
      qc.invalidateQueries({ queryKey: aclKeys.rolePerms(roleId) }),
  });
};

export const useAssignUserRole = () => {
  const qc = useQueryClient();
  return useMutation<
    unknown,
    ApiError,
    { userId: number | string; body: AssignUserRoleRequest }
  >({
    mutationFn: ({ userId, body }) => accessControlApi.users.assignRole(userId, body),
    onSuccess: (_data, { userId }) => {
      qc.invalidateQueries({ queryKey: aclKeys.userPerms(userId) });
      qc.invalidateQueries({ queryKey: ["user"] });
    },
  });
};
