import type { Metadata } from "next";
import SalesResourcePage from "@/components/sales/SalesResourcePage";

export const metadata: Metadata = { title: "Customers and debtors" };

export default function SalesCustomersPage() {
  return <SalesResourcePage kind="customers" />;
}
