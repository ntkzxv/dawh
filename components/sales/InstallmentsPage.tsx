"use client";

import { useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, type ReactNode } from "react";
import { BookOpenCheck } from "lucide-react";
import { Button } from "@/components/common/Button";
import CustomDropdown from "@/components/common/CustomDropdown";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import SidePanel from "@/components/common/SidePanel";
import DatePicker from "@/components/common/DatePicker";
import SearchInput from "@/components/common/SearchInput";
import SalesPageFrame from "@/components/sales/SalesPageFrame";
import { DetailRow, LoadMore, MiniTable, PanelSection, SalesField, TableFrame, Toolbar, useFormStyles } from "@/components/sales/SalesUi";
import { baht, methodLabel, statusLabel } from "@/components/sales/SalesTransactionsPage";
import { useDebouncedValue } from "@/components/sales/useDebouncedValue";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import { Notice, message, useRemote } from "@/components/warehouse/Ui";
import { useNotification } from "@/context/NotificationContext";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import { useCursorResource } from "@/hooks/useCursorResource";
import { ApiRequestError } from "@/lib/api/client";
import { salesApi, type PaymentMethod, type SaleDetail, type SaleSummary } from "@/lib/api/sales";
import { printReceiptHref } from "@/components/sales/PrintDocs";
import { useAppLanguage } from "@/utils/language";

const methods: PaymentMethod[] = ["TRANSFER", "CASH", "CREDIT_CARD"];
const voidRoles = ["ADMIN", "CEO", "MANAGER"];
const satang = (value: string) => Math.round(Number(value) * 100);
const today = () => new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Bangkok" });

export default function InstallmentsPage() {
  const isThai = useAppLanguage() === "TH";
  const [search, setSearch] = useState("");
  const query = useDebouncedValue(search);
  const preselect = Number(useSearchParams().get("saleId"));
  const [selectedId, setSelectedId] = useState<number | null>(Number.isInteger(preselect) && preselect > 0 ? preselect : null);
  const load = useCallback(
    (cursor: string | null, signal: AbortSignal) => salesApi.openInstallments(cursor, query, signal),
    [query],
  );
  const { items, page, loading, loadingMore, error, refresh, loadMore } = useCursorResource(load);

  const columns: DataTableColumn<SaleSummary>[] = [
    { key: "record", header: isThai ? "เลขที่บิล" : "Bill no.", className: "font-mono", render: (row) => row.record_no },
    { key: "customer", header: isThai ? "ลูกค้า" : "Customer", render: (row) => row.customer_name },
    { key: "outstanding", header: isThai ? "ยอดคงเหลือ" : "Outstanding", className: "font-mono", render: (row) => baht(row.outstanding ?? "0") },
    { key: "due", header: isThai ? "งวดถัดไป" : "Next due", className: "font-mono", render: (row) => (row.next_due_on ? String(row.next_due_on).slice(0, 10) : "-") },
  ];

  return (
    <SalesPageFrame titleEn="Installment payments" titleTh="บันทึกชำระค่างวด">
      {error && <Notice tone="error">{error}</Notice>}
      <Toolbar>
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder={isThai ? "ค้นหาเลขที่บิล ชื่อ หรือเบอร์โทร" : "Search bill no., name or phone"}
          aria-label={isThai ? "ค้นหาสัญญาผ่อน" : "Search installment contracts"}
          clearLabel={isThai ? "ล้างคำค้นหา" : "Clear search"}
          width="w-full sm:w-72"
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
          emptyTitle={isThai ? "ไม่พบสัญญาผ่อนที่ค้างชำระ" : "No open installment contracts."}
          minWidth="600px"
        />
      </TableFrame>
      <LoadMore show={page?.hasMore} loading={loadingMore} onClick={() => void loadMore()} />
      {selectedId && <ContractPanel saleId={selectedId} onClose={() => setSelectedId(null)} onChanged={() => void refresh()} />}
    </SalesPageFrame>
  );
}

