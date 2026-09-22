/**
 * Canonical Auth & Session Contracts
 * Conforms to DESIGN.md and docs/api/p0-frontend-handoff.md
 */

import type { EmployeeProfileDto } from "./profile";

export type AuthMode = "signin" | "signup";
export type AuthLanguage = "TH" | "EN";
export type AuthTheme = "dark" | "light";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  emailVerified: boolean;
  image?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface AuthSessionData {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date | string;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface AuthSessionResponse {
  session: AuthSessionData;
  user: AuthUser;
}

export type FacilityScopeType = "READ" | "OPERATE" | "APPROVE" | "ADMIN";

export interface FacilityScopeItem {
  facilityId: string;
  scopeType: FacilityScopeType;
}

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "TERMINATED";

export interface AppMeResponse {
  user: {
    id: string;
    email: string;
    name: string;
  };
  organization: {
    id: string;
    code: string;
  };
  accountStatus: AccountStatus;
  profile: EmployeeProfileDto | null;
  profileComplete: boolean;
  roles: string[];
  permissions: string[];
  facilityScopes: FacilityScopeItem[];
}

export interface SignInInput {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpInput {
  email: string;
  password: string;
  name: string;
}

export interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  textClass: string;
}
