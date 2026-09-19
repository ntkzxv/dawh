export type ProductCategoryDto = {
  id: string;
  organizationId: string;
  parentId: string | null;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
};
export type ProductCategoryInput = {
  parentId: string | null;
  code: string;
  name: string;
  description: string | null;
  isActive: boolean;
};
export type ProductCategoryUpdateInput = Partial<ProductCategoryInput> & {
  version: number;
};
