import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ArCustomerProfilePage from "@/components/sales/ar/ArCustomerProfilePage";

export const metadata: Metadata = { title: "Customer profile" };

export default async function Page({ params }: { params: Promise<{ customerId: string }> }) {
  const customerId = Number((await params).customerId);
  if (!Number.isInteger(customerId) || customerId < 1) notFound();
  return <ArCustomerProfilePage customerId={customerId} />;
}
