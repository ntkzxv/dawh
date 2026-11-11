"use client";

import type { ReactNode } from "react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";

/** Sales pages reuse the warehouse page shell; `narrow` is the form layout (max-w-7xl, centered). */
export default function SalesPageFrame({
  titleEn,
  titleTh,
  children,
  narrow = false,
}: {
  titleEn: string;
  titleTh: string;
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <WarehousePageTemplate titleEn={titleEn} titleTh={titleTh} routePath="/sales" fullBleed={!narrow}>
      {narrow ? (
        children
      ) : (
        <div className="flex w-full min-h-0 flex-1 flex-col gap-6 self-stretch overflow-y-auto p-6 lg:p-8">{children}</div>
      )}
    </WarehousePageTemplate>
  );
}
