"use client";

/**
 * React Query hooks for auth mutations.
 *
 * Session state itself lives in `AuthProvider` (app-global singleton); these
 * cover the stateless auth actions. `useLoginMutation` is used by the provider;
 * the forgot-password hooks back the (future) reset screens.
 */

import { useMutation } from "@tanstack/react-query";

import type { ApiError } from "@/core/api/types";

import { authApi } from "./auth.api";
import type {
  ForgotPasswordRequest,
  LoginRequest,
  LoginResult,
} from "./auth.types";

export const authKeys = {
  session: ["auth", "session"] as const,
};

export const useLoginMutation = () =>
  useMutation<LoginResult, ApiError, LoginRequest>({
    mutationFn: authApi.login,
  });

export const useForgotPasswordMutation = () =>
  useMutation<unknown, ApiError, ForgotPasswordRequest>({
    mutationFn: authApi.forgotPassword,
  });

export const useSendResetMailMutation = () =>
  useMutation<unknown, ApiError, string>({
    mutationFn: authApi.sendForgotPasswordMail,
  });
