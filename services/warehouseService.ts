import { apiGet } from "@/lib/api/client";

export interface WarehouseSummary {
  totalSkusCount: number;
  inboundUnits: number;
  outboundUnits: number;
  criticalLowStockCount: number;
}

type StockBalance = {
  sku: string;
  productNameTh: string;
  productNameEn: string | null;
  locationId: string | null;
  locationCode: string | null;
  availableQuantity: string;
};

function asNumber(value: string | null | undefined) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

export const warehouseService = {
  /**
   * ดึงข้อมูลสรุปภาพรวมคลังสินค้า
   */
  async getSummary(): Promise<WarehouseSummary> {
    try {
      const response = await apiGet<StockBalance[]>("/api/stock/balances?limit=1000");
      const rows = response.data;
      return {
        totalSkusCount: new Set(rows.map((row) => row.sku)).size,
        inboundUnits: 0,
        outboundUnits: 0,
        criticalLowStockCount: rows.filter((row) => asNumber(row.availableQuantity) <= 0).length,
      };
    } catch {
      return {
        totalSkusCount: 0,
        inboundUnits: 0,
        outboundUnits: 0,
        criticalLowStockCount: 0,
      };
    }
  },

  /**
   * ดึงรายการ SKU สินค้าในคลัง
   */
  async getInventoryList(limit = 20) {
    try {
      const response = await apiGet<StockBalance[]>(`/api/stock/balances?limit=${encodeURIComponent(String(limit))}`);
      return response.data.map((row) => ({
        sku: row.sku,
        name: row.productNameEn ?? row.productNameTh,
        quantity: row.availableQuantity,
        location: row.locationCode ?? row.locationId ?? "—",
      }));
    } catch {
      return [];
    }
  },
};
