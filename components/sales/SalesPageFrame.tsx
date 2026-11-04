"use client";

import type { ReactNode } from "react";
import { HeaderNavbar } from "@/components/navbar";
import { useAppLanguage } from "@/utils/language";

export default function SalesPageFrame({
  titleEn,
  titleTh,
  children,
  contentClassName = "",
}: {
  titleEn: string;
  titleTh: string;
  children: ReactNode;
  contentClassName?: string;
}) {
  const isThai = useAppLanguage() === "TH";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <HeaderNavbar
        moduleLabel={isThai ? "โมดูลการขาย" : "Sales module"}
        title={isThai ? titleTh : titleEn}
        showOnMobile
      />
      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className={`mx-auto w-full max-w-6xl space-y-7 px-5 py-6 sm:px-8 sm:py-8 lg:px-10 ${contentClassName}`}>
          {children}
        </div>
      </main>
    </div>
  );
}
