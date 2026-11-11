import type { Metadata } from "next";
import SalesTransactionsPage from "@/components/sales/SalesTransactionsPage";

export const metadata: Metadata = { title: "Sales records" };

export default function Page() {
  return <SalesTransactionsPage />;
}
