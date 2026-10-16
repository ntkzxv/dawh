"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  warehouseApi,
  type CarrierReceipt,
  type CatalogItem,
  type PurchaseOrder,
  type PurchaseOrderLine,
} from "@/lib/api/warehouse";
import {
  button,
  EvidencePicker,
  Field,
  input,
  panel,
  sanitizeWholeNumberInput,
} from "../Ui";
import Button from "@/components/common/Button";
import CustomDropdown from "@/components/common/CustomDropdown";
import {
  SidePanelFieldError,
  sidePanelFormStyles,
  sidePanelInvalidFieldClassName,
} from "@/components/common/SidePanel";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";

type CountLineDraft = {
  good: string;
  damaged: string;
  wrong: string;
  serials: string;
};

function parseSerialNumbers(value: string) {
  return value
    .split(/[,\r\n]+/)
    .map((serial) => serial.trim())
    .filter(Boolean);
}

export function CountForm({
  carriers,
  warehouses,
  onSave,
  sidePanel = false,
  onCancel,
}: {
  carriers: CarrierReceipt[];
  warehouses: CatalogItem[];
  onSave: (body: Record<string, unknown>) => void;
  sidePanel?: boolean;
  onCancel?: () => void;
}) {
  const isThai = useAppLanguage() === "TH";
  const { theme } = useTheme();
  const styles = sidePanelFormStyles(theme === "light");
  const sidePanelFooter = `${styles.footer} sticky bottom-0 ${theme === "light" ? "bg-white" : "bg-[#282828]"}`;
  const [carrierId, setCarrierId] = useState("");
  const [carrier, setCarrier] = useState<CarrierReceipt | null>(null);
  const [po, setPo] = useState<PurchaseOrder | null>(null);
  const [warehouseId, setWarehouseId] = useState("");
  const [count, setCount] = useState<Record<number, CountLineDraft>>({});
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [mediaIds, setMediaIds] = useState<number[]>([]);
  const [errors, setErrors] = useState<string[]>([]);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [evidencePrepared, setEvidencePrepared] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (!carrierId) return;
    const controller = new AbortController();
    void warehouseApi
      .carrierReceipt(Number(carrierId), controller.signal)
      .then(async (item) => {
        const order = await warehouseApi.purchaseOrder(
          item.purchase_order_id,
          controller.signal,
        );
        if (!controller.signal.aborted) {
          setCarrier(item);
          setPo(order);
          if (item.confirmation) {
            setErrors((current) =>
              current.filter((error) => error !== "carrier"),
            );
          }
        }
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [carrierId]);

  const serialsForLine = (lineId: number) =>
    parseSerialNumbers(count[lineId]?.serials ?? "");
  const goodQuantityForLine = (line: PurchaseOrderLine) =>
    line.serial_tracked
      ? String(serialsForLine(line.id).length)
      : count[line.id]?.good || "0";
  const hasDuplicateSerials = (lineId: number) => {
    const serials = serialsForLine(lineId).map((serial) => serial.toLocaleLowerCase());
    return new Set(serials).size !== serials.length;
  };
  const lines =
    po?.lines?.filter((line) => {
      const item = count[line.id];
      return (
        item &&
        Number(goodQuantityForLine(line)) +
          Number(item.damaged || 0) +
          Number(item.wrong || 0) >
          0
      );
    }) ?? [];
  const damaged = lines.some(
    (line) =>
      Number(count[line.id].damaged || 0) + Number(count[line.id].wrong || 0) > 0,
  );
  const hasError = (key: string) => errors.includes(key);
  const fieldClass = sidePanel ? styles.input : input;
  const cancel = () => {
    if (!onCancel) return;
    const hasEnteredData = Boolean(carrierId || warehouseId || Object.keys(count).length || title.trim() || detail.trim() || mediaIds.length || pendingFiles.length);
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

  const updateCount = (
    lineId: number,
    key: keyof CountLineDraft,
    value: string,
  ) => {
    const next = {
      ...count,
      [lineId]: {
        good: count[lineId]?.good ?? "",
        damaged: count[lineId]?.damaged ?? "",
        wrong: count[lineId]?.wrong ?? "",
        serials: count[lineId]?.serials ?? "",
        [key]: value,
      },
    };
    setCount(next);
    setErrors((current) => {
      const remaining = current.filter(
        (error) => error !== `line-${lineId}-${key}`,
      );
      const hasCount = (po?.lines ?? []).some((line) => {
        const item = next[line.id];
        if (!item) return false;
        const good = line.serial_tracked
          ? parseSerialNumbers(item.serials).length
          : Number(item.good || 0);
        return good + Number(item.damaged || 0) + Number(item.wrong || 0) > 0;
      });
      return hasCount ? remaining.filter((error) => error !== "lines") : remaining;
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const invalidQuantities = (po?.lines ?? []).flatMap((line) =>
      (["good", "damaged", "wrong"] as const).flatMap((key) => {
        if (key === "good" && line.serial_tracked) return [];
        const value = count[line.id]?.[key] ?? "";
        return value !== "" &&
          (!/^\d{1,15}$/.test(value) || Number(value) < 0)
          ? [`line-${line.id}-${key}`]
          : [];
      }),
    );
    const duplicateSerialErrors = (po?.lines ?? [])
      .filter((line) => line.serial_tracked && hasDuplicateSerials(line.id))
      .map((line) => `line-${line.id}-serials`);
    const nextErrors = [
      !carrier?.confirmation && "carrier",
      !warehouseId && "warehouse",
      !lines.length && "lines",
      damaged && !title.trim() && "title",
      damaged && !detail.trim() && "detail",
      damaged && !mediaIds.length && !(pendingFiles.length > 0 && evidencePrepared) && "evidence",
      ...invalidQuantities,
      ...duplicateSerialErrors,
    ].filter((error): error is string => Boolean(error));
    setErrors(nextErrors);
    if (nextErrors.length || !carrier) return;

    const body = {
      carrierReceiptId: carrier.id,
      warehouseId: Number(warehouseId),
      lines: lines.map((line) => ({
        purchaseOrderLineId: line.id,
        goodQuantity: goodQuantityForLine(line),
        damagedQuantity: count[line.id].damaged || "0",
        wrongQuantity: count[line.id].wrong || "0",
        serialNumbers: line.serial_tracked ? serialsForLine(line.id) : [],
      })),
      issueTitle: damaged ? title : undefined,
      issueDetail: damaged ? detail : undefined,
      mediaAssetIds: mediaIds,
    };
    if (sidePanel) {
      setUploadError("");
      setShowSaveConfirm(true);
    } else {
      onSave(body);
    }
  };
  const confirmSave = async () => {
    if (!carrier || isSaving) return;
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
      onSave({
        carrierReceiptId: carrier.id,
        warehouseId: Number(warehouseId),
        lines: lines.map((line) => ({
          purchaseOrderLineId: line.id,
          goodQuantity: goodQuantityForLine(line),
          damagedQuantity: count[line.id].damaged || "0",
          wrongQuantity: count[line.id].wrong || "0",
          serialNumbers: line.serial_tracked ? serialsForLine(line.id) : [],
        })),
        issueTitle: damaged ? title : undefined,
        issueDetail: damaged ? detail : undefined,
        mediaAssetIds: assetIds,
      });
    } catch {
      setUploadError(isThai ? "อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองยืนยันอีกครั้ง" : "File upload failed. Please confirm again to retry.");
      setShowSaveConfirm(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      className={sidePanel ? "space-y-4 py-6" : `${panel} space-y-3 self-start`}
      onSubmit={submit}
      noValidate
    >
      {!sidePanel && (
        <h2 className="text-lg font-bold">
          {isThai ? "เปิดกล่องและนับจริง" : "Unpack and count"}
        </h2>
      )}
      <Field label={isThai ? "ใบขนส่งที่ยืนยันรับแล้ว" : "Confirmed delivery note"}>
        <CustomDropdown
          value={carrierId}
          onChange={(value) => {
            setCarrier(null);
            setPo(null);
            setWarehouseId("");
            setCount({});
            setTitle("");
            setDetail("");
            setMediaIds([]);
            setPendingFiles([]);
            setEvidencePrepared(false);
            setCarrierId(value);
            setErrors((current) =>
              current.filter(
                (error) => !["carrier", "lines", "warehouse"].includes(error),
              ),
            );
          }}
          options={carriers.filter((item) => item.received_at).map((item) => ({ value: String(item.id), label: item.record_no, subLabel: item.purchase_order_no }))}
          placeholder={isThai ? "เลือกใบขนส่ง" : "Select delivery note"}
          className="w-full"
          triggerClassName={`${fieldClass} ${hasError("carrier") ? sidePanelInvalidFieldClassName : ""}`}
          aria-invalid={hasError("carrier")}
          searchable
          searchPlaceholder={isThai ? "ค้นหาเลขที่ใบขนส่งหรือ PO" : "Search delivery note or PO"}
        />
        {hasError("carrier") && (
          <SidePanelFieldError>
            {isThai
              ? "กรุณาเลือกใบขนส่งที่ยืนยันรับแล้ว"
              : "Choose a confirmed delivery note."}
          </SidePanelFieldError>
        )}
      </Field>

      {carrier?.confirmation && (
        <Field
          label={
            isThai
              ? "คลังปลายทางในสาขาที่รับ"
              : "Destination warehouse at receiving branch"
          }
        >
          <CustomDropdown
            value={warehouseId}
            onChange={(value) => {
              setWarehouseId(value);
              setErrors((current) =>
                current.filter((error) => error !== "warehouse"),
              );
            }}
            options={warehouses.filter((item) => item.active !== false && item.branch_id === carrier.confirmation?.receiving_branch_id).map((item) => ({ value: String(item.id), label: item.name }))}
            placeholder={isThai ? "เลือกคลัง" : "Select warehouse"}
            className="w-full"
            triggerClassName={`${fieldClass} ${hasError("warehouse") ? sidePanelInvalidFieldClassName : ""}`}
            aria-invalid={hasError("warehouse")}
            searchable
            searchPlaceholder={isThai ? "ค้นหาคลัง" : "Search warehouses"}
          />
          {hasError("warehouse") && (
            <SidePanelFieldError>
              {isThai
                ? "กรุณาเลือกคลังในสาขาที่รับสินค้า"
                : "Choose a warehouse in the receiving branch."}
            </SidePanelFieldError>
          )}
        </Field>
      )}

      {po?.lines?.map((line: PurchaseOrderLine) => (
        <div
          key={line.id}
          className={`space-y-2 rounded-xl border p-3 ${hasError("lines") ? sidePanelInvalidFieldClassName : "border-slate-200 dark:border-white/10"}`}
        >
          <strong>
            {line.sku} · {line.product_name}
          </strong>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            {isThai
              ? `สั่ง ${line.quantity} · ยังขาดของดี ${line.remaining_good_quantity}`
              : `Ordered ${line.quantity} · Good quantity remaining ${line.remaining_good_quantity}`}
          </p>
          <div className="grid grid-cols-3 gap-2">
            {([
              ["good", isThai ? "ดี" : "Good"],
              ["damaged", isThai ? "ชำรุด" : "Damaged"],
              ["wrong", isThai ? "ผิดรุ่น" : "Wrong item"],
            ] as const).map(([key, label]) => {
              const errorKey = `line-${line.id}-${key}`;
              const invalid = hasError("lines") || hasError(errorKey);
              return (
                <Field
                  key={key}
                  label={
                    key === "good" && line.serial_tracked
                      ? isThai
                        ? "ดี (นับจาก Serial)"
                        : "Good (from serials)"
                      : label
                  }
                >
                  <input
                    className={`${fieldClass} ${invalid ? sidePanelInvalidFieldClassName : ""}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={
                      key === "good" && line.serial_tracked
                        ? goodQuantityForLine(line)
                        : count[line.id]?.[key] ?? ""
                    }
                    readOnly={key === "good" && line.serial_tracked}
                    onChange={(event) =>
                      updateCount(line.id, key, sanitizeWholeNumberInput(event.target.value, false, count[line.id]?.[key] ?? ""))
                    }
                    aria-invalid={invalid}
                  />
                  {hasError(errorKey) && (
                    <SidePanelFieldError>
                      {isThai
                        ? "กรอกจำนวนเป็นจำนวนเต็มตั้งแต่ 0 ขึ้นไป"
                        : "Enter a nonnegative whole number."}
                    </SidePanelFieldError>
                  )}
                </Field>
              );
            })}
          </div>
          {line.serial_tracked && (
            <Field
              label={isThai ? "Serial ของสินค้าดี" : "Good item serial numbers"}
            >
              <textarea
                className={`${fieldClass} ${hasError(`line-${line.id}-serials`) || hasDuplicateSerials(line.id) ? sidePanelInvalidFieldClassName : ""}`}
                rows={3}
                value={count[line.id]?.serials ?? ""}
                onChange={(event) =>
                  updateCount(line.id, "serials", event.target.value)
                }
                placeholder={isThai ? "สแกนทีละรายการ หรือวาง Serial คั่นด้วยจุลภาค/ขึ้นบรรทัดใหม่" : "Scan one at a time, or paste serials separated by commas or new lines"}
                aria-invalid={hasError(`line-${line.id}-serials`) || hasDuplicateSerials(line.id)}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-zinc-400">
                {isThai
                  ? `กรอกแล้ว ${serialsForLine(line.id).length} รายการ · จำนวนดีจะนับจาก Serial อัตโนมัติ`
                  : `${serialsForLine(line.id).length} entered · Good quantity is counted from serials`}
              </p>
              {hasDuplicateSerials(line.id) && (
                <SidePanelFieldError>
                  {isThai ? "Serial ซ้ำ กรุณาตรวจสอบรายการ" : "Duplicate serial numbers. Check the list."}
                </SidePanelFieldError>
              )}
              {hasError(`line-${line.id}-serials`) && !hasDuplicateSerials(line.id) && (
                <SidePanelFieldError>
                  {isThai ? "กรุณาตรวจสอบ Serial ของสินค้านี้" : "Check this product's serial numbers."}
                </SidePanelFieldError>
              )}
            </Field>
          )}
        </div>
      ))}
      {hasError("lines") && (
        <SidePanelFieldError>
          {isThai
            ? "กรุณาระบุจำนวนที่นับได้อย่างน้อย 1 รายการ"
            : "Enter a counted quantity for at least one product."}
        </SidePanelFieldError>
      )}

      {damaged && (
        <>
          <Field label={isThai ? "หัวเรื่องปัญหา" : "Issue title"}>
            <input
              className={`${fieldClass} ${hasError("title") ? sidePanelInvalidFieldClassName : ""}`}
              required
              value={title}
              onChange={(event) => {
                setTitle(event.target.value);
                setErrors((current) => current.filter((error) => error !== "title"));
              }}
              aria-invalid={hasError("title")}
            />
            {hasError("title") && (
              <SidePanelFieldError>
                {isThai ? "กรุณากรอกหัวเรื่องปัญหา" : "Enter an issue title."}
              </SidePanelFieldError>
            )}
          </Field>
          <Field label={isThai ? "รายละเอียดปัญหา" : "Issue details"}>
            <textarea
              className={`${fieldClass} ${hasError("detail") ? sidePanelInvalidFieldClassName : ""}`}
              required
              value={detail}
              onChange={(event) => {
                setDetail(event.target.value);
                setErrors((current) => current.filter((error) => error !== "detail"));
              }}
              aria-invalid={hasError("detail")}
            />
            {hasError("detail") && (
              <SidePanelFieldError>
                {isThai ? "กรุณากรอกรายละเอียดปัญหา" : "Enter issue details."}
              </SidePanelFieldError>
            )}
          </Field>
          <EvidencePicker
            required
            deferUpload={sidePanel}
            invalid={hasError("evidence")}
            errorText={
              isThai
                ? "กรุณาอัปโหลดหลักฐานความเสียหาย"
                : "Upload evidence for the damaged or incorrect items."
            }
            onChange={(ids) => {
              setMediaIds(ids);
              if (ids.length)
                setErrors((current) =>
                  current.filter((error) => error !== "evidence"),
                );
            }}
            onFilesChange={(files, prepared) => {
              setPendingFiles(files);
              setEvidencePrepared(prepared);
              setMediaIds([]);
              setUploadError("");
              if (prepared) setErrors((current) => current.filter((error) => error !== "evidence"));
            }}
          />
        </>
      )}

      <p className="text-xs text-slate-500 dark:text-zinc-400">
        {isThai
          ? "จำนวนชำรุดและผิดรุ่นจะไม่เพิ่มสต๊อก"
          : "Damaged and incorrect items will not be added to stock."}
      </p>
      {uploadError && <SidePanelFieldError>{uploadError}</SidePanelFieldError>}
      {sidePanel ? (
        <div className={sidePanelFooter}>
          <Button variant="outline" onClick={cancel}>
            {isThai ? "ยกเลิก" : "Cancel"}
          </Button>
          <Button type="submit" variant="primary">
            {isThai ? "บันทึกผลนับ" : "Save count"}
          </Button>
        </div>
      ) : (
        <button className={button} type="submit">
          {isThai ? "บันทึกผลนับ" : "Save count"}
        </button>
      )}
      {sidePanel && showSaveConfirm && (
        <div className="fixed inset-y-0 right-0 z-[120] flex w-full max-w-[560px] items-center justify-center bg-black/40 p-5" onMouseDown={(event) => { if (event.target === event.currentTarget && !isSaving) setShowSaveConfirm(false); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="confirm-count-save-title" aria-describedby="confirm-count-save-description" className={`w-full max-w-sm space-y-4 rounded-2xl border p-5 shadow-2xl ${theme === "light" ? "border-slate-200 bg-white text-[#222222]" : "border-white/10 bg-[#383838] text-white"}`}>
            <div className="space-y-2">
              <h3 id="confirm-count-save-title" className="text-base font-semibold">{isThai ? "ยืนยันบันทึกใบตรวจรับ" : "Confirm goods receipt"}</h3>
              <p id="confirm-count-save-description" className="text-sm text-slate-500 dark:text-zinc-300">{isThai ? "ตรวจสอบจำนวนและคลังปลายทางก่อนบันทึกผลตรวจรับ" : "Review the quantities and destination warehouse before saving the count."}</p>
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
          <section role="alertdialog" aria-modal="true" aria-labelledby="cancel-count-title" aria-describedby="cancel-count-description" className={`w-full max-w-sm space-y-4 rounded-2xl border p-5 shadow-2xl ${theme === "light" ? "border-slate-200 bg-white text-[#222222]" : "border-white/10 bg-[#383838] text-white"}`}>
            <div className="space-y-2">
              <h3 id="cancel-count-title" className="text-base font-semibold">{isThai ? "ยืนยันออกจากฟอร์ม" : "Leave this form?"}</h3>
              <p id="cancel-count-description" className="text-sm text-slate-500 dark:text-zinc-300">{isThai ? "คุณกรอกข้อมูลไว้แล้ว หากออกจากฟอร์ม ข้อมูลที่กรอกจะไม่ถูกบันทึก" : "You have entered data. Leaving now will discard your changes."}</p>
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
