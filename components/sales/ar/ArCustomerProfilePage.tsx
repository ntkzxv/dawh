"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { ArrowLeft, ReceiptText } from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import { ContractsList, day, PaymentsList } from "@/components/sales/ar/ArLists";
import SalesPageFrame from "@/components/sales/SalesPageFrame";
import { Card, DetailRow, LoadMore, Segmented, TableFrame } from "@/components/sales/SalesUi";
import { baht } from "@/components/sales/SalesTransactionsPage";
import { Empty, Notice, useRemote } from "@/components/warehouse/Ui";
import { useCursorResource } from "@/hooks/useCursorResource";
import { salesApi, type CustomerProfile, type SaleSummary } from "@/lib/api/sales";
import { useAppLanguage } from "@/utils/language";

type Tab = "info" | "sales" | "contracts" | "payments";

export default function ArCustomerProfilePage({ customerId }: { customerId: number }) {
  const isThai = useAppLanguage() === "TH";
  const [tab, setTab] = useState<Tab>("info");
  const load = useCallback((signal: AbortSignal) => salesApi.customerProfile(customerId, signal), [customerId]);
  const { data: customer, loading, error } = useRemote<CustomerProfile>(load);
  const tabs: [Tab, string][] = [
    ["info", isThai ? "ข้อมูลส่วนตัว" : "Profile"],
    ["sales", isThai ? "ประวัติการซื้อ" : "Purchases"],
    ["contracts", isThai ? "สัญญาและการเงิน" : "Contracts & finance"],
    ["payments", isThai ? "ประวัติการชำระ" : "Payments"],
  ];
  return (
    <SalesPageFrame titleEn="Customer profile" titleTh="ข้อมูลลูกค้า">
      {error && <Notice tone="error">{error}</Notice>}
      <Link href="/sales/ar/customers" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:underline">
        <ArrowLeft size={14} aria-hidden="true" />
        {isThai ? "ทะเบียนลูกค้า" : "Customer registry"}
      </Link>
      {loading || !customer ? (
        <Card>
          <div role="status" aria-label={isThai ? "กำลังโหลดข้อมูล" : "Loading data"} className="space-y-2">
            <SkeletonBox className="h-6 w-56" />
            <SkeletonBox className="h-4 w-full" />
            <SkeletonBox className="h-4 w-2/3" />
          </div>
        </Card>
      ) : (
        <>
          <div>
            <Segmented label={isThai ? "มุมมองลูกค้า" : "Customer view"} value={tab} onChange={setTab} options={tabs} />
          </div>
          {tab === "info" && <Info customer={customer} />}
          {tab === "sales" && <Purchases customerId={customerId} />}
          {tab === "contracts" &&
            (customer.summary.installment_count === 0 ? (
              <Empty text={isThai ? "ไม่มีสัญญาผ่อน" : "No installment contracts"} />
            ) : (
              <ContractsList customerId={customerId} />
            ))}
          {tab === "payments" && <PaymentsList customerId={customerId} />}
        </>
      )}
    </SalesPageFrame>
  );
}

function Info({ customer }: { customer: CustomerProfile }) {
  const isThai = useAppLanguage() === "TH";
  const s = customer.summary;
  const rows: [string, string][] = [
    [isThai ? "ชื่อ" : "Name", customer.full_name],
    [isThai ? "เบอร์โทร" : "Phone", customer.phone],
    [isThai ? "เลขบัตรประชาชน" : "Citizen ID", customer.citizen_id ?? "-"],
    [isThai ? "ที่อยู่" : "Address", customer.address ?? "-"],
    [isThai ? "หมายเหตุ" : "Note", customer.note ?? "-"],
    [isThai ? "ซื้อเงินสด (บิล)" : "Cash bills", String(s.cash_count)],
    [isThai ? "ซื้อผ่อน (สัญญา)" : "Installment contracts", String(s.installment_count)],
    [isThai ? "ยอดซื้อรวม" : "Total purchased", baht(s.total_purchased)],
    [isThai ? "ยอดค้างชำระ" : "Outstanding", baht(s.outstanding)],
    [isThai ? "ยอดเกินกำหนด" : "Overdue", baht(s.overdue_amount)],
  ];
  return (
    <Card title={customer.full_name}>
      <div className="grid gap-x-10 gap-y-3 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <DetailRow key={label} label={label} value={<span className="font-mono">{value}</span>} />
        ))}
      </div>
    </Card>
  );
}

function Purchases({ customerId }: { customerId: number }) {
  const isThai = useAppLanguage() === "TH";
  const load = useCallback((cursor: string | null, signal: AbortSignal) => salesApi.salesPage(cursor, "", signal, "", customerId), [customerId]);
  const { items, page, loading, loadingMore, error, loadMore } = useCursorResource(load);
  const columns: DataTableColumn<SaleSummary>[] = [
    { key: "record", header: isThai ? "เลขที่บิล" : "Bill no.", className: "font-mono", render: (row) => row.record_no },
    { key: "date", header: isThai ? "วันที่" : "Date", className: "font-mono", render: (row) => day(row.sold_on) },
    { key: "type", header: isThai ? "ประเภท" : "Type", render: (row) => (row.sale_type === "INSTALLMENT" ? (isThai ? "ผ่อนชำระ" : "Installment") : (isThai ? "เงินสด" : "Cash")) },
    { key: "total", header: isThai ? "ยอดรวม" : "Total", className: "font-mono", render: (row) => baht(row.total_amount) },
    { key: "status", header: isThai ? "สถานะ" : "Status", render: (row) => (row.cancelled_at ? (isThai ? "ยกเลิกแล้ว" : "Cancelled") : (isThai ? "สำเร็จ" : "Completed")) },
  ];
  return (
    <div className="space-y-4">
      {error && <Notice tone="error">{error}</Notice>}
      <TableFrame>
        <DataTable
          columns={columns}
          data={items}
          isLoading={loading}
          keyExtractor={(row) => row.id}
          emptyIcon={<ReceiptText size={34} />}
          emptyTitle={isThai ? "ยังไม่มีประวัติการซื้อ" : "No purchases yet."}
          minWidth="640px"
        />
      </TableFrame>
      <LoadMore show={page?.hasMore} loading={loadingMore} onClick={() => void loadMore()} />
    </div>
  );
}
