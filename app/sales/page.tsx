import type { Metadata } from "next";
import SalesOverview from "@/components/sales/SalesOverview";

export const metadata: Metadata = {
  title: "Sales & Customer Receivables",
  description: "Sales and customer receivables workspace.",
};

export default function SalesPage() {
  return <SalesOverview />;
}
