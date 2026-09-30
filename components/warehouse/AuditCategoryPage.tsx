"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import CustomDropdown, { type DropdownOption } from "@/components/common/CustomDropdown";
import DatePicker from "@/components/common/DatePicker";
import Pagination from "@/components/common/Pagination";
import { Ellipsis, Search, SlidersHorizontal, X } from "lucide-react";
import { ApiRequestError } from "@/lib/api/client";
import { warehouseApi, type AuditEvent } from "@/lib/api/warehouse";
import { useAccountMenu } from "@/hooks/useAccountMenu";
import { useTheme } from "@/context/ThemeContext";
import { AUDIT_CATEGORIES, getAuditActionLabel, getAuditEntityTypeLabel } from "./auditLog";
import { input, panel } from "./Ui";

const PAGE_SIZE = 25;

export default function AuditCategoryPage({ categoryId }: { categoryId: string }) {
  const { isThai } = useAccountMenu();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const searchKey = searchParams.toString();
  const params = useMemo(() => new URLSearchParams(searchKey), [searchKey]);
  const query = params.get("q") ?? "";
  const from = params.get("from") ?? "";
  const to = params.get("to") ?? "";
  const action = params.get("action") ?? "";
  const entityType = params.get("entityType") ?? "";
  const sort = params.get("sort") ?? "date_desc";
  const category = AUDIT_CATEGORIES.find((item) => item.id === categoryId);
  const parsedPage = Number(params.get("page") ?? "1");
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0 ? parsedPage : 1;
  const [result, setResult] = useState<{
    key: string;
    items: AuditEvent[];
    total: number;
    error: string | null;
  } | null>(null);
  const [searchInput, setSearchInput] = useState(query);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftFrom, setDraftFrom] = useState(from);
  const [draftTo, setDraftTo] = useState(to);
  const [draftAction, setDraftAction] = useState(action);
  const [draftEntityType, setDraftEntityType] = useState(entityType);
  const [draftSort, setDraftSort] = useState(sort);
  const filterDropdownRef = useRef<HTMLDivElement>(null);

  // Sync search input state if query parameter changes externally
  useEffect(() => {
    setSearchInput(query);
  }, [query]);

  useEffect(() => {
    setDraftFrom(from);
    setDraftTo(to);
    setDraftAction(action);
    setDraftEntityType(entityType);
    setDraftSort(sort);
  }, [from, to, action, entityType, sort]);
  const loading = result?.key !== searchKey;
  const events = result?.key === searchKey ? result.items : [];
  const total = result?.key === searchKey ? result.total : 0;
  const error = result?.key === searchKey ? result.error : null;
  const activeFilterCount = [query, from || to, action, entityType, sort !== "date_desc" ? sort : ""]
    .filter(Boolean).length;

  const actionOptions: DropdownOption<string>[] = [
    { value: "", label: isThai ? "ทุกเหตุการณ์" : "All events" },
    ...(category?.actions ?? []).map((eventAction) => ({
      value: eventAction,
      label: getAuditActionLabel(eventAction, isThai),
    })),
  ];
  const entityOptions: DropdownOption<string>[] = [
    { value: "", label: isThai ? "ทุกประเภท" : "All record types" },
    ...(category?.entityTypes ?? []).map((type) => ({
      value: type,
      label: getAuditEntityTypeLabel(type, isThai),
    })),
  ];
  const sortOptions: DropdownOption<string>[] = [
    { value: "date_desc", label: isThai ? "วันที่ล่าสุดก่อน" : "Newest date first" },
    { value: "date_asc", label: isThai ? "วันที่เก่าก่อน" : "Oldest date first" },
    { value: "name_asc", label: isThai ? "ชื่อผู้ดำเนินการจากต้นไปท้าย" : "Actor name A–Z" },
    { value: "name_desc", label: isThai ? "ชื่อผู้ดำเนินการจากท้ายไปต้น" : "Actor name Z–A" },
  ];

  useEffect(() => {
    if (!filtersOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Element && event.target.closest('[role="listbox"]')) return;
      if (event.target instanceof Element && event.target.closest(".audit-log-calendar-popup")) return;
      if (event.target instanceof Node && !filterDropdownRef.current?.contains(event.target)) {
        setFiltersOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [filtersOpen]);

  useEffect(() => {
    const controller = new AbortController();
    void warehouseApi
      .auditPage({ category: categoryId, q: query, from, to, action, entityType, sort, page }, controller.signal)
      .then((response) => {
        setResult({
          key: searchKey,
          items: response.data.items,
          total: response.data.total,
          error: null,
        });
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        const message =
          cause instanceof ApiRequestError && cause.status === 403
            ? isThai
              ? "บัญชีนี้ไม่มีสิทธิ์ดูบันทึกการตรวจสอบ"
              : "This account cannot view audit logs."
            : cause instanceof Error
              ? cause.message
              : isThai
                ? "โหลดบันทึกไม่สำเร็จ"
                : "Could not load audit events.";
        setResult({ key: searchKey, items: [], total: 0, error: message });
      });
    return () => controller.abort();
  }, [categoryId, query, from, to, action, entityType, sort, page, isThai, searchKey]);

  const pushFilters = useCallback(
    (next: { q?: string; from?: string; to?: string; action?: string; entityType?: string; sort?: string; page?: number }) => {
      const nextParams = new URLSearchParams();
      if (next.q) nextParams.set("q", next.q);
      if (next.from) nextParams.set("from", next.from);
      if (next.to) nextParams.set("to", next.to);
      if (next.action) nextParams.set("action", next.action);
      if (next.entityType) nextParams.set("entityType", next.entityType);
      if (next.sort && next.sort !== "date_desc") nextParams.set("sort", next.sort);
      if (next.page && next.page > 1) nextParams.set("page", String(next.page));
      const suffix = nextParams.toString();
      router.push(suffix ? `${pathname}?${suffix}` : pathname);
    },
    [pathname, router],
  );

  // Debounce search input so user doesn't need to press enter
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const trimmed = searchInput.trim();
      if (trimmed !== query) {
        pushFilters({ q: trimmed, from, to, action, entityType, sort, page: 1 });
      }
    }, 300);
    return () => window.clearTimeout(timer);
  }, [searchInput, query, from, to, action, entityType, sort, pushFilters]);

  const updateFilters = (patch: Partial<{
    from: string;
    to: string;
    action: string;
    entityType: string;
    sort: string;
  }>) => {
    const next = {
      from: patch.from ?? draftFrom,
      to: patch.to ?? draftTo,
      action: patch.action ?? draftAction,
      entityType: patch.entityType ?? draftEntityType,
      sort: patch.sort ?? draftSort,
    };
    setDraftFrom(next.from);
    setDraftTo(next.to);
    setDraftAction(next.action);
    setDraftEntityType(next.entityType);
    setDraftSort(next.sort);
    pushFilters({
      q: query,
      ...next,
      page: 1,
    });
  };



  const columns: DataTableColumn<AuditEvent>[] = [
    {
      key: "created_at",
      header: isThai ? "วันที่และเวลา" : "Date and time",
      className: "whitespace-nowrap",
      render: (event) => new Date(event.created_at).toLocaleString(isThai ? "th-TH" : "en-GB"),
    },
    {
      key: "actor",
      header: isThai ? "ผู้ดำเนินการ" : "Actor",
      className: "min-w-48",
      render: (event) => (
        <div>
          <div className="font-medium">{event.actor_name || (isThai ? "ระบบ" : "System")}</div>
          {event.actor_email && <div className="text-xs text-slate-500 dark:text-zinc-400">{event.actor_email}</div>}
        </div>
      ),
    },
    {
      key: "event",
      header: isThai ? "เหตุการณ์" : "Event",
      className: "min-w-48 font-medium",
      render: (event) => getAuditActionLabel(event.action, isThai),
    },
    {
      key: "entity",
      header: isThai ? "รายการที่เกี่ยวข้อง" : "Related record",
      className: "whitespace-nowrap font-mono text-xs",
      render: (event) => `${event.entity_type}${event.entity_id === null ? "" : ` #${event.entity_id}`}`,
    },
    {
      key: "details",
      header: null,
      headerClassName: "w-14",
      className: "w-14 text-center",
      render: (event) => {
        const hasDetails = event.before_data !== null || event.after_data !== null;

        if (!hasDetails) {
          return (
            <button
              type="button"
              disabled
              aria-label={isThai ? "ไม่มีรายละเอียดเพิ่มเติม" : "No additional details"}
              className="inline-flex h-8 w-8 cursor-not-allowed items-center justify-center opacity-35"
            >
              <Ellipsis className={`h-4 w-4 ${isLight ? "text-black" : "text-white"}`} aria-hidden="true" />
            </button>
          );
        }

        return <AuditDetails event={event} isThai={isThai} isLight={isLight} />;
      },
    },
  ];

  return (
    <main className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="relative z-30 flex items-center gap-2">
          {/* Search Input */}
          <div
            className={`relative flex items-center px-3 py-1.5 min-w-0 flex-1 rounded-[6px] border text-[13px] transition-colors ${
              isLight
                ? "bg-white border-[#E4E4E7] text-[#222222]"
                : "bg-[#383838] border-[#444444] text-[#F8FAFC]"
            }`}
          >
            <Search size={14} className="text-[#A1A1AA] shrink-0 mr-2" aria-hidden="true" />
            <input
              type="text"
              name="q"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              aria-label={isThai ? "ค้นหาชื่อ อีเมล หรือรหัสรายการ" : "Search name, email, or record ID"}
              placeholder={isThai ? "ค้นหาชื่อ อีเมล หรือรหัสรายการ" : "Search name, email, or record ID"}
              className="w-full bg-transparent border-none outline-none text-[13px] placeholder:text-[#A1A1AA] pr-6"
            />
            {searchInput && (
              <button
                type="button"
                aria-label={isThai ? "ล้างคำค้นหา" : "Clear search"}
                onClick={() => {
                  setSearchInput("");
                  pushFilters({ q: "", from, to, action, entityType, sort, page: 1 });
                }}
                className={`absolute right-2 top-1/2 inline-flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-md ${
                  isLight ? "text-zinc-500 hover:text-black hover:bg-black/5" : "text-zinc-400 hover:text-white hover:bg-white/10"
                }`}
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
          <div className="relative shrink-0" ref={filterDropdownRef}>
          <button
            type="button"
            aria-expanded={filtersOpen}
            aria-controls="audit-filter-panel"
            onClick={() => {
              if (!filtersOpen) {
                setDraftFrom(from);
                setDraftTo(to);
                setDraftAction(action);
                setDraftEntityType(entityType);
                setDraftSort(sort);
              }
              setFiltersOpen((open) => !open);
            }}
            className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${isLight ? "border-[#E4E4E7] bg-white text-[#222222] hover:bg-slate-50" : "border-[#444444] bg-[#383838] text-white hover:bg-white/5"}`}
          >
            <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
            {isThai ? "ตัวกรอง" : "Filters"}
            {activeFilterCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6366F1] px-1 text-xs text-white">{activeFilterCount}</span>
            )}
          </button>
          {filtersOpen && (
            <form
              key={searchKey}
              id="audit-filter-panel"
              onSubmit={(event) => event.preventDefault()}
              className={`absolute right-0 top-full z-30 mt-2 w-[min(680px,calc(100vw-2rem))] space-y-4 rounded-2xl border p-4 shadow-2xl sm:p-5 ${isLight ? "border-[#E4E4E7] bg-white text-[#222222]" : "border-[#444444] bg-[#383838] text-white"}`}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm font-medium">
                  <span>{isThai ? "วันที่เริ่มต้น" : "Start date"}</span>
                  <DatePicker
                    value={draftFrom}
                    onChange={(value) => updateFilters({ from: value })}
                    isThai={isThai}
                    maxDate={draftTo || undefined}
                    placeholder={isThai ? "เลือกวันที่เริ่มต้น" : "Select start date"}
                    triggerClassName="!h-10 !rounded-xl !px-3 !py-2 !text-sm"
                    iconClassName={isLight ? "!text-black" : "!text-white"}
                    calendarClassName="audit-log-calendar-popup"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>{isThai ? "วันที่สิ้นสุด" : "End date"}</span>
                  <DatePicker
                    value={draftTo}
                    onChange={(value) => updateFilters({ to: value })}
                    isThai={isThai}
                    minDate={draftFrom || undefined}
                    placeholder={isThai ? "เลือกวันที่สิ้นสุด" : "Select end date"}
                    triggerClassName="!h-10 !rounded-xl !px-3 !py-2 !text-sm"
                    iconClassName={isLight ? "!text-black" : "!text-white"}
                    calendarClassName="audit-log-calendar-popup"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>{isThai ? "เหตุการณ์" : "Event"}</span>
                  <CustomDropdown
                    value={draftAction}
                    onChange={(value) => updateFilters({ action: value })}
                    options={actionOptions}
                    className="w-full"
                    placeholder={isThai ? "เลือกเหตุการณ์" : "Select event"}
                    triggerClassName="min-h-10 !rounded-xl !px-3 !py-2 !text-sm"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium">
                  <span>{isThai ? "ประเภทข้อมูล" : "Record type"}</span>
                  <CustomDropdown
                    value={draftEntityType}
                    onChange={(value) => updateFilters({ entityType: value })}
                    options={entityOptions}
                    className="w-full"
                    placeholder={isThai ? "เลือกประเภทข้อมูล" : "Select record type"}
                    triggerClassName="min-h-10 !rounded-xl !px-3 !py-2 !text-sm"
                  />
                </label>
                <label className="space-y-1.5 text-sm font-medium sm:col-span-2">
                  <span>{isThai ? "เรียงตาม" : "Sort by"}</span>
                  <CustomDropdown
                    value={draftSort}
                    onChange={(value) => updateFilters({ sort: value })}
                    options={sortOptions}
                    className="w-full"
                    placeholder={isThai ? "เลือกการเรียง" : "Select sort order"}
                    triggerClassName="min-h-10 !rounded-xl !px-3 !py-2 !text-sm"
                  />
                </label>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-200 pt-3 dark:border-white/10">
                <button
                  type="button"
                  className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold transition-colors hover:bg-slate-100 dark:border-white/15 dark:hover:bg-white/5"
                  onClick={() => {
                    setSearchInput("");
                    setDraftFrom("");
                    setDraftTo("");
                    setDraftAction("");
                    setDraftEntityType("");
                    setDraftSort("date_desc");
                    setFiltersOpen(false);
                    pushFilters({ page: 1 });
                  }}
                >
                  {isThai ? "ล้างตัวกรอง" : "Clear filters"}
                </button>
              </div>
            </form>
          )}
          </div>
      </div>

      <section className={`${panel} space-y-4`}>
        {error && <div role="alert" className="rounded-xl border border-[#E74C3C]/30 bg-[#E74C3C]/10 px-4 py-3 text-sm text-[#E74C3C]">{error}</div>}
        <DataTable
          columns={columns}
          data={events}
          keyExtractor={(event) => event.id}
          isLoading={loading}
          skeletonRowCount={5}
          minWidth="1080px"
          emptyTitle={isThai ? "ไม่พบบันทึกในหมวดนี้" : "No events in this category"}
        />
      </section>
      {total > 0 && (
        <Pagination
          currentPage={page}
          totalPages={Math.ceil(total / PAGE_SIZE)}
          totalItems={total}
          pageSize={PAGE_SIZE}
          isThai={isThai}
          onPageChange={(nextPage) =>
            pushFilters({ q: query, from, to, action, entityType, sort, page: nextPage })
          }
        />
      )}
    </main>
  );
}

function AuditDetails({
  event,
  isThai,
  isLight,
}: {
  event: AuditEvent;
  isThai: boolean;
  isLight: boolean;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const cardClass = isLight
    ? "border-[#E4E4E7] bg-white text-[#222222]"
    : "border-[#444444] bg-[#383838] text-white";

  return (
    <>
      <button
        type="button"
        aria-label={isThai ? "ดูรายละเอียดก่อนและหลัง" : "View before and after"}
        onClick={() => dialogRef.current?.showModal()}
        className="mx-auto inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-black/5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#6366F1] dark:hover:bg-white/10"
      >
        <Ellipsis className={`h-4 w-4 ${isLight ? "text-black" : "text-white"}`} aria-hidden="true" />
      </button>
      <dialog
        ref={dialogRef}
        aria-label={isThai ? "รายละเอียดการเปลี่ยนแปลง" : "Change details"}
        onClick={(event) => {
          if (event.target === event.currentTarget) dialogRef.current?.close();
        }}
        className="fixed inset-0 m-auto max-h-[90dvh] w-[min(920px,calc(100vw-2rem))] overflow-visible bg-transparent p-0 text-inherit backdrop:bg-black/60"
      >
        <section className={`max-h-[90dvh] overflow-y-auto rounded-2xl border shadow-2xl ${cardClass}`}>
          <header className={`sticky top-0 z-10 flex items-center justify-between gap-4 border-b px-5 py-4 ${isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#383838]"}`}>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold">
                {isThai ? "รายละเอียดการเปลี่ยนแปลง" : "Change details"}
              </h2>
            </div>
            <button
              type="button"
              aria-label={isThai ? "ปิดรายละเอียด" : "Close details"}
              onClick={() => dialogRef.current?.close()}
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
            >
              <X size={18} aria-hidden="true" />
            </button>
          </header>
          <div className="space-y-4 p-5">
            <section className={`rounded-xl border p-4 ${isLight ? "border-[#E4E4E7] bg-[#F8FAFC]" : "border-[#444444] bg-[#2C2C2C]"}`}>
              <h3 className="mb-3 text-sm font-semibold">{isThai ? "ข้อมูลรายการ" : "Record information"}</h3>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div className="min-w-0">
                  <dt className={`text-xs font-medium ${isLight ? "text-slate-500" : "text-zinc-300"}`}>{isThai ? "วันที่และเวลา" : "Date and time"}</dt>
                  <dd className="mt-1 break-words text-sm">{new Date(event.created_at).toLocaleString(isThai ? "th-TH" : "en-GB")}</dd>
                </div>
                <div className="min-w-0">
                  <dt className={`text-xs font-medium ${isLight ? "text-slate-500" : "text-zinc-300"}`}>{isThai ? "ผู้ดำเนินการ" : "Actor"}</dt>
                  <dd className="mt-1 break-words text-sm">
                    {event.actor_name || (isThai ? "ระบบ" : "System")}
                    {event.actor_email && <span className={`block text-xs ${isLight ? "text-slate-500" : "text-zinc-300"}`}>{event.actor_email}</span>}
                  </dd>
                </div>
                <div className="min-w-0">
                  <dt className={`text-xs font-medium ${isLight ? "text-slate-500" : "text-zinc-300"}`}>{isThai ? "เหตุการณ์" : "Event"}</dt>
                  <dd className="mt-1 break-words text-sm">{getAuditActionLabel(event.action, isThai)}</dd>
                </div>
                <div className="min-w-0">
                  <dt className={`text-xs font-medium ${isLight ? "text-slate-500" : "text-zinc-300"}`}>{isThai ? "รายการที่เกี่ยวข้อง" : "Related record"}</dt>
                  <dd className="mt-1 break-words font-mono text-xs">{`${event.entity_type}${event.entity_id === null ? "" : ` #${event.entity_id}`}`}</dd>
                </div>
              </dl>
            </section>
            <div className="grid gap-4 md:grid-cols-2">
              {event.before_data !== null && (
                <Snapshot label={isThai ? "ก่อนดำเนินการ" : "Before"} value={event.before_data} isThai={isThai} isLight={isLight} />
              )}
              {event.after_data !== null && (
                <Snapshot label={isThai ? "หลังดำเนินการ" : "After"} value={event.after_data} isThai={isThai} isLight={isLight} />
              )}
            </div>
          </div>
        </section>
      </dialog>
    </>
  );
}

function Snapshot({
  label,
  value,
  isThai,
  isLight,
}: {
  label: string;
  value: Record<string, unknown>;
  isThai: boolean;
  isLight: boolean;
}) {
  const panelClass = isLight
    ? "border-[#E4E4E7] bg-[#F8FAFC]"
    : "border-[#444444] bg-[#2C2C2C]";
  const entries = Object.entries(value);

  return (
    <section className={`min-w-0 rounded-xl border p-4 ${panelClass}`}>
      <h3 className="mb-3 text-sm font-semibold">{label}</h3>
      {entries.length === 0 ? (
        <p className={`text-sm ${isLight ? "text-slate-500" : "text-zinc-300"}`}>
          {isThai ? "ไม่มีข้อมูล" : "No data"}
        </p>
      ) : (
        <dl className="space-y-3">
          {entries.map(([key, fieldValue]) => (
            <div key={key} className="grid min-w-0 gap-1">
              <dt className={`break-words text-xs font-medium ${isLight ? "text-slate-500" : "text-zinc-300"}`}>
                {formatAuditField(key)}
              </dt>
              <dd className="min-w-0 break-words text-sm">
                {fieldValue !== null && typeof fieldValue === "object" ? (
                  <pre className={`max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg p-2 font-mono text-[11px] ${isLight ? "bg-white" : "bg-black/20"}`}>
                    {JSON.stringify(fieldValue, null, 2)}
                  </pre>
                ) : (
                  String(fieldValue ?? "—")
                )}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  );
}

function formatAuditField(key: string) {
  return key
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ");
}
