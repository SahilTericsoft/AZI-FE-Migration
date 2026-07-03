/**
 * Auth API — one function per backend route (`user-service/auth/*`).
 * Mirrors `services/user_service/auth.py`. Each unwraps `{ message, data }`.
 */

import { http } from "@/core/api/client";
import { USER_SERVICE } from "@/core/api/endpoints";

import type {
  CheckLoginResult,
  ForgotPasswordRequest,
  LoginRequest,
  LoginResult,
  LogoutRequest,
  VerifyPasswordRequest,
} from "./auth.types";

const base = USER_SERVICE.auth;

export const authApi = {
  /** POST /auth/login — authenticate, returns user + token + access modules. */
  login: (body: LoginRequest) =>
    http.post<LoginResult>(`${base}/login`, body).then((r) => r.data),

  /** GET /auth/check-login — validate the current bearer, returns the session. */
  checkLogin: () =>
    http.get<CheckLoginResult>(`${base}/check-login`).then((r) => r.data),

  /** POST /auth/logout — drop the user's active tokens. */
  logout: (body: LogoutRequest) =>
    http.post<unknown>(`${base}/logout`, body).then((r) => r.data),

  /** POST /auth/verify-password — re-check a password (e.g. unlock screen). */
  verifyPassword: (body: VerifyPasswordRequest) =>
    http.post<unknown>(`${base}/verify-password`, body).then((r) => r.data),

  /** PUT /auth/forgot-password — set a new password (optionally email it). */
  forgotPassword: (body: ForgotPasswordRequest) =>
    http.put<unknown>(`${base}/forgot-password`, body).then((r) => r.data),

  /** POST /auth/forgot-password/send-mail — send a reset link. */
  sendForgotPasswordMail: (emailId: string) =>
    http
      .post<unknown>(`${base}/forgot-password/send-mail`, { emailId })
      .then((r) => r.data),
};
