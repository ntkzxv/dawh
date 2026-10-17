import WarehousePageLoading from "@/components/warehouse/WarehousePageLoading";
import { StockRouteSkeleton } from "@/components/loading_screen/WarehouseRouteSkeletons";

export default function MovementsLoading() {
  return (
    <WarehousePageLoading
      titleEn="Movement Log"
      titleTh="ประวัติการเคลื่อนไหวสต๊อก"
      routePath="/warehouse/movements"
      iconName="history"
    >
      <StockRouteSkeleton ledger />
    </WarehousePageLoading>
  );
}
