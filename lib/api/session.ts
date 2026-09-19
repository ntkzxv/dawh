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

