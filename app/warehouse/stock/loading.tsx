import WarehousePageLoading from "@/components/warehouse/WarehousePageLoading";
import { StockRouteSkeleton } from "@/components/loading_screen/WarehouseRouteSkeletons";

export default function StockLoading() {
  return (
    <WarehousePageLoading
      titleEn="Stock Balances"
      titleTh="ยอดคงเหลือสต๊อก"
      routePath="/warehouse/stock"
      iconName="layers"
    >
      <StockRouteSkeleton />
    </WarehousePageLoading>
  );
}
