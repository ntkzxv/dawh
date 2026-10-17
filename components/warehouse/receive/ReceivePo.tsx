"use client";

import { useState, type FormEvent } from "react";
import type { CatalogItem, PurchaseOrder } from "@/lib/api/warehouse";
import { button, Field, input, panel, sanitizeWholeNumberInput, subtleButton } from "../Ui";
import { ProductSearchSelect } from "../ProductSearchSelect";
import Button from "@/components/common/Button";
import CustomDropdown from "@/components/common/CustomDropdown";
import DatePicker from "@/components/common/DatePicker";
import { SidePanelFieldError, sidePanelFormStyles, sidePanelInvalidFieldClassName } from "@/components/common/SidePanel";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";

export function PoDetails({ po, canClose, onEdit, onClose }: { po: PurchaseOrder; canClose: boolean; onEdit: (body: Record<string, unknown>) => void; onClose: () => void }) {
  const isThai = useAppLanguage() === "TH";
  const [date, setDate] = useState(po.ordered_at?.slice(0,10) ?? ""); const [note, setNote] = useState(po.note ?? "");
  const editable = !po.closed_at && !po.supplierReceipts?.length && !po.carrierReceipts?.length;
  return <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/5"><h3 className="font-bold">{po.record_no} · {po.supplier_name}</h3><p>{isThai ? "วันที่สั่ง" : "Order date"} {po.ordered_at?.slice(0,10)} · {isThai ? "CEO ผู้สั่งซื้อจริง" : "Ordering CEO"} #{po.ordered_by_ceo_id}</p>{po.lines?.map((line) => <div key={line.id} className="flex justify-between gap-2 border-t border-slate-200 pt-2 dark:border-white/10"><span>{line.sku} · {line.product_name}</span><span>{isThai ? `สั่ง ${line.quantity} / ดี ${line.counted_good_quantity} / ค้าง ${line.remaining_good_quantity}` : `Ordered ${line.quantity} / Good ${line.counted_good_quantity} / Remaining ${line.remaining_good_quantity}`}</span></div>)}<p className="text-xs text-slate-500 dark:text-zinc-400">{isThai ? "ผู้กรอกเอกสารกับ CEO ผู้สั่งซื้อเป็นคนละข้อมูล" : "The document creator and ordering CEO are recorded separately."}</p>{editable && <form className="space-y-2 border-t border-slate-200 pt-3 dark:border-white/10" onSubmit={(event) => { event.preventDefault(); onEdit({ orderedAt: date, note: note || null }); }}><Field label={isThai ? "แก้วันที่สั่ง" : "Edit order date"}><input className={input} type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></Field><Field label={isThai ? "แก้หมายเหตุ" : "Edit note"}><textarea className={input} value={note} onChange={(event) => setNote(event.target.value)} /></Field><button className={subtleButton}>{isThai ? "บันทึกการแก้ไข" : "Save changes"}</button></form>}{canClose && !po.closed_at && <button className="text-sm font-medium text-rose-600 underline" onClick={() => { if (window.confirm(isThai ? `ปิด PO ${po.record_no}?` : `Close PO ${po.record_no}?`)) onClose(); }}>{isThai ? "ปิด PO" : "Close PO"}</button>}</div>;
}

