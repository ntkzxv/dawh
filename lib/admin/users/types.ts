import type { FacilityScopeType } from "@/lib/access/types";

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "TERMINATED";

export type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  emailVerified: boolean;
  accountStatus: AccountStatus;
  profileComplete: boolean;
  username: string | null;
  facility: { id: string; code: string; name: string } | null;
  department: { id: string; code: string; name: string } | null;
  roles: Array<{
    assignmentId: string;
    roleId: string;
    code: string;
    name: string;
    validFrom: string | null;
    validUntil: string | null;
  }>;
  facilityScopes: Array<{
    id: string;
    facilityId: string;
    facilityCode: string;
    scopeType: FacilityScopeType;
    validFrom: string | null;
    validUntil: string | null;
    version: number;
  }>;
  createdAt: string;
};

export type UserFilters = {
  search: string | null;
  status: AccountStatus | null;
  roleCode: string | null;
  facilityId: string | null;
  profileComplete: boolean | null;
};

export type UserPageRequest = {
  limit: number;
  cursor: { timestamp: string; id: string } | null;
};

export type ChangeAccountStatusInput = {
  status: AccountStatus;
  reason: string;
};
