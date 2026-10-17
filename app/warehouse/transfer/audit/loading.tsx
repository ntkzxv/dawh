import WarehousePageLoading from "@/components/warehouse/WarehousePageLoading";
import { TransferAuditRouteSkeleton } from "@/components/loading_screen/WarehouseRouteSkeletons";

export default function TransferAuditLoading() {
  return (
    <WarehousePageLoading
      titleEn="Status & Audit Board"
      titleTh="สถานะและบันทึกตรวจสอบ"
      routePath="/warehouse/transfer/audit"
      iconName="history"
    >
      <TransferAuditRouteSkeleton />
    </WarehousePageLoading>
  );
}
