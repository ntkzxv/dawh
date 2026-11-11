"use client";

import Link from "next/link";
import { useCallback, useState } from "react";
import { FilePlus2, ReceiptText } from "lucide-react";
import { Button } from "@/components/common/Button";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import { FilterDropdown } from "@/components/common/FilterDropdown";
import SearchInput from "@/components/common/SearchInput";
import SidePanel, { SidePanelAlert } from "@/components/common/SidePanel";
import SalesPageFrame from "@/components/sales/SalesPageFrame";
import { Badge, DetailRow, LinkButton, LoadMore, MiniTable, PanelSection, SalesField, TableFrame, Toolbar, useFormStyles } from "@/components/sales/SalesUi";
import { useDebouncedValue } from "@/components/sales/useDebouncedValue";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import { Notice, message, useRemote } from "@/components/warehouse/Ui";
import { useCursorResource } from "@/hooks/useCursorResource";
import { useNotification } from "@/context/NotificationContext";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import { salesApi, type SaleDetail, type SaleSummary } from "@/lib/api/sales";
import { printBillHref, printReceiptHref } from "@/components/sales/PrintDocs";
import { useAppLanguage } from "@/utils/language";

export const methodLabel = (method: string, isThai: boolean) =>
  ({ CASH: isThai ? "เงินสด" : "Cash", TRANSFER: isThai ? "โอนเงิน" : "Transfer", CREDIT_CARD: isThai ? "บัตรเครดิต" : "Credit card" })[method] ?? method;
export const baht = (value: string) =>
  Number(value).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const typeLabel = (type: string, isThai: boolean) =>
  type === "INSTALLMENT" ? (isThai ? "ผ่อนชำระ" : "Installment") : (isThai ? "เงินสด" : "Cash");
export const statusLabel = (status: string, isThai: boolean) =>
  ({ PAID: isThai ? "ชำระแล้ว" : "Paid", PARTIAL: isThai ? "ชำระบางส่วน" : "Partial", OVERDUE: isThai ? "เกินกำหนด" : "Overdue", UPCOMING: isThai ? "ยังไม่ถึงกำหนด" : "Upcoming" })[status] ?? status;

const canCancelRoles = ["ADMIN", "CEO", "MANAGER"];

