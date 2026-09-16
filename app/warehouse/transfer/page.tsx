import type { Metadata } from "next";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";

export const metadata: Metadata = {
  title: "Warehouse ERP",
  description: "Inter-warehouse & Zone Stock Transfer Management",
};

export default function TransferPage() {
  return (
    <WarehousePageTemplate
      titleEn="Inter-branch Transfer"
      titleTh="โอนย้ายสินค้าระหว่างสาขา"
      routePath="/warehouse/transfer"
      iconName="transfer"
    />
  );
}
