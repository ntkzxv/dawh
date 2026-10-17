"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ApiRequestError, ApiTimeoutError } from "@/lib/api/client";
import { warehouseApi } from "@/lib/api/warehouse";
import { useNotification } from "@/context/NotificationContext";
import { useAppLanguage } from "@/utils/language";
import { Loader2 } from "lucide-react";
import {
  SidePanelFieldError,
  sidePanelInvalidFieldClassName,
} from "@/components/common/SidePanel";

export const panel =
  "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#383838]";
export const input =
  "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-white/20 dark:bg-[#292929] dark:text-white";
export const button =
  "inline-flex items-center justify-center rounded-xl bg-[#222222] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#383838] disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-[#222222] dark:hover:bg-[#F4F4F5]";
export const subtleButton =
  "inline-flex items-center justify-center rounded-xl bg-[#F4F4F5] px-4 py-2 text-sm font-medium text-[#222222] transition hover:bg-[#E4E4E7] disabled:opacity-50 dark:bg-white/10 dark:text-white dark:hover:bg-white/15";
export { useRemote } from "@/hooks/useRemoteResource";

export function message(error: unknown, isThai = true): string {
  if (error instanceof ApiTimeoutError)
    return isThai ? "การโหลดข้อมูลใช้เวลานานเกินไป กรุณาลองใหม่อีกครั้ง" : "The request timed out. Please try again.";
  if (error instanceof ApiRequestError) {
    if (error.code === "STORAGE_NOT_CONFIGURED")
      return isThai ? "ระบบเก็บรูปยังไม่ได้ตั้งค่า กรุณาแจ้งผู้ดูแลระบบ" : "File storage is not configured. Contact your administrator.";
    if (error.code === "FORBIDDEN") return isThai ? "บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้" : "Your account is not allowed to perform this action.";
    return error.message;
  }
  return error instanceof Error ? error.message : (isThai ? "ไม่สามารถทำรายการได้" : "The action could not be completed.");
}

export function Notice({
  children,
  tone = "info",
}: {
  children: ReactNode;
  tone?: "info" | "error" | "success";
}) {
  const isThai = useAppLanguage() === "TH";
  const { notify } = useNotification();
  const messageText =
    typeof children === "string" ? children : (isThai ? "มีการแจ้งเตือนจากระบบ" : "You have a system notification.");
  const notifyCurrent = notify[tone];
  useEffect(() => {
    const title =
      tone === "error"
        ? (isThai ? "เกิดข้อผิดพลาด" : "Something went wrong")
        : tone === "success"
          ? (isThai ? "ดำเนินการสำเร็จ" : "Completed")
          : (isThai ? "แจ้งเตือน" : "Notification");
    notifyCurrent(title, { message: messageText });
  }, [isThai, messageText, notifyCurrent, tone]);
  return null;
}

export function Field({
  label,
  children,
  className = "block space-y-1.5 text-sm font-medium",
  labelClassName,
}: {
  label: string;
  children: ReactNode;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <label className={className}>
      <span className={labelClassName}>{label}</span>
      {children}
    </label>
  );
}

export function sanitizeWholeNumberInput(value: string, allowNegative = false, previousValue = "") {
  const wholeNumberPattern = allowNegative ? /^-?\d*$/ : /^\d*$/;
  return wholeNumberPattern.test(value) ? value : previousValue;
}

export function Empty({ text }: { text?: string }) {
  const isThai = useAppLanguage() === "TH";
  return (
    <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/20 dark:text-zinc-400">
      {text ?? (isThai ? "ยังไม่มีข้อมูล" : "No data available.")}
    </div>
  );
}

export function EvidencePicker({
  onChange,
  onFilesChange,
  deferUpload = false,
  required = false,
  invalid = false,
  errorText,
}: {
  onChange: (ids: number[]) => void;
  onFilesChange?: (files: File[], prepared: boolean) => void;
  deferUpload?: boolean;
  required?: boolean;
  invalid?: boolean;
  errorText?: string;
}) {
  const isThai = useAppLanguage() === "TH";
  const [files, setFiles] = useState<File[]>([]);
  const [uploaded, setUploaded] = useState(0);
  const [prepared, setPrepared] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upload = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const ids: number[] = [];
      for (const file of files) ids.push((await warehouseApi.upload(file)).id);
      onChange(ids);
      setUploaded(ids.length);
    } catch (cause) {
      setError(message(cause, isThai));
      onChange([]);
      setUploaded(0);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-2">
      <Field
        label={
          required
            ? (isThai ? "รูปหรือ PDF หลักฐานทุกหน้า (จำเป็น)" : "Evidence images or PDF (all pages required)")
            : (isThai ? "รูปหรือ PDF หลักฐาน" : "Evidence images or PDF")
        }
      >
        <input
          className={`${input} ${invalid ? sidePanelInvalidFieldClassName : ""}`}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf"
          multiple
          aria-invalid={invalid}
          onChange={(event) => {
            const selectedFiles = Array.from(event.target.files ?? []);
            setFiles(selectedFiles);
            setUploaded(0);
            setPrepared(false);
            onFilesChange?.(selectedFiles, false);
            onChange([]);
          }}
        />
      </Field>
      {invalid && errorText && <SidePanelFieldError>{errorText}</SidePanelFieldError>}
      <button
        type="button"
        className={subtleButton}
        disabled={!files.length || busy || uploaded > 0 || (deferUpload && prepared)}
        onClick={(event) => {
          if (deferUpload) {
            event.preventDefault();
            setPrepared(true);
            onFilesChange?.(files, true);
            return;
          }
          void upload(event);
        }}
      >
        {busy ? <Loader2 size={16} className="animate-spin" aria-label={isThai ? "กำลังอัปโหลด" : "Uploading"} /> : deferUpload ? prepared ? (isThai ? "เตรียมไฟล์แล้ว" : "Files ready") : (isThai ? "เตรียมไฟล์" : "Prepare files") : uploaded > 0 ? (isThai ? "อัปโหลดแล้ว" : "Uploaded") : (isThai ? "อัปโหลดไฟล์ที่เลือก" : "Upload selected files")}
      </button>
      {uploaded > 0 && (
        <Notice tone="success">{isThai ? `อัปโหลดแล้ว ${uploaded} ไฟล์` : `${uploaded} files uploaded.`}</Notice>
      )}
      {error && <Notice tone="error">{error}</Notice>}
    </div>
  );
}

export function EvidenceLinks({
  media,
}: {
  media?: Array<{ media_asset_id: number; page_number: number }>;
}) {
  const isThai = useAppLanguage() === "TH";
  if (!media?.length) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {media.map((item) => (
        <a
          key={item.media_asset_id}
          className="text-sm font-medium text-indigo-600 underline dark:text-indigo-300"
          href={warehouseApi.evidenceUrl(item.media_asset_id)}
          target="_blank"
          rel="noreferrer"
        >
          {isThai ? `ดูหลักฐานหน้า ${item.page_number}` : `View evidence, page ${item.page_number}`}
        </a>
      ))}
    </div>
  );
}
