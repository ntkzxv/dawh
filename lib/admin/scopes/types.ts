import type { FacilityScopeType } from "@/lib/access/types";

export type FacilityScopeInput = {
  facilityId: string;
  scopeType: FacilityScopeType;
  validFrom: string | null;
  validUntil: string | null;
};

export type UpdateFacilityScopeInput = Omit<
  FacilityScopeInput,
  "facilityId"
> & { version: number };

export type FacilityScopeDto = FacilityScopeInput & {
  id: string;
  userId: string;
  facilityCode: string;
  version: number;
  createdAt: string;
  updatedAt: string;
};
