"use client";

import { useEffect, useState, type FormEvent } from "react";
import { warehouseApi } from "@/lib/api/warehouse";
import type { CarrierReceipt, CatalogItem, PurchaseOrder } from "@/lib/api/warehouse";
import { button, EvidenceLinks, EvidencePicker, Field, input, Notice, panel, subtleButton } from "../Ui";
import { ProductSearchSelect } from "../ProductSearchSelect";
import Button from "@/components/common/Button";
import DatePicker from "@/components/common/DatePicker";
import { sidePanelFormStyles } from "@/components/common/SidePanel";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";

export function CarrierForm({ orders, onSave, sidePanel = false, onCancel }: { orders: PurchaseOrder[]; onSave: (body: Record<string, unknown>) => void; sidePanel?: boolean; onCancel?: () => void }) {
  const isThai = useAppLanguage() === "TH";
  const { theme } = useTheme();
  const styles = sidePanelFormStyles(theme === "light");
  const sidePanelFooter = `${styles.footer} sticky bottom-0 ${theme === "light" ? "bg-white" : "bg-[#282828]"}`;
  const [code, setCode] = useState("");
  const [searchedOrders, setSearchedOrders] = useState<PurchaseOrder[]>([]);
  const [external, setExternal] = useState("");
  const [carrier, setCarrier] = useState("");
  const [tracking, setTracking] = useState("");
  const [packages, setPackages] = useState("");
  const [freight, setFreight] = useState("");
  const [date, setDate] = useState("");
  const [note, setNote] = useState("");
  const [mediaIds, setMediaIds] = useState<number[]>([]);
  const [lines, setLines] = useState<Array<{ productId: string; quantity: string }>>([]);
  useEffect(() => {
    const query = code.trim();
    if (query.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      void warehouseApi.purchaseOrdersPage(null, controller.signal, query)
        .then((result) => setSearchedOrders(result.items))
        .catch(() => { if (!controller.signal.aborted) setSearchedOrders([]); });
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [code]);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    onSave({ purchaseOrderCode: code.trim().toUpperCase(), externalDocNo: external || null, documentDate: date || null, carrierName: carrier || null, trackingNo: tracking || null, packageCount: packages ? Number(packages) : null, freightAmount: freight || null, note: note || null, lines: lines.map((line) => ({ productId: Number(line.productId), quantity: line.quantity || null })), mediaAssetIds: mediaIds });
  };
  return <form className={sidePanel ? "space-y-4 py-6" : `${panel} space-y-3 self-start`} onSubmit={submit}>
    {!sidePanel && <h2 className="text-lg font-bold">{isThai ? "บันทึกใบขนส่ง" : "Record delivery note"}</h2>}
    <Field label={isThai ? "รหัส PO ที่สั่งของ" : "Purchase order number"}><input className={input} required list="po-codes" value={code} onChange={(event) => setCode(event.target.value)} /><datalist id="po-codes">{[...new Map([...orders, ...(code.trim().length >= 2 ? searchedOrders : [])].map((item) => [item.id, item])).values()].map((item) => <option key={item.id} value={item.record_no}>{item.supplier_name}</option>)}</datalist></Field>
    <Field label={isThai ? "เลขใบขนส่ง" : "Delivery note number"}><input className={input} value={external} onChange={(event) => setExternal(event.target.value)} /></Field>
    <Field label={isThai ? "วันที่เอกสาร" : "Document date"}><DatePicker value={date} onChange={setDate} isThai={isThai} size="md" triggerClassName={sidePanel ? styles.dropdown : undefined} /></Field>
    <Field label={isThai ? "ผู้ขนส่ง" : "Carrier"}><input className={input} value={carrier} onChange={(event) => setCarrier(event.target.value)} /></Field>
    <Field label={isThai ? "หมายเลขติดตามพัสดุ" : "Tracking number"}><input className={input} value={tracking} onChange={(event) => setTracking(event.target.value)} /></Field>
    <Field label={isThai ? "จำนวนหีบห่อบนใบ" : "Package count on document"}><input className={input} type="number" min="0" value={packages} onChange={(event) => setPackages(event.target.value)} /></Field>
    <Field label={isThai ? "ค่าขนส่ง (ถ้ามี)" : "Freight cost (optional)"}><input className={input} type="number" min="0" step="0.01" value={freight} onChange={(event) => setFreight(event.target.value)} /></Field>
    {lines.map((line, index) => <div key={index} className="grid grid-cols-[1fr_100px_auto] gap-2"><ProductSearchSelect isThai={isThai} label={isThai ? "สินค้าที่ระบุบนใบ" : "Products listed on the document"} value={line.productId} onChange={(value) => setLines(lines.map((item, i) => i === index ? { ...item, productId: value } : item))} /><input className={input} type="number" min="0" step="0.001" placeholder={isThai ? "จำนวน" : "Quantity"} value={line.quantity} onChange={(event) => setLines(lines.map((item, i) => i === index ? { ...item, quantity: event.target.value } : item))} /><button type="button" className="text-rose-600" onClick={() => setLines(lines.filter((_, i) => i !== index))}>{isThai ? "ลบ" : "Remove"}</button></div>)}
    <button type="button" className={subtleButton} onClick={() => setLines([...lines, { productId: "", quantity: "" }])}>{isThai ? "เพิ่มสินค้าที่มีบนใบ" : "Add listed product"}</button>
    <p className="text-xs text-slate-500 dark:text-zinc-400">{isThai ? "หากใบขนส่งไม่มีรายการสินค้า เว้นส่วนนี้ว่างไว้" : "Leave this section empty if the delivery note does not list products."}</p>
    <Field label={isThai ? "หมายเหตุ" : "Note"}><textarea className={input} value={note} onChange={(event) => setNote(event.target.value)} /></Field>
    <EvidencePicker required onChange={setMediaIds} />
    {sidePanel ? <div className={sidePanelFooter}><Button variant="outline" onClick={onCancel}>{isThai ? "ยกเลิก" : "Cancel"}</Button><Button type="submit" variant="primary" disabled={!mediaIds.length}>{isThai ? "บันทึกใบขนส่ง" : "Save delivery note"}</Button></div> : <button className={button} disabled={!mediaIds.length}>{isThai ? "บันทึกใบขนส่ง" : "Save delivery note"}</button>}
  </form>;
}

export function CarrierDetails({ carrier, branches, onConfirm }: { carrier: CarrierReceipt; branches: CatalogItem[]; onConfirm: (body: Record<string, unknown>) => void }) {
  const isThai = useAppLanguage() === "TH";
  const [branchId, setBranchId] = useState(""); const [packages, setPackages] = useState(""); const [condition, setCondition] = useState(""); const [mediaIds, setMediaIds] = useState<number[]>([]);
  return <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/5"><h3 className="font-bold">{carrier.record_no} · {carrier.purchase_order_no}</h3><p>{carrier.carrier_name} · {carrier.tracking_no}</p><EvidenceLinks media={carrier.media} />{carrier.confirmation ? <Notice tone="success">{isThai ? `รับเข้าที่สาขา #${carrier.confirmation.receiving_branch_id} แล้ว · ${carrier.confirmation.actual_package_count} กล่อง` : `Received at branch #${carrier.confirmation.receiving_branch_id} · ${carrier.confirmation.actual_package_count} packages.`}</Notice> : <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onConfirm({ receivingBranchId: Number(branchId), actualPackageCount: Number(packages), packageCondition: condition, mediaAssetIds: mediaIds }); }}><h4 className="font-bold">{isThai ? "ยืนยันรับจากขนส่ง" : "Confirm delivery arrival"}</h4><Field label={isThai ? "สาขาที่รับจริง" : "Receiving branch"}><select className={input} required value={branchId} onChange={(event) => setBranchId(event.target.value)}><option value="">{isThai ? "เลือกสาขา" : "Select branch"}</option>{branches.filter((item) => item.active !== false).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label={isThai ? "จำนวนกล่องจริง" : "Actual package count"}><input className={input} type="number" min="0" required value={packages} onChange={(event) => setPackages(event.target.value)} /></Field><Field label={isThai ? "สภาพกล่อง" : "Package condition"}><input className={input} required value={condition} onChange={(event) => setCondition(event.target.value)} /></Field><EvidencePicker required onChange={setMediaIds} /><button className={button} disabled={!mediaIds.length}>{isThai ? "ยืนยันของมาถึง" : "Confirm arrival"}</button><p className="text-xs text-slate-500 dark:text-zinc-400">{isThai ? "ขั้นนี้ยังไม่เพิ่มยอดสินค้า" : "Stock quantities are not updated at this step."}</p></form>}</div>;
}
