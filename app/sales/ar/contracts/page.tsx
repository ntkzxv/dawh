import { Suspense } from "react";
import type { Metadata } from "next";
import ArContractsPage from "@/components/sales/ar/ArContractsPage";

export const metadata: Metadata = { title: "Installment contracts" };

export default function Page() {
  return (
    <Suspense>
      <ArContractsPage />
    </Suspense>
  );
}
