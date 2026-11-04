import type { Metadata } from "next";
import SalesResourcePage from "@/components/sales/SalesResourcePage";

export const metadata: Metadata = { title: "Record a sale" };

export default function NewSalePage() {
  return <SalesResourcePage kind="new-sale" />;
}
