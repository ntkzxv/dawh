import type { Metadata } from "next";
import ArOverduePage from "@/components/sales/ar/ArOverduePage";

export const metadata: Metadata = { title: "Overdue installments" };

export default function Page() {
  return <ArOverduePage />;
}
