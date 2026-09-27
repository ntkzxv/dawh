"use client";

import { useState, type FormEvent } from "react";
import type { CarrierReceipt, CatalogItem, PurchaseOrder } from "@/lib/api/warehouse";
import { button, EvidenceLinks, EvidencePicker, Field, input, Notice, panel, subtleButton } from "../Ui";
import { ProductSearchSelect } from "../ProductSearchSelect";

export function CarrierForm({ orders, onSave }: { orders: PurchaseOrder[]; onSave: (body: Record<string, unknown>) => void }) {
  const [code, setCode] = useState("");
  const [external, setExternal] = useState("");
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [packages, setPackages] = useState("");
  const [freight, setFreight] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [mediaIds, setMediaIds] = useState<number[]>([]);
  const [lines, setLines] = useState<Array<{ productId: string; quantity: string }>>([]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({ purchaseOrderCode: code.trim().toUpperCase(), externalDocNo: external || null, documentDate: date || null, carrierName: carrier || null, trackingNo: tracking || null, packageCount: packages ? Number(packages) : null, freightAmount: freight || null, note: note || null, lines: lines.map((line) => ({ productId: Number(line.productId), quantity: line.quantity || null })), mediaAssetIds: mediaIds });
  };
  return <form className={`${panel} space-y-3 self-start`} onSubmit={submit}>
    <h2 className="text-lg font-bold">บันทึกใบขนส่ง</h2>
    <Field label="รหัส PO ที่สั่งของ"><input className={input} required list="po-codes" value={code} onChange={(event) => setCode(event.target.value)} /><datalist id="po-codes">{orders.map((item) => <option key={item.id} value={item.record_no} />)}</datalist></Field>
    <Field label="เลขใบขนส่ง"><input className={input} value={external} onChange={(event) => setExternal(event.target.value)} /></Field>
    <Field label="วันที่เอกสาร"><input className={input} type="date" value={date} onChange={(event) => setDate(event.target.value)} /></Field>
    <Field label="ผู้ขนส่ง"><input className={input} value={carrier} onChange={(event) => setCarrier(event.target.value)} /></Field>
    <Field label="Tracking"><input className={input} value={tracking} onChange={(event) => setTracking(event.target.value)} /></Field>
    <Field label="จำนวนหีบห่อบนใบ"><input className={input} type="number" min="0" value={packages} onChange={(event) => setPackages(event.target.value)} /></Field>
    <Field label="ค่าขนส่ง (ถ้ามี)"><input className={input} type="number" min="0" step="0.01" value={freight} onChange={(event) => setFreight(event.target.value)} /></Field>
    {lines.map((line, index) => <div key={index} className="grid grid-cols-[1fr_100px_auto] gap-2"><ProductSearchSelect label="สินค้าที่ระบุบนใบ" value={line.productId} onChange={(value) => setLines(lines.map((item, i) => i === index ? { ...item, productId: value } : item))} /><input className={input} type="number" min="0" step="0.001" placeholder="จำนวน" value={line.quantity} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, quantity: event.target.value } : item))} /><button type="button" className="text-rose-600" onClick={() => setLines(lines.filter((_, i) => i !== index))}>ลบ</button></div>)}
    <button type="button" className={subtleButton} onClick={() => setLines([...lines, { productId: "", quantity: "" }])}>เพิ่มสินค้าที่มีบนใบ</button>
    <p className="text-xs text-slate-500">หากใบขนส่งไม่มีรายการสินค้า เว้นส่วนนี้ว่างไว้</p>
    <Field label="หมายเหตุ"><textarea className={input} value={note} onChange={(event) => setNote(event.target.value)} /></Field>
    <EvidencePicker required onChange={setMediaIds} />
    <button className={button} disabled={!mediaIds.length}>บันทึกใบขนส่ง</button>
  </form>;
}

export function CarrierDetails({ carrier, branches, onConfirm }: { carrier: CarrierReceipt; branches: CatalogItem[]; onConfirm: (body: Record<string, unknown>) => void }) {
  const [branchId, setBranchId] = useState(""); const [packages, setPackages] = useState(""); const [condition, setCondition] = useState(""); const [mediaIds, setMediaIds] = useState<number[]>([]);
  return <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/5"><h3 className="font-bold">{carrier.record_no} · {carrier.purchase_order_no}</h3><p>{carrier.carrier_name} · {carrier.tracking_no}</p><EvidenceLinks media={carrier.media} />{carrier.confirmation ? <Notice tone="success">รับเข้าที่สาขา #{carrier.confirmation.receiving_branch_id} แล้ว · {carrier.confirmation.actual_package_count} กล่อง</Notice> : <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onConfirm({ receivingBranchId: Number(branchId), actualPackageCount: Number(packages), packageCondition: condition, mediaAssetIds: mediaIds }); }}><h4 className="font-bold">ยืนยันรับจากขนส่ง</h4><Field label="สาขาที่รับจริง"><select className={input} required value={branchId} onChange={(event) => setBranchId(event.target.value)}><option value="">เลือกสาขา</option>{branches.filter((item) => item.active !== false).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label="จำนวนกล่องจริง"><input className={input} type="number" min="0" required value={packages} onChange={(event) => setPackages(event.target.value)} /></Field><Field label="สภาพกล่อง"><input className={input} required value={condition} onChange={(event) => setCondition(event.target.value)} /></Field><EvidencePicker required onChange={setMediaIds} /><button className={button} disabled={!mediaIds.length}>ยืนยันของมาถึง</button><p className="text-xs text-slate-500">ขั้นนี้ยังไม่เพิ่มยอดสินค้า</p></form>}</div>;
}
