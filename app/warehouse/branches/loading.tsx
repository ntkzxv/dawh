import WarehousePageLoading from "@/components/warehouse/WarehousePageLoading";
import { CatalogLoadingSkeleton } from "../inventory/InventoryLoading";

export default function BranchesLoading() {
  return (
    <WarehousePageLoading
      titleEn="Branches"
      titleTh="สาขา"
      routePath="/warehouse/branches"
      iconName="branches"
    >
      <CatalogLoadingSkeleton showTitle={false} />
    </WarehousePageLoading>
  );
}
