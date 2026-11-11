"use client";

import { useSearchParams } from "next/navigation";
import { ContractsList } from "@/components/sales/ar/ArLists";
import SalesPageFrame from "@/components/sales/SalesPageFrame";

export default function ArContractsPage() {
  const saleId = Number(useSearchParams().get("saleId"));
  return (
    <SalesPageFrame titleEn="Installment contracts" titleTh="สัญญาผ่อนชำระ">
      <ContractsList initialSaleId={Number.isInteger(saleId) && saleId > 0 ? saleId : null} />
    </SalesPageFrame>
  );
}
