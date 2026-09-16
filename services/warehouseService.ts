import { supabase } from "@/utils/supabase";

export interface WarehouseSummary {
  totalSkusCount: number;
  inboundUnits: number;
  outboundUnits: number;
  criticalLowStockCount: number;
}

export const warehouseService = {
  /**
   * ดึงข้อมูลสรุปภาพรวมคลังสินค้า
   */
  async getSummary(): Promise<WarehouseSummary> {
    try {
      return {
        totalSkusCount: 4892,
        inboundUnits: 148,
        outboundUnits: 320,
        criticalLowStockCount: 2,
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
    return [
      { sku: "SKU-NV-A100", name: "GPU Node Accelerator A100", quantity: 24, location: "Zone A-01" },
      { sku: "SKU-SFP-28G", name: "Optical Transceiver 25GbE", quantity: 180, location: "Zone B-14" },
      { sku: "SKU-CAT6A-10", name: "High-density Patch Cable 10m", quantity: 650, location: "Zone C-03" },
    ];
  },
};
