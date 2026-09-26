"use client";

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import { ApiRequestError } from "@/lib/api/client";
import { warehouseApi } from "@/lib/api/warehouse";

export const panel = "rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#383838]";
export const input = "w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-950 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15 dark:border-white/20 dark:bg-[#292929] dark:text-white";
export const button = "inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50";
export const subtleButton = "inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:opacity-50 dark:border-white/20 dark:hover:bg-white/5";

export function message(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.code === "STORAGE_NOT_CONFIGURED") return "ระบบเก็บรูปยังไม่ได้ตั้งค่า กรุณาแจ้งผู้ดูแลระบบ";
    if (error.code === "PASSWORD_CHANGE_REQUIRED") return "ต้องเปลี่ยนรหัสผ่านเริ่มต้นก่อนใช้งาน";
    if (error.code === "FORBIDDEN") return "บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้";
    return error.message;
  }
  return error instanceof Error ? error.message : "ไม่สามารถทำรายการได้";
}

export function useRemote<T>(load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try { setData(await load()); }
    catch (cause) { setError(message(cause)); }
    finally { setLoading(false); }
  }, [load]);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return null;
      setLoading(true);
      setError(null);
      return load();
    }).then((result) => { if (active && result !== null) setData(result); })
      .catch((cause) => { if (active) setError(message(cause)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [load]);
  return { data, loading, error, refresh, setData };
}

export function Notice({ children, tone = "info" }: { children: ReactNode; tone?: "info" | "error" | "success" }) {
  const color = tone === "error" ? "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-700 dark:bg-rose-950/30 dark:text-rose-200" : tone === "success" ? "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200" : "border-indigo-200 bg-indigo-50 text-indigo-900 dark:border-indigo-700 dark:bg-indigo-950/30 dark:text-indigo-200";
  return <div role={tone === "error" ? "alert" : "status"} className={`rounded-xl border px-4 py-3 text-sm ${color}`}>{children}</div>;
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block space-y-1.5 text-sm font-medium"><span>{label}</span>{children}</label>;
}

export function Empty({ text = "ยังไม่มีข้อมูล" }: { text?: string }) {
  return <div className="rounded-xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500 dark:border-white/20 dark:text-zinc-400">{text}</div>;
}

export function EvidencePicker({ onChange, required = false }: { onChange: (ids: number[]) => void; required?: boolean }) {
  const [files, setFiles] = useState<File[]>([]);
  const [uploaded, setUploaded] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const upload = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(null);
    try { const ids: number[] = []; for (const file of files) ids.push((await warehouseApi.upload(file)).id); onChange(ids); setUploaded(ids.length); }
    catch (cause) { setError(message(cause)); onChange([]); setUploaded(0); }
    finally { setBusy(false); }
  };
  return <div className="space-y-2">
    <Field label={required ? "รูปหรือ PDF หลักฐานทุกหน้า (จำเป็น)" : "รูปหรือ PDF หลักฐาน"}>
      <input className={input} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={(event) => { setFiles(Array.from(event.target.files ?? [])); setUploaded(0); onChange([]); }} />
    </Field>
    <button type="button" className={subtleButton} disabled={!files.length || busy} onClick={(event) => void upload(event)}>{busy ? "กำลังอัปโหลด..." : "อัปโหลดไฟล์ที่เลือก"}</button>
    {uploaded > 0 && <Notice tone="success">อัปโหลดแล้ว {uploaded} ไฟล์</Notice>}
    {error && <Notice tone="error">{error}</Notice>}
  </div>;
}

export function EvidenceLinks({ media }: { media?: Array<{ media_asset_id: number; page_number: number }> }) {
  if (!media?.length) return null;
  return <div className="flex flex-wrap gap-2">{media.map((item) => <a key={item.media_asset_id} className="text-sm font-medium text-indigo-600 underline dark:text-indigo-300" href={warehouseApi.evidenceUrl(item.media_asset_id)} target="_blank" rel="noreferrer">ดูหลักฐานหน้า {item.page_number}</a>)}</div>;
}
