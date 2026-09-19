export type StockBalance = {
  id: string;
  facilityId: string;
  facilityCode: string;
  locationId: string | null;
  productId: string;
  sku: string;
  productNameTh: string;
  lotId: string | null;
  serialId: string | null;
  shipmentId: string | null;
  stockStatus: string;
  quantity: string;
  version: string;
  updatedAt: string;
};
