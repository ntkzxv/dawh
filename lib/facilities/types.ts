export type Facility = {
  id: string;
  organizationId: string;
  organizationCode: string;
  code: string;
  name: string;
  facilityType: "CENTRAL_WAREHOUSE" | "BRANCH";
  province: string | null;
  isActive: boolean;
  version: number;
  createdAt: string;
};
