"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { BookOpenCheck, Banknote } from "lucide-react";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import SearchInput from "@/components/common/SearchInput";
import SidePanel, { SidePanelAlert } from "@/components/common/SidePanel";
import { DetailRow, LoadMore, MiniTable, PanelSection, TableFrame, Toolbar } from "@/components/sales/SalesUi";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import { baht, methodLabel, statusLabel } from "@/components/sales/SalesTransactionsPage";
import { printReceiptHref } from "@/components/sales/PrintDocs";
import { useDebouncedValue } from "@/components/sales/useDebouncedValue";
import { Notice, useRemote } from "@/components/warehouse/Ui";
import { useCursorResource } from "@/hooks/useCursorResource";
import { salesApi, type ArPayment, type SaleDetail, type SaleSummary } from "@/lib/api/sales";
import { useAppLanguage } from "@/utils/language";

export const day = (value: string) => String(value).slice(0, 10);
export const kindLabel = (kind: string, isThai: boolean) =>
  ({ CASH_SALE: isThai ? "ขายเงินสด" : "Cash sale", DOWN_PAYMENT: isThai ? "เงินดาวน์" : "Down payment", INSTALLMENT: isThai ? "ค่างวด" : "Installment" })[kind] ?? kind;

// Read-only contract view: terms, schedule with status, paid/overdue counts, guarantors, payments.
export function ContractDetail({ saleId, onClose }: { saleId: number; onClose: () => void }) {
  const isThai = useAppLanguage() === "TH";
  const load = useCallback((signal: AbortSignal) => salesApi.sale(saleId, signal), [saleId]);
  const { data: sale, loading, error } = useRemote<SaleDetail>(load);
  const count = (status: string) => sale?.installments.filter((row) => row.status === status).length ?? 0;
  const outstanding = sale ? sale.installments.reduce((sum, r) => sum + Math.round(Number(r.amount) * 100) - Math.round(Number(r.paid_amount) * 100), 0) / 100 : 0;
  const mono = (value: string | number) => <span className="font-mono">{value}</span>;
  return (
    <SidePanel
      item={null}
      onClose={onClose}
      eyebrow={isThai ? "สัญญาผ่อนชำระ" : "Installment contract"}
      title={<span className="font-mono">{sale?.record_no ?? (isThai ? "รายละเอียด" : "Details")}</span>}
    >
      <div className="space-y-5 pt-6 text-[13px]">
        {error && <Notice tone="error">{error}</Notice>}
        {loading || !sale ? (
          <div className="space-y-3" role="status" aria-label={isThai ? "กำลังโหลดข้อมูล" : "Loading data"}>
            <SkeletonBox className="h-5 w-48" />
            <SkeletonBox className="h-4 w-full" />
            <SkeletonBox className="h-32 w-full" />
          </div>
        ) : (
          <>
            {sale.cancelled_at && <SidePanelAlert>{isThai ? "ยกเลิกแล้ว: " : "Cancelled: "}{sale.cancel_reason}</SidePanelAlert>}
            {sale.closed_at && <SidePanelAlert tone="success">{isThai ? "ชำระครบแล้ว" : "Fully paid"}</SidePanelAlert>}
            <div className="space-y-2.5">
              <DetailRow label={isThai ? "ลูกค้า" : "Customer"} value={`${sale.customer_name} · ${sale.customer_phone}`} />
              <DetailRow label={isThai ? "สาขา / วันที่" : "Branch / date"} value={`${sale.branch_name} · ${day(sale.sold_on)}`} />
              <DetailRow label={isThai ? "ราคา" : "Price"} value={mono(baht(sale.total_amount))} />
              <DetailRow label={isThai ? "เงินดาวน์" : "Down"} value={mono(baht(sale.down_payment ?? "0"))} />
              <DetailRow label={isThai ? "ดอกเบี้ย" : "Interest"} value={mono(`${Number(sale.interest_rate)}% (${baht(sale.interest_amount ?? "0")})`)} />
              <DetailRow label={isThai ? "ยอดผ่อน" : "Financed"} value={mono(baht(sale.financed_amount ?? "0"))} />
              <DetailRow label={isThai ? "งวด" : "Months"} value={mono(`${sale.months} × ${baht(sale.installment_amount ?? "0")}`)} />
              <DetailRow label={isThai ? "คงเหลือ" : "Outstanding"} value={<span className="font-mono font-bold">{baht(String(outstanding))}</span>} />
              <DetailRow label={isThai ? "ชำระแล้ว / เกินกำหนด" : "Paid / overdue"} value={mono(`${count("PAID")} / ${count("OVERDUE")} (${sale.installments.length})`)} />
            </div>
            {!sale.cancelled_at && !sale.closed_at && (
              <Link href={`/sales/installments?saleId=${sale.id}`} className="inline-block font-medium underline">{isThai ? "บันทึกชำระค่างวด" : "Record a payment"}</Link>
            )}
            <MiniTable
              rows={sale.installments}
              rowKey={(row) => row.seq}
              columns={[
                { key: "seq", header: "#", className: "font-mono", render: (row) => row.seq },
                { key: "due", header: isThai ? "ครบกำหนด" : "Due", className: "font-mono", render: (row) => day(row.due_on) },
                { key: "amount", header: isThai ? "ยอด" : "Amount", align: "right", className: "font-mono", render: (row) => baht(row.amount) },
                { key: "paid", header: isThai ? "ชำระแล้ว" : "Paid", align: "right", className: "font-mono", render: (row) => baht(row.paid_amount) },
                {
                  key: "status",
                  header: isThai ? "สถานะ" : "Status",
                  render: (row) => <span className={row.status === "OVERDUE" ? "font-semibold text-[var(--status-danger-text)]" : ""}>{statusLabel(row.status, isThai)}</span>,
                },
              ]}
            />
            {sale.guarantors.length > 0 && (
              <PanelSection title={isThai ? "ผู้ค้ำประกัน" : "Guarantors"}>
                {sale.guarantors.map((g) => (
                  <p key={g.id}>
                    {g.full_name} · {g.phone}
                    {g.relationship ? ` · ${g.relationship}` : ""}
                    {g.citizen_id ? ` · ${g.citizen_id}` : ""}
                    {g.address ? ` · ${g.address}` : ""}
                  </p>
                ))}
              </PanelSection>
            )}
            {sale.payments.length > 0 && (
              <PanelSection title={isThai ? "ประวัติการชำระ" : "Payments"}>
                {sale.payments.map((p) => (
                  <div key={p.id} className={`flex flex-wrap items-center justify-between gap-2 ${p.voided_at ? "line-through opacity-60" : ""}`}>
                    <span>
                      <span className="font-mono">{p.record_no}</span> · {day(p.paid_on)} · {kindLabel(p.kind, isThai)} · {methodLabel(p.method, isThai)} · <span className="font-mono">{baht(p.amount)}</span>
                    </span>
                    <a href={printReceiptHref(p.id)} target="_blank" rel="noreferrer" className="underline">{isThai ? "พิมพ์ใบเสร็จ" : "Print receipt"}</a>
                  </div>
                ))}
              </PanelSection>
            )}
          </>
        )}
      </div>
    </SidePanel>
  );
}

