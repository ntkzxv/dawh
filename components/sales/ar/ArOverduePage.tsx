"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { AlertTriangle } from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import SearchInput from "@/components/common/SearchInput";
import { day } from "@/components/sales/ar/ArLists";
import SalesPageFrame from "@/components/sales/SalesPageFrame";
import { LoadMore, TableFrame, Toolbar } from "@/components/sales/SalesUi";
import { baht } from "@/components/sales/SalesTransactionsPage";
import { useDebouncedValue } from "@/components/sales/useDebouncedValue";
import { Notice } from "@/components/warehouse/Ui";
import { useCursorResource } from "@/hooks/useCursorResource";
import { salesApi, type OverdueInstallment } from "@/lib/api/sales";
import { useAppLanguage } from "@/utils/language";

export default function ArOverduePage() {
  const isThai = useAppLanguage() === "TH";
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search);
  const load = useCallback((cursor: string | null, signal: AbortSignal) => salesApi.arOverdue(cursor, query, signal), [query]);
  const { items, page, loading, loadingMore, error, loadMore } = useCursorResource(load);
  const columns: DataTableColumn<OverdueInstallment>[] = [
    { key: "customer", header: isThai ? "ลูกค้า" : "Customer", render: (row) => <Link href={`/sales/ar/customers/${row.customer_id}`} className="underline">{row.customer_name}</Link> },
    { key: "phone", header: isThai ? "เบอร์โทร" : "Phone", className: "font-mono", render: (row) => row.phone },
    { key: "contract", header: isThai ? "สัญญา" : "Contract", className: "font-mono", render: (row) => <Link href={`/sales/ar/contracts?saleId=${row.sale_id}`} className="underline">{row.record_no}</Link> },
    { key: "seq", header: isThai ? "งวดที่" : "Installment", className: "font-mono", render: (row) => row.seq },
    { key: "due", header: isThai ? "ครบกำหนด" : "Due", className: "font-mono", render: (row) => day(row.due_on) },
    { key: "days", header: isThai ? "เกิน (วัน)" : "Days overdue", className: "font-mono", render: (row) => row.days_overdue },
    { key: "owed", header: isThai ? "ค้างชำระ" : "Owed", className: "font-mono", render: (row) => baht(String((Math.round(Number(row.amount) * 100) - Math.round(Number(row.paid_amount) * 100)) / 100)) },
    { key: "pay", header: "", render: (row) => <Link href={`/sales/installments?saleId=${row.sale_id}`} className="underline">{isThai ? "บันทึกชำระ" : "Record payment"}</Link> },
  ];
  return (
    <SalesPageFrame titleEn="Overdue installments" titleTh="รายการเกินกำหนด">
      {error && <Notice tone="error">{error}</Notice>}
      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder={isThai ? "ค้นหาชื่อ เบอร์โทร หรือเลขที่สัญญา" : "Search name, phone or contract no."} aria-label={isThai ? "ค้นหารายการเกินกำหนด" : "Search overdue installments"} clearLabel={isThai ? "ล้างคำค้นหา" : "Clear search"} width="w-full sm:w-72" />
      </Toolbar>
      <TableFrame>
        <DataTable
          columns={columns}
          data={items}
          isLoading={loading}
          keyExtractor={(row) => row.id}
          emptyIcon={<AlertTriangle size={34} />}
          emptyTitle={isThai ? "ไม่มีรายการเกินกำหนด" : "No overdue installments."}
          minWidth="900px"
        />
      </TableFrame>
      <LoadMore show={page?.hasMore} loading={loadingMore} onClick={() => void loadMore()} />
    </SalesPageFrame>
  );
}
