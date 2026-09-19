export type DepartmentDto = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
};
export type DepartmentInput = { code: string; name: string; isActive: boolean };
export type DepartmentUpdateInput = Partial<DepartmentInput> & {
  version: number;
};
