"use client";

import { PaymentsList } from "@/components/sales/ar/ArLists";
import SalesPageFrame from "@/components/sales/SalesPageFrame";

export default function ArPaymentsPage() {
  return (
    <SalesPageFrame titleEn="Payment history" titleTh="ประวัติการชำระเงิน">
      <PaymentsList />
    </SalesPageFrame>
  );
}