function ContractPanel({ saleId, onClose, onChanged }: { saleId: number; onClose: () => void; onChanged: () => void }) {
  const isThai = useAppLanguage() === "TH";
  const f = useFormStyles();
  const { notify } = useNotification();
  const role = useOptionalWarehouseAccount()?.me?.role;
  const load = useCallback((signal: AbortSignal) => salesApi.sale(saleId, signal), [saleId]);
  const { data: sale, error, refresh } = useRemote<SaleDetail>(load);
  const [reason, setReason] = useState("");
  const [voiding, setVoiding] = useState(false);

  const shell = (children: ReactNode) => (
    <SidePanel
      item={null}
      onClose={onClose}
      eyebrow={isThai ? "สัญญาผ่อนชำระ" : "Installment contract"}
      title={<span className="font-mono">{sale?.record_no ?? (isThai ? "รายละเอียด" : "Details")}</span>}
    >
      <div className="space-y-5 pt-6 text-[13px]">{children}</div>
    </SidePanel>
  );
  if (!sale)
    return shell(
      error ? (
        <Notice tone="error">{error}</Notice>
      ) : (
        <div className="space-y-3" role="status" aria-label={isThai ? "กำลังโหลดข้อมูล" : "Loading data"}>
          <SkeletonBox className="h-5 w-48" />
          <SkeletonBox className="h-4 w-full" />
          <SkeletonBox className="h-32 w-full" />
        </div>
      ),
    );

  const outstanding = sale.installments.reduce((sum, r) => sum + satang(r.amount) - satang(r.paid_amount), 0);
  const next = sale.installments.find((r) => satang(r.paid_amount) < satang(r.amount));
  const latest = [...sale.payments].reverse().find((p) => p.kind === "INSTALLMENT" && !p.voided_at);
  const open = sale.sale_type === "INSTALLMENT" && !sale.cancelled_at && !sale.closed_at;

  async function voidLatest() {
    if (!latest) return;
    if (!reason.trim()) return notify.error(isThai ? "กรุณาระบุเหตุผล" : "Enter a reason");
    setVoiding(true);
    try {
      await salesApi.voidPayment(latest.id, reason.trim());
      notify.success(isThai ? "ยกเลิกการชำระแล้ว" : "Payment voided");
      setReason("");
      await refresh();
      onChanged();
    } catch (cause) {
      notify.error(isThai ? "ยกเลิกการชำระไม่สำเร็จ" : "Could not void the payment", { message: message(cause, isThai) });
    } finally {
      setVoiding(false);
    }
  }

  return shell(
    <>
      {error && <Notice tone="error">{error}</Notice>}
      <div className="space-y-2.5">
        <DetailRow label={isThai ? "ลูกค้า" : "Customer"} value={`${sale.customer_name} · ${sale.customer_phone}`} />
        <DetailRow
          label={isThai ? "ยอดคงเหลือ" : "Outstanding"}
          value={
            <>
              <span className="font-mono font-bold">{baht(String(outstanding / 100))}</span>
              {sale.closed_at && ` · ${isThai ? "ชำระครบแล้ว" : "Fully paid"}`}
              {sale.cancelled_at && ` · ${isThai ? "ยกเลิกแล้ว" : "Cancelled"}`}
            </>
          }
        />
      </div>
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
      {open && next && (
        // New form instance (and Idempotency-Key) after every successful change.
        <PaymentForm
          key={`${sale.payments.length}:${outstanding}`}
          saleId={saleId}
          defaultAmount={((satang(next.amount) - satang(next.paid_amount)) / 100).toFixed(2)}
          onSaved={async () => {
            await refresh();
            onChanged();
          }}
        />
      )}
      <PanelSection title={isThai ? "ประวัติการชำระ" : "Payment history"}>
        {sale.payments.map((payment) => (
          <div key={payment.id} className={`flex flex-wrap items-center justify-between gap-2 ${payment.voided_at ? "line-through opacity-60" : ""}`}>
            <span>
              <span className="font-mono">{payment.record_no}</span> · {payment.kind} · {String(payment.paid_on).slice(0, 10)} · {methodLabel(payment.method, isThai)} · <span className="font-mono">{baht(payment.amount)}</span>
              {payment.reference_no ? ` · ${payment.reference_no}` : ""}
            </span>
            <a href={printReceiptHref(payment.id)} target="_blank" rel="noreferrer" className="underline">
              {isThai ? "พิมพ์ใบเสร็จ" : "Print receipt"}
            </a>
          </div>
        ))}
      </PanelSection>
      {latest && role && voidRoles.includes(role) && (
        <div className="space-y-3 border-t border-[#444444]/30 pt-5">
          <SalesField label={isThai ? `เหตุผลยกเลิก ${latest.record_no}` : `Void reason for ${latest.record_no}`}>
            <input className={f.input} value={reason} maxLength={2000} onChange={(e) => setReason(e.target.value)} />
          </SalesField>
          <div className="flex justify-end">
            <Button variant="danger" loading={voiding} onClick={() => void voidLatest()}>
              {isThai ? "ยกเลิกการชำระล่าสุด" : "Void latest payment"}
            </Button>
          </div>
        </div>
      )}
    </>,
  );
}

