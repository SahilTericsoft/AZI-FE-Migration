/**
 * Auth types — mirror `services/user_service/auth.py` + the `User` model.
 *
 * The backend returns the user's columns (camelCase) plus session extras
 * (token, expiryTime, userAccessModules, systemConfig) on login.
 */

export interface AuthRole {
  id?: number;
  title?: string | null;
  code?: string | null;
  isSignatureRequired?: boolean | null;
  isSdiRole?: boolean | null;
}

export interface SystemConfig {
  instanceName?: string;
  [key: string]: unknown;
}

/** The logged-in user (subset of the `Users` table we actually consume). */
export interface AuthUser {
  id: number;
  emailId: string | null;
  firstName: string | null;
  middleName?: string | null;
  lastName: string | null;
  prefix?: string | null;
  suffix?: string | null;
  mobileNumber?: string | null;
  roleId?: number | null;
  roleObj?: AuthRole | null;
  designation?: string | null;
  isActive?: boolean | null;
  isPhysician?: boolean | null;
  isSdiUser?: boolean | null;
  internalUserId?: string | null;
  /** Lab/instance configuration carried in the login token (e.g. instanceName). */
  systemConfig?: SystemConfig | null;
}

/** One accessible (module, feature) grant. */
export interface AccessModuleEntry {
  module: string;
  feature: string | null;
  isAccessible: boolean;
}

/** module -> grants (from `build_access_modules`). */
export type UserAccessModules = Record<string, AccessModuleEntry[]>;

// ---- requests ----
export interface LoginRequest {
  emailId: string;
  password: string;
}

export interface VerifyPasswordRequest {
  userId: number;
  password: string;
}

export interface ForgotPasswordRequest {
  emailId: string;
  newPassword: string;
  sendEmail?: boolean;
}

export interface LogoutRequest {
  userId: number;
}

// ---- responses (the `data` of the {message,data} envelope) ----
export interface LoginResult extends AuthUser {
  token: string;
  expiryTime: string;
  userAccessModules: UserAccessModules;
}

export interface CheckLoginResult extends AuthUser {
  userAccessModules: UserAccessModules;
}
