import WarehousePageLoading from "@/components/warehouse/WarehousePageLoading";
import { ReceivingPageSkeleton } from "@/components/loading_screen/ReceivingPageSkeleton";

export default function ReceivingLoading() {
  return (
    <WarehousePageLoading
      titleEn="Receiving"
      titleTh="สั่งสินค้าและตรวจรับ"
      routePath="/warehouse/receive"
      iconName="inbound"
      fullBleed={false}
    >
      <ReceivingPageSkeleton />
    </WarehousePageLoading>
  );
}
