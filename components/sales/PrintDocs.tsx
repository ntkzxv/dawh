"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Printer } from "lucide-react";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import { day, kindLabel } from "@/components/sales/ar/ArLists";
import { baht, methodLabel } from "@/components/sales/SalesTransactionsPage";
import { message } from "@/components/warehouse/Ui";
import { ApiRequestError } from "@/lib/api/client";
import { DAWH_LOGOS } from "@/config/brand";
import { salesApi, type Organization } from "@/lib/api/sales";
import { bahtText } from "@/lib/sales/baht-text";
import { useAppLanguage } from "@/utils/language";

export const printReceiptHref = (paymentId: number) => `/print/sales/receipts/${paymentId}`;
export const printBillHref = (saleId: number) => `/print/sales/bills/${saleId}`;

const INK = "#222222";
const label = "text-[10px] font-medium uppercase tracking-wider text-[#6B7280]";
const cell = "border-b border-[#E5E7EB] px-3 py-2";

// Login is still required: a 401 sends the user to login and back to this page.
function Sheet<T>({ load, children }: { load: (signal: AbortSignal) => Promise<T>; children: (data: T, isThai: boolean) => ReactNode }) {
  const isThai = useAppLanguage() === "TH";
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    const ctrl = new AbortController();
    load(ctrl.signal).then(setData, (cause) => {
      if (ctrl.signal.aborted) return;
      if (cause instanceof ApiRequestError && cause.status === 401)
        window.location.replace(`/auth/login?from=${encodeURIComponent(window.location.pathname)}`);
      else setError(message(cause, isThai));
    });
    return () => ctrl.abort();
  }, [load, isThai]);
  if (error) return <p className="p-8 text-red-700">{error}</p>;
  if (!data)
    return (
      <div className="mx-auto max-w-[210mm] space-y-3 p-8">
        <SkeletonBox className="h-8 w-64" />
        <SkeletonBox className="h-4 w-full" />
        <SkeletonBox className="h-40 w-full" />
      </div>
    );
  return (
    <div className="min-h-screen bg-[#F1F5F9] text-[13px] tabular-nums text-[#111827] print:min-h-0 print:bg-white">
      <div className="sticky top-0 z-10 flex justify-end gap-2 border-b border-[#E5E7EB] bg-white px-4 py-2 print:hidden">
        <button
          type="button"
          onClick={() => window.close()}
          className="rounded-md border border-[#E5E7EB] px-3 py-1.5 text-sm hover:bg-[#F1F5F9]"
        >
          {isThai ? "ปิด" : "Close"}
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-2 rounded-md bg-[#222222] px-3 py-1.5 text-sm font-medium text-white hover:bg-black"
        >
          <Printer className="h-4 w-4" />
          {isThai ? "พิมพ์" : "Print"}
        </button>
      </div>
      <main className="relative mx-auto my-6 max-w-[210mm] border border-[#E5E7EB] bg-white p-[14mm] shadow-sm print:my-0 print:max-w-none print:border-0 print:p-0 print:shadow-none">
        <div className="absolute inset-x-0 top-0 h-1 print:hidden" style={{ background: INK }} />
        <div className="hidden h-1 print:block" style={{ background: INK }} />
        <div className="space-y-5 print:pt-4">{children(data, isThai)}</div>
      </main>
    </div>
  );
}

