import type { Metadata } from "next";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";
import ProductInventorySplitView from "./ProductInventorySplitView";
import CatalogScreen from "@/components/warehouse/CatalogScreen";
import type { CatalogKind } from "@/lib/api/warehouse";

const catalogKinds: CatalogKind[] = [
  "branches",
  "warehouses",
  "suppliers",
  "units",
  "product-groups",
  "product-categories",
  "brands",
  "product-models",
  "products",
];

export const metadata: Metadata = {
  title: "Warehouse ERP",
  description: "SKU Catalog, Specifications & Barcode Registration",
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ kind?: string | string[] }>;
}) {
  const requestedKind = (await searchParams).kind;
  const kind = typeof requestedKind === "string" && catalogKinds.includes(requestedKind as CatalogKind)
    ? requestedKind as CatalogKind
    : "products";

  if (kind !== "products") {
    return <CatalogScreen key={kind} initialKind={kind} />;
  }

  return (
    <WarehousePageTemplate
      titleEn="Product Master & SKU Catalog"
      titleTh="ข้อมูลสินค้าหลัก"
      routePath="/warehouse/inventory"
      fullBleed
    >
      <ProductInventorySplitView />
    </WarehousePageTemplate>
  );
}
