import type { Metadata } from "next";
import SalesResourcePage from "@/components/sales/SalesResourcePage";

export const metadata: Metadata = { title: "Customer receivables" };

export default function SalesReceivablesPage() {
  return <SalesResourcePage kind="receivables" />;
}