const Header = ({ org, title, subtitle, meta }: { org: Organization | null; title: string; subtitle: string; meta: [string, string][] }) => (
  <header className="flex items-start justify-between gap-6">
    <div className="space-y-1">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={DAWH_LOGOS.horizontal.black} alt={org?.name ?? "DAWH"} className="h-8 w-auto" />
      <p className="text-sm font-bold">{org?.name}</p>
      {org?.address && <p className="text-xs text-[#6B7280]">{org.address}</p>}
      {org?.phone && <p className="text-xs text-[#6B7280]">{org.phone}</p>}
    </div>
    <div className="text-right">
      <p className="text-[24px] font-bold leading-tight" style={{ color: INK }}>{title}</p>
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#6B7280]">{subtitle}</p>
      <dl className="mt-3 grid grid-cols-[auto_auto] justify-end gap-x-4 gap-y-0.5 text-xs">
        {meta.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-[#6B7280]">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  </header>
);

// Rotated bordered stamp; prints too.
const Stamp = ({ text }: { text: string }) => (
  <p
    className="pointer-events-none absolute left-1/2 top-[70mm] -translate-x-1/2 -rotate-12 whitespace-nowrap rounded-lg border-4 px-6 py-2 text-4xl font-extrabold opacity-60"
    style={{ borderColor: "var(--status-danger, #E71D36)", color: "var(--status-danger, #E71D36)" }}
  >
    {text}
  </p>
);

const Panel = ({ title, name, rows }: { title: string; name?: string; rows: (string | null | undefined | [string, string])[] }) => (
  <div className="space-y-1">
    <p className={label}>{title}</p>
    {name && <p className="text-sm font-bold">{name}</p>}
    {rows.map((r, i) =>
      Array.isArray(r) ? (
        <p key={i} className="text-xs"><span className="text-[#6B7280]">{r[0]}: </span>{r[1]}</p>
      ) : r ? (
        <p key={i} className="text-xs text-[#6B7280]">{r}</p>
      ) : null,
    )}
  </div>
);

const Parties = ({ left, right }: { left: ReactNode; right: ReactNode }) => (
  <section className="grid grid-cols-2 gap-6 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-4 [break-inside:avoid]">
    {left}
    {right}
  </section>
);

const Th = ({ children, right }: { children: ReactNode; right?: boolean }) => (
  <th className={`border-b border-[#E5E7EB] bg-[#F3F4F6] px-3 py-2 text-[11px] font-semibold text-[#374151] ${right ? "text-right" : "text-left"}`}>{children}</th>
);

const Words = ({ amount }: { amount: string }) => (
  <p className="rounded-md bg-[#F3F4F6] px-3 py-2 text-center text-sm font-medium">({bahtText(amount)})</p>
);

const Totals = ({ rows, hero }: { rows?: [string, string][]; hero: { label: string; sub: string; value: string; unit: string } }) => (
  <section className="ml-auto w-[88mm] space-y-2 [break-inside:avoid]">
    {rows?.map(([k, v]) => (
      <p key={k} className="flex justify-between text-xs text-[#6B7280]"><span>{k}</span><span>{v}</span></p>
    ))}
    <div className="rounded-md border-2 px-4 py-3 text-right" style={{ borderColor: INK }}>
      <p className="text-xs font-semibold">{hero.label} <span className="text-[10px] uppercase tracking-wider text-[#6B7280]">{hero.sub}</span></p>
      <p className="text-[30px] font-bold leading-tight" style={{ color: INK }}>{hero.value} <span className="text-sm font-medium">{hero.unit}</span></p>
    </div>
  </section>
);

const Signatures = ({ left, right }: { left: { title: string; sub: string; name?: string; date?: string }; right: { title: string; sub: string; name?: string; date?: string } }) => (
  <section className="grid grid-cols-2 gap-16 pt-10 [break-inside:avoid]">
    {[left, right].map((s, i) => (
      <div key={i} className="text-center text-xs">
        <div className="border-b border-dotted border-[#6B7280] pb-1 h-8" />
        <p className="mt-1 font-medium">({"name" in s && s.name ? s.name : " ".repeat(24)})</p>
        <p>{s.title} <span className="text-[#6B7280]">/ {s.sub}</span></p>
        {s.date && <p className="text-[#6B7280]">{s.date}</p>}
      </div>
    ))}
  </section>
);

const Footer = ({ org, th }: { org: Organization | null; th: boolean }) => (
  <footer className="space-y-0.5 border-t border-[#E5E7EB] pt-3 text-center text-[10px] text-[#6B7280]">
    <p>เอกสารนี้ไม่ใช่ใบกำกับภาษี / This document is not a tax invoice</p>
    {org?.phone && <p>{th ? "โทร" : "Tel"} {org.phone}</p>}
  </footer>
);

const Terms = ({ items }: { items: [string, string][] }) => (
  <dl className="grid grid-cols-3 gap-x-6 gap-y-2 rounded-lg border border-[#E5E7EB] p-4 text-xs [break-inside:avoid]">
    {items.map(([k, v]) => (
      <div key={k}>
        <dt className={label}>{k}</dt>
        <dd className="font-medium">{v}</dd>
      </div>
    ))}
  </dl>
);

export function BillPrint({ saleId }: { saleId: number }) {
  const load = useCallback((signal: AbortSignal) => salesApi.sale(saleId, signal), [saleId]);
  return (
    <Sheet load={load}>
      {(sale, th) => {
        const live = sale.payments.filter((p) => !p.voided_at);
        const methods = [...new Set(live.map((p) => methodLabel(p.method, th)))].join(", ") || "-";
        const rows = sale.installments;
        const half = Math.ceil(rows.length / 2);
        const sched = (list: typeof rows) => (
          <table className="w-full border-collapse text-xs">
            <thead>
              <tr>
                <Th>{th ? "งวด" : "No."}</Th>
                <Th>{th ? "วันครบกำหนด" : "Due date"}</Th>
                <Th right>{th ? "จำนวนเงิน" : "Amount"}</Th>
              </tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.seq} className="[break-inside:avoid]">
                  <td className={cell}>{r.seq}</td>
                  <td className={cell}>{day(r.due_on)}</td>
                  <td className={`${cell} text-right`}>{baht(r.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        );
        return (
          <>
            {sale.cancelled_at && <Stamp text="ยกเลิกแล้ว · CANCELLED" />}
            <Header
              org={sale.organization}
              title={th ? "บิลขาย" : "Sales bill"}
              subtitle={th ? "SALES BILL" : "บิลขาย"}
              meta={[[th ? "เลขที่" : "No.", sale.record_no], [th ? "วันที่" : "Date", day(sale.sold_on)]]}
            />
            <Parties
              left={<Panel title={th ? "ลูกค้า / Customer" : "Customer / ลูกค้า"} name={sale.customer_name} rows={[sale.customer_phone, sale.customer_address]} />}
              right={
                <Panel
                  title={th ? "ผู้ขาย / Seller" : "Seller / ผู้ขาย"}
                  rows={[
                    [th ? "ผู้ขาย" : "Sold by", sale.created_by_name],
                    [th ? "สาขา" : "Branch", sale.branch_name],
                    [th ? "ช่องทางชำระ" : "Paid by", methods],
                  ]}
                />
              }
            />
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>{th ? "ลำดับ" : "#"}</Th>
                  <Th>{th ? "รหัส" : "SKU"}</Th>
                  <Th>{th ? "รายการ" : "Item"}</Th>
                  <Th right>{th ? "จำนวน" : "Qty"}</Th>
                  <Th right>{th ? "ราคา/หน่วย" : "Unit price"}</Th>
                  <Th right>{th ? "จำนวนเงิน" : "Amount"}</Th>
                </tr>
              </thead>
              <tbody>
                {sale.lines.map((l, i) => (
                  <tr key={l.id} className="[break-inside:avoid]">
                    <td className={cell}>{i + 1}</td>
                    <td className={cell}>{l.sku}</td>
                    <td className={cell}>
                      {l.product_name}
                      {l.serial_numbers.length > 0 && <div className="text-[10px] text-[#6B7280]">{l.serial_numbers.join(", ")}</div>}
                    </td>
                    <td className={`${cell} text-right`}>{Number(l.quantity)}</td>
                    <td className={`${cell} text-right`}>{baht(l.unit_price)}</td>
                    <td className={`${cell} text-right`}>{baht(l.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Totals hero={{ label: th ? "ยอดรวม" : "Total", sub: th ? "Total" : "ยอดรวม", value: baht(sale.total_amount), unit: th ? "บาท" : "THB" }} />
            <Words amount={sale.total_amount} />
            {sale.sale_type === "INSTALLMENT" && (
              <>
                <section className="space-y-2 [break-inside:avoid]">
                  <p className="text-sm font-bold">{th ? "เงื่อนไขการผ่อนชำระ" : "Installment terms"}</p>
                  <Terms
                    items={[
                      [th ? "ราคาสินค้า" : "Price", baht(sale.total_amount)],
                      [th ? "เงินดาวน์" : "Down payment", baht(sale.down_payment ?? "0")],
                      [th ? "ดอกเบี้ย" : "Interest", `${Number(sale.interest_rate)}% / ${baht(sale.interest_amount ?? "0")}`],
                      [th ? "ยอดผ่อน" : "Financed", baht(sale.financed_amount ?? "0")],
                      [th ? "จำนวนงวด × ค่างวด" : "Months × installment", `${sale.months} × ${baht(sale.installment_amount ?? "0")}`],
                      [th ? "งวดแรก" : "First due", sale.first_due_on ? day(sale.first_due_on) : "-"],
                    ]}
                  />
                </section>
                <section className="grid grid-cols-2 items-start gap-4">
                  {sched(rows.slice(0, half))}
                  {sched(rows.slice(half))}
                </section>
              </>
            )}
            <Signatures
              left={{ title: th ? "ผู้ขาย" : "Seller", sub: th ? "Seller" : "ผู้ขาย", name: sale.created_by_name, date: day(sale.sold_on) }}
              right={{ title: th ? "ลูกค้า" : "Customer", sub: th ? "Customer" : "ลูกค้า" }}
            />
            <Footer org={sale.organization} th={th} />
          </>
        );
      }}
    </Sheet>
  );
}

export function ReceiptPrint({ paymentId }: { paymentId: number }) {
  const load = useCallback((signal: AbortSignal) => salesApi.receipt(paymentId, signal), [paymentId]);
  return (
    <Sheet load={load}>
      {(r, th) => {
        const what =
          r.kind === "CASH_SALE"
            ? th ? `ชำระค่าสินค้าตามบิล ${r.sale_record_no}` : `Payment for goods per bill ${r.sale_record_no}`
            : r.kind === "DOWN_PAYMENT"
              ? th ? `เงินดาวน์ สัญญา ${r.sale_record_no}` : `Down payment, contract ${r.sale_record_no}`
              : th ? `ชำระค่างวด สัญญา ${r.sale_record_no}` : `Installment payment, contract ${r.sale_record_no}`;
        return (
          <>
            {r.voided_at && <Stamp text="ยกเลิกแล้ว · VOIDED" />}
            <Header
              org={r.organization}
              title={th ? "ใบเสร็จรับเงิน" : "Receipt"}
              subtitle={th ? "RECEIPT" : "ใบเสร็จรับเงิน"}
              meta={[
                [th ? "เลขที่" : "No.", r.record_no],
                [th ? "วันที่" : "Date", day(r.paid_on)],
                [th ? "อ้างอิงบิล/สัญญา" : "Bill / contract", r.sale_record_no],
              ]}
            />
            <Parties
              left={<Panel title={th ? "รับเงินจาก / Received from" : "Received from / รับเงินจาก"} name={r.customer_name} rows={[r.customer_phone, r.customer_address]} />}
              right={
                <Panel
                  title={th ? "รายละเอียดการชำระ / Payment" : "Payment / รายละเอียดการชำระ"}
                  rows={[
                    [th ? "ประเภท" : "Type", kindLabel(r.kind, th)],
                    [th ? "ช่องทาง" : "Method", methodLabel(r.method, th)],
                    ...(r.reference_no ? [[th ? "เลขอ้างอิง" : "Ref", r.reference_no] as [string, string]] : []),
                    [th ? "สาขา" : "Branch", r.branch_name],
                  ]}
                />
              }
            />
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr>
                  <Th>{th ? "ลำดับ" : "#"}</Th>
                  <Th>{th ? "รายการ" : "Description"}</Th>
                  <Th right>{th ? "จำนวนเงิน" : "Amount"}</Th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={cell}>1</td>
                  <td className={cell}>{what}</td>
                  <td className={`${cell} text-right`}>{baht(r.amount)}</td>
                </tr>
              </tbody>
            </table>
            <Totals
              rows={[[th ? "ยอดรวมบิล/สัญญา" : "Bill / contract total", baht(r.total_amount)]]}
              hero={{ label: th ? "จำนวนเงินที่รับครั้งนี้" : "Amount received", sub: th ? "Amount received" : "จำนวนเงินที่รับ", value: baht(r.amount), unit: th ? "บาท" : "THB" }}
            />
            <Words amount={r.amount} />
            <Signatures
              left={{ title: th ? "ผู้รับเงิน" : "Received by", sub: th ? "Received by" : "ผู้รับเงิน", name: r.created_by_name, date: day(r.paid_on) }}
              right={{ title: th ? "ผู้จ่ายเงิน" : "Payer", sub: th ? "Payer" : "ผู้จ่ายเงิน" }}
            />
            <Footer org={r.organization} th={th} />
          </>
        );
      }}
    </Sheet>
  );
}
