"use client";

import { apiGet } from "@/lib/api/client";
import type { EmployeeProfileDto } from "@/lib/profiles/types";

export type AppMe = {
  user: { id: string; email: string; name: string };
  organization: { id: string; code: string };
  accountStatus: "ACTIVE" | "SUSPENDED" | "TERMINATED";
  profile: EmployeeProfileDto | null;
  profileComplete: boolean;
  roles: string[];
  permissions: string[];
  facilityScopes: Array<{ facilityId: string; scopeType: "READ" | "OPERATE" | "APPROVE" | "ADMIN" }>;
};

export async function getAppMe() {
  return apiGet<AppMe>("/api/me");
}

export function hasPermission(me: AppMe | null | undefined, permission: string) {
  return Boolean(me?.permissions.includes(permission));
}

export function checkIsAdmin(
  roles?: string[] | null,
  permissions?: string[] | null,
  profileRole?: string | null
): boolean {
  if (roles && roles.length > 0) {
    if (
      roles.some(
        (r) =>
          r.toUpperCase() === "SYSTEM_ADMINISTRATOR" ||
          r.toUpperCase() === "ADMIN" ||
          r.toUpperCase() === "SUPER_ADMIN" ||
          r.toUpperCase() === "SUPERADMIN" ||
          r.toUpperCase().includes("ADMIN")
      )
    ) {
      return true;
    }
  }

  if (permissions && permissions.length > 0) {
    if (
      permissions.some(
        (p) =>
          p === "*" ||
          p === "admin.*" ||
          p.startsWith("admin.") ||
          p.includes("admin")
      )
    ) {
      return true;
    }
  }

  if (profileRole) {
    const norm = profileRole.toLowerCase().trim();
    if (
      norm === "admin" ||
      norm === "superadmin" ||
      norm === "super_admin" ||
      norm === "system_administrator" ||
      norm === "devops" ||
      norm.includes("admin")
    ) {
      return true;
    }
  }

  return false;
}

export function isAppAdmin(me: AppMe | null | undefined): boolean {
  if (!me) return false;
  return checkIsAdmin(me.roles, me.permissions);
}

