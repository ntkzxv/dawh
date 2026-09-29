"use client";

import dynamic from "next/dynamic";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";
import {
  SkeletonDataTable,
  SkeletonWarehousePage,
} from "@/components/loading_screen/SkeletonLoading";
import type { CatalogKind } from "@/lib/api/warehouse";

const ProductInventorySplitView = dynamic(
  () => import("./ProductInventorySplitView"),
  {
    loading: () => <SkeletonDataTable rows={8} columns={6} />,
  },
);

const CatalogScreen = dynamic(() => import("@/components/warehouse/CatalogScreen"), {
  loading: () => <SkeletonWarehousePage />,
});

export default function InventoryContent({ kind }: { kind: CatalogKind }) {
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
