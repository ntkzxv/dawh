"use client";

import { useEffect, useState, type FormEvent } from "react";
import { warehouseApi } from "@/lib/api/warehouse";
import type { CarrierReceipt, CatalogItem, PurchaseOrder } from "@/lib/api/warehouse";
import { button, EvidenceLinks, EvidencePicker, Field, input, Notice, panel, sanitizeWholeNumberInput, subtleButton } from "../Ui";
import { ProductSearchSelect } from "../ProductSearchSelect";
import Button from "@/components/common/Button";
import DatePicker from "@/components/common/DatePicker";
import { X } from "lucide-react";
import { SidePanelFieldError, sidePanelFormStyles, sidePanelInvalidFieldClassName } from "@/components/common/SidePanel";
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
  const [errors, setErrors] = useState<string[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [evidencePrepared, setEvidencePrepared] = useState(false);
  const [uploadError, setUploadError] = useState("");
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
  const hasError = (key: string) => errors.includes(key);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const hasEvidence = mediaIds.length > 0 || (pendingFiles.length > 0 && evidencePrepared);
    const nextErrors = [
      !code.trim() && "code",
      !external.trim() && "external",
      !date && "date",
      !carrier.trim() && "carrier",
      !tracking.trim() && "tracking",
      !/^\d{1,15}$/.test(packages) && "packages",
      !freight.trim() && "freight",
      !hasEvidence && "evidence",
      ...lines.flatMap((line, index) => [
        !line.productId && `line-${index}-product`,
        (!/^\d{1,15}$/.test(line.quantity) || Number(line.quantity) <= 0) && `line-${index}-quantity`,
      ]),
    ].filter((error): error is string => Boolean(error));
    setErrors(nextErrors);
    if (nextErrors.length) return;
    setUploadError("");
    setShowSaveConfirm(true);
  };
  const confirmSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    setUploadError("");
    try {
      let assetIds = mediaIds;
      if (!assetIds.length) {
        assetIds = [];
        for (const file of pendingFiles) assetIds.push((await warehouseApi.upload(file)).id);
        setMediaIds(assetIds);
      }
      setShowSaveConfirm(false);
      onSave({ purchaseOrderCode: code.trim().toUpperCase(), externalDocNo: external.trim(), documentDate: date, carrierName: carrier.trim(), trackingNo: tracking.trim(), packageCount: Number(packages), freightAmount: freight, note: note || null, lines: lines.map((line) => ({ productId: Number(line.productId), quantity: line.quantity })), mediaAssetIds: assetIds });
    } catch {
      setUploadError(isThai ? "อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองยืนยันอีกครั้ง" : "File upload failed. Please confirm again to retry.");
      setShowSaveConfirm(false);
    } finally {
      setIsSaving(false);
    }
  };
  const cancel = () => {
    if (!onCancel) return;
    const hasEnteredData = Boolean(
      code.trim() || external.trim() || date || carrier.trim() || tracking.trim() || packages || freight || note.trim() ||
      mediaIds.length || pendingFiles.length || lines.some((line) => line.productId || line.quantity),
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
  const fieldClass = sidePanel ? styles.input : input;
  return <form className={sidePanel ? "space-y-4 py-6" : `${panel} space-y-3 self-start`} onSubmit={submit} noValidate>
    {!sidePanel && <h2 className="text-lg font-bold">{isThai ? "บันทึกใบขนส่ง" : "Record delivery note"}</h2>}
    <Field label={isThai ? "รหัส PO ที่สั่งของ" : "Purchase order number"}>
      <input className={`${fieldClass} ${hasError("code") ? sidePanelInvalidFieldClassName : ""}`} required list="po-codes" value={code} onChange={(event) => { setCode(event.target.value); setErrors((current) => current.filter((error) => error !== "code")); }} aria-invalid={hasError("code")} />
      <datalist id="po-codes">{[...new Map([...orders, ...(code.trim().length >= 2 ? searchedOrders : [])].map((item) => [item.id, item])).values()].map((item) => <option key={item.id} value={item.record_no}>{item.supplier_name}</option>)}</datalist>
      {hasError("code") && <SidePanelFieldError>{isThai ? "กรุณาระบุรหัส PO" : "Enter the purchase order number."}</SidePanelFieldError>}
    </Field>
    <Field label={isThai ? "เลขใบขนส่ง" : "Delivery note number"}>
      <input className={`${fieldClass} ${hasError("external") ? sidePanelInvalidFieldClassName : ""}`} required value={external} onChange={(event) => { setExternal(event.target.value); setErrors((current) => current.filter((error) => error !== "external")); }} aria-invalid={hasError("external")} />
      {hasError("external") && <SidePanelFieldError>{isThai ? "กรุณาระบุเลขใบขนส่ง" : "Enter the delivery note number."}</SidePanelFieldError>}
    </Field>
    <Field label={isThai ? "วันที่เอกสาร" : "Document date"}>
      <DatePicker value={date} onChange={(value) => { setDate(value); setErrors((current) => current.filter((error) => error !== "date")); }} isThai={isThai} size="md" triggerClassName={`${sidePanel ? styles.dropdown : ""} ${hasError("date") ? sidePanelInvalidFieldClassName : ""}`} />
      {hasError("date") && <SidePanelFieldError>{isThai ? "กรุณาระบุวันที่เอกสาร" : "Choose a document date."}</SidePanelFieldError>}
    </Field>
    <Field label={isThai ? "ผู้ขนส่ง" : "Carrier"}>
      <input className={`${fieldClass} ${hasError("carrier") ? sidePanelInvalidFieldClassName : ""}`} required value={carrier} onChange={(event) => { setCarrier(event.target.value); setErrors((current) => current.filter((error) => error !== "carrier")); }} aria-invalid={hasError("carrier")} />
      {hasError("carrier") && <SidePanelFieldError>{isThai ? "กรุณาระบุชื่อผู้ขนส่ง" : "Enter the carrier name."}</SidePanelFieldError>}
    </Field>
    <Field label={isThai ? "หมายเลขติดตามพัสดุ" : "Tracking number"}>
      <input className={`${fieldClass} ${hasError("tracking") ? sidePanelInvalidFieldClassName : ""}`} required value={tracking} onChange={(event) => { setTracking(event.target.value); setErrors((current) => current.filter((error) => error !== "tracking")); }} aria-invalid={hasError("tracking")} />
      {hasError("tracking") && <SidePanelFieldError>{isThai ? "กรุณาระบุหมายเลขติดตามพัสดุ" : "Enter the tracking number."}</SidePanelFieldError>}
    </Field>
    <Field label={isThai ? "จำนวนหีบห่อบนใบ" : "Package count on document"}>
      <input className={`${fieldClass} ${hasError("packages") ? sidePanelInvalidFieldClassName : ""}`} type="text" inputMode="numeric" pattern="[0-9]*" required value={packages} onChange={(event) => { setPackages(sanitizeWholeNumberInput(event.target.value, false, packages)); setErrors((current) => current.filter((error) => error !== "packages")); }} aria-invalid={hasError("packages")} />
      {hasError("packages") && <SidePanelFieldError>{isThai ? "กรุณาระบุจำนวนหีบห่อเป็นจำนวนเต็ม" : "Enter the package count as a whole number."}</SidePanelFieldError>}
    </Field>
    <Field label={isThai ? "ค่าขนส่ง" : "Freight cost"}>
      <input className={`${fieldClass} ${hasError("freight") ? sidePanelInvalidFieldClassName : ""}`} type="number" min="0" step="0.01" required value={freight} onChange={(event) => { setFreight(event.target.value); setErrors((current) => current.filter((error) => error !== "freight")); }} aria-invalid={hasError("freight")} />
      {hasError("freight") && <SidePanelFieldError>{isThai ? "กรุณาระบุค่าขนส่ง (หากไม่มีให้ระบุ 0)" : "Enter the freight cost, or 0 if there is no charge."}</SidePanelFieldError>}
    </Field>
    {lines.map((line, index) => (
      <div key={index} className="grid grid-cols-[minmax(0,1fr)_84px_28px] items-start gap-2">
        <div>
          <ProductSearchSelect isThai={isThai} label={isThai ? "สินค้าบนใบ" : "Listed product"} value={line.productId} onChange={(value) => { setLines((current) => current.map((item, i) => i === index ? { ...item, productId: value } : item)); setErrors((current) => current.filter((error) => error !== `line-${index}-product`)); }} useCommonDropdown={sidePanel} invalid={hasError(`line-${index}-product`)} dropdownTriggerClassName={`${styles.dropdown} ${hasError(`line-${index}-product`) ? sidePanelInvalidFieldClassName : ""}`} />
          {hasError(`line-${index}-product`) && <SidePanelFieldError>{isThai ? "กรุณาเลือกสินค้า" : "Choose a product."}</SidePanelFieldError>}
        </div>
        <div>
          <Field label={isThai ? "จำนวน" : "Qty"} className="block space-y-1.5 text-sm font-medium">
            <input className={`${fieldClass} min-w-0 px-2 text-center ${hasError(`line-${index}-quantity`) ? sidePanelInvalidFieldClassName : ""}`} type="text" inputMode="numeric" pattern="[0-9]*" required value={line.quantity} onChange={(event) => { setLines((current) => current.map((item, i) => i === index ? { ...item, quantity: sanitizeWholeNumberInput(event.target.value, false, line.quantity) } : item)); setErrors((current) => current.filter((error) => error !== `line-${index}-quantity`)); }} aria-invalid={hasError(`line-${index}-quantity`)} />
          </Field>
          {hasError(`line-${index}-quantity`) && <SidePanelFieldError>{isThai ? "กรุณาระบุจำนวนมากกว่า 0" : "Enter a quantity greater than 0."}</SidePanelFieldError>}
        </div>
        <button type="button" aria-label={isThai ? "ลบรายการสินค้า" : "Remove product"} className="mt-5 inline-flex h-[38px] w-7 items-center justify-center rounded-lg text-rose-600 transition-colors hover:text-rose-400" onClick={() => { setLines((current) => current.filter((_, i) => i !== index)); setErrors((current) => current.filter((error) => !error.startsWith("line-"))); }}><X size={16} aria-hidden="true" /></button>
      </div>
    ))}
    <button type="button" className={subtleButton} onClick={() => setLines((current) => [...current, { productId: "", quantity: "" }])}>{isThai ? "เพิ่มสินค้าที่มีบนใบ" : "Add listed product"}</button>
    <p className="text-xs text-slate-500 dark:text-zinc-400">{isThai ? "หากใบขนส่งไม่มีรายการสินค้า เว้นส่วนนี้ว่างไว้" : "Leave this section empty if the delivery note does not list products."}</p>
    <Field label={isThai ? "หมายเหตุ" : "Note"}><textarea className={input} value={note} onChange={(event) => setNote(event.target.value)} /></Field>
    <EvidencePicker
      required
      deferUpload
      invalid={hasError("evidence")}
      errorText={isThai ? "กรุณาเลือกและเตรียมไฟล์หลักฐานก่อนบันทึก" : "Choose and prepare the evidence files before saving."}
      onChange={setMediaIds}
      onFilesChange={(files, prepared) => {
        setPendingFiles(files);
        setEvidencePrepared(prepared);
        setMediaIds([]);
        setUploadError("");
        if (prepared) setErrors((current) => current.filter((error) => error !== "evidence"));
      }}
    />
    {uploadError && <SidePanelFieldError>{uploadError}</SidePanelFieldError>}
    {sidePanel ? <div className={sidePanelFooter}><Button variant="outline" onClick={cancel}>{isThai ? "ยกเลิก" : "Cancel"}</Button><Button type="submit" variant="primary">{isThai ? "บันทึกใบขนส่ง" : "Save delivery note"}</Button></div> : <button className={button}>{isThai ? "บันทึกใบขนส่ง" : "Save delivery note"}</button>}
    {showSaveConfirm && (
      <div
        className={sidePanel ? "fixed inset-y-0 right-0 z-[120] flex w-full max-w-[560px] items-center justify-center bg-black/40 p-5" : "fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-5"}
        onMouseDown={(event) => {
          if (event.target === event.currentTarget && !isSaving) setShowSaveConfirm(false);
        }}
      >
        <section role="alertdialog" aria-modal="true" aria-labelledby="confirm-carrier-save-title" aria-describedby="confirm-carrier-save-description" className={`w-full max-w-sm space-y-4 rounded-2xl border p-5 shadow-2xl ${theme === "light" ? "border-slate-200 bg-white text-[#222222]" : "border-white/10 bg-[#383838] text-white"}`}>
          <div className="space-y-2">
            <h3 id="confirm-carrier-save-title" className="text-base font-semibold">{isThai ? "ยืนยันบันทึกใบขนส่ง" : "Confirm delivery note"}</h3>
            <p id="confirm-carrier-save-description" className="text-sm text-slate-500 dark:text-zinc-300">{isThai ? "ระบบจะอัปโหลดไฟล์หลักฐานและบันทึกใบขนส่งเมื่อคุณยืนยัน" : "Evidence files will upload and the delivery note will be saved after you confirm."}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" disabled={isSaving} onClick={() => setShowSaveConfirm(false)}>{isThai ? "กลับไปตรวจสอบ" : "Review form"}</Button>
            <Button variant="primary" loading={isSaving} onClick={() => void confirmSave()}>{isThai ? "ยืนยันบันทึก" : "Confirm and save"}</Button>
          </div>
        </section>
      </div>
    )}
    {sidePanel && showCancelConfirm && (
      <div className="fixed inset-y-0 right-0 z-[120] flex w-full max-w-[560px] items-center justify-center bg-black/40 p-5" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCancelConfirm(false); }}>
        <section role="alertdialog" aria-modal="true" aria-labelledby="cancel-carrier-title" aria-describedby="cancel-carrier-description" className={`w-full max-w-sm space-y-4 rounded-2xl border p-5 shadow-2xl ${theme === "light" ? "border-slate-200 bg-white text-[#222222]" : "border-white/10 bg-[#383838] text-white"}`}>
          <div className="space-y-2">
            <h3 id="cancel-carrier-title" className="text-base font-semibold">{isThai ? "ยืนยันออกจากฟอร์ม" : "Leave this form?"}</h3>
            <p id="cancel-carrier-description" className="text-sm text-slate-500 dark:text-zinc-300">{isThai ? "คุณกรอกข้อมูลไว้แล้ว หากออกจากฟอร์ม ข้อมูลที่กรอกจะไม่ถูกบันทึก" : "You have entered data. Leaving now will discard your changes."}</p>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCancelConfirm(false)}>{isThai ? "อยู่ต่อ" : "Stay"}</Button>
            <Button variant="danger" onClick={confirmCancel}>{isThai ? "ออกจากฟอร์ม" : "Leave form"}</Button>
          </div>
        </section>
      </div>
    )}
  </form>;
}

