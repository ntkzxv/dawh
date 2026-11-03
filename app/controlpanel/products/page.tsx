import ProductInventorySplitView from "@/app/warehouse/inventory/ProductInventorySplitView";

export default function ControlPanelProductsPage() {
  return (
    <ProductInventorySplitView
      showAddProduct={false}
      titleEn="Products"
      titleTh="สินค้า"
      routePath="/controlpanel/products"
    />
  );
}
