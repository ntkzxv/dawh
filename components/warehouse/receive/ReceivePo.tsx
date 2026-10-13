"use client";

import { useState, type FormEvent } from "react";
import type { CatalogItem, PurchaseOrder } from "@/lib/api/warehouse";
import { button, Field, input, panel, subtleButton } from "../Ui";
import { ProductSearchSelect } from "../ProductSearchSelect";
import Button from "@/components/common/Button";
import CustomDropdown from "@/components/common/CustomDropdown";
import DatePicker from "@/components/common/DatePicker";
import { sidePanelFormStyles } from "@/components/common/SidePanel";
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
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState("");
  const [lines, setLines] = useState([{ productId: "", quantity: "", unitPrice: "" }]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({
      supplierId: Number(supplierId),
      orderedByCeoId: Number(ceoId),
      orderedAt: date,
      note: note || null,
      lines: lines.map((line) => ({ productId: Number(line.productId), quantity: line.quantity, unitPrice: line.unitPrice })),
    });
  };
  const fieldClass = sidePanel ? styles.input : input;
  return (
    <form className={`${sidePanel ? "space-y-4 py-6" : `${panel} space-y-3 self-start`}`} onSubmit={submit}>
      {!sidePanel && <h2 className="text-lg font-bold">{isThai ? "บันทึก PO ที่ CEO สั่ง" : "Record a CEO purchase order"}</h2>}
      <Field label={isThai ? "ผู้ขาย" : "Supplier"}>
        {sidePanel ? (
          <CustomDropdown value={supplierId} onChange={setSupplierId} placeholder={isThai ? "เลือกผู้ขาย" : "Select supplier"} options={suppliers.filter((item) => item.active !== false).map((item) => ({ value: String(item.id), label: item.name }))} className="w-full" triggerClassName={styles.dropdown} />
        ) : (
          <select className={fieldClass} required value={supplierId} onChange={(event) => setSupplierId(event.target.value)}><option value="">{isThai ? "เลือกผู้ขาย" : "Select supplier"}</option>{suppliers.filter((item) => item.active !== false).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        )}
      </Field>
      <Field label={isThai ? "CEO ผู้สั่งซื้อจริง" : "Ordering CEO"}>
        {sidePanel ? (
          <CustomDropdown value={ceoId} onChange={setCeoId} placeholder={isThai ? "เลือก CEO" : "Select CEO"} options={ceos.map((item) => ({ value: String(item.id), label: item.name }))} className="w-full" triggerClassName={styles.dropdown} />
        ) : (
          <select className={fieldClass} required value={ceoId} onChange={(event) => setCeoId(event.target.value)}><option value="">{isThai ? "เลือก CEO" : "Select CEO"}</option>{ceos.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
        )}
      </Field>
      <Field label={isThai ? "วันที่สั่ง" : "Order date"}>
        {sidePanel ? <DatePicker value={date} onChange={setDate} isThai={isThai} size="md" triggerClassName={styles.dropdown} /> : <input className={fieldClass} type="date" required value={date} onChange={(event) => setDate(event.target.value)} />}
      </Field>
      {lines.map((line, index) => (
        <div key={index} className="space-y-2 rounded-xl border border-slate-200 p-3 dark:border-white/10">
          <ProductSearchSelect isThai={isThai} value={line.productId} onChange={(value) => setLines(lines.map((item, i) => i === index ? { ...item, productId: value } : item))} />
          <div className="grid grid-cols-2 gap-2">
            <input className={fieldClass} type="number" min="0.001" step="0.001" placeholder={isThai ? "จำนวน" : "Quantity"} required value={line.quantity} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, quantity: event.target.value } : item))} />
            <input className={fieldClass} type="number" min="0" step="0.01" placeholder={isThai ? "ราคา/หน่วย" : "Price per unit"} required value={line.unitPrice} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, unitPrice: event.target.value } : item))} />
          </div>
          {lines.length > 1 && <button type="button" className="text-sm text-rose-600" onClick={() => setLines(lines.filter((_, i) => i !== index))}>{isThai ? "ลบบรรทัด" : "Remove line"}</button>}
        </div>
      ))}
      <Button type="button" variant="outline" onClick={() => setLines([...lines, { productId: "", quantity: "", unitPrice: "" }])}>{isThai ? "เพิ่มสินค้า" : "Add product"}</Button>
      <Field label={isThai ? "หมายเหตุ" : "Note"}><textarea className={fieldClass} value={note} onChange={(event) => setNote(event.target.value)} /></Field>
      {sidePanel ? (
        <div className={sidePanelFooter}>
          <Button variant="outline" onClick={onCancel}>{isThai ? "ยกเลิก" : "Cancel"}</Button>
          <Button type="submit" variant="primary" disabled={!supplierId || !ceoId || !date || !suppliers.length || !ceos.length || lines.some((line) => !line.productId || !line.quantity || !line.unitPrice)}>{isThai ? "บันทึก PO" : "Save PO"}</Button>
        </div>
      ) : <button className={button} disabled={!supplierId || !ceoId || !date || !suppliers.length || !ceos.length || lines.some((line) => !line.productId || !line.quantity || !line.unitPrice)}>{isThai ? "บันทึก PO" : "Save PO"}</button>}
    </form>
  );
}
