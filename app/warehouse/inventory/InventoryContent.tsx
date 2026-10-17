"use client";

import dynamic from "next/dynamic";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";
import { CatalogLoadingSkeleton, ProductInventorySkeleton } from "./InventoryLoading";
import type { CatalogKind } from "@/lib/api/warehouse";

const ProductInventorySplitView = dynamic(
  () => import("./ProductInventorySplitView"),
  {
    loading: () => (
      <WarehousePageTemplate
        titleEn="Product Master & SKU Catalog"
        titleTh="ข้อมูลสินค้าหลัก"
        routePath="/warehouse/inventory"
        fullBleed
      >
        <ProductInventorySkeleton />
      </WarehousePageTemplate>
    ),
  },
);

const CatalogScreen = dynamic(() => import("@/components/warehouse/CatalogScreen"), {
  loading: () => <CatalogLoadingSkeleton />,
});

export default function InventoryContent({ kind }: { kind: CatalogKind }) {
  if (kind !== "products") {
    return <CatalogScreen key={kind} initialKind={kind} />;
  }

  return <ProductInventorySplitView />;
}
