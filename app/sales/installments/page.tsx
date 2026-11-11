import { Suspense } from "react";
import type { Metadata } from "next";
import InstallmentsPage from "@/components/sales/InstallmentsPage";

export const metadata: Metadata = { title: "Installment payments" };

export default function Page() {
  return (
    <Suspense>
      <InstallmentsPage />
    </Suspense>
  );
}