// Installment contracts with outstanding / next due; a row opens the read-only detail.
export function ContractsList({ customerId = 0, initialSaleId = null }: { customerId?: number; initialSaleId?: number | null }) {
  const isThai = useAppLanguage() === "TH";
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search);
  const [openOnly, setOpenOnly] = useState("true");
  const [selectedId, setSelectedId] = useState<number | null>(initialSaleId);
  const load = useCallback(
    (cursor: string | null, signal: AbortSignal) => salesApi.contractsPage(cursor, query, signal, openOnly === "true", customerId),
    [query, openOnly, customerId],
  );
  const { items, page, loading, loadingMore, error, loadMore } = useCursorResource(load);
  const columns: DataTableColumn<SaleSummary>[] = [
    { key: "record", header: isThai ? "เลขที่สัญญา" : "Contract no.", className: "font-mono", render: (row) => row.record_no },
    { key: "customer", header: isThai ? "ลูกค้า" : "Customer", render: (row) => row.customer_name },
    { key: "date", header: isThai ? "วันที่ทำสัญญา" : "Date", className: "font-mono", render: (row) => day(row.sold_on) },
    { key: "total", header: isThai ? "ราคา" : "Price", className: "font-mono", render: (row) => baht(row.total_amount) },
    { key: "outstanding", header: isThai ? "ยอดคงเหลือ" : "Outstanding", className: "font-mono", render: (row) => baht(row.outstanding ?? "0") },
    { key: "due", header: isThai ? "งวดถัดไป" : "Next due", className: "font-mono", render: (row) => (row.next_due_on ? day(row.next_due_on) : "-") },
    {
      key: "status",
      header: isThai ? "สถานะ" : "Status",
      render: (row) => (row.cancelled_at ? (isThai ? "ยกเลิกแล้ว" : "Cancelled") : Number(row.outstanding ?? 0) > 0 ? (isThai ? "กำลังผ่อน" : "Open") : (isThai ? "ชำระครบ" : "Closed")),
    },
  ];
  return (
    <div className="space-y-4">
      {error && <Notice tone="error">{error}</Notice>}
      <Toolbar>
        {!customerId && (
          <SearchInput value={search} onChange={setSearch} placeholder={isThai ? "ค้นหาเลขที่สัญญา ชื่อ หรือเบอร์โทร" : "Search contract no., name or phone"} aria-label={isThai ? "ค้นหาสัญญา" : "Search contracts"} clearLabel={isThai ? "ล้างคำค้นหา" : "Clear search"} width="w-full sm:w-72" />
        )}
        <FilterDropdown
          value={openOnly}
          onChange={setOpenOnly}
          options={[
            { value: "true", label: isThai ? "ยังผ่อนอยู่" : "Open" },
            { value: "false", label: isThai ? "ทั้งหมด" : "All" },
          ]}
        />
      </Toolbar>
      <TableFrame>
        <DataTable
          columns={columns}
          data={items}
          isLoading={loading}
          keyExtractor={(row) => row.id}
          selectedKey={selectedId}
          onRowClick={(row) => setSelectedId(row.id)}
          emptyIcon={<BookOpenCheck size={34} />}
          emptyTitle={isThai ? "ไม่มีสัญญาผ่อน" : "No installment contracts."}
          minWidth="800px"
        />
      </TableFrame>
      <LoadMore show={page?.hasMore} loading={loadingMore} onClick={() => void loadMore()} />
      {selectedId && <ContractDetail saleId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

export function PaymentsList({ customerId = 0 }: { customerId?: number }) {
  const isThai = useAppLanguage() === "TH";
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search);
  const [kind, setKind] = useState("");
  const load = useCallback(
    (cursor: string | null, signal: AbortSignal) => salesApi.arPayments(cursor, query, signal, kind, customerId),
    [query, kind, customerId],
  );
  const { items, page, loading, loadingMore, error, loadMore } = useCursorResource(load);
  const columns: DataTableColumn<ArPayment>[] = [
    { key: "record", header: isThai ? "เลขที่ใบเสร็จ" : "Receipt no.", className: "font-mono", render: (row) => row.record_no },
    { key: "date", header: isThai ? "วันที่ชำระ" : "Paid on", className: "font-mono", render: (row) => day(row.paid_on) },
    { key: "customer", header: isThai ? "ลูกค้า" : "Customer", render: (row) => row.customer_name },
    { key: "sale", header: isThai ? "บิล/สัญญา" : "Bill / contract", className: "font-mono", render: (row) => row.sale_record_no },
    { key: "kind", header: isThai ? "ประเภท" : "Kind", render: (row) => kindLabel(row.kind, isThai) },
    { key: "method", header: isThai ? "ชำระโดย" : "Method", render: (row) => methodLabel(row.method, isThai) },
    { key: "amount", header: isThai ? "จำนวนเงิน" : "Amount", className: "font-mono", render: (row) => baht(row.amount) },
    { key: "print", header: "", render: (row) => <a href={printReceiptHref(row.id)} target="_blank" rel="noreferrer" className="underline">{isThai ? "พิมพ์ใบเสร็จ" : "Print receipt"}</a> },
  ];
  return (
    <div className="space-y-4">
      {error && <Notice tone="error">{error}</Notice>}
      <Toolbar>
        {!customerId && (
          <SearchInput value={search} onChange={setSearch} placeholder={isThai ? "ค้นหาเลขที่ใบเสร็จ บิล หรือชื่อ" : "Search receipt, bill or name"} aria-label={isThai ? "ค้นหาการชำระเงิน" : "Search payments"} clearLabel={isThai ? "ล้างคำค้นหา" : "Clear search"} width="w-full sm:w-72" />
        )}
        <FilterDropdown
          value={kind}
          onChange={setKind}
          options={[
            { value: "", label: isThai ? "ทุกประเภท" : "All kinds" },
            { value: "CASH_SALE", label: kindLabel("CASH_SALE", isThai) },
            { value: "DOWN_PAYMENT", label: kindLabel("DOWN_PAYMENT", isThai) },
            { value: "INSTALLMENT", label: kindLabel("INSTALLMENT", isThai) },
          ]}
        />
      </Toolbar>
      <TableFrame>
        <DataTable
          columns={columns}
          data={items}
          isLoading={loading}
          keyExtractor={(row) => row.id}
          emptyIcon={<Banknote size={34} />}
          emptyTitle={isThai ? "ไม่พบประวัติการชำระ" : "No payments found."}
          minWidth="800px"
        />
      </TableFrame>
      <LoadMore show={page?.hasMore} loading={loadingMore} onClick={() => void loadMore()} />
    </div>
  );
}
