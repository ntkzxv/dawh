"use client";

import { useEffect, useState, type FormEvent } from "react";
import { warehouseApi, type PurchaseOrder } from "@/lib/api/warehouse";
import { button, EvidenceLinks, EvidencePicker, Field, input, panel, sanitizeWholeNumberInput } from "../Ui";
import Button from "@/components/common/Button";
import CustomDropdown from "@/components/common/CustomDropdown";
import DatePicker from "@/components/common/DatePicker";
import { SidePanelFieldError, sidePanelFormStyles, sidePanelInvalidFieldClassName } from "@/components/common/SidePanel";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";

export function SupplierDetails({
  detail,
}: {
  detail: Awaited<ReturnType<typeof warehouseApi.supplierReceipt>>;
}) {
  return (
    <div className="mt-3 space-y-2 rounded-xl border border-slate-200 p-3 text-sm dark:border-white/10">
      {detail.lines?.map((line) => (
        <p key={line.id}>
          {line.product_name} · {line.quantity} × {line.unit_price}
        </p>
      ))}
      <EvidenceLinks media={detail.media} />
    </div>
  );
}

export function SupplierForm({ orders, selectedPoId, onSave, sidePanel = false, onCancel }: { orders: PurchaseOrder[]; selectedPoId: number | null; onSave: (body: Record<string, unknown>) => void; sidePanel?: boolean; onCancel?: () => void }) {
  const isThai = useAppLanguage() === "TH";
  const { theme } = useTheme();
  const styles = sidePanelFormStyles(theme === "light");
  const sidePanelFooter = `${styles.footer} sticky bottom-0 ${theme === "light" ? "bg-white" : "bg-[#282828]"}`;
  const [poId, setPoId] = useState(String(selectedPoId ?? "")); const [po, setPo] = useState<PurchaseOrder | null>(null); const [externalDocNo, setExternalDocNo] = useState(""); const [date, setDate] = useState(""); const [total, setTotal] = useState(""); const [mediaIds, setMediaIds] = useState<number[]>([]); const [quantities, setQuantities] = useState<Record<number,string>>({}); const [prices, setPrices] = useState<Record<number,string>>({}); const [note, setNote] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [evidencePrepared, setEvidencePrepared] = useState(false);
  const [uploadError, setUploadError] = useState("");
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
  useEffect(() => {
    if (po) {
      setErrors((current) =>
        current.filter(
          (error) =>
            error !== "po" && (po.lines?.length ? error !== "lines" : true),
        ),
      );
    }
  }, [po]);
  const searchableOrders = poSearch.trim().length >= 2 ? searchResults : [];
  const availableOrders = [...new Map([...orders, ...searchableOrders, ...(po ? [po] : [])].map((item) => [item.id, item])).values()].filter((item) => !item.closed_at);
  const fieldClass = sidePanel ? styles.input : input;
  const hasError = (key: string) => errors.includes(key);
  const cancel = () => {
    if (!onCancel) return;
    const hasEnteredData = Boolean(
      poId !== String(selectedPoId ?? "") ||
      externalDocNo.trim() ||
      date ||
      total ||
      mediaIds.length ||
      pendingFiles.length ||
      Object.keys(quantities).length ||
      Object.keys(prices).length ||
      note.trim(),
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
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const hasEvidence = mediaIds.length > 0 || (pendingFiles.length > 0 && evidencePrepared);
    const nextErrors = [!po && "po", !po?.lines?.length && "lines", !date && "date", sidePanel && !externalDocNo.trim() && "externalDocNo", sidePanel && !total.trim() && "total", !hasEvidence && "evidence", ...(po?.lines ?? []).flatMap((line) => (!/^\d{1,15}$/.test(String(quantities[line.id] ?? line.quantity)) || Number(quantities[line.id] ?? line.quantity) < 0) ? [`line-${line.id}-quantity`] : [])].filter((error): error is string => Boolean(error));
    setErrors(nextErrors);
    if (nextErrors.length || !po) return;
    setUploadError("");
    setShowSaveConfirm(true);
  };
  const confirmSave = async () => {
    if (!po || isSaving) return;
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
      onSave({ purchaseOrderId: po.id, supplierId: po.supplier_id, externalDocNo: externalDocNo || null, documentDate: date, totalAmount: total || null, lines: po.lines?.map((line) => ({ purchaseOrderLineId: line.id, quantity: quantities[line.id] ?? line.quantity, unitPrice: prices[line.id] ?? line.unit_price })), mediaAssetIds: assetIds, note: note || null });
    } catch {
      setUploadError(isThai ? "อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองยืนยันอีกครั้ง" : "File upload failed. Please confirm again to retry.");
      setShowSaveConfirm(false);
    } finally {
      setIsSaving(false);
    }
  };
  return (
    <form className={sidePanel ? "space-y-4 py-6" : `${panel} space-y-3 self-start`} onSubmit={submit} noValidate>
      {!sidePanel && <h2 className="text-lg font-bold">{isThai ? "บันทึกเอกสารผู้ขาย" : "Record supplier document"}</h2>}
      <Field label={isThai ? "ใบสั่งซื้อ (PO)" : "Purchase order (PO)"}>
        <CustomDropdown
          value={poId}
          onChange={(value) => {
            const selectedOrder = availableOrders.find((item) => String(item.id) === value) ?? null;
            setPo(selectedOrder);
            setPoId(value);
            setErrors((current) => current.filter((error) => error !== "po" && error !== "lines"));
          }}
          options={availableOrders.map((item) => ({ value: String(item.id), label: item.record_no, subLabel: item.supplier_name }))}
          placeholder={isThai ? "เลือกหรือค้นหา PO" : "Select or search POs"}
          searchable
          searchPlaceholder={isThai ? "ค้นหาเลขที่ PO หรือชื่อผู้ขาย" : "Search PO number or supplier"}
          onSearchChange={setPoSearch}
          className="w-full"
          triggerClassName={`${fieldClass} ${hasError("po") ? sidePanelInvalidFieldClassName : ""}`}
          aria-invalid={hasError("po")}
        />
        {hasError("po") && <SidePanelFieldError>{isThai ? "กรุณาเลือก PO" : "Choose a purchase order."}</SidePanelFieldError>}
      </Field>
      <Field label={isThai ? "เลขเอกสารบนใบ" : "Supplier document number"}>
        <input className={`${fieldClass} ${hasError("externalDocNo") ? sidePanelInvalidFieldClassName : ""}`} value={externalDocNo} onChange={(event) => { setExternalDocNo(event.target.value); setErrors((current) => current.filter((error) => error !== "externalDocNo")); }} required={sidePanel} aria-invalid={hasError("externalDocNo")} />
        {hasError("externalDocNo") && <SidePanelFieldError>{isThai ? "กรุณาระบุเลขเอกสารบนใบ" : "Enter the supplier document number."}</SidePanelFieldError>}
      </Field>
      <Field label={isThai ? "วันที่เอกสาร" : "Document date"}>
        <DatePicker value={date} onChange={(value) => { setDate(value); setErrors((current) => current.filter((error) => error !== "date")); }} isThai={isThai} size="md" triggerClassName={`${sidePanel ? styles.dropdown : ""} ${hasError("date") ? sidePanelInvalidFieldClassName : ""}`} />
        {hasError("date") && <SidePanelFieldError>{isThai ? "กรุณาระบุวันที่เอกสารผู้ขาย" : "Enter the supplier document date."}</SidePanelFieldError>}
      </Field>
      {po?.lines?.map((line) => <div key={line.id} className="space-y-2"><Field label={`${line.sku} · ${line.product_name} (PO ${line.quantity})`}><input className={`${fieldClass} ${hasError(`line-${line.id}-quantity`) ? sidePanelInvalidFieldClassName : ""}`} type="text" inputMode="numeric" pattern="[0-9]*" value={quantities[line.id] ?? line.quantity} onChange={(event) => { setQuantities({ ...quantities, [line.id]: sanitizeWholeNumberInput(event.target.value, false, String(quantities[line.id] ?? line.quantity)) }); setErrors((current) => current.filter((error) => error !== `line-${line.id}-quantity`)); }} aria-invalid={hasError(`line-${line.id}-quantity`)} /></Field>{hasError(`line-${line.id}-quantity`) && <SidePanelFieldError>{isThai ? "จำนวนสินค้าในเอกสารต้องเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป" : "Document quantities must be nonnegative whole numbers."}</SidePanelFieldError>}<Field label={isThai ? "ราคาต่อหน่วยตามใบ" : "Unit price on document"}><input className={fieldClass} type="number" min="0" step="0.01" value={prices[line.id] ?? line.unit_price} onChange={(event) => setPrices({ ...prices, [line.id]: event.target.value })} /></Field></div>)}
      <Field label={isThai ? "ยอดรวมบนใบ" : "Total on document"}>
        <input className={`${fieldClass} ${hasError("total") ? sidePanelInvalidFieldClassName : ""}`} type="number" min="0" step="0.01" value={total} onChange={(event) => { setTotal(event.target.value); setErrors((current) => current.filter((error) => error !== "total")); }} required={sidePanel} aria-invalid={hasError("total")} />
        {hasError("total") && <SidePanelFieldError>{isThai ? "กรุณาระบุยอดรวมบนใบ" : "Enter the total shown on the document."}</SidePanelFieldError>}
      </Field>
      <Field label={isThai ? "หมายเหตุ" : "Note"}><textarea className={fieldClass} value={note} onChange={(event) => setNote(event.target.value)} /></Field>
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
      {sidePanel ? <div className={sidePanelFooter}><Button variant="outline" onClick={cancel}>{isThai ? "ยกเลิก" : "Cancel"}</Button><Button type="submit" variant="primary">{isThai ? "บันทึกเอกสาร" : "Save document"}</Button></div> : <button className={button}>{isThai ? "บันทึกเอกสาร" : "Save document"}</button>}
      {showSaveConfirm && (
        <div
          className={sidePanel ? "fixed inset-y-0 right-0 z-[120] flex w-full max-w-[560px] items-center justify-center bg-black/40 p-5" : "fixed inset-0 z-[120] flex items-center justify-center bg-black/50 p-5"}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isSaving) setShowSaveConfirm(false);
          }}
        >
          <section
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-supplier-save-title"
            aria-describedby="confirm-supplier-save-description"
            className={`w-full max-w-sm space-y-4 rounded-2xl border p-5 shadow-2xl ${theme === "light" ? "border-slate-200 bg-white text-[#222222]" : "border-white/10 bg-[#383838] text-white"}`}
          >
            <div className="space-y-2">
              <h3 id="confirm-supplier-save-title" className="text-base font-semibold">{isThai ? "ยืนยันบันทึกเอกสารผู้ขาย" : "Confirm supplier document"}</h3>
              <p id="confirm-supplier-save-description" className="text-sm text-slate-500 dark:text-zinc-300">{isThai ? "ระบบจะอัปโหลดไฟล์หลักฐานและบันทึกเอกสารเมื่อคุณยืนยัน" : "Evidence files will upload and the document will be saved after you confirm."}</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" disabled={isSaving} onClick={() => setShowSaveConfirm(false)}>{isThai ? "กลับไปตรวจสอบ" : "Review form"}</Button>
              <Button variant="primary" loading={isSaving} onClick={() => void confirmSave()}>{isThai ? "ยืนยันบันทึก" : "Confirm and save"}</Button>
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
            aria-labelledby="cancel-supplier-title"
            aria-describedby="cancel-supplier-description"
            className={`w-full max-w-sm space-y-4 rounded-2xl border p-5 shadow-2xl ${theme === "light" ? "border-slate-200 bg-white text-[#222222]" : "border-white/10 bg-[#383838] text-white"}`}
          >
            <div className="space-y-2">
              <h3 id="cancel-supplier-title" className="text-base font-semibold">{isThai ? "ยืนยันออกจากฟอร์ม" : "Leave this form?"}</h3>
              <p id="cancel-supplier-description" className="text-sm text-slate-500 dark:text-zinc-300">{isThai ? "คุณกรอกข้อมูลไว้แล้ว หากออกจากฟอร์ม ข้อมูลที่กรอกจะไม่ถูกบันทึก" : "You have entered data. Leaving now will discard your changes."}</p>
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
