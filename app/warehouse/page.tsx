import type { Metadata } from "next";
import WarehousePageTemplate from "./_components/WarehousePageTemplate";

export const metadata: Metadata = {
  title: "Warehouse ERP",
  description: "Warehouse Operations & Supply Chain Platform",
};

export default function WarehouseOverviewPage() {
  return (
    <WarehousePageTemplate
      titleEn="Warehouse Operations & Supply Chain"
      titleTh="ระบบบริหารจัดการคลังสินค้า"
      routePath="/warehouse"
      metrics={[
        {
          title: "Total SKUs Active",
          value: "4,892",
          sub: "In 14 warehouse zones",
          iconName: "package",
          color: "#2EC4B6",
        },
        {
          title: "Receiving Inbound",
          value: "148 units",
          sub: "8 shipments pending QC",
          iconName: "inbound",
          color: "#3B82F6",
        },
        {
          title: "Dispatch Outbound",
          value: "320 units",
          sub: "Scheduled for transit today",
          iconName: "outbound",
          color: "#10B981",
        },
        {
          title: "Critical Low Stock",
          value: "2 items",
          sub: "Reorder triggered",
          iconName: "alert",
          color: "#FF9F1C",
        },
      ]}
    />
  );
}
