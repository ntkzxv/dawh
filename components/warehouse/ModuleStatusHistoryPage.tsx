"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import DataTable, { dataTableFrameClassName, type DataTableColumn } from "@/components/common/DataTable";
import DatePicker from "@/components/common/DatePicker";
import FilterDropdown from "@/components/common/FilterDropdown";
import Pagination from "@/components/common/Pagination";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import { apiGet } from "@/lib/api/client";
import type { ManagedModuleKey, ModuleStatusHistoryItem } from "@/lib/contracts/module-status";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";

type StatusFilter = "all" | "enabled" | "disabled";
type ModuleFilter = "all" | ManagedModuleKey;

const PAGE_SIZE = 25;

const moduleNames: Record<ManagedModuleKey, { th: string; en: string }> = {
  datacenter: { th: "สัญญาเช่าซื้อ", en: "HP Datacenter" },
  warehouse: { th: "คลังสินค้า", en: "Warehouse ERP" },
  sales: { th: "การขาย", en: "Sales" },
  reports: { th: "รายงานและตรวจสอบ", en: "Reports & Auditing" },
};

const statusLabel = (enabled: boolean, isThai: boolean) => enabled
  ? isThai ? "เปิดใช้งาน" : "Enabled"
  : isThai ? "ปิดใช้งาน" : "Disabled";

const formatDate = (value: string, isThai: boolean) => new Intl.DateTimeFormat(isThai ? "th-TH" : "en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "Asia/Bangkok",
}).format(new Date(value));

