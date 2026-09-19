export type FacilityType = "CENTRAL_WAREHOUSE" | "BRANCH";

export type Facility = {
  id: string;
  organizationId: string;
  organizationCode: string;
  code: string;
  name: string;
  facilityType: FacilityType;
  addressLine1: string | null;
  addressLine2: string | null;
  province: string | null;
  district: string | null;
  subdistrict: string | null;
  postalCode: string | null;
  latitude: string | null;
  longitude: string | null;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
};

export type FacilityInput = Omit<Facility,
  "id" | "organizationId" | "organizationCode" | "version" | "createdAt" | "updatedAt">;
export type FacilityUpdateInput = Partial<FacilityInput> & { version: number };
export type FacilityFilters = { search: string | null; facilityType: FacilityType | null; active: boolean | null };
