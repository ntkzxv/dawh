import type { Metadata } from "next";
import SalesResourcePage from "@/components/sales/SalesResourcePage";

export const metadata: Metadata = { title: "Payment records" };

export default function SalesPaymentsPage() {
  return <SalesResourcePage kind="payments" />;
}
