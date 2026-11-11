"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { ArrowLeft, Loader2, Plus, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/common/Button";
import CustomDropdown from "@/components/common/CustomDropdown";
import SidePanel from "@/components/common/SidePanel";
import CustomerForm from "@/components/sales/CustomerForm";
import SalesPageFrame from "@/components/sales/SalesPageFrame";
import { Card, Segmented, SalesField, useFormStyles } from "@/components/sales/SalesUi";
import { baht, methodLabel } from "@/components/sales/SalesTransactionsPage";
import { useDebouncedValue } from "@/components/sales/useDebouncedValue";
import DatePicker from "@/components/common/DatePicker";
import { Notice, message, useRemote } from "@/components/warehouse/Ui";
import { useNotification } from "@/context/NotificationContext";
import { ApiRequestError } from "@/lib/api/client";
import { salesApi, type Customer, type PaymentMethod, type SellableProduct } from "@/lib/api/sales";
import { warehouseApi } from "@/lib/api/warehouse";
import { buildSchedule } from "@/lib/sales/schedule";
import { ApiError } from "@/lib/core/http/errors";
import { useAppLanguage } from "@/utils/language";

type FormLine = { key: number; product: SellableProduct | null; quantity: string; unitPrice: string; serials: string[] };
const methods: PaymentMethod[] = ["CASH", "TRANSFER", "CREDIT_CARD"];
type FormGuarantor = { key: number; fullName: string; phone: string; citizenId: string; address: string; relationship: string };
const emptyGuarantor = (): FormGuarantor => ({ key: ++lineKey, fullName: "", phone: "", citizenId: "", address: "", relationship: "" });
const satang = (value: string) => {
  const [baht, fraction = ""] = value.split(".");
  return BigInt(baht || "0") * BigInt(100) + BigInt(fraction.padEnd(2, "0").slice(0, 2));
};
let lineKey = 0;
const emptyLine = (): FormLine => ({ key: ++lineKey, product: null, quantity: "1", unitPrice: "", serials: [] });

function StockProductSelect({ warehouseId, product, excluded, isThai, onSelect }: {
  warehouseId: string;
  product: SellableProduct | null;
  excluded: number[];
  isThai: boolean;
  onSelect: (product: SellableProduct) => void;
}) {
  const f = useFormStyles();
  const [typed, setTyped] = useState("");
  const [open, setOpen] = useState(false);
  const q = useDebouncedValue(typed);
  const load = useCallback((signal: AbortSignal) => salesApi.sellableStock(warehouseId, q, signal), [warehouseId, q]);
  const { data, loading } = useRemote(load, { enabled: open && !!warehouseId });
  const label = (item: SellableProduct) => `${item.sku} · ${item.name} · ${isThai ? "คงเหลือ" : "On hand"} ${Number(item.on_hand)}`;
  const items = (data ?? []).filter((item) => !excluded.includes(item.id));
  return (
    <SalesField label={isThai ? "สินค้า" : "Product"}>
      <CustomDropdown
        value={product ? String(product.id) : ""}
        onChange={(value) => { const next = items.find((item) => String(item.id) === value); if (next) onSelect(next); }}
        options={[
          ...(product ? [{ value: String(product.id), label: label(product) }] : []),
          ...items.filter((item) => item.id !== product?.id).map((item) => ({ value: String(item.id), label: label(item) })),
        ]}
        placeholder={warehouseId ? (isThai ? "ค้นหาสินค้าในคลัง" : "Search products in stock") : (isThai ? "เลือกคลังก่อน" : "Select a warehouse first")}
        disabled={!warehouseId}
        className="w-full"
        triggerClassName={f.input}
        searchable
        searchPlaceholder={isThai ? "ค้นหา SKU หรือชื่อสินค้า" : "Search SKU or product name"}
        onOpen={() => setOpen(true)}
        onSearchChange={setTyped}
        icon={loading ? <Loader2 size={14} className="animate-spin" aria-hidden="true" /> : undefined}
      />
    </SalesField>
  );
}

