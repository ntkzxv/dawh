"use client";

import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import ModuleStatusPanel from "./ModuleStatusPanel";

export default function ControlPanelModuleStatusPage() {
  return (
    <WarehousePageTemplate
      titleEn="Module status"
      titleTh="สถานะโมดูล"
      routePath="/controlpanel/module-status"
      fullBleed
    >
      <ModuleStatusPanel />
    </WarehousePageTemplate>
  );
}
