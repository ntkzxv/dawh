import { DashboardRouteSkeleton } from "@/components/loading_screen/WarehouseRouteSkeletons";
import WarehousePageLoading from "@/components/warehouse/WarehousePageLoading";

export default function WarehouseLoading() {
  return (
    <WarehousePageLoading
      titleEn="Warehouse Dashboard"
      titleTh="ภาพรวมคลังสินค้า"
      routePath="/warehouse"
      iconName="package"
    >
      <DashboardRouteSkeleton />
    </WarehousePageLoading>
  );
}
