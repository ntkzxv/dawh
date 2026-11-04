"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  History,
  ListFilter,
  Loader2,
  Power,
  X,
} from "lucide-react";
import { useAccountMenu } from "@/hooks/useAccountMenu";
import { apiGet, apiPatch } from "@/lib/api/client";
import type { ManagedModuleKey, ModuleStatus, ModuleStatusHistoryItem } from "@/lib/contracts/module-status";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";

type ModuleState = "active" | "maintenance";
type ModuleItem = {
  key: ManagedModuleKey;
  title: string;
  titleTh: string;
  description: string;
  descriptionTh: string;
  state: ModuleState;
  reason: string | null;
  changedAt: string | null;
};

type ModuleChange = {
  id: number;
  moduleKey: ManagedModuleKey;
  moduleTitle: string;
  previousState: ModuleState;
  nextState: ModuleState;
  reason: string;
  actor: string;
  changedAt: string;
};

const initialModules: ModuleItem[] = [
  {
    key: "datacenter",
    title: "HP Datacenter",
    titleTh: "สัญญาเช่าซื้อ",
    description: "Controls access to the HP Datacenter workspace.",
    descriptionTh: "ควบคุมการเข้าถึงพื้นที่สัญญาเช่าซื้อ",
    state: "active",
    reason: null,
    changedAt: null,
  },
  {
    key: "warehouse",
    title: "Warehouse ERP",
    titleTh: "จัดการคลังสินค้า",
    description: "Controls access to warehouse operations.",
    descriptionTh: "ควบคุมการเข้าถึงระบบจัดการคลังสินค้า",
    state: "active",
    reason: null,
    changedAt: null,
  },
  {
    key: "sales",
    title: "Sales",
    titleTh: "การขาย",
    description: "Manage customer records and in-store sales.",
    descriptionTh: "จัดการข้อมูลลูกค้าและบันทึกการขายหน้าร้าน",
    state: "active",
    reason: null,
    changedAt: null,
  },
  {
    key: "reports",
    title: "Reports & Auditing",
    titleTh: "รายงานและตรวจสอบ",
    description: "Controls access to reports and audit screens.",
    descriptionTh: "ควบคุมการเข้าถึงหน้ารายงานและตรวจสอบ",
    state: "maintenance",
    reason: "อยู่ระหว่างเตรียมระบบรายงาน",
    changedAt: null,
  },
];

