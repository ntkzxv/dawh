export type Product = {
  id: string;
  organizationId: string;
  sku: string;
  nameTh: string;
  nameEn: string | null;
  trackingMethod: "NONE" | "LOT" | "SERIAL";
  pickingStrategy: "FIFO" | "FEFO";
  isActive: boolean;
  version: number;
  createdAt: string;
};
