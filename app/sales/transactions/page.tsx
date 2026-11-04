import type { Metadata } from "next";
import SalesResourcePage from "@/components/sales/SalesResourcePage";

export const metadata: Metadata = { title: "Sales records" };

export default function SalesTransactionsPage() {
  return <SalesResourcePage kind="transactions" />;
}