export default function ModuleStatusHistoryPage() {
  const isThai = useAppLanguage() === "TH";
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [items, setItems] = useState<ModuleStatusHistoryItem[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [module, setModule] = useState<ModuleFilter>("all");
  const [from, setFrom] = useState<string | null>(null);
  const [to, setTo] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const query = useMemo(() => {
    const params = new URLSearchParams({
      page: String(page),
      limit: String(PAGE_SIZE),
      status,
      module,
    });
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    return params.toString();
  }, [from, module, page, status, to]);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    void apiGet<ModuleStatusHistoryItem[]>(`/api/modules/status/history/table?${query}`, {
      signal: controller.signal,
    })
      .then((result) => {
        setItems(result.data);
        setTotal(result.page?.total ?? 0);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(cause instanceof Error
            ? cause.message
            : isThai ? "โหลดประวัติไม่สำเร็จ" : "Could not load status history.");
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [isThai, query]);

  const updateStatus = (value: StatusFilter) => {
    setPage(1);
    setStatus(value);
  };

  const updateModule = (value: ModuleFilter) => {
    setPage(1);
    setModule(value);
  };

  const updateFrom = (value: string) => {
    setPage(1);
    setFrom(value || null);
  };

  const updateTo = (value: string) => {
    setPage(1);
    setTo(value || null);
  };

  const clearFilters = () => {
    setPage(1);
    setStatus("all");
    setModule("all");
    setFrom(null);
    setTo(null);
  };

  const columns = useMemo<DataTableColumn<ModuleStatusHistoryItem>[]>(() => [
    {
      key: "changedAt",
      header: isThai ? "วันและเวลา" : "Date and time",
      className: "min-w-[170px]",
      render: (item) => <time dateTime={item.changedAt}>{formatDate(item.changedAt, isThai)}</time>,
    },
    {
      key: "module",
      header: isThai ? "โมดูล" : "Module",
      render: (item) => isThai ? moduleNames[item.moduleKey].th : moduleNames[item.moduleKey].en,
    },
    {
      key: "status",
      header: isThai ? "การเปลี่ยนแปลง" : "Status change",
      className: "min-w-[210px]",
      render: (item) => (
        <span className="inline-flex items-center gap-2">
          <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${item.previousEnabled
            ? "border-[var(--status-success)]/30 bg-[var(--status-success)]/10 text-[var(--status-success)]"
            : "border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10 text-[var(--status-warning)]"}`}>
            {statusLabel(item.previousEnabled, isThai)}
          </span>
          <ArrowRight size={13} className={isLight ? "text-[#737D88]" : "text-[#E4E4E7]"} aria-hidden="true" />
          <span className={`rounded-full border px-2 py-1 text-[11px] font-semibold ${item.isEnabled
            ? "border-[var(--status-success)]/30 bg-[var(--status-success)]/10 text-[var(--status-success)]"
            : "border-[var(--status-warning)]/30 bg-[var(--status-warning)]/10 text-[var(--status-warning)]"}`}>
            {statusLabel(item.isEnabled, isThai)}
          </span>
        </span>
      ),
    },
    {
      key: "reason",
      header: isThai ? "เหตุผล" : "Reason",
      className: "min-w-[240px] whitespace-normal",
      render: (item) => item.reason || (item.isEnabled
        ? isThai ? "เปิดใช้งานโมดูล" : "Module reopened."
        : isThai ? "ไม่มีการระบุเหตุผล" : "No reason recorded."),
    },
    {
      key: "actor",
      header: isThai ? "ผู้ดำเนินการ" : "Changed by",
      className: "min-w-[170px]",
      render: (item) => item.actor,
    },
  ], [isLight, isThai]);

  const activeFilterCount = Number(status !== "all") + Number(module !== "all") + Number(Boolean(from)) + Number(Boolean(to));
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const textMuted = isLight ? "text-[#383838]" : "text-[#E4E4E7]";

  return (
    <WarehousePageTemplate
      titleEn="Module status history"
      titleTh="ประวัติสถานะโมดูล"
      routePath="/controlpanel/module-status/history"
      fullBleed
    >
      <main className="mx-auto w-full max-w-[1500px] space-y-5 p-4 pb-10 sm:p-6 lg:p-10">
        <section className={`rounded-2xl border p-5 sm:p-6 ${isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#383838]"}`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <Link
                href="/controlpanel/module-status"
                className={`mb-3 inline-flex items-center gap-1.5 text-xs font-semibold transition hover:underline ${textMuted}`}
              >
                <ArrowLeft size={14} aria-hidden="true" />
                {isThai ? "กลับไปหน้าสถานะโมดูล" : "Back to module status"}
              </Link>
              <h2 className={`text-xl font-bold tracking-tight ${isLight ? "text-[#222222]" : "text-white"}`}>
                {isThai ? "บันทึกประวัติการเปลี่ยนสถานะทั้งหมด" : "Complete module status log"}
              </h2>
              <p className={`mt-1 text-sm ${textMuted}`}>
                {isThai ? "ตรวจสอบผู้ดำเนินการ เหตุผล และเวลาเปิดหรือปิดแต่ละครั้ง" : "Review who changed each module, why, and when it was opened or closed."}
              </p>
            </div>
            <div className={`rounded-lg border px-3 py-2 text-xs font-medium ${isLight ? "border-[#E4E4E7] bg-[#F8FAFC] text-[#383838]" : "border-[#555555] bg-[#2C2C2C] text-[#E4E4E7]"}`}>
              {isThai ? `${total.toLocaleString("th-TH")} รายการทั้งหมด` : `${total.toLocaleString("en-US")} total entries`}
            </div>
          </div>
        </section>

        <section aria-label={isThai ? "ตัวกรองประวัติ" : "History filters"} className={`rounded-2xl border p-4 sm:p-5 ${isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#383838]"}`}>
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h3 className={`text-sm font-semibold ${isLight ? "text-[#222222]" : "text-white"}`}>{isThai ? "ตัวกรอง" : "Filters"}</h3>
              <p className={`mt-0.5 text-xs ${textMuted}`}>{isThai ? "กรองตามสถานะ โมดูล และช่วงวันที่" : "Filter by status, module, and date range."}</p>
            </div>
            <button
              type="button"
              onClick={clearFilters}
              disabled={activeFilterCount === 0}
              className={`inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-40 ${isLight ? "text-[#222222] hover:bg-[#F1F5F9]" : "text-[#F4F4F5] hover:bg-[#2C2C2C]"}`}
            >
              <RotateCcw size={13} aria-hidden="true" />
              {isThai ? "ล้างตัวกรอง" : "Clear filters"}
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1.5">
              <span className={`block text-xs font-medium ${textMuted}`}>{isThai ? "สถานะหลังเปลี่ยน" : "Resulting status"}</span>
              <FilterDropdown<StatusFilter>
                value={status}
                onChange={updateStatus}
                options={[
                  { value: "all", label: isThai ? "ทุกสถานะ" : "All statuses" },
                  { value: "enabled", label: isThai ? "เปิดใช้งาน" : "Enabled" },
                  { value: "disabled", label: isThai ? "ปิดใช้งาน" : "Disabled" },
                ]}
                className="w-full"
                triggerClassName="!w-full !justify-between"
              />
            </label>
            <label className="space-y-1.5">
              <span className={`block text-xs font-medium ${textMuted}`}>{isThai ? "โมดูล" : "Module"}</span>
              <FilterDropdown<ModuleFilter>
                value={module}
                onChange={updateModule}
                options={[
                  { value: "all", label: isThai ? "ทุกโมดูล" : "All modules" },
                  ...Object.entries(moduleNames).map(([value, name]) => ({
                    value: value as ManagedModuleKey,
                    label: isThai ? name.th : name.en,
                  })),
                ]}
                className="w-full"
                triggerClassName="!w-full !justify-between"
              />
            </label>
            <label className="space-y-1.5">
              <span className={`block text-xs font-medium ${textMuted}`}>{isThai ? "ตั้งแต่วันที่" : "From date"}</span>
              <DatePicker
                value={from}
                onChange={updateFrom}
                isThai={isThai}
                placeholder={isThai ? "เลือกวันเริ่มต้น" : "Choose start date"}
                maxDate={to ?? undefined}
                size="sm"
                className="w-full"
                triggerClassName="!h-[33px] !w-full !justify-between !rounded-[6px]"
              />
            </label>
            <label className="space-y-1.5">
              <span className={`block text-xs font-medium ${textMuted}`}>{isThai ? "ถึงวันที่" : "To date"}</span>
              <DatePicker
                value={to}
                onChange={updateTo}
                isThai={isThai}
                placeholder={isThai ? "เลือกวันสิ้นสุด" : "Choose end date"}
                minDate={from ?? undefined}
                size="sm"
                className="w-full"
                triggerClassName="!h-[33px] !w-full !justify-between !rounded-[6px]"
              />
            </label>
          </div>
        </section>

        {error && (
          <div role="alert" className="rounded-xl border border-[var(--status-danger)]/30 bg-[var(--status-danger)]/10 px-4 py-3 text-sm text-[var(--status-danger)]">
            {error}
          </div>
        )}

        {isLoading && items.length === 0 ? (
          <div className="space-y-3" aria-busy="true">
            <SkeletonBox className="h-12 w-full rounded-xl" />
            <SkeletonBox className="h-80 w-full rounded-xl" />
          </div>
        ) : (
          <>
            <div className={dataTableFrameClassName(isLight)}>
              <DataTable
                columns={columns}
                data={items}
                keyExtractor={(item) => item.id}
                isLoading={isLoading}
                emptyTitle={isThai ? "ไม่พบประวัติตามตัวกรองที่เลือก" : "No history matches these filters."}
                minWidth="1080px"
              />
            </div>
            <Pagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              pageItemCount={items.length}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              isThai={isThai}
              isLoading={isLoading}
            />
          </>
        )}
      </main>
    </WarehousePageTemplate>
  );
}
