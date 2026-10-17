import WarehousePageLoading from "@/components/warehouse/WarehousePageLoading";
import { IssuesRouteSkeleton } from "@/components/loading_screen/WarehouseRouteSkeletons";

export default function IssuesLoading() {
  return (
    <WarehousePageLoading
      titleEn="Issues"
      titleTh="ปัญหาและการติดตามเคลม"
      routePath="/warehouse/issues"
      iconName="alert"
      fullBleed={false}
    >
      <IssuesRouteSkeleton />
    </WarehousePageLoading>
  );
}
