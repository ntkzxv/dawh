import WarehousePageLoading from "@/components/warehouse/WarehousePageLoading";
import { ReportsRouteSkeleton } from "@/components/loading_screen/WarehouseRouteSkeletons";

export default function ReportsLoading() {
  return (
    <WarehousePageLoading
      titleEn="Reports"
      titleTh="รายงานคลังสินค้า"
      routePath="/warehouse/reports"
      iconName="history"
      fullBleed={false}
    >
      <ReportsRouteSkeleton />
    </WarehousePageLoading>
  );
}
