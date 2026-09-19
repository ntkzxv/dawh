import type { EmployeeProfileResponse } from "@/lib/profiles/types";

export type FacilityScopeType = "READ" | "OPERATE" | "APPROVE" | "ADMIN";

export type FacilityScope = {
  facilityId: string;
  scopeType: FacilityScopeType;
};

export type AccessContext = {
  user: {
    id: string;
    email: string;
    name: string;
  };
  sessionId: string;
  accountStatus: "ACTIVE" | "SUSPENDED" | "TERMINATED";
  isSystemAdministrator: boolean;
  organization: {
    id: string;
    code: string;
  };
  profile: EmployeeProfileResponse | null;
  roles: string[];
  permissions: string[];
  facilityScopes: FacilityScope[];
};