function PaymentForm({ saleId, defaultAmount, onSaved }: { saleId: number; defaultAmount: string; onSaved: () => Promise<void> }) {
  const isThai = useAppLanguage() === "TH";
  const f = useFormStyles();
  const { notify } = useNotification();
  const idempotencyKey = useRef(crypto.randomUUID());
  const [amount, setAmount] = useState(defaultAmount);
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [paidOn, setPaidOn] = useState(today());
  const [referenceNo, setReferenceNo] = useState("");
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const result = await salesApi.recordPayment(
        saleId,
        { amount: amount.trim(), method, paidOn, referenceNo: referenceNo.trim() || undefined },
        idempotencyKey.current,
      );
      notify.success(result.closed ? (isThai ? "บันทึกแล้ว สัญญาชำระครบ" : "Recorded; contract fully paid") : (isThai ? "บันทึกการชำระแล้ว" : "Payment recorded"));
      await onSaved();
    } catch (cause) {
      if (cause instanceof ApiRequestError) idempotencyKey.current = crypto.randomUUID();
      notify.error(isThai ? "บันทึกการชำระไม่สำเร็จ" : "Could not record the payment", { message: message(cause, isThai) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <PanelSection title={isThai ? "บันทึกการชำระ" : "Record payment"}>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SalesField label={isThai ? "จำนวนเงิน" : "Amount"}>
          <input className={f.input} inputMode="decimal" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </SalesField>
        <SalesField label={isThai ? "วิธีชำระ" : "Method"}>
          <CustomDropdown
            value={method}
            onChange={(value) => setMethod(value as PaymentMethod)}
            options={methods.map((item) => ({ value: item, label: methodLabel(item, isThai) }))}
            className="w-full"
            triggerClassName={f.input}
          />
        </SalesField>
        <SalesField label={isThai ? "วันที่ชำระ" : "Paid on"}>
          <DatePicker value={paidOn} onChange={setPaidOn} isThai={isThai} maxDate={today()} />
        </SalesField>
        <SalesField label={isThai ? "เลขอ้างอิง (ถ้ามี)" : "Reference no. (optional)"}>
          <input className={f.input} value={referenceNo} maxLength={100} onChange={(e) => setReferenceNo(e.target.value)} />
        </SalesField>
      </div>
      <div className="flex justify-end">
        <Button variant="primary" loading={saving} disabled={!/^\d+(\.\d{1,2})?$/.test(amount.trim()) || Number(amount) <= 0} onClick={() => void save()}>
          {isThai ? "บันทึกการชำระ" : "Record payment"}
        </Button>
      </div>
    </PanelSection>
  );
}
