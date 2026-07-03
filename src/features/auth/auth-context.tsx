"use client";

/**
 * App-global auth/session state.
 *
 * Replaces the old FE's Redux `account` slice + `CheckLoginComponent`:
 *   - hydrates the user from an existing JWT on mount (`/auth/check-login`)
 *   - `login()` runs the login mutation, stores the token, sets the user
 *   - `logout()` clears the token + React Query cache, best-effort server logout
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { useQueryClient } from "@tanstack/react-query";

import { clearToken, getToken, setToken } from "@/core/auth/token";

import { authApi } from "./auth.api";
import { useLoginMutation } from "./auth.queries";
import type {
  AuthUser,
  LoginRequest,
  UserAccessModules,
} from "./auth.types";

export type AuthStatus = "loading" | "authenticated" | "unauthenticated";

/** The user as we hold it in state — columns plus the session's access modules. */
type SessionUser = AuthUser & { userAccessModules?: UserAccessModules };

/** Flatten `build_access_modules` into the flat set of granted feature codes. */
function permissionsOf(user: SessionUser | null): Set<string> {
  const codes = new Set<string>();
  if (!user?.userAccessModules) return codes;
  for (const entries of Object.values(user.userAccessModules)) {
    for (const e of entries) {
      if (e.isAccessible && e.feature) codes.add(e.feature);
    }
  }
  return codes;
}

interface AuthContextValue {
  user: SessionUser | null;
  status: AuthStatus;
  /** Flat set of ACL feature codes the user may access (superAdmin = all). */
  permissions: Set<string>;
  isSuperAdmin: boolean;
  /** True when `code` is undefined (public) or present in the user's grants. */
  canAccess: (code?: string | null) => boolean;
  login: (credentials: LoginRequest) => Promise<AuthUser>;
  logout: () => Promise<void>;
  /** Re-pull the session (and its access modules) from the backend. */
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");
  const queryClient = useQueryClient();
  const loginMutation = useLoginMutation();

  const permissions = useMemo(() => permissionsOf(user), [user]);
  const isSuperAdmin = user?.roleObj?.code === "superAdmin";
  // superAdmin bypasses ACL entirely (sees every gated nav item / route),
  // regardless of the grants returned at login.
  const canAccess = useCallback(
    (code?: string | null) => isSuperAdmin || !code || permissions.has(code),
    [isSuperAdmin, permissions],
  );

  // Hydrate from an existing token once, on mount.
  useEffect(() => {
    let active = true;
    if (!getToken()) {
      setStatus("unauthenticated");
      return;
    }
    authApi
      .checkLogin()
      .then((session) => {
        if (!active) return;
        setUser(session);
        setStatus("authenticated");
      })
      .catch(() => {
        if (!active) return;
        clearToken();
        setUser(null);
        setStatus("unauthenticated");
      });
    return () => {
      active = false;
    };
  }, []);

  const login = useCallback(
    async (credentials: LoginRequest) => {
      const result = await loginMutation.mutateAsync(credentials);
      setToken(result.token);
      setUser(result);
      setStatus("authenticated");
      return result;
    },
    [loginMutation],
  );

  const refreshSession = useCallback(async () => {
    if (!getToken()) return;
    try {
      const session = await authApi.checkLogin();
      setUser(session);
      setStatus("authenticated");
    } catch {
      // leave the current session untouched on a transient failure
    }
  }, []);

  const logout = useCallback(async () => {
    const current = user;
    clearToken();
    setUser(null);
    setStatus("unauthenticated");
    queryClient.clear();
    if (current?.id) {
      try {
        await authApi.logout({ userId: current.id });
      } catch {
        // best-effort: the local session is already cleared
      }
    }
  }, [user, queryClient]);

  return (
    <AuthContext.Provider
      value={{
        user,
        status,
        permissions,
        isSuperAdmin,
        canAccess,
        login,
        logout,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within <AuthProvider>");
  }
  return ctx;
}
