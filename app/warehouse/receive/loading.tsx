import WarehousePageLoading from "@/components/warehouse/WarehousePageLoading";
import { ReceivingRouteSkeleton } from "@/components/loading_screen/WarehouseRouteSkeletons";

export default function ReceivingLoading() {
  return (
    <WarehousePageLoading
      titleEn="Receiving"
      titleTh="สั่งสินค้าและตรวจรับ"
      routePath="/warehouse/receive"
      iconName="inbound"
      fullBleed={false}
    >
      <ReceivingRouteSkeleton />
    </WarehousePageLoading>
  );
}
