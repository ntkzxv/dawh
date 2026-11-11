"use client";

import Link from "next/link";
import { useCallback } from "react";
import { ArrowRight, FilePlus2, ReceiptText, Search, Users } from "lucide-react";
import SalesPageFrame from "@/components/sales/SalesPageFrame";
import { Card, LinkButton } from "@/components/sales/SalesUi";
import { dataTableFrameClassName } from "@/components/common/DataTable";
import { baht } from "@/components/sales/SalesTransactionsPage";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import { useRemote } from "@/components/warehouse/Ui";
import { salesApi } from "@/lib/api/sales";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";

export default function SalesOverview() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const isThai = useAppLanguage() === "TH";
  const { data, loading } = useRemote(useCallback((signal: AbortSignal) => salesApi.arOverview(signal), []));
  const muted = "text-[var(--text-muted)]";

  return (
    <SalesPageFrame titleEn="Sales & Customer Receivables" titleTh="การขายและลูกหนี้ลูกค้า">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className={`max-w-xl text-sm ${muted}`}>
          {isThai
            ? "พื้นที่สำหรับรายการขาย ข้อมูลลูกค้า และยอดที่ลูกค้าค้างชำระ"
            : "A starting point for sales, customer records, and outstanding receivables."}
        </p>
        <LinkButton href="/sales/transactions/new" icon={<FilePlus2 size={14} aria-hidden="true" />}>
          {isThai ? "บันทึกการขาย" : "Record a sale"}
        </LinkButton>
      </div>

      <section aria-label={isThai ? "สรุปข้อมูลการขาย" : "Sales summary"} className="grid gap-4 sm:grid-cols-3">
        {[
          { icon: ReceiptText, label: isThai ? "สัญญาผ่อนที่เปิดอยู่" : "Open contracts", value: data && String(data.open_contracts) },
          { icon: Users, label: isThai ? "ลูกค้า" : "Customers", value: data && String(data.customers) },
          { icon: Search, label: isThai ? "ยอดค้างชำระ" : "Outstanding", value: data && baht(data.outstanding) },
        ].map(({ icon: Icon, label, value }) => (
          <article key={label} className={`space-y-4 p-5 ${dataTableFrameClassName(isLight)}`}>
            <div className="flex items-center justify-between">
              <span className={`text-sm font-semibold ${muted}`}>{label}</span>
              <Icon size={17} className={muted} />
            </div>
            {loading || value == null ? (
              <SkeletonBox className="h-8 w-32" />
            ) : (
              <p className="font-mono text-2xl font-bold">{value}</p>
            )}
          </article>
        ))}
      </section>

      <Card
        title={isThai ? "รายการขายล่าสุด" : "Recent sales"}
        actions={
          <Link href="/sales/transactions" className={`inline-flex items-center gap-1.5 text-xs font-medium transition hover:underline ${muted}`}>
            {isThai ? "ดูรายการทั้งหมด" : "View all"}
            <ArrowRight size={14} />
          </Link>
        }
      >
        <div className="flex min-h-48 flex-col items-center justify-center gap-2 text-center">
          <ReceiptText size={36} className="text-zinc-400 opacity-60" />
          <p className="text-sm font-medium">{isThai ? "ยังไม่มีรายการขาย" : "No sales yet"}</p>
          <p className={`max-w-sm text-xs ${muted}`}>
            {isThai ? "หน้านี้เป็นโครงเริ่มต้น ยังไม่ได้เชื่อมข้อมูลหรือฟอร์มบันทึกรายการ" : "This is the initial page scaffold; sales data and entry forms are not connected yet."}
          </p>
        </div>
      </Card>
    </SalesPageFrame>
  );
}
