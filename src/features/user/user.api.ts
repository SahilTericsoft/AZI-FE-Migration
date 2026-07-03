/**
 * User API — `services/user_service/users.py` routes (under /user-service/users).
 * Note: not standard REST — view is POST /users/view, update is PUT /users
 * (single via `userId` or bulk via `userIds`).
 */

import { http } from "@/core/api/client";
import { USER_SERVICE } from "@/core/api/endpoints";
import type { Paginated } from "@/core/api/types";

import type {
  User,
  UserCreateRequest,
  UserListQuery,
  UserViewQuery,
} from "./user.types";

const base = USER_SERVICE.users;

export const userApi = {
  list: (body: UserListQuery = {}) =>
    http.post<Paginated<User>>(`${base}/list`, body).then((r) => r.data),
  view: (body: UserViewQuery) =>
    http.post<User | null>(`${base}/view`, body).then((r) => r.data),
  create: (body: UserCreateRequest) =>
    http.post<User>(base, body).then((r) => r.data),
  update: (body: { userId?: number; userIds?: number[] } & Record<string, unknown>) =>
    http.put<User>(base, body).then((r) => r.data),
  remove: (id: number | string) =>
    http.del<unknown>(`${base}/${id}`).then((r) => r.data),
  validate: (body: { emailId: string; npiNumber?: string }) =>
    http.post<unknown>(`${base}/validate`, body).then((r) => r.data),
};
