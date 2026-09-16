import type { Metadata } from "next";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";

export const metadata: Metadata = {
  title: "Warehouse ERP",
  description: "Receive Inbound Goods, PO Verification & Inspection",
};

export default function ReceivePage() {
  return (
    <WarehousePageTemplate
      titleEn="Goods Receiving Inspection"
      titleTh="รับสินค้าเข้าคลัง (GR)"
      routePath="/warehouse/receive"
      iconName="inbound"
    />
  );
}
