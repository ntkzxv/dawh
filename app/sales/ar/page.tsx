import type { Metadata } from "next";
import ArOverviewPage from "@/components/sales/ar/ArOverviewPage";

export const metadata: Metadata = { title: "Receivables overview" };

export default function Page() {
  return <ArOverviewPage />;
}
