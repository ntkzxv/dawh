import type { Metadata } from "next";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";

export const metadata: Metadata = {
  title: "Warehouse ERP",
  description: "Low Stock Triggers, Expired Batches & System Warnings",
};

export default function AlertsPage() {
  return (
    <WarehousePageTemplate
      titleEn="Low Stock & Expiry Alerts"
      titleTh="แจ้งเตือนสินค้าใกล้หมด"
      routePath="/warehouse/alerts"
      iconName="alert"
    />
  );
}
