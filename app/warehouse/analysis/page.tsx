import type { Metadata } from "next";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";

export const metadata: Metadata = {
  title: "Warehouse ERP",
  description: "AI Stock Optimization, Demand Forecast & ABC Turnover",
};

export default function AnalysisPage() {
  return (
    <WarehousePageTemplate
      titleEn="AI Supply Chain Intelligence"
      titleTh="วิเคราะห์คลังสินค้าด้วย AI"
      routePath="/warehouse/analysis"
      iconName="ai"
    />
  );
}
