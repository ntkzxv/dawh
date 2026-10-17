import { CatalogLoadingSkeleton } from "./InventoryLoading";
import WarehousePageLoading from "@/components/warehouse/WarehousePageLoading";

export default function InventoryLoading() {
  return (
    <WarehousePageLoading
      titleEn="Product Master & SKU Catalog"
      titleTh="ข้อมูลสินค้าหลัก"
      routePath="/warehouse/inventory"
      iconName="box"
    >
      <CatalogLoadingSkeleton showTitle={false} />
    </WarehousePageLoading>
  );
}