export default function NewSalePage() {
  const isThai = useAppLanguage() === "TH";
  const f = useFormStyles();
  const router = useRouter();
  const { notify } = useNotification();
  const idempotencyKey = useRef(crypto.randomUUID());
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [addingCustomer, setAddingCustomer] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const customerQuery = useDebouncedValue(customerSearch);
  const [customerSearchOpen, setCustomerSearchOpen] = useState(false);
  const [warehouseId, setWarehouseId] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [referenceNo, setReferenceNo] = useState("");
  const [lines, setLines] = useState<FormLine[]>([emptyLine()]);
  const [saving, setSaving] = useState(false);
  const [installment, setInstallment] = useState(false);
  const [down, setDown] = useState("0");
  const [rate, setRate] = useState("0");
  const [months, setMonths] = useState("12");
  const [firstDueOn, setFirstDueOn] = useState("");
  const [guarantors, setGuarantors] = useState<FormGuarantor[]>([]);

  const loadCustomers = useCallback(
    async (signal: AbortSignal) => (await salesApi.customersPage(null, customerQuery, signal)).items,
    [customerQuery],
  );
  const customers = useRemote(loadCustomers, { enabled: customerSearchOpen });
  const loadWarehouses = useCallback((signal: AbortSignal) => warehouseApi.catalog("warehouses", signal), []);
  const warehouses = useRemote(loadWarehouses);

  const updateLine = (key: number, patch: Partial<FormLine>) =>
    setLines((current) => current.map((line) => (line.key === key ? { ...line, ...patch } : line)));
  const pricedTotal = lines.reduce(
    (sum, line) => sum + (line.unitPrice ? Math.round(Number(line.quantity || 0) * Number(line.unitPrice) * 100) : 0),
    0,
  );
  // Preview only: the server recomputes everything and stays the source of truth.
  const preview = (() => {
    if (!installment || !firstDueOn || !/^\d{1,13}(\.\d{1,2})?$/.test(down) || !/^\d+$/.test(months)) return null;
    try {
      return buildSchedule({
        priceSatang: BigInt(pricedTotal),
        ratePct: rate,
        downSatang: satang(down),
        months: Number(months),
        firstDueOn,
      });
    } catch (cause) {
      return cause instanceof ApiError ? cause : null;
    }
  })();
  // Lines on default prices are unknown to the preview, so it only blocks when it has a price to work with.
  const scheduleOk = !installment || (!!firstDueOn && (pricedTotal === 0 || (!!preview && !(preview instanceof ApiError))));
  const needsMethod = !installment || satang(down || "0") > BigInt(0);
  const ready = scheduleOk && !!customer && !!warehouseId && lines.every(
    (line) =>
      line.product &&
      Number(line.quantity) > 0 &&
      Number(line.quantity) <= Number(line.product.on_hand) &&
      (!line.product.serial_tracked || line.serials.length === Number(line.quantity)),
  );

  async function save() {
    if (!customer) return;
    setSaving(true);
    try {
      await salesApi.createSale(
        {
          customerId: customer.id,
          warehouseId: Number(warehouseId),
          saleType: installment ? "INSTALLMENT" : "CASH",
          paymentMethod: needsMethod ? method : undefined,
          installment: installment
            ? {
                downPayment: down,
                interestRate: rate,
                months: Number(months),
                firstDueOn,
                guarantors: guarantors.map((g) => ({
                  fullName: g.fullName,
                  phone: g.phone,
                  citizenId: g.citizenId || undefined,
                  address: g.address || undefined,
                  relationship: g.relationship || undefined,
                })),
              }
            : undefined,
          referenceNo: referenceNo.trim() || undefined,
          lines: lines.map((line) => ({
            productId: line.product!.id,
            quantity: line.quantity,
            unitPrice: line.unitPrice || undefined,
            serialNumbers: line.serials,
          })),
        },
        idempotencyKey.current,
      );
      notify.success(isThai ? "บันทึกการขายแล้ว" : "Sale recorded");
      router.push("/sales/transactions");
    } catch (cause) {
      // A server response means nothing was saved, so the next attempt needs a fresh key.
      if (cause instanceof ApiRequestError) idempotencyKey.current = crypto.randomUUID();
      notify.error(isThai ? "บันทึกการขายไม่สำเร็จ" : "Could not record the sale", { message: message(cause, isThai) });
    } finally {
      setSaving(false);
    }
  }

  return (
    <SalesPageFrame titleEn="Record a sale" titleTh="บันทึกการขาย" narrow>
      <Link href="/sales/transactions" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-muted)] hover:underline">
        <ArrowLeft size={14} aria-hidden="true" />
        {isThai ? "กลับไปรายการขาย" : "Back to sales"}
      </Link>
      {warehouses.error && <Notice tone="error">{warehouses.error}</Notice>}

      <Card title={isThai ? "ลูกค้า" : "Customer"}>
        {customer && (
          <p className="text-sm">{customer.full_name} · {customer.phone}</p>
        )}
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-64 flex-1">
            <CustomDropdown
              value={customer ? String(customer.id) : ""}
              onChange={(value) => setCustomer(customers.data?.find((item) => String(item.id) === value) ?? customer)}
              options={[
                ...(customer ? [{ value: String(customer.id), label: `${customer.full_name} · ${customer.phone}` }] : []),
                ...(customers.data ?? []).filter((item) => item.id !== customer?.id).map((item) => ({ value: String(item.id), label: `${item.full_name} · ${item.phone}` })),
              ]}
              placeholder={isThai ? "ค้นหาลูกค้า (ชื่อ เบอร์โทร เลขบัตร)" : "Search customer (name, phone, citizen ID)"}
              className="w-full"
              triggerClassName={f.input}
              searchable
              searchPlaceholder={isThai ? "ค้นหาลูกค้า" : "Search customers"}
              onOpen={() => setCustomerSearchOpen(true)}
              onSearchChange={setCustomerSearch}
            />
          </div>
          <Button variant="outline" icon={<UserPlus size={14} aria-hidden="true" />} onClick={() => setAddingCustomer(true)}>
            {isThai ? "เพิ่มลูกค้าใหม่" : "New customer"}
          </Button>
        </div>
      </Card>
      {addingCustomer && (
        <SidePanel
          item={null}
          onClose={() => setAddingCustomer(false)}
          eyebrow={isThai ? "สร้างข้อมูลใหม่" : "New customer"}
          title={isThai ? "เพิ่มลูกค้า" : "Add customer"}
        >
          <CustomerForm
            onCancel={() => setAddingCustomer(false)}
            onSaved={(saved) => { setCustomer(saved); setAddingCustomer(false); }}
          />
        </SidePanel>
      )}

      <Card title={isThai ? "สินค้า" : "Products"}>
        <SalesField label={isThai ? "คลังสินค้า" : "Warehouse"}>
          <CustomDropdown
            value={warehouseId}
            onChange={(value) => { setWarehouseId(value); setLines([emptyLine()]); }}
            options={(warehouses.data ?? []).filter((item) => item.active !== false).map((item) => ({ value: String(item.id), label: `${item.code ?? ""} ${item.name}`.trim() }))}
            placeholder={isThai ? "เลือกคลัง" : "Select warehouse"}
            disabled={warehouses.loading}
            className="w-full"
            triggerClassName={f.input}
          />
        </SalesField>
        {lines.map((line) => (
          <div key={line.key} className="grid gap-3 rounded-lg border border-[#E4E4E7] bg-[#F8FAFC] p-4 dark:border-[#444444] dark:bg-[#222222] md:grid-cols-[2fr_1fr_1fr_2fr_auto]">
            <StockProductSelect
              warehouseId={warehouseId}
              product={line.product}
              excluded={lines.flatMap((other) => (other.key !== line.key && other.product ? [other.product.id] : []))}
              isThai={isThai}
              onSelect={(product) =>
                updateLine(line.key, { product, unitPrice: product.sale_price ?? "", serials: [], quantity: product.serial_tracked ? "0" : "1" })
              }
            />
            <SalesField label={isThai ? "จำนวน" : "Quantity"}>
              <input
                className={f.input}
                inputMode="decimal"
                value={line.quantity}
                readOnly={!!line.product?.serial_tracked}
                aria-invalid={!!line.product && Number(line.quantity) > Number(line.product.on_hand)}
                onChange={(e) => updateLine(line.key, { quantity: e.target.value })}
              />
              {line.product && (
                <span className={`text-xs ${Number(line.quantity) > Number(line.product.on_hand) ? "text-[var(--status-danger-text)]" : "text-[var(--text-muted)]"}`}>
                  {isThai ? "คงเหลือ" : "On hand"} {Number(line.product.on_hand)}
                </span>
              )}
            </SalesField>
            <SalesField label={isThai ? "ราคา/หน่วย" : "Unit price"}>
              <input className={f.input} inputMode="decimal" value={line.unitPrice} placeholder={isThai ? "ราคาตั้งต้น" : "Default price"} onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })} />
            </SalesField>
            {line.product?.serial_tracked ? (
              <SalesField label={isThai ? "หมายเลขซีเรียล" : "Serial numbers"}>
                <div className="max-h-32 space-y-1 overflow-auto rounded-[8px] border border-[#737D88] bg-[#F8FAFC] p-2 text-[13px] dark:border-[#E4E4E7] dark:bg-[#222222]">
                  {line.product.serials.map((serial) => (
                    <label key={serial} className="flex cursor-pointer items-center gap-2">
                      <input
                        type="checkbox"
                        checked={line.serials.includes(serial)}
                        onChange={(e) => {
                          const serials = e.target.checked ? [...line.serials, serial] : line.serials.filter((item) => item !== serial);
                          updateLine(line.key, { serials, quantity: String(serials.length) });
                        }}
                      />
                      <span className="font-mono text-xs">{serial}</span>
                    </label>
                  ))}
                </div>
              </SalesField>
            ) : <div />}
            <div className="flex items-end">
              <Button
                variant="outline"
                aria-label={isThai ? "ลบรายการ" : "Remove line"}
                disabled={lines.length === 1}
                icon={<Trash2 size={14} aria-hidden="true" />}
                onClick={() => setLines((current) => current.filter((item) => item.key !== line.key))}
              />
            </div>
          </div>
        ))}
        <Button variant="outline" icon={<Plus size={14} aria-hidden="true" />} onClick={() => setLines((current) => [...current, emptyLine()])}>
          {isThai ? "เพิ่มสินค้า" : "Add product"}
        </Button>
      </Card>

      <Card title={isThai ? "ประเภทบิล" : "Bill type"}>
        <Segmented
          label={isThai ? "ประเภทบิล" : "Bill type"}
          value={installment ? "installment" : "cash"}
          onChange={(value) => setInstallment(value === "installment")}
          options={[["cash", isThai ? "เงินสด" : "Cash"], ["installment", isThai ? "ผ่อนชำระ" : "Installment"]]}
        />
        {installment && (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <SalesField label={isThai ? "เงินดาวน์" : "Down payment"}>
                <input className={f.input} inputMode="decimal" value={down} onChange={(e) => setDown(e.target.value)} />
              </SalesField>
              <SalesField label={isThai ? "ดอกเบี้ย (%)" : "Interest (%)"}>
                <input className={f.input} inputMode="decimal" value={rate} onChange={(e) => setRate(e.target.value)} />
              </SalesField>
              <SalesField label={isThai ? "จำนวนงวด (เดือน)" : "Months"}>
                <input className={f.input} inputMode="numeric" value={months} onChange={(e) => setMonths(e.target.value)} />
              </SalesField>
              <SalesField label={isThai ? "วันครบกำหนดงวดแรก" : "First due date"}>
                <DatePicker value={firstDueOn} onChange={setFirstDueOn} isThai={isThai} />
              </SalesField>
            </div>
            {preview instanceof ApiError && <Notice tone="error">{Object.values(preview.details ?? {}).join(" ")}</Notice>}
            {preview && !(preview instanceof ApiError) && (
              <div className="space-y-1 text-sm">
                <p>
                  {isThai ? "ดอกเบี้ย" : "Interest"} <span className="font-mono">{baht(String(Number(preview.interestSatang) / 100))}</span>
                  {" · "}{isThai ? "ยอดผ่อน" : "Financed"} <span className="font-mono">{baht(String(Number(preview.financedSatang) / 100))}</span>
                  {" · "}{isThai ? "งวดละ" : "Per month"} <span className="font-mono">{baht(String(Number(preview.installmentSatang) / 100))}</span>
                </p>
                <ul className="max-h-48 overflow-auto font-mono text-xs">
                  {preview.installments.map((row) => (
                    <li key={row.seq}>{row.seq}. {row.dueOn} · {baht(String(Number(row.amountSatang) / 100))}</li>
                  ))}
                </ul>
              </div>
            )}
            <h3 className="text-sm font-bold">{isThai ? "ผู้ค้ำประกัน (ถ้ามี)" : "Guarantors (optional)"}</h3>
            {guarantors.map((g) => (
              <div key={g.key} className="grid gap-3 rounded-lg border border-[#E4E4E7] bg-[#F8FAFC] p-4 dark:border-[#444444] dark:bg-[#222222] md:grid-cols-[repeat(5,1fr)_auto]">
                {(["fullName", "phone", "citizenId", "address", "relationship"] as const).map((field) => (
                  <SalesField key={field} label={{ fullName: isThai ? "ชื่อ-สกุล" : "Full name", phone: isThai ? "เบอร์โทร" : "Phone", citizenId: isThai ? "เลขบัตร" : "Citizen ID", address: isThai ? "ที่อยู่" : "Address", relationship: isThai ? "ความสัมพันธ์" : "Relationship" }[field]}>
                    <input className={f.input} value={g[field]} onChange={(e) => setGuarantors((cur) => cur.map((x) => (x.key === g.key ? { ...x, [field]: e.target.value } : x)))} />
                  </SalesField>
                ))}
                <div className="flex items-end">
                  <Button variant="outline" aria-label={isThai ? "ลบผู้ค้ำ" : "Remove guarantor"} icon={<Trash2 size={14} aria-hidden="true" />} onClick={() => setGuarantors((cur) => cur.filter((x) => x.key !== g.key))} />
                </div>
              </div>
            ))}
            <Button variant="outline" icon={<Plus size={14} aria-hidden="true" />} onClick={() => setGuarantors((cur) => [...cur, emptyGuarantor()])}>
              {isThai ? "เพิ่มผู้ค้ำประกัน" : "Add guarantor"}
            </Button>
          </>
        )}
      </Card>

      <Card title={installment ? (isThai ? "เงินดาวน์" : "Down payment") : (isThai ? "การชำระเงิน" : "Payment")}>
        <div className="grid gap-4 sm:grid-cols-2">
          <SalesField label={isThai ? "วิธีชำระ" : "Method"}>
            <CustomDropdown
              value={method}
              onChange={(value) => setMethod(value as PaymentMethod)}
              options={methods.map((item) => ({ value: item, label: methodLabel(item, isThai) }))}
              className="w-full"
              triggerClassName={f.input}
            />
          </SalesField>
          <SalesField label={isThai ? "เลขอ้างอิง (ถ้ามี)" : "Reference no. (optional)"}>
            <input className={f.input} value={referenceNo} maxLength={100} onChange={(e) => setReferenceNo(e.target.value)} />
          </SalesField>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#444444]/30 pt-4">
          <p className="text-sm">
            {isThai ? "ยอดรวม (เฉพาะรายการที่ระบุราคา; ระบบคำนวณยอดจริงเมื่อบันทึก)" : "Total (priced lines only; the server computes the final amount)"}:{" "}
            <span className="font-mono font-semibold">{baht(String(pricedTotal / 100))}</span>
          </p>
          <Button variant="primary" loading={saving} disabled={!ready} onClick={() => void save()}>
            {isThai ? "บันทึกการขาย" : "Save sale"}
          </Button>
        </div>
      </Card>
    </SalesPageFrame>
  );
}
