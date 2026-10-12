import ProductInventorySplitView from "@/app/warehouse/inventory/ProductInventorySplitView";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";

export default function ControlPanelProductsPage() {
  return (
    <WarehousePageTemplate
      titleEn="Products"
      titleTh="สินค้า"
      routePath="/controlpanel/products"
      fullBleed
    >
      <ProductInventorySplitView showAddProduct={false} />
    </WarehousePageTemplate>
  );
}
