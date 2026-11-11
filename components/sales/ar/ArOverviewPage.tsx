"use client";

import Link from "next/link";
import { useCallback } from "react";
import { Banknote } from "lucide-react";
import DataTable, { dataTableFrameClassName, type DataTableColumn } from "@/components/common/DataTable";
import { SkeletonStatCard } from "@/components/loading_screen/SkeletonLoading";
import { day, kindLabel } from "@/components/sales/ar/ArLists";
import SalesPageFrame from "@/components/sales/SalesPageFrame";
import { TableFrame } from "@/components/sales/SalesUi";
import { baht } from "@/components/sales/SalesTransactionsPage";
import { Notice, useRemote } from "@/components/warehouse/Ui";
import { useTheme } from "@/context/ThemeContext";
import { salesApi, type ArOverview } from "@/lib/api/sales";
import { useAppLanguage } from "@/utils/language";

export default function ArOverviewPage() {
  const isThai = useAppLanguage() === "TH";
  const isLight = useTheme().theme === "light";
  const load = useCallback((signal: AbortSignal) => salesApi.arOverview(signal), []);
  const { data, loading, error } = useRemote<ArOverview>(load);
  const stats = data && [
    { label: isThai ? "สัญญาผ่อนที่เปิดอยู่" : "Open contracts", value: String(data.open_contracts), href: "/sales/ar/contracts" },
    { label: isThai ? "ยอดค้างชำระรวม" : "Total outstanding", value: baht(data.outstanding), href: "/sales/ar/contracts" },
    { label: isThai ? "งวดเกินกำหนด" : "Overdue installments", value: String(data.overdue_count), href: "/sales/ar/overdue" },
    { label: isThai ? "ยอดเกินกำหนด" : "Overdue amount", value: baht(data.overdue_amount), href: "/sales/ar/overdue" },
    { label: isThai ? "ลูกค้า" : "Customers", value: String(data.customers), href: "/sales/ar/customers" },
  ];
  const columns: DataTableColumn<ArOverview["recent_payments"][number]>[] = [
    { key: "record", header: isThai ? "เลขที่ใบเสร็จ" : "Receipt no.", className: "font-mono", render: (row) => row.record_no },
    { key: "date", header: isThai ? "วันที่ชำระ" : "Paid on", className: "font-mono", render: (row) => day(row.paid_on) },
    { key: "customer", header: isThai ? "ลูกค้า" : "Customer", render: (row) => row.customer_name },
    { key: "sale", header: isThai ? "บิล/สัญญา" : "Bill / contract", className: "font-mono", render: (row) => row.sale_record_no },
    { key: "kind", header: isThai ? "ประเภท" : "Kind", render: (row) => kindLabel(row.kind, isThai) },
    { key: "amount", header: isThai ? "จำนวนเงิน" : "Amount", className: "font-mono", render: (row) => baht(row.amount) },
  ];
  return (
    <SalesPageFrame titleEn="Receivables overview" titleTh="ภาพรวมลูกหนี้">
      {error && <Notice tone="error">{error}</Notice>}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading || !stats
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonStatCard key={i} />)
          : stats.map((stat) => (
              <Link key={stat.label} href={stat.href} className={`block space-y-4 p-5 transition-colors hover:opacity-90 ${dataTableFrameClassName(isLight)}`}>
                <p className="text-sm font-semibold text-[var(--text-muted)]">{stat.label}</p>
                <p className="font-mono text-2xl font-bold">{stat.value}</p>
              </Link>
            ))}
      </section>
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold">{isThai ? "การชำระล่าสุด" : "Recent payments"}</h2>
          <Link href="/sales/ar/payments" className="text-xs font-medium text-[var(--text-muted)] hover:underline">{isThai ? "ดูทั้งหมด" : "View all"}</Link>
        </div>
        <TableFrame>
          <DataTable
            columns={columns}
            data={data?.recent_payments ?? []}
            isLoading={loading}
            keyExtractor={(row) => row.id}
            emptyIcon={<Banknote size={34} />}
            emptyTitle={isThai ? "ยังไม่มีการชำระเงิน" : "No payments yet."}
            minWidth="700px"
          />
        </TableFrame>
      </section>
    </SalesPageFrame>
  );
}