export function CarrierDetails({ carrier, branches, onConfirm }: { carrier: CarrierReceipt; branches: CatalogItem[]; onConfirm: (body: Record<string, unknown>) => void }) {
  const isThai = useAppLanguage() === "TH";
  const [branchId, setBranchId] = useState(""); const [packages, setPackages] = useState(""); const [condition, setCondition] = useState(""); const [mediaIds, setMediaIds] = useState<number[]>([]);
  return <div className="mt-5 space-y-3 rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/5"><h3 className="font-bold">{carrier.record_no} · {carrier.purchase_order_no}</h3><p>{carrier.carrier_name} · {carrier.tracking_no}</p><EvidenceLinks media={carrier.media} />{carrier.confirmation ? <Notice tone="success">{isThai ? `รับเข้าที่สาขา #${carrier.confirmation.receiving_branch_id} แล้ว · ${carrier.confirmation.actual_package_count} กล่อง` : `Received at branch #${carrier.confirmation.receiving_branch_id} · ${carrier.confirmation.actual_package_count} packages.`}</Notice> : <form className="space-y-3" onSubmit={(event) => { event.preventDefault(); onConfirm({ receivingBranchId: Number(branchId), actualPackageCount: Number(packages), packageCondition: condition, mediaAssetIds: mediaIds }); }}><h4 className="font-bold">{isThai ? "ยืนยันรับจากขนส่ง" : "Confirm delivery arrival"}</h4><Field label={isThai ? "สาขาที่รับจริง" : "Receiving branch"}><select className={input} required value={branchId} onChange={(event) => setBranchId(event.target.value)}><option value="">{isThai ? "เลือกสาขา" : "Select branch"}</option>{branches.filter((item) => item.active !== false).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></Field><Field label={isThai ? "จำนวนกล่องจริง" : "Actual package count"}><input className={input} type="text" inputMode="numeric" pattern="[0-9]*" required value={packages} onChange={(event) => setPackages(sanitizeWholeNumberInput(event.target.value, false, packages))} /></Field><Field label={isThai ? "สภาพกล่อง" : "Package condition"}><input className={input} required value={condition} onChange={(event) => setCondition(event.target.value)} /></Field><EvidencePicker required onChange={setMediaIds} /><button className={button} disabled={!mediaIds.length}>{isThai ? "ยืนยันของมาถึง" : "Confirm arrival"}</button><p className="text-xs text-slate-500 dark:text-zinc-400">{isThai ? "ขั้นนี้ยังไม่เพิ่มยอดสินค้า" : "Stock quantities are not updated at this step."}</p></form>}</div>;
}
