export type BrandDto = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
};
export type BrandInput = { code: string; name: string; isActive: boolean };
export type BrandUpdateInput = Partial<BrandInput> & { version: number };
