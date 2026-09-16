import type { Metadata } from "next";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";

export const metadata: Metadata = {
  title: "Warehouse ERP",
  description: "Distribution Centers, Hub Locations & Branch Network",
};

export default function BranchesPage() {
  return (
    <WarehousePageTemplate
      titleEn="Branch Hub Allocation"
      titleTh="คลังสินค้าสาขา"
      routePath="/warehouse/branches"
      iconName="branches"
    />
  );
}
