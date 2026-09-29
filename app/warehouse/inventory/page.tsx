import type { Metadata } from "next";
import InventoryContent from "./InventoryContent";
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

  return <InventoryContent kind={kind} />;
}
