import type { Metadata } from "next";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";

export const metadata: Metadata = {
  title: "Warehouse ERP",
  description: "Vendor Management, Lead Times & Procurement Contracts",
};

export default function SuppliersPage() {
  return (
    <WarehousePageTemplate
      titleEn="Vendor & Supplier Catalog"
      titleTh="ข้อมูลผู้จำหน่าย (Suppliers)"
      routePath="/warehouse/suppliers"
      iconName="suppliers"
    />
  );
}
