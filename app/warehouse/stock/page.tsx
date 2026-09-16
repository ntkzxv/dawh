import type { Metadata } from "next";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";

export const metadata: Metadata = {
  title: "Warehouse ERP",
  description: "Real-time Quantity on Hand, Reserved & Allocated Stock",
};

export default function StockPage() {
  return (
    <WarehousePageTemplate
      titleEn="Stock Balance & Allocation"
      titleTh="ยอดสินค้าคงคลัง"
      routePath="/warehouse/stock"
      iconName="package"
    />
  );
}