export function PoForm({ suppliers, ceos, onSave, sidePanel = false, onCancel }: { suppliers: CatalogItem[]; ceos: Array<{ id: number; name: string }>; onSave: (body: Record<string, unknown>) => void; sidePanel?: boolean; onCancel?: () => void }) {
  const isThai = useAppLanguage() === "TH";
  const { theme } = useTheme();
  const styles = sidePanelFormStyles(theme === "light");
  const sidePanelFooter = `${styles.footer} sticky bottom-0 ${theme === "light" ? "bg-white" : "bg-[#282828]"}`;
  const [supplierId, setSupplierId] = useState("");
  const [ceoId, setCeoId] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [lines, setLines] = useState([{ productId: "", quantity: "", unitPrice: "" }]);
  const [errors, setErrors] = useState<string[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const cancel = () => {
    if (!onCancel) return;
    const hasEnteredData = Boolean(
      supplierId ||
      ceoId ||
      date ||
      note.trim() ||
      lines.some((line) => line.productId || line.quantity || line.unitPrice),
    );
    if (hasEnteredData) {
      setShowCancelConfirm(true);
      return;
    }
    onCancel();
  };
  const confirmCancel = () => {
    if (!onCancel) return;
    setShowCancelConfirm(false);
    onCancel();
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors = [
      !supplierId && "supplier",
      !ceoId && "ceo",
      !date && "date",
      ...lines.flatMap((line, index) => [
        !line.productId && `line-${index}-product`,
        (!/^\d{1,15}$/.test(line.quantity) || Number(line.quantity) <= 0) && `line-${index}-quantity`,
        (!/^\d{1,15}(?:\.\d{1,2})?$/.test(line.unitPrice) || Number(line.unitPrice) < 0) && `line-${index}-price`,
      ]),
    ].filter((error): error is string => Boolean(error));
    setErrors(nextErrors);
    if (nextErrors.length) return;
    setShowSaveConfirm(true);
  };
  const confirmSave = () => {
    setShowSaveConfirm(false);
    onSave({
      supplierId: Number(supplierId),
      orderedByCeoId: Number(ceoId),
      orderedAt: date,
      note: note || null,
      lines: lines.map((line) => ({ productId: Number(line.productId), quantity: line.quantity, unitPrice: line.unitPrice })),
    });
  };
  const hasError = (key: string) => errors.includes(key);
  const updateLine = (index: number, patch: Partial<(typeof lines)[number]>) => {
    setLines((current) => current.map((line, itemIndex) => itemIndex === index ? { ...line, ...patch } : line));
    const correctedKeys = Object.keys(patch).map((key) =>
      key === "unitPrice" ? "price" : key,
    );
    setErrors((current) =>
      current.filter(
        (error) => !correctedKeys.some((key) => error === `line-${index}-${key}`),
      ),
    );
  };
  const fieldClass = sidePanel ? styles.input : input;
  return (
    <form className={`${sidePanel ? "space-y-4 py-6" : `${panel} space-y-3 self-start`}`} onSubmit={submit} noValidate>
      {!sidePanel && <h2 className="text-lg font-bold">{isThai ? "บันทึก PO ที่ CEO สั่ง" : "Record a CEO purchase order"}</h2>}
      <Field label={isThai ? "ผู้ขาย" : "Supplier"}>
        {sidePanel ? (
          <CustomDropdown value={supplierId} onChange={(value) => { setSupplierId(value); setErrors((current) => current.filter((error) => error !== "supplier")); }} placeholder={isThai ? "เลือกผู้ขาย" : "Select supplier"} options={suppliers.filter((item) => item.active !== false).map((item) => ({ value: String(item.id), label: item.name }))} className="w-full" triggerClassName={`${styles.dropdown} ${hasError("supplier") ? sidePanelInvalidFieldClassName : ""}`} aria-invalid={hasError("supplier")} />
        ) : (
          <select className={`${fieldClass} ${hasError("supplier") ? sidePanelInvalidFieldClassName : ""}`} required value={supplierId} onChange={(event) => { setSupplierId(event.target.value); setErrors((current) => current.filter((error) => error !== "supplier")); }} aria-invalid={hasError("supplier")}><option value="">{isThai ? "เลือกผู้ขาย" : "Select supplier"}</option>{suppliers.filter((item) => item.active !== false).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        )}
        {hasError("supplier") && <SidePanelFieldError>{isThai ? "กรุณาเลือกผู้ขาย" : "Choose a supplier."}</SidePanelFieldError>}
      </Field>
      <Field label={isThai ? "CEO ผู้สั่งซื้อจริง" : "Ordering CEO"}>
        {sidePanel ? (
          <CustomDropdown value={ceoId} onChange={(value) => { setCeoId(value); setErrors((current) => current.filter((error) => error !== "ceo")); }} placeholder={isThai ? "เลือก CEO" : "Select CEO"} options={ceos.map((item) => ({ value: String(item.id), label: item.name }))} className="w-full" triggerClassName={`${styles.dropdown} ${hasError("ceo") ? sidePanelInvalidFieldClassName : ""}`} aria-invalid={hasError("ceo")} />
        ) : (
          <select className={`${fieldClass} ${hasError("ceo") ? sidePanelInvalidFieldClassName : ""}`} required value={ceoId} onChange={(event) => { setCeoId(event.target.value); setErrors((current) => current.filter((error) => error !== "ceo")); }} aria-invalid={hasError("ceo")}><option value="">{isThai ? "เลือก CEO" : "Select CEO"}</option>{ceos.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        )}
        {hasError("ceo") && <SidePanelFieldError>{isThai ? "กรุณาเลือก CEO ที่เป็นผู้สั่งซื้อจริง" : "Choose the CEO who placed the order."}</SidePanelFieldError>}
      </Field>
      <Field label={isThai ? "วันที่สั่ง" : "Order date"}>
        {sidePanel ? <DatePicker value={date} onChange={(value) => { setDate(value); setErrors((current) => current.filter((error) => error !== "date")); }} isThai={isThai} size="md" triggerClassName={`${styles.dropdown} ${hasError("date") ? sidePanelInvalidFieldClassName : ""}`} /> : <input className={`${fieldClass} ${hasError("date") ? sidePanelInvalidFieldClassName : ""}`} type="date" required value={date} onChange={(event) => { setDate(event.target.value); setErrors((current) => current.filter((error) => error !== "date")); }} aria-invalid={hasError("date")} />}
        {hasError("date") && <SidePanelFieldError>{isThai ? "กรุณาระบุวันที่สั่ง" : "Choose an order date."}</SidePanelFieldError>}
      </Field>
      {lines.map((line, index) => (
        <div key={index} className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-white/10">
          <ProductSearchSelect isThai={isThai} value={line.productId} onChange={(value) => updateLine(index, { productId: value })} useCommonDropdown={sidePanel} invalid={hasError(`line-${index}-product`)} dropdownTriggerClassName={`${styles.dropdown} ${hasError(`line-${index}-product`) ? sidePanelInvalidFieldClassName : ""}`} />
          {hasError(`line-${index}-product`) && <SidePanelFieldError>{isThai ? "กรุณาเลือกสินค้า" : "Choose a product."}</SidePanelFieldError>}
          <div className="grid grid-cols-2 gap-2">
            <div><input className={`${fieldClass} ${hasError(`line-${index}-quantity`) ? sidePanelInvalidFieldClassName : ""}`} type="text" inputMode="numeric" pattern="[0-9]*" placeholder={isThai ? "จำนวน" : "Quantity"} required value={line.quantity} onChange={(event) => updateLine(index, { quantity: sanitizeWholeNumberInput(event.target.value, false, line.quantity) })} aria-invalid={hasError(`line-${index}-quantity`)} />{hasError(`line-${index}-quantity`) && <SidePanelFieldError>{isThai ? "ระบุจำนวนสินค้าเป็นจำนวนเต็มมากกว่า 0" : "Enter a whole number greater than 0."}</SidePanelFieldError>}</div>
            <div><input className={`${fieldClass} ${hasError(`line-${index}-price`) ? sidePanelInvalidFieldClassName : ""}`} type="number" min="0" step="0.01" placeholder={isThai ? "ราคา/หน่วย" : "Price per unit"} required value={line.unitPrice} onChange={(event) => updateLine(index, { unitPrice: event.target.value })} aria-invalid={hasError(`line-${index}-price`)} />{hasError(`line-${index}-price`) && <SidePanelFieldError>{isThai ? "ระบุราคา 0 ขึ้นไป (ทศนิยมไม่เกิน 2 ตำแหน่ง)" : "Enter a nonnegative price with up to 2 decimals."}</SidePanelFieldError>}</div>
          </div>
          {lines.length > 1 && <button type="button" className="text-sm text-rose-600" onClick={() => { setLines((current) => current.filter((_, i) => i !== index)); setErrors((current) => current.filter((error) => !error.startsWith("line-"))); }}>{isThai ? "ลบบรรทัด" : "Remove line"}</button>}
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => setLines([...lines, { productId: "", quantity: "", unitPrice: "" }])}>{isThai ? "เพิ่มสินค้า" : "Add product"}</Button>
      <Field label={isThai ? "หมายเหตุ" : "Note"}><textarea className={`${fieldClass} min-h-28 resize-y`} rows={4} value={note} onChange={(event) => setNote(event.target.value)} /></Field>
      {sidePanel ? (
        <div className={sidePanelFooter}>
          <Button variant="outline" onClick={cancel}>{isThai ? "ยกเลิก" : "Cancel"}</Button>
          <Button type="submit" variant="primary">{isThai ? "บันทึก PO" : "Save PO"}</Button>
        </div>
      ) : <button className={button}>{isThai ? "บันทึก PO" : "Save PO"}</button>}
      {showSaveConfirm && (
        <div
          className={sidePanel ? "fixed inset-y-0 right-0 z-[120] flex w-full max-w-[560px] items-center justify-center bg-black/40 p-5" : "fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-5"}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowSaveConfirm(false);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-po-save-title"
            aria-describedby="confirm-po-save-description"
            className={`w-full max-w-sm space-y-4 rounded-2xl border p-5 shadow-2xl ${theme === "light" ? "border-slate-200 bg-white text-[#222222]" : "border-white/10 bg-[#383838] text-white"}`}
          >
            <div className="space-y-2">
              <h3 id="confirm-po-save-title" className="text-base font-semibold">{isThai ? "ยืนยันสร้างใบสั่งซื้อ" : "Confirm purchase order"}</h3>
              <p id="confirm-po-save-description" className="text-sm text-slate-500 dark:text-zinc-300">{isThai ? "ตรวจสอบผู้ขาย CEO ผู้สั่งซื้อ วันที่ และรายการสินค้าให้ถูกต้องก่อนสร้าง PO" : "Review the supplier, ordering CEO, date, and line items before creating this PO."}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveConfirm(false)}>{isThai ? "กลับไปตรวจสอบ" : "Review form"}</Button>
              <Button variant="primary" onClick={confirmSave}>{isThai ? "ยืนยันสร้าง PO" : "Confirm and create"}</Button>
            </div>
          </section>
        </div>
      )}
      {sidePanel && showCancelConfirm && (
        <div
          className="fixed inset-y-0 right-0 z-[120] flex w-full max-w-[560px] items-center justify-center bg-black/40 p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setShowCancelConfirm(false);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="cancel-po-title"
            aria-describedby="cancel-po-description"
            className={`w-full max-w-sm space-y-4 rounded-2xl border p-5 shadow-2xl ${theme === "light" ? "border-slate-200 bg-white text-[#222222]" : "border-white/10 bg-[#383838] text-white"}`}
          >
            <div className="space-y-2">
              <h3 id="cancel-po-title" className="text-base font-semibold">{isThai ? "ยืนยันออกจากฟอร์ม" : "Leave this form?"}</h3>
              <p id="cancel-po-description" className="text-sm text-slate-500 dark:text-zinc-300">{isThai ? "คุณกรอกข้อมูลไว้แล้ว หากออกจากฟอร์ม ข้อมูลที่กรอกจะไม่ถูกบันทึก" : "You have entered data. Leaving now will discard your changes."}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>{isThai ? "อยู่ต่อ" : "Stay"}</Button>
              <Button variant="danger" onClick={confirmCancel}>{isThai ? "ออกจากฟอร์ม" : "Leave form"}</Button>
            </div>
          </section>
        </div>
      )}
    </form>
  );
}
