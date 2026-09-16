import type { Metadata } from "next";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";

export const metadata: Metadata = {
  title: "Warehouse ERP",
  description: "Complete Stock Ledger, Audit Logs & Inventory Transactions",
};

export default function MovementsPage() {
  return (
    <WarehousePageTemplate
      titleEn="Movement Log & History"
      titleTh="ประวัติการเคลื่อนย้าย"
      routePath="/warehouse/movements"
      iconName="history"
    />
  );
}
