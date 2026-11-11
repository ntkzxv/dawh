import type { Metadata } from "next";
import ArCustomersPage from "@/components/sales/ar/ArCustomersPage";

export const metadata: Metadata = { title: "Customer registry" };

export default function Page() {
  return <ArCustomersPage />;
}