export default function SalesTransactionsPage() {
  const isThai = useAppLanguage() === "TH";
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search);
  const [saleType, setSaleType] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const load = useCallback(
    (cursor: string | null, signal: AbortSignal) => salesApi.salesPage(cursor, query, signal, saleType),
    [query, saleType],
  );
  const { items, page, loading, loadingMore, error, refresh, loadMore } = useCursorResource(load);

  const columns: DataTableColumn<SaleSummary>[] = [
    { key: "record", header: isThai ? "เลขที่บิล" : "Bill no.", className: "font-mono", render: (row) => row.record_no },
    { key: "date", header: isThai ? "วันที่" : "Date", className: "font-mono", render: (row) => String(row.sold_on).slice(0, 10) },
    { key: "customer", header: isThai ? "ลูกค้า" : "Customer", render: (row) => row.customer_name },
    { key: "type", header: isThai ? "ประเภท" : "Type", render: (row) => typeLabel(row.sale_type, isThai) },
    { key: "method", header: isThai ? "ชำระโดย" : "Payment", render: (row) => (row.payment_method ? methodLabel(row.payment_method, isThai) : "-") },
    { key: "total", header: isThai ? "ยอดรวม" : "Total", className: "font-mono", render: (row) => baht(row.total_amount) },
    {
      key: "status",
      header: isThai ? "สถานะ" : "Status",
      render: (row) =>
        row.cancelled_at ? (
          <Badge tone="danger">{isThai ? "ยกเลิกแล้ว" : "Cancelled"}</Badge>
        ) : (
          <Badge tone="success">{isThai ? "สำเร็จ" : "Completed"}</Badge>
        ),
    },
  ];

  return (
    <SalesPageFrame titleEn="Sales records" titleTh="รายการขาย">
      {error && <Notice tone="error">{error}</Notice>}
      <Toolbar
        actions={
          <LinkButton href="/sales/transactions/new" icon={<FilePlus2 size={14} aria-hidden="true" />}>
            {isThai ? "บันทึกการขาย" : "Record a sale"}
          </LinkButton>
        }
      >
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={isThai ? "ค้นหาเลขที่บิล ชื่อ หรือเบอร์โทร" : "Search bill no., name or phone"}
          aria-label={isThai ? "ค้นหารายการขาย" : "Search sales"}
          clearLabel={isThai ? "ล้างคำค้นหา" : "Clear search"}
          width="w-full sm:w-72"
        />
        <FilterDropdown
          value={saleType}
          onChange={setSaleType}
          options={[
            { value: "", label: isThai ? "ทุกประเภท" : "All types" },
            { value: "CASH", label: typeLabel("CASH", isThai) },
            { value: "INSTALLMENT", label: typeLabel("INSTALLMENT", isThai) },
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
          emptyIcon={<ReceiptText size={34} />}
          emptyTitle={isThai ? "ยังไม่มีรายการขาย" : "No sales have been recorded yet."}
          minWidth="800px"
        />
      </TableFrame>
      <LoadMore show={page?.hasMore} loading={loadingMore} onClick={() => void loadMore()} />

      {selectedId && (
        <SaleDetailPanel
          saleId={selectedId}
          onClose={() => setSelectedId(null)}
          onCancelled={() => void refresh()}
        />
      )}
    </SalesPageFrame>
  );
}

function SaleDetailPanel({
  saleId,
  onClose,
  onCancelled,
}: {
  saleId: number;
  onClose: () => void;
  onCancelled: () => void;
}) {
  const isThai = useAppLanguage() === "TH";
  const f = useFormStyles();
  const { notify } = useNotification();
  const role = useOptionalWarehouseAccount()?.me?.role;
  const load = useCallback((signal: AbortSignal) => salesApi.sale(saleId, signal), [saleId]);
  const { data: sale, loading, error, refresh } = useRemote<SaleDetail>(load);
  const [reason, setReason] = useState("");
  const [cancelling, setCancelling] = useState(false);

  async function cancel() {
    if (!reason.trim()) return notify.error(isThai ? "กรุณาระบุเหตุผล" : "Enter a reason");
    setCancelling(true);
    try {
      await salesApi.cancelSale(saleId, reason.trim());
      notify.success(isThai ? "ยกเลิกบิลแล้ว" : "Sale cancelled");
      setReason("");
      await refresh();
      onCancelled();
    } catch (cause) {
      notify.error(isThai ? "ยกเลิกบิลไม่สำเร็จ" : "Could not cancel sale", { message: message(cause, isThai) });
    } finally {
      setCancelling(false);
    }
  }

  return (
    <SidePanel
      item={null}
      onClose={onClose}
      eyebrow={isThai ? "รายละเอียดการขาย" : "Sale details"}
      title={<span className="font-mono">{sale?.record_no ?? (isThai ? "รายละเอียด" : "Details")}</span>}
    >
      <div className="space-y-5 pt-6 text-[13px]">
        {error && <Notice tone="error">{error}</Notice>}
        {loading || !sale ? (
          <div className="space-y-3" role="status" aria-label={isThai ? "กำลังโหลดข้อมูล" : "Loading data"}>
            <SkeletonBox className="h-5 w-48" />
            <SkeletonBox className="h-4 w-full" />
            <SkeletonBox className="h-4 w-2/3" />
            <SkeletonBox className="h-32 w-full" />
          </div>
        ) : (
          <>
            {sale.cancelled_at && (
              <SidePanelAlert>{isThai ? "ยกเลิกแล้ว: " : "Cancelled: "}{sale.cancel_reason}</SidePanelAlert>
            )}
            <div className="space-y-2.5">
              <DetailRow label={isThai ? "ลูกค้า" : "Customer"} value={`${sale.customer_name} · ${sale.customer_phone}`} />
              <DetailRow label={isThai ? "สาขา / คลัง" : "Branch / warehouse"} value={`${sale.branch_name} / ${sale.warehouse_name}`} />
              <DetailRow label={isThai ? "ประเภท" : "Type"} value={typeLabel(sale.sale_type, isThai)} />
              <DetailRow label={isThai ? "ยอดรวม" : "Total"} value={<span className="font-mono font-bold">{baht(sale.total_amount)}</span>} />
            </div>
            <a
              href={printBillHref(sale.id)}
              target="_blank"
              rel="noreferrer"
              className="inline-block text-sm font-medium underline"
            >
              {isThai ? "พิมพ์บิล" : "Print bill"}
            </a>

            <PanelSection title={isThai ? "สินค้า" : "Products"}>
              <MiniTable
                rows={sale.lines}
                rowKey={(line) => line.id}
                columns={[
                  {
                    key: "product",
                    header: isThai ? "สินค้า" : "Product",
                    render: (line) => (
                      <>
                        {line.sku} · {line.product_name}
                        {line.serial_numbers.length > 0 && <div className="font-mono text-xs text-[var(--text-muted)]">{line.serial_numbers.join(", ")}</div>}
                      </>
                    ),
                  },
                  { key: "qty", header: isThai ? "จำนวน" : "Qty", align: "right", className: "font-mono", render: (line) => Number(line.quantity) },
                  { key: "price", header: isThai ? "ราคา" : "Price", align: "right", className: "font-mono", render: (line) => baht(line.unit_price) },
                  { key: "total", header: isThai ? "รวม" : "Total", align: "right", className: "font-mono", render: (line) => baht(line.line_total) },
                ]}
              />
            </PanelSection>

            <PanelSection title={isThai ? "การชำระเงิน" : "Payments"}>
              {sale.payments.map((payment) => (
                <div key={payment.id} className={`flex flex-wrap items-center justify-between gap-2 ${payment.voided_at ? "line-through opacity-60" : ""}`}>
                  <span>
                    <span className="font-mono">{payment.record_no}</span> · {methodLabel(payment.method, isThai)} · <span className="font-mono">{baht(payment.amount)}</span>
                    {payment.reference_no ? ` · ${payment.reference_no}` : ""}
                  </span>
                  <a href={printReceiptHref(payment.id)} target="_blank" rel="noreferrer" className="underline print:hidden">
                    {isThai ? "พิมพ์ใบเสร็จ" : "Print receipt"}
                  </a>
                </div>
              ))}
            </PanelSection>

            {sale.sale_type === "INSTALLMENT" && (
              <PanelSection title={isThai ? "สัญญาผ่อนชำระ" : "Installment contract"}>
                <div className="space-y-2.5">
                  <DetailRow label={isThai ? "เงินดาวน์" : "Down payment"} value={<span className="font-mono">{baht(sale.down_payment ?? "0")}</span>} />
                  <DetailRow label={isThai ? "ดอกเบี้ย" : "Interest"} value={<span className="font-mono">{Number(sale.interest_rate)}% ({baht(sale.interest_amount ?? "0")})</span>} />
                  <DetailRow label={isThai ? "ยอดผ่อน" : "Financed"} value={<span className="font-mono">{baht(sale.financed_amount ?? "0")}</span>} />
                  <DetailRow label={isThai ? "งวด" : "Months"} value={<span className="font-mono">{sale.months} × {baht(sale.installment_amount ?? "0")}</span>} />
                  <DetailRow
                    label={isThai ? "ยอดคงเหลือ" : "Outstanding"}
                    value={<span className="font-mono font-bold">{baht(String(sale.installments.reduce((sum, r) => sum + Math.round(Number(r.amount) * 100) - Math.round(Number(r.paid_amount) * 100), 0) / 100))}</span>}
                  />
                </div>
                {!sale.cancelled_at && (
                  <Link href={`/sales/installments?saleId=${sale.id}`} className="inline-block font-medium underline">
                    {isThai ? "บันทึกชำระค่างวด" : "Record a payment"}
                  </Link>
                )}
                <MiniTable
                  rows={sale.installments}
                  rowKey={(row) => row.seq}
                  columns={[
                    { key: "seq", header: "#", className: "font-mono", render: (row) => row.seq },
                    { key: "due", header: isThai ? "ครบกำหนด" : "Due", className: "font-mono", render: (row) => String(row.due_on).slice(0, 10) },
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
                  <div className="space-y-1">
                    <p className="font-bold">{isThai ? "ผู้ค้ำประกัน" : "Guarantors"}</p>
                    {sale.guarantors.map((g) => (
                      <p key={g.id}>
                        {g.full_name} · {g.phone}
                        {g.relationship ? ` · ${g.relationship}` : ""}
                        {g.citizen_id ? ` · ${g.citizen_id}` : ""}
                        {g.address ? ` · ${g.address}` : ""}
                      </p>
                    ))}
                  </div>
                )}
              </PanelSection>
            )}

            {!sale.cancelled_at && role && canCancelRoles.includes(role) && (
              <div className="space-y-3 border-t border-[#444444]/30 pt-5">
                <SalesField label={isThai ? "เหตุผลการยกเลิก" : "Cancellation reason"}>
                  <input className={f.input} value={reason} maxLength={2000} onChange={(e) => setReason(e.target.value)} />
                </SalesField>
                <div className="flex justify-end">
                  <Button variant="danger" loading={cancelling} onClick={() => void cancel()}>
                    {isThai ? "ยกเลิกบิล" : "Cancel sale"}
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </SidePanel>
  );
}
