import type { Metadata } from "next";
import SalesResourcePage from "@/components/sales/SalesResourcePage";

export const metadata: Metadata = { title: "Hire-purchase agreements" };

export default function SalesHirePurchasePage() {
  return <SalesResourcePage kind="hire-purchase" />;
}
