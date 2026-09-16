import type { Metadata } from "next";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";

export const metadata: Metadata = {
  title: "Warehouse ERP",
  description: "SKU Catalog, Specifications & Barcode Registration",
};

export default function InventoryPage() {
  return (
    <WarehousePageTemplate
      titleEn="Product Master & SKU Catalog"
      titleTh="ข้อมูลสินค้าหลัก (SKU Master)"
      routePath="/warehouse/inventory"
      iconName="layers"
    />
  );
}
