import WarehousePageLoading from "@/components/warehouse/WarehousePageLoading";
import { TransferRouteSkeleton } from "@/components/loading_screen/WarehouseRouteSkeletons";

export default function TransferLoading() {
  return (
    <WarehousePageLoading
      titleEn="Stock Transfers"
      titleTh="โอนย้ายสต๊อก"
      routePath="/warehouse/transfer"
      iconName="transfer"
    >
      <TransferRouteSkeleton />
    </WarehousePageLoading>
  );
}
