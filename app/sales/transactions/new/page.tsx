import type { Metadata } from "next";
import NewSalePage from "@/components/sales/NewSalePage";

export const metadata: Metadata = { title: "Record a sale" };

export default function Page() {
  return <NewSalePage />;
}
