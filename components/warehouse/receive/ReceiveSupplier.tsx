"use client";

import { useEffect, useState } from "react";
import { warehouseApi, type PurchaseOrder } from "@/lib/api/warehouse";
import { button, EvidenceLinks, EvidencePicker, Field, input, panel } from "../Ui";

export function SupplierRow({ item }: { item: { id: number; record_no: string; purchase_order_no?: string; supplier_name?: string; external_doc_no: string | null } }) {
  const [detail, setDetail] = useState<Awaited<ReturnType<typeof warehouseApi.supplierReceipt>> | null>(null);
  return <div className="mb-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-white/10"><button className="w-full text-left" onClick={() => void warehouseApi.supplierReceipt(item.id).then(setDetail)}><strong>{item.record_no}</strong> · {item.purchase_order_no} · {item.supplier_name} <span className="text-slate-500">{item.external_doc_no}</span></button>{detail && <div className="mt-3 space-y-2 border-t border-slate-200 pt-3 dark:border-white/10">{detail.lines?.map((line) => <p key={line.id}>{line.product_name} · {line.quantity} × {line.unit_price}</p>)}<EvidenceLinks media={detail.media} /></div>}</div>;
}

export function SupplierForm({ orders, selectedPoId, onSave }: { orders: PurchaseOrder[]; selectedPoId: number | null; onSave: (body: Record<string, unknown>) => void }) {
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
  return <form className={`${panel} space-y-3 self-start`} onSubmit={(event) => { event.preventDefault(); if (!po) return; onSave({ purchaseOrderId: po.id, supplierId: po.supplier_id, externalDocNo: externalDocNo || null, documentDate: date || null, totalAmount: total || null, lines: po.lines?.map((line) => ({ purchaseOrderLineId: line.id, quantity: quantities[line.id] ?? line.quantity, unitPrice: prices[line.id] ?? line.unit_price })), mediaAssetIds: mediaIds, note: note || null }); }}><h2 className="text-lg font-bold">บันทึกเอกสารผู้ขาย</h2><Field label="ค้นหา PO ตามเลขที่"><input className={input} value={poSearch} onChange={(event) => setPoSearch(event.target.value)} placeholder="พิมพ์อย่างน้อย 2 ตัวอักษร" /></Field><Field label="PO"><select className={input} required value={poId} onChange={(event) => { setPo(null); setPoId(event.target.value); }}><option value="">เลือก PO</option>{availableOrders.map((item) => <option key={item.id} value={item.id}>{item.record_no} · {item.supplier_name}</option>)}</select></Field><Field label="เลขเอกสารบนใบ"><input className={input} value={externalDocNo} onChange={(event) => setExternalDocNo(event.target.value)} /></Field><Field label="วันที่เอกสาร"><input className={input} type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>{po?.lines?.map((line) => <div key={line.id} className="space-y-2"><Field label={`${line.sku} · ${line.product_name} (PO ${line.quantity})`}><input className={input} type="number" min="0" step="0.001" value={quantities[line.id] ?? line.quantity} onChange={(event) => setQuantities({ ...quantities, [line.id]: event.target.value })} /></Field><Field label="ราคาต่อหน่วยตามใบ"><input className={input} type="number" min="0" step="0.01" value={prices[line.id] ?? line.unit_price} onChange={(event) => setPrices({ ...prices, [line.id]: event.target.value })} /></Field></div>)}<Field label="ยอดรวมบนใบ"><input className={input} type="number" min="0" step="0.01" value={total} onChange={(event) => setTotal(event.target.value)} /></Field><Field label="หมายเหตุ"><textarea className={input} value={note} onChange={(event) => setNote(event.target.value)} /></Field><EvidencePicker required onChange={setMediaIds} /><button className={button} disabled={!po || !mediaIds.length}>บันทึกเอกสาร</button></form>;
}
