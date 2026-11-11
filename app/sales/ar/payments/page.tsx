import type { Metadata } from "next";
import ArPaymentsPage from "@/components/sales/ar/ArPaymentsPage";

export const metadata: Metadata = { title: "Payment history" };

export default function Page() {
  return <ArPaymentsPage />;
}
