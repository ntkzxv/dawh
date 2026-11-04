"use client";

import Link from "next/link";
import { ArrowRight, FilePlus2, ReceiptText, Search, Users } from "lucide-react";
import SalesPageFrame from "@/components/sales/SalesPageFrame";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";

export default function SalesOverview() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const isThai = useAppLanguage() === "TH";

  const surface = isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#383838]";
  const muted = isLight ? "text-[#383838]" : "text-[#E4E4E7]";

  return (
    <SalesPageFrame titleEn="Sales & Customer Receivables" titleTh="การขายและลูกหนี้ลูกค้า">
          <section className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div className="max-w-2xl">
              <p className={`mb-2 text-sm font-medium ${muted}`}>{isThai ? "ศูนย์กลางงานขาย" : "Sales operations"}</p>
              <h2 className={`text-2xl font-semibold tracking-tight sm:text-[30px] ${isLight ? "text-[#222222]" : "text-white"}`}>
                {isThai ? "ภาพรวมการขาย" : "Sales overview"}
              </h2>
              <p className={`mt-2 max-w-xl text-sm leading-6 ${muted}`}>
                {isThai
                  ? "พื้นที่สำหรับรายการขาย ข้อมูลลูกค้า และยอดที่ลูกค้าค้างชำระ"
                  : "A starting point for sales, customer records, and outstanding receivables."}
              </p>
            </div>
            <Link
              href="/sales/transactions/new"
              className={`inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition hover:opacity-90 ${isLight ? "bg-[#222222] text-white" : "bg-white text-[#222222]"}`}
            >
              <FilePlus2 size={16} />
              {isThai ? "บันทึกการขาย" : "Record a sale"}
            </Link>
          </section>

          <section aria-label={isThai ? "สรุปข้อมูลการขาย" : "Sales summary"} className="grid gap-3 sm:grid-cols-3">
            {[
              { icon: ReceiptText, label: isThai ? "รายการขาย" : "Sales", hint: isThai ? "จะแสดงหลังเชื่อมข้อมูล" : "Available when data is connected" },
              { icon: Users, label: isThai ? "ลูกค้า" : "Customers", hint: isThai ? "จะแสดงหลังเชื่อมข้อมูล" : "Available when data is connected" },
              { icon: Search, label: isThai ? "ยอดค้างชำระ" : "Outstanding", hint: isThai ? "จะแสดงหลังเชื่อมข้อมูล" : "Available when data is connected" },
            ].map(({ icon: Icon, label, hint }) => (
              <article key={label} className={`rounded-xl border p-4 sm:p-5 ${surface}`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${muted}`}>{label}</span>
                  <Icon size={17} className={muted} />
                </div>
                <p className={`mt-5 font-mono text-2xl font-semibold ${isLight ? "text-[#222222]" : "text-white"}`}>—</p>
                <p className={`mt-1 text-xs ${muted}`}>{hint}</p>
              </article>
            ))}
          </section>

          <section className={`rounded-2xl border ${surface}`}>
            <div className={`flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4 sm:px-6 ${isLight ? "border-[#E4E4E7]" : "border-[#444444]"}`}>
              <div>
                <h3 className={`text-base font-semibold ${isLight ? "text-[#222222]" : "text-white"}`}>{isThai ? "รายการขายล่าสุด" : "Recent sales"}</h3>
                <p className={`mt-1 text-xs ${muted}`}>{isThai ? "รายการจะปรากฏที่นี่เมื่อเริ่มบันทึกการขาย" : "Sales will appear here once recording is available."}</p>
              </div>
              <Link href="/sales/transactions" className={`inline-flex items-center gap-1.5 text-xs font-medium transition hover:underline ${muted}`}>
                {isThai ? "ดูรายการทั้งหมด" : "View all"}
                <ArrowRight size={14} />
              </Link>
            </div>
            <div className="flex min-h-56 flex-col items-center justify-center px-5 py-10 text-center">
              <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl border ${isLight ? "border-[#E4E4E7] bg-[#F8FAFC] text-[#383838]" : "border-[#555555] bg-[#2C2C2C] text-[#E4E4E7]"}`}>
                <ReceiptText size={21} />
              </div>
              <p className={`text-sm font-semibold ${isLight ? "text-[#222222]" : "text-white"}`}>
                {isThai ? "ยังไม่มีรายการขาย" : "No sales yet"}
              </p>
              <p className={`mt-1 max-w-sm text-xs leading-5 ${muted}`}>
                {isThai ? "หน้านี้เป็นโครงเริ่มต้น ยังไม่ได้เชื่อมข้อมูลหรือฟอร์มบันทึกรายการ" : "This is the initial page scaffold; sales data and entry forms are not connected yet."}
              </p>
            </div>
          </section>
    </SalesPageFrame>
  );
}
