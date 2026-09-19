export type UnitOfMeasureDto = {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  decimalScale: number;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
};
export type UnitOfMeasureInput = {
  code: string;
  name: string;
  decimalScale: number;
  isActive: boolean;
};
export type UnitOfMeasureUpdateInput = Partial<UnitOfMeasureInput> & {
  version: number;
};