export default function ModuleStatusPanel() {
  const { isThai, fullName } = useAccountMenu();
  const [modules, setModules] = useState(initialModules);
  const [changes, setChanges] = useState<ModuleChange[]>([]);
  const [selectedModuleKey, setSelectedModuleKey] = useState<ManagedModuleKey | null>(null);
  const [reason, setReason] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [statusesLoaded, setStatusesLoaded] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const selectedModule = selectedModuleKey
    ? modules.find((module) => module.key === selectedModuleKey) ?? null
    : null;
  const openDialog = (moduleKey: ManagedModuleKey) => {
    setSelectedModuleKey(moduleKey);
    setReason("");
    setFormError(null);
  };

  const closeDialog = useCallback(() => {
    setSelectedModuleKey(null);
    setReason("");
    setFormError(null);
  }, []);

  useEffect(() => {
    if (!selectedModule) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeDialog();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [selectedModule, closeDialog]);

  useEffect(() => {
    const controller = new AbortController();
    const load = async () => {
      try {
        const [{ data: statuses }, historyResult] = await Promise.all([
          apiGet<ModuleStatus[]>("/api/modules/status", { signal: controller.signal }),
          apiGet<ModuleStatusHistoryItem[]>("/api/modules/status/history", { signal: controller.signal })
            .catch(() => ({ data: [] as ModuleStatusHistoryItem[] })),
        ]);
        setModules((current) => current.map((module) => {
          const status = statuses.find((item) => item.moduleKey === module.key);
          return status
            ? {
                ...module,
                state: status.isEnabled ? "active" : "maintenance",
                reason: status.maintenanceReason,
                changedAt: status.updatedAt,
              }
            : module;
        }));
        setChanges(historyResult.data.map((item) => {
          const module = initialModules.find((entry) => entry.key === item.moduleKey)!;
          return {
            id: item.id,
            moduleKey: item.moduleKey,
            moduleTitle: isThai ? module.titleTh : module.title,
            previousState: item.previousEnabled ? "active" : "maintenance",
            nextState: item.isEnabled ? "active" : "maintenance",
            reason: item.reason || (item.isEnabled ? isThai ? "เปิดใช้งานโมดูล" : "Module reopened." : ""),
            actor: item.actor,
            changedAt: item.changedAt,
          };
        }));
        setStatusError(null);
      } catch (error) {
        if (!controller.signal.aborted) {
          setStatusError(error instanceof Error ? error.message : isThai ? "โหลดสถานะโมดูลไม่สำเร็จ" : "Could not load module statuses.");
        }
      } finally {
        if (!controller.signal.aborted) setStatusesLoaded(true);
      }
    };
    void load();
    return () => controller.abort();
  }, [isThai]);

  const confirmChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedModule) return;

    const nextState = selectedModule.state === "active" ? "maintenance" : "active";
    const cleanReason = reason.trim();
    if (nextState === "maintenance" && !cleanReason) {
      setFormError(isThai ? "กรุณาระบุเหตุผลก่อนปิดโมดูล" : "Enter a reason before closing this module.");
      return;
    }

    setIsSaving(true);
    const moduleTitle = isThai ? selectedModule.titleTh : selectedModule.title;
    try {
      const { data: updated } = await apiPatch<ModuleStatus>("/api/modules/status", {
        moduleKey: selectedModule.key,
        isEnabled: nextState === "active",
        maintenanceReason: nextState === "maintenance" ? cleanReason : null,
      });
      const changedAt = updated.updatedAt;
      const resolvedReason = cleanReason || (isThai ? "เปิดใช้งานโมดูล" : "Module reopened.");
      setModules((current) => current.map((module) => module.key !== selectedModule.key
        ? module
        : {
            ...module,
            state: updated.isEnabled ? "active" : "maintenance",
            reason: updated.maintenanceReason,
            changedAt,
          }));
      setChanges((current) => [{
        id: Date.now(),
        moduleKey: selectedModule.key,
        moduleTitle,
        previousState: selectedModule.state,
        nextState: updated.isEnabled ? "active" : "maintenance",
        reason: updated.maintenanceReason || resolvedReason,
        actor: fullName || (isThai ? "ผู้ดูแลระบบ" : "Administrator"),
        changedAt,
      }, ...current]);
      closeDialog();
    } catch (error) {
      setFormError(error instanceof Error ? error.message : isThai ? "บันทึกสถานะไม่สำเร็จ" : "Could not save the module status.");
    } finally {
      setIsSaving(false);
    }
  };

  const statusCopy = (state: ModuleState) => {
    return state === "active"
      ? isThai ? "เปิดใช้งาน" : "Active"
      : isThai ? "ปิดปรับปรุง" : "Maintenance";
  };

  const formatDate = (value: string) => new Date(value).toLocaleString(isThai ? "th-TH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  if (!statusesLoaded) {
    return (
      <section className="mx-auto w-full max-w-7xl space-y-5 p-4 sm:p-6 lg:p-10" aria-busy="true">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(19rem,0.6fr)]">
          <SkeletonBox className="h-[32rem] w-full rounded-2xl" />
          <SkeletonBox className="h-[32rem] w-full rounded-2xl" />
        </div>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-7xl space-y-5 p-4 pb-10 sm:p-6 lg:p-10">
      {statusError && (
        <div role="alert" className="rounded-xl border border-[var(--status-danger)]/30 bg-[var(--status-danger)]/10 px-4 py-3 text-sm text-[var(--status-danger)]">
          {statusError}
        </div>
      )}

      <div className="grid gap-5 @container lg:grid-cols-[minmax(0,1.4fr)_minmax(19rem,0.6fr)]">
        <section aria-labelledby="module-list-title" className="min-w-0">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 id="module-list-title" className="text-base font-bold text-[#222222] dark:text-white">{isThai ? "โมดูลทั้งหมด" : "All modules"}</h3>
              <p className="mt-1 text-sm text-slate-500 dark:text-[#E4E4E7]">{isThai ? "สถานะที่แสดงมีผลกับการเข้าใช้งานจากหน้า Workspace" : "These states control access from the Workspace page."}</p>
            </div>
            <span className="hidden items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-zinc-400 sm:flex">
              <Activity size={14} aria-hidden="true" />
              {isThai ? "อัปเดตตามการเปลี่ยนแปลง" : "Updates as statuses change"}
            </span>
          </div>

          <div className="grid gap-3 @2xl:grid-cols-2">
            {modules.map((module) => {
              const title = isThai ? module.titleTh : module.title;
              const description = isThai ? module.descriptionTh : module.description;
              return (
                <article key={module.title} className="flex min-h-52 flex-col justify-between rounded-2xl border border-[#E4E4E7] bg-white p-5 shadow-sm dark:border-[#444444] dark:bg-[#383838] sm:p-6">
                  <div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border ${module.state === "active" ? "border-[var(--status-success)]/30 bg-[var(--status-success)]/10 text-[var(--status-success)]" : "border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10 text-[var(--status-warning)]"}`}>
                          <Power size={19} aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <h4 className="truncate font-semibold text-[#222222] dark:text-white">{title}</h4>
                          <p className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-zinc-400">{description}</p>
                        </div>
                      </div>
                      <StatusBadge state={module.state} label={statusCopy(module.state)} />
                    </div>

                    <div className="mt-5 rounded-xl bg-[#F8FAFC] px-4 py-3 dark:bg-[#2C2C2C]">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500 dark:text-zinc-400">{isThai ? "เหตุผล" : "Reason"}</p>
                      <p className="mt-1 text-sm leading-5 text-[#383838] dark:text-[#F4F4F5]">
                        {module.state === "maintenance"
                          ? module.reason || (isThai ? "ไม่มีเหตุผลการปิดปรับปรุง" : "No maintenance reason recorded.")
                          : isThai ? "โมดูลเปิดใช้งานอยู่" : "Module is active."}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E4E4E7] pt-4 dark:border-[#444444]">
                    <p className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-zinc-400">
                      <Clock3 size={13} aria-hidden="true" />
                      {module.changedAt
                        ? `${isThai ? "เปลี่ยนล่าสุด" : "Last changed"} ${formatDate(module.changedAt)}`
                        : isThai ? "สถานะตั้งต้น" : "Default status"}
                    </p>
                    <button
                      type="button"
                      onClick={() => openDialog(module.key)}
                      disabled={Boolean(statusError) || isSaving}
                      className={`inline-flex h-10 items-center gap-2 rounded-xl border px-3.5 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222]/30 dark:focus-visible:ring-white/40 ${module.state === "active" ? "border-[var(--status-danger)]/30 bg-[var(--status-danger)]/10 text-[var(--status-danger)] hover:bg-[var(--status-danger)]/15" : "border-[var(--status-success)]/30 bg-[var(--status-success)]/10 text-[var(--status-success)] hover:bg-[var(--status-success)]/15"}`}
                    >
                      <Power size={15} aria-hidden="true" />
                      {module.state === "active" ? isThai ? "ปิดโมดูล" : "Close module" : isThai ? "เปิดโมดูล" : "Open module"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <aside aria-labelledby="module-history-title" className="rounded-2xl border border-[#E4E4E7] bg-white p-5 dark:border-[#444444] dark:bg-[#383838] sm:p-6">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 text-[#222222] dark:text-white">
                <History size={18} aria-hidden="true" />
                <h3 id="module-history-title" className="text-base font-bold">{isThai ? "ประวัติการเปลี่ยนสถานะ" : "Status history"}</h3>
              </div>
              <p className="mt-1 text-sm text-slate-500 dark:text-[#E4E4E7]">{isThai ? "รายการล่าสุดจะแสดงอยู่ด้านบน" : "Most recent changes appear first."}</p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="rounded-full bg-[#F1F5F9] px-2.5 py-1 text-xs font-semibold text-[#383838] dark:bg-[#2C2C2C] dark:text-[#E4E4E7]">{changes.length}</span>
              <Link
                href="/controlpanel/module-status/history"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#E4E4E7] bg-white px-3 text-xs font-semibold text-[#222222] transition hover:bg-[#F1F5F9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#222222]/30 dark:border-[#555555] dark:bg-[#2C2C2C] dark:text-[#F4F4F5] dark:hover:bg-[#383838] dark:focus-visible:ring-white/40"
              >
                <ListFilter size={14} aria-hidden="true" />
                {isThai ? "ดูประวัติทั้งหมด" : "View full log"}
              </Link>
            </div>
          </div>

          {changes.length === 0 ? (
            <div className="mt-5 flex min-h-40 flex-col items-center justify-center rounded-xl border border-dashed border-[#E4E4E7] px-5 text-center dark:border-[#555555]">
              <History size={22} className="text-slate-400 dark:text-zinc-400" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-[#383838] dark:text-[#F4F4F5]">{isThai ? "ยังไม่มีประวัติการเปลี่ยนแปลง" : "No status changes yet"}</p>
              <p className="mt-1 max-w-xs text-xs leading-5 text-slate-500 dark:text-zinc-400">{isThai ? "เมื่อเปิดหรือปิดโมดูล รายการจะปรากฏพร้อมเหตุผล ผู้ดำเนินการ และเวลา" : "Opening or closing a module adds the reason, administrator, and time here."}</p>
            </div>
          ) : (
            <ol className="mt-5 space-y-3">
              {changes.map((change) => (
                <li key={change.id} className="rounded-xl border border-[#E4E4E7] p-4 dark:border-[#555555]">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <span className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${change.nextState === "active" ? "bg-[var(--status-success)]/10 text-[var(--status-success)]" : "bg-[var(--status-warning)]/10 text-[var(--status-warning)]"}`}>
                        {change.nextState === "active" ? <ArrowUpRight size={15} aria-hidden="true" /> : <ArrowDownRight size={15} aria-hidden="true" />}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-[#222222] dark:text-white">{change.moduleTitle}</p>
                        <p className="mt-0.5 text-xs text-slate-500 dark:text-zinc-400">{statusCopy(change.previousState)} → {statusCopy(change.nextState)}</p>
                      </div>
                    </div>
                    <time className="shrink-0 text-[11px] text-slate-500 dark:text-zinc-400">{formatDate(change.changedAt)}</time>
                  </div>
                  <p className="mt-3 text-sm leading-5 text-[#383838] dark:text-[#E4E4E7]">{change.reason}</p>
                  <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">{isThai ? "ดำเนินการโดย" : "Changed by"} {change.actor}</p>
                </li>
              ))}
            </ol>
          )}
        </aside>
      </div>

      {selectedModule && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeDialog(); }}
        >
          <section role="dialog" aria-modal="true" aria-labelledby="module-status-dialog-title" className="w-full max-w-lg rounded-2xl border border-[#E4E4E7] bg-white p-5 shadow-2xl dark:border-[#555555] dark:bg-[#383838] sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-3">
                <span className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${selectedModule.state === "active" ? "bg-[var(--status-danger)]/10 text-[var(--status-danger)]" : "bg-[var(--status-success)]/10 text-[var(--status-success)]"}`}>
                  {selectedModule.state === "active" ? <AlertTriangle size={19} aria-hidden="true" /> : <Power size={19} aria-hidden="true" />}
                </span>
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-zinc-400">{isThai ? "ยืนยันการเปลี่ยนสถานะ" : "Confirm status change"}</p>
                  <h3 id="module-status-dialog-title" className="mt-1 text-lg font-bold text-[#222222] dark:text-white">
                    {selectedModule.state === "active" ? isThai ? "ปิดโมดูล" : "Close module" : isThai ? "เปิดโมดูล" : "Open module"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-600 dark:text-[#E4E4E7]">{isThai ? selectedModule.titleTh : selectedModule.title}</p>
                </div>
              </div>
              <button type="button" aria-label={isThai ? "ปิดหน้าต่าง" : "Close dialog"} onClick={closeDialog} disabled={isSaving} className="rounded-lg p-2 text-slate-500 transition hover:bg-[#F1F5F9] disabled:cursor-wait disabled:opacity-60 dark:text-zinc-300 dark:hover:bg-[#2C2C2C] dark:hover:text-white">
                <X size={18} aria-hidden="true" />
              </button>
            </div>

            {selectedModule.state === "active" && (
              <div className="mt-5 flex gap-2.5 rounded-xl border border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10 p-3.5 text-sm text-[#383838] dark:text-[#F4F4F5]">
                <AlertTriangle size={17} className="mt-0.5 shrink-0 text-[var(--status-warning)]" aria-hidden="true" />
                <p>{isThai ? "ผู้ใช้จะไม่สามารถเข้าโมดูลนี้ได้จนกว่าจะเปิดใช้งานอีกครั้ง" : "Users will lose access until this module is opened again."}</p>
              </div>
            )}

      <form className="mt-5 space-y-4" onSubmit={confirmChange}>
              <label className="block">
                <span className="text-sm font-semibold text-[#222222] dark:text-white">{isThai ? "เหตุผล" : "Reason"}{selectedModule.state === "active" && <span className="ml-1 text-[var(--status-danger)]">*</span>}</span>
                <textarea
                  value={reason}
                  onChange={(event) => { setReason(event.target.value); setFormError(null); }}
                  rows={3}
                  maxLength={500}
                  placeholder={isThai ? "ระบุสาเหตุที่เปลี่ยนสถานะ" : "Describe why the status is changing"}
                  className="mt-2 w-full resize-y rounded-xl border border-[#737D88] bg-[#F8FAFC] px-3.5 py-3 text-sm text-[#222222] outline-none transition placeholder:text-slate-400 focus:border-[#222222] focus:ring-2 focus:ring-[#222222]/10 dark:border-[#666666] dark:bg-[#222222] dark:text-white dark:placeholder:text-zinc-500 dark:focus:border-white dark:focus:ring-white/10"
                />
                <span className="mt-1 block text-right text-[11px] text-slate-500 dark:text-zinc-400">{reason.length}/500</span>
              </label>
              {formError && <p role="alert" className="text-sm font-medium text-[var(--status-danger)]">{formError}</p>}
              <div className="flex flex-col-reverse gap-2 border-t border-[#E4E4E7] pt-4 dark:border-[#555555] sm:flex-row sm:justify-end">
                <button type="button" onClick={closeDialog} disabled={isSaving} className="h-10 rounded-xl border border-[#E4E4E7] px-4 text-sm font-semibold text-[#383838] transition hover:bg-[#F1F5F9] disabled:cursor-wait disabled:opacity-60 dark:border-[#555555] dark:text-[#E4E4E7] dark:hover:bg-[#2C2C2C]">
                  {isThai ? "ยกเลิก" : "Cancel"}
                </button>
                <button type="submit" disabled={isSaving} className={`inline-flex h-10 items-center justify-center gap-2 rounded-xl px-4 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 ${selectedModule.state === "active" ? "bg-[var(--status-danger)] text-white hover:brightness-95" : "bg-[#222222] text-white hover:bg-[#383838] dark:bg-white dark:text-[#222222] dark:hover:bg-[#E4E4E7]"}`}>
                  {isSaving ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Power size={15} aria-hidden="true" />}
                  {isSaving ? isThai ? "กำลังบันทึก..." : "Saving..." : selectedModule.state === "active" ? isThai ? "ยืนยันปิดโมดูล" : "Confirm close" : isThai ? "ยืนยันเปิดโมดูล" : "Confirm open"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </section>
  );
}

function StatusBadge({ state, label }: { state: ModuleState; label: string }) {
  const toneClass = state === "active"
    ? "border-[var(--status-success)]/30 bg-[var(--status-success)]/10 text-[var(--status-success)]"
    : "border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10 text-[var(--status-warning)]";

  return <span className={`inline-flex shrink-0 items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClass}`}>{label}</span>;
}
