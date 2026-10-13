"use client";

import { useEffect, useState } from "react";
import { warehouseApi, type PurchaseOrder } from "@/lib/api/warehouse";
import { button, EvidenceLinks, EvidencePicker, Field, input, panel } from "../Ui";
import Button from "@/components/common/Button";
import DatePicker from "@/components/common/DatePicker";
import { sidePanelFormStyles } from "@/components/common/SidePanel";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";

export function SupplierRow({ item }: { item: { id: number; record_no: string; purchase_order_no?: string; supplier_name?: string; external_doc_no: string | null } }) {
  const isThai = useAppLanguage() === "TH";
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof warehouseApi.supplierReceipt>> | null>(null);
  return <div className="mb-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-white/10"><button className="w-full text-left" onClick={() => void warehouseApi.supplierReceipt(item.id).then(setDetail)}><strong>{item.record_no}</strong> · {item.purchase_order_no} · {item.supplier_name} <span className="text-slate-500 dark:text-zinc-400">{item.external_doc_no}</span><span className="sr-only">{isThai ? "ดูรายละเอียด" : "View details"}</span></button>{detail && <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-white/10">{detail.lines?.map((line) => <p key={line.id}>{line.product_name} · {line.quantity} × {line.unit_price}</p>)}<EvidenceLinks media={detail.media} /></div>}</div>;
}

export function SupplierForm({ orders, selectedPoId, onSave, sidePanel = false, onCancel }: { orders: PurchaseOrder[]; selectedPoId: number | null; onSave: (body: Record<string, unknown>) => void; sidePanel?: boolean; onCancel?: () => void }) {
  const isThai = useAppLanguage() === "TH";
  const { theme } = useTheme();
  const styles = sidePanelFormStyles(theme === "light");
  const sidePanelFooter = `${styles.footer} sticky bottom-0 ${theme === "light" ? "bg-white" : "bg-[#282828]"}`;
  const [poId, setPoId] = useState(String(selectedPoId ?? "")); const [po, setPo] = useState<PurchaseOrder | null>(null); const [externalDocNo, setExternalDocNo] = useState(""); const [date, setDate] = useState(""); const [total, setTotal] = useState(""); const [mediaIds, setMediaIds] = useState<number[]>([]); const [quantities, setQuantities] = useState<Record<number,string>>({}); const [prices, setPrices] = useState<Record<number,string>>({}); const [note, setNote] = useState("");
  const [poSearch, setPoSearch] = useState(""); const [searchResults, setSearchResults] = useState<PurchaseOrder[]>([]);
  useEffect(() => {
    const query = poSearch.trim();
    if (query.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void warehouseApi.purchaseOrdersPage(null, controller.signal, query)
        .then((result) => setSearchResults(result.items))
        .catch(() => { if (!controller.signal.aborted) setSearchResults([]); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [poSearch]);
  useEffect(() => {
    if (!poId) return;
    const controller = new AbortController();
    void warehouseApi.purchaseOrder(Number(poId), controller.signal)
      .then(setPo).catch(() => undefined);
    return () => controller.abort();
  }, [poId]);
  const searchableOrders = poSearch.trim().length >= 2 ? searchResults : [];
  const availableOrders = [...new Map([...orders, ...searchableOrders, ...(po ? [po] : [])].map((item) => [item.id, item])).values()].filter((item) => !item.closed_at);
  const fieldClass = sidePanel ? styles.input : input;
  return (
    <form className={sidePanel ? "space-y-4 py-6" : `${panel} space-y-3 self-start`} onSubmit={(event) => { event.preventDefault(); if (!po) return; onSave({ purchaseOrderId: po.id, supplierId: po.supplier_id, externalDocNo: externalDocNo || null, documentDate: date || null, totalAmount: total || null, lines: po.lines?.map((line) => ({ purchaseOrderLineId: line.id, quantity: quantities[line.id] ?? line.quantity, unitPrice: prices[line.id] ?? line.unit_price })), mediaAssetIds: mediaIds, note: note || null }); }}>
      {!sidePanel && <h2 className="text-lg font-bold">{isThai ? "บันทึกเอกสารผู้ขาย" : "Record supplier document"}</h2>}
      <Field label={isThai ? "ค้นหา PO ตามเลขที่" : "Search POs by number"}><input className={fieldClass} value={poSearch} onChange={(event) => setPoSearch(event.target.value)} placeholder={isThai ? "พิมพ์อย่างน้อย 2 ตัวอักษร" : "Type at least 2 characters"} /></Field>
      <Field label="PO"><select className={fieldClass} required value={poId} onChange={(event) => { setPo(null); setPoId(event.target.value); }}><option value="">{isThai ? "เลือก PO" : "Select PO"}</option>{availableOrders.map((item) => <option key={item.id} value={item.id}>{item.record_no} · {item.supplier_name}</option>)}</select></Field>
      <Field label={isThai ? "เลขเอกสารบนใบ" : "Supplier document number"}><input className={fieldClass} value={externalDocNo} onChange={(event) => setExternalDocNo(event.target.value)} /></Field>
      <Field label={isThai ? "วันที่เอกสาร" : "Document date"}><DatePicker value={date} onChange={setDate} isThai={isThai} size="md" triggerClassName={sidePanel ? styles.dropdown : undefined} /></Field>
      {po?.lines?.map((line) => <div key={line.id} className="space-y-2"><Field label={`${line.sku} · ${line.product_name} (PO ${line.quantity})`}><input className={fieldClass} type="number" min="0" step="0.001" value={quantities[line.id] ?? line.quantity} onChange={(event) => setQuantities({ ...quantities, [line.id]: event.target.value })} /></Field><Field label={isThai ? "ราคาต่อหน่วยตามใบ" : "Unit price on document"}><input className={fieldClass} type="number" min="0" step="0.01" value={prices[line.id] ?? line.unit_price} onChange={(event) => setPrices({ ...prices, [line.id]: event.target.value })} /></Field></div>)}
      <Field label={isThai ? "ยอดรวมบนใบ" : "Total on document"}><input className={fieldClass} type="number" min="0" step="0.01" value={total} onChange={(event) => setTotal(event.target.value)} /></Field>
      <Field label={isThai ? "หมายเหตุ" : "Note"}><textarea className={fieldClass} value={note} onChange={(event) => setNote(event.target.value)} /></Field>
      <EvidencePicker required onChange={setMediaIds} />
      {sidePanel ? <div className={sidePanelFooter}><Button variant="outline" onClick={onCancel}>{isThai ? "ยกเลิก" : "Cancel"}</Button><Button type="submit" variant="primary" disabled={!po || !mediaIds.length}>{isThai ? "บันทึกเอกสาร" : "Save document"}</Button></div> : <button className={button} disabled={!po || !mediaIds.length}>{isThai ? "บันทึกเอกสาร" : "Save document"}</button>}
    </form>
  );
}
