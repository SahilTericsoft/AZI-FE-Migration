/**
 * JWT storage — SSR-safe.
 *
 * The backend issues an HS256 bearer on `POST /user-service/auth/login`.
 * We keep it in localStorage (like the old FE) behind these helpers so the
 * storage key and the `window` guards live in exactly one place.
 */

const TOKEN_KEY = "azi_admin_token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
}

export function hasToken(): boolean {
  return Boolean(getToken());
}
