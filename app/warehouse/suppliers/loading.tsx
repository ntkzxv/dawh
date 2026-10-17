import WarehousePageLoading from "@/components/warehouse/WarehousePageLoading";
import { CatalogLoadingSkeleton } from "../inventory/InventoryLoading";

export default function SuppliersLoading() {
  return (
    <WarehousePageLoading
      titleEn="Suppliers"
      titleTh="ผู้ขาย"
      routePath="/warehouse/suppliers"
      iconName="suppliers"
    >
      <CatalogLoadingSkeleton showTitle={false} />
    </WarehousePageLoading>
  );
}
