"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, GripVertical, LayoutGrid, Menu, Plus } from "lucide-react";
import { Reorder } from "framer-motion";
import DataTable, { type DataTableColumn } from "@/components/common/DataTable";
import SearchInput from "@/components/common/SearchInput";
import FilterDropdown from "@/components/common/FilterDropdown";
import FilterButton from "@/components/common/FilterButton";
import CommonButton from "@/components/common/Button";
import { Pagination } from "@/components/common";
import { useTheme } from "@/context/ThemeContext";
import { useAccountMenu } from "@/hooks/useAccountMenu";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import { DAWH_LOGOS } from "@/config/brand";

type Status = "active" | "inactive";
type PreviewRow = {
  id: number;
  name: string;
  code?: string;
  address?: string;
  active: Status;
};
type DesignKind = "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "10";

const rows: PreviewRow[] = [
  { id: 1, code: "BKK-001", name: "สาขากรุงเทพฯ", address: "ปทุมวัน, กรุงเทพมหานคร", active: "active" },
  { id: 2, code: "CNX-001", name: "สาขาเชียงใหม่", address: "อำเภอเมืองเชียงใหม่", active: "active" },
  { id: 3, code: "HKT-001", name: "สาขาภูเก็ต", address: "อำเภอเมืองภูเก็ต", active: "active" },
  { id: 4, code: "KKN-001", name: "สาขาขอนแก่น", address: "อำเภอเมืองขอนแก่น", active: "inactive" },
  { id: 5, code: "RYG-001", name: "สาขาระยอง", address: "อำเภอเมืองระยอง", active: "active" },
  { id: 6, code: "HDY-001", name: "สาขาหาดใหญ่", address: "อำเภอหาดใหญ่, สงขลา", active: "active" },
];

const statusBadge = (status: Status, isThai: boolean) => (
  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${status === "active" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-300" : "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-zinc-300"}`}>
    {status === "active" ? (isThai ? "ใช้งาน" : "Active") : (isThai ? "ปิดใช้งาน" : "Inactive")}
  </span>
);

export default function TableDesignPlayground() {
  const { theme } = useTheme();
  const { isThai } = useAccountMenu();
  const isLight = theme === "light";
  const [isMinimized, setIsMinimized] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDesign, setActiveDesign] = useState<DesignKind>("2");
  const [tabOrder, setTabOrder] = useState<DesignKind[]>(["1", "2", "4", "3", "5", "6", "7", "8", "9", "10"]);
  const navigateToDesign = (kind: DesignKind) => {
    setActiveDesign(kind);
    setMobileOpen(false);
  };

  return (
      <div className={`flex min-h-screen w-full ${isLight ? "bg-[#F8FAFC] text-[#222222]" : "bg-[#2C2C2C] text-white"}`}>
        <div className="sticky top-0 hidden h-screen shrink-0 md:flex">
          <TablePreviewSidebar
            isMinimized={isMinimized}
            onMinimizedChange={setIsMinimized}
            activeDesign={activeDesign}
            tabOrder={tabOrder}
            onTabOrderChange={setTabOrder}
            onSelect={navigateToDesign}
            isLight={isLight}
            isThai={isThai}
          />
        </div>
        {mobileOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <button type="button" aria-label={isThai ? "ปิดเมนู" : "Close menu"} className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
            <TablePreviewSidebar
              isMinimized={false}
              onMinimizedChange={setIsMinimized}
              activeDesign={activeDesign}
              tabOrder={tabOrder}
              onTabOrderChange={setTabOrder}
              onSelect={navigateToDesign}
              isLight={isLight}
              isThai={isThai}
              mobileOpen
            />
          </div>
        )}
        <div className="min-h-screen min-w-0 flex-1">
          <WarehousePageTemplate
            titleEn="Table layout previews"
            titleTh="ตัวอย่างเลย์เอาต์ตาราง"
            routePath="/test"
            fullBleed
            headerActions={(
              <div className="flex items-center gap-3">
                <button type="button" aria-label={isThai ? "เปิดเมนู" : "Open menu"} className="rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10 md:hidden" onClick={() => setMobileOpen(true)}>
                  <Menu size={20} />
                </button>
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-400/10 dark:text-amber-200">MOCK</span>
              </div>
            )}
          >
          <div className="mx-auto w-full max-w-7xl p-6 sm:p-10">
            <PreviewSection kind={activeDesign} isThai={isThai} isLight={isLight} />
          </div>
          </WarehousePageTemplate>
        </div>
      </div>
  );
}

function PreviewSection({ kind, isThai, isLight }: { kind: DesignKind; isThai: boolean; isLight: boolean }) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | Status>("all");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const allRows = rows;
  const title = isThai ? "สาขา" : "Branches";
  const filteredRows = useMemo(() => allRows.filter((row) => {
    if (status !== "all" && row.active !== status) return false;
    return Object.values(row).join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
  }), [allRows, query, status]);
  const totalPages = Math.ceil(filteredRows.length / pageSize);
  const pageRows = filteredRows.slice((page - 1) * pageSize, page * pageSize);
  const columns = useMemo<DataTableColumn<PreviewRow>[]>(() => getColumns(isThai), [isThai]);
  const setSearch = (value: string) => { setQuery(value); setPage(1); };
  const setStatusFilter = (value: "all" | Status) => { setStatus(value); setPage(1); };
  const filters = (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <SearchInput value={query} onChange={setSearch} placeholder={isThai ? `ค้นหา${title}...` : `Search ${title.toLowerCase()}...`} width="w-full sm:w-72" />
      <StatusFilterControl value={status} onChange={setStatusFilter} isThai={isThai} isLight={isLight} />
    </div>
  );

  if (kind === "8") return (
    <section id={`preview-${kind}`} className="scroll-mt-6">
      <div className="grid gap-5 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className={`flex flex-col gap-5 rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#383838]"}`}>
          <div>
            <div className={`text-sm font-semibold ${isLight ? "text-slate-600" : "text-zinc-300"}`}>{isThai ? "รายการทั้งหมด" : "Total items"}</div>
            <div className="mt-1 text-2xl font-semibold tabular-nums">{filteredRows.length}</div>
          </div>
          <SearchInput value={query} onChange={setSearch} placeholder={isThai ? "ค้นหารายการ..." : "Search items..."} width="w-full" />
          <StatusFilterControl value={status} onChange={setStatusFilter} isThai={isThai} isLight={isLight} />
          <CommonButton variant="primary" icon={<Plus size={14} />} className="w-full">{isThai ? "เพิ่มรายการ" : "Add item"}</CommonButton>
        </aside>
        <div className="min-w-0 space-y-3">
          <div className={`overflow-hidden rounded-2xl border ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#383838]"}`}>
            <DataTable columns={columns} data={pageRows} keyExtractor={(row) => row.id} minWidth="760px" emptyTitle={isThai ? "ไม่พบรายการ" : "No items found"} />
          </div>
          <Pagination currentPage={page} totalPages={totalPages} totalItems={filteredRows.length} pageSize={pageSize} onPageChange={setPage} isThai={isThai} className="px-1" />
        </div>
      </div>
    </section>
  );

  if (kind === "9") return (
    <section id={`preview-${kind}`} className="scroll-mt-6">
      <div className={`overflow-hidden rounded-2xl border ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#383838]"}`}>
        <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">{isThai ? "รายการ" : "Items"}</h2>
            <p className={`mt-1 text-sm ${isLight ? "text-slate-500" : "text-zinc-400"}`}>{isThai ? `ทั้งหมด ${filteredRows.length} รายการ` : `${filteredRows.length} total items`}</p>
          </div>
          <CommonButton variant="primary" icon={<Plus size={14} />}>{isThai ? "เพิ่มรายการ" : "Add item"}</CommonButton>
        </div>
        <div className={`flex flex-col gap-3 border-y px-5 py-3 sm:flex-row sm:items-center ${isLight ? "border-slate-200 bg-slate-50/70" : "border-white/10 bg-white/[0.02]"}`}>
          {filters}
        </div>
        <DataTable columns={columns} data={pageRows} keyExtractor={(row) => row.id} minWidth="760px" emptyTitle={isThai ? "ไม่พบรายการ" : "No items found"} />
        <div className={`border-t ${isLight ? "border-slate-200" : "border-white/10"}`}>
          <Pagination currentPage={page} totalPages={totalPages} totalItems={filteredRows.length} pageSize={pageSize} onPageChange={setPage} isThai={isThai} className="px-5" />
        </div>
      </div>
    </section>
  );

  if (kind === "2") return (
    <section id={`preview-${kind}`} className="scroll-mt-6 space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {filters}
        <CommonButton variant="primary" icon={<Plus size={14} />}>{isThai ? "เพิ่มรายการ" : "Add item"}</CommonButton>
      </div>
      <div className={`overflow-hidden rounded-xl border ${isLight ? "border-[#D4D4D8] bg-white" : "border-[#555555] bg-[#383838]"}`}>
        <DataTable columns={columns} data={pageRows} keyExtractor={(row) => row.id} minWidth="760px" tableClassName="!border-separate !border-spacing-0 !border-0 bg-transparent" emptyTitle={isThai ? "ไม่พบรายการ" : "No items found"} />
        <Pagination currentPage={page} totalPages={totalPages} totalItems={filteredRows.length} pageSize={pageSize} onPageChange={setPage} isThai={isThai} showTotalItems={false} className="!justify-end px-4" />
      </div>
    </section>
  );

  if (kind === "10") return (
    <section id={`preview-${kind}`} className="scroll-mt-6 space-y-5">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <div>
            <h2 className="text-xl font-semibold">{isThai ? "รายการ" : "Items"}</h2>
            <p className={`mt-1 text-sm ${isLight ? "text-slate-500" : "text-zinc-400"}`}>{isThai ? `ทั้งหมด ${filteredRows.length} รายการ` : `${filteredRows.length} total items`}</p>
          </div>
          <SearchInput value={query} onChange={setSearch} placeholder={isThai ? "ค้นหารายการ..." : "Search items..."} width="w-full sm:w-72" />
        </div>
        <div className="flex flex-col items-stretch gap-3 sm:items-end">
          <CommonButton variant="primary" icon={<Plus size={14} />}>{isThai ? "เพิ่มรายการ" : "Add item"}</CommonButton>
          <StatusFilterControl value={status} onChange={setStatusFilter} isThai={isThai} isLight={isLight} />
        </div>
      </div>
      <div className={`overflow-hidden rounded-2xl border-0 ${isLight ? "bg-white" : "bg-[#383838]"}`}>
        <DataTable columns={columns} data={pageRows} keyExtractor={(row) => row.id} minWidth="760px" emptyTitle={isThai ? "ไม่พบรายการ" : "No items found"} />
        <div aria-hidden="true" className="h-12" />
      </div>
      <Pagination currentPage={page} totalPages={totalPages} totalItems={filteredRows.length} pageSize={pageSize} onPageChange={setPage} isThai={isThai} className="px-0" />
    </section>
  );

  if (kind === "4" || kind === "5" || kind === "6" || kind === "7") return (
    <section id={`preview-${kind}`} className="scroll-mt-6 space-y-5">
      {kind === "7" && <div className={`text-sm font-semibold ${isLight ? "text-slate-600" : "text-zinc-300"}`}>{isThai ? `ทั้งหมด ${filteredRows.length} รายการ` : `All items (${filteredRows.length})`}</div>}
      {kind === "6" || kind === "7" ? (
        <div className={`rounded-2xl border ${kind === "7" ? "px-4 py-2.5" : "p-5"} ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#383838]"}`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              {kind === "6" && <span className="shrink-0 text-sm font-semibold text-slate-600 dark:text-zinc-300">{isThai ? `ทั้งหมด ${filteredRows.length} รายการ` : `All items (${filteredRows.length})`}</span>}
              {filters}
            </div>
            <CommonButton variant="primary" icon={<Plus size={14} />}>{isThai ? "เพิ่มรายการ" : "Add item"}</CommonButton>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <span className={`text-sm font-semibold ${isLight ? "text-slate-600" : "text-zinc-300"}`}>{isThai ? `ทั้งหมด ${filteredRows.length} รายการ` : `All items (${filteredRows.length})`}</span>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            {filters}
            <CommonButton variant="primary" icon={<Plus size={14} />}>{isThai ? "เพิ่มรายการ" : "Add item"}</CommonButton>
          </div>
        </div>
      )}
      <div className={`overflow-hidden rounded-2xl border ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#383838]"}`}>
        <DataTable columns={columns} data={pageRows} keyExtractor={(row) => row.id} minWidth="760px" emptyTitle={isThai ? "ไม่พบรายการ" : "No items found"} />
        {(kind === "5" || kind === "6" || kind === "7") && <div aria-hidden="true" className="h-12" />}
        {kind === "4" && <Pagination currentPage={page} totalPages={totalPages} totalItems={filteredRows.length} pageSize={pageSize} onPageChange={setPage} isThai={isThai} className="px-5" />}
      </div>
      {(kind === "5" || kind === "6" || kind === "7") && <Pagination currentPage={page} totalPages={totalPages} totalItems={filteredRows.length} pageSize={pageSize} onPageChange={setPage} isThai={isThai} className="px-0" />}
    </section>
  );

  if (kind === "1") return (
    <section id={`preview-${kind}`} className="scroll-mt-6 space-y-4">
      <div className="flex justify-end">
        <CommonButton variant="primary" icon={<Plus size={14} />}>{isThai ? "เพิ่มรายการ" : "Add item"}</CommonButton>
      </div>
      <div className={`space-y-4 rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#383838]"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="shrink-0 text-sm font-semibold text-slate-600 dark:text-zinc-300">{isThai ? `ทั้งหมด ${filteredRows.length} รายการ` : `All items (${filteredRows.length})`}</span>
        {filters}
      </div>
      <DataTable columns={columns} data={pageRows} keyExtractor={(row) => row.id} minWidth="760px" emptyTitle={isThai ? "ไม่พบรายการ" : "No items found"} />
      <Pagination currentPage={page} totalPages={totalPages} totalItems={filteredRows.length} pageSize={pageSize} onPageChange={setPage} isThai={isThai} />
      </div>
    </section>
  );

  return (
    <section id={`preview-${kind}`} className="scroll-mt-6 space-y-4">
      <div className="flex justify-end">
        <CommonButton variant="primary" icon={<Plus size={14} />}>{isThai ? "เพิ่มรายการ" : "Add item"}</CommonButton>
      </div>
      <div className={`space-y-4 rounded-2xl border p-5 ${isLight ? "border-slate-200 bg-white" : "border-white/10 bg-[#383838]"}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="shrink-0 text-sm font-semibold text-slate-600 dark:text-zinc-300">{isThai ? `ทั้งหมด ${filteredRows.length} รายการ` : `All items (${filteredRows.length})`}</span>
        {filters}
      </div>
      <DataTable columns={columns} data={pageRows} keyExtractor={(row) => row.id} minWidth="760px" emptyTitle={isThai ? "ไม่พบรายการ" : "No items found"} />
      <Pagination currentPage={page} totalPages={totalPages} totalItems={filteredRows.length} pageSize={pageSize} onPageChange={setPage} isThai={isThai} />
      </div>
    </section>
  );
}

function TablePreviewSidebar({
  isMinimized,
  onMinimizedChange,
  activeDesign,
  tabOrder,
  onTabOrderChange,
  onSelect,
  isLight,
  isThai,
  mobileOpen = false,
}: {
  isMinimized: boolean;
  onMinimizedChange: (value: boolean) => void;
  activeDesign: DesignKind;
  tabOrder: DesignKind[];
  onTabOrderChange: (value: DesignKind[]) => void;
  onSelect: (kind: DesignKind) => void;
  isLight: boolean;
  isThai: boolean;
  mobileOpen?: boolean;
}) {
  const labels: Record<DesignKind, string> = { "1": "1", "2": "2", "4": "3", "3": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9", "10": "10" };
  const logo = isMinimized
    ? isLight ? DAWH_LOGOS.square1024.black : DAWH_LOGOS.square1024.light
    : isLight ? "/assets/dawh_nospacewight_dark_logo.png" : "/assets/dawh_nospacewight_light_logo.png";

  return (
    <aside className={`${mobileOpen ? "fixed inset-y-0 left-0 z-[60] flex h-dvh w-[min(86vw,18rem)] shadow-2xl" : "sticky top-0 hidden h-dvh md:flex"} shrink-0 flex-col transition-all duration-300 ${!mobileOpen && isMinimized ? "w-20" : "w-64"} ${isLight ? "border-r border-[#E4E4E7] bg-white text-[#222222]" : "border-r border-[#444444] bg-[#222222] text-white"}`}>
      <div className="relative flex h-[88px] shrink-0 items-center justify-center px-5">
        <Image src={logo} alt="DAWH" width={isMinimized ? 40 : 150} height={40} className="max-h-10 w-auto object-contain" priority />
      </div>
      <div className={`mx-4 border-b ${isLight ? "border-[#E4E4E7]" : "border-[#444444]"}`} />
      <nav aria-label={isThai ? "เมนูตัวอย่างตาราง" : "Table preview navigation"} className="flex-1 space-y-1.5 px-3 py-4">
        <p className={`mb-2 px-1 text-[11px] font-semibold ${isLight ? "text-slate-500" : "text-zinc-400"}`}>{isThai ? "ตัวอย่างตาราง" : "Table previews"}</p>
        <Reorder.Group axis="y" as="div" values={tabOrder} onReorder={onTabOrderChange} className="space-y-1.5">
        {tabOrder.map((kind) => {
          const label = labels[kind];
          const selected = activeDesign === kind;
          return (
            <Reorder.Item key={kind} value={kind} as="div" className="touch-none">
              <button type="button" title={isMinimized ? (isThai ? `แท็บ ${label} · ${isThai ? "ลากเพื่อเรียงลำดับ" : "Drag to reorder"}` : `Tab ${label} · Drag to reorder`) : undefined} aria-label={isThai ? `แท็บ ${label} ลากเพื่อเปลี่ยนลำดับ` : `Tab ${label}, drag to reorder`} aria-current={selected ? "location" : undefined} onClick={() => onSelect(kind)} className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-2.5 text-left transition-colors ${selected ? isLight ? "border-[#E4E4E7] bg-[#F4F4F5] font-semibold text-[#222222]" : "border-[#444444]/60 bg-[#383838]/80 font-semibold text-white" : isLight ? "border-transparent text-[#2C2C2C] hover:bg-[#F4F4F5]" : "border-transparent text-[#E4E4E7] hover:bg-[#383838]/60"} ${isMinimized && !mobileOpen ? "justify-center px-0" : ""}`}>
                <LayoutGrid size={18} className="shrink-0" />
                {(!isMinimized || mobileOpen) && <span className="text-[13.5px] font-medium">{label}</span>}
                {(!isMinimized || mobileOpen) && <GripVertical size={15} className="ml-auto shrink-0 opacity-40" aria-hidden="true" />}
              </button>
            </Reorder.Item>
          );
        })}
        </Reorder.Group>
      </nav>
      {!mobileOpen && <div className={`border-t p-3 ${isLight ? "border-[#E4E4E7]" : "border-[#444444]"}`}>
        <button type="button" onClick={() => onMinimizedChange(!isMinimized)} aria-label={isThai ? "ย่อหรือขยายแถบด้านข้าง" : "Collapse or expand sidebar"} className={`flex h-10 w-full items-center justify-center rounded-xl border ${isLight ? "border-[#E4E4E7] bg-white hover:bg-[#F4F4F5]" : "border-[#444444] bg-[#383838] hover:bg-[#444444]"}`}>
          <ChevronLeft size={17} className={`transition-transform ${isMinimized ? "rotate-180" : ""}`} />
        </button>
      </div>}
    </aside>
  );
}

function getColumns(isThai: boolean): DataTableColumn<PreviewRow>[] {
  const status: DataTableColumn<PreviewRow> = {
    key: "status",
    header: isThai ? "สถานะ" : "Status",
    className: "whitespace-nowrap",
    render: (row) => statusBadge(row.active, isThai),
  };
  return [
    { key: "code", header: isThai ? "รหัสสาขา" : "Branch code", className: "w-40 font-mono font-semibold", render: (row) => row.code },
    { key: "name", header: isThai ? "ชื่อสาขา" : "Branch name", render: (row) => <span className="font-medium">{row.name}</span> },
    { key: "address", header: isThai ? "ที่อยู่" : "Address", className: "min-w-56 text-slate-500 dark:text-zinc-300", render: (row) => row.address },
    status,
  ];
}

function StatusFilterControl({ value, onChange, isThai, isLight }: { value: "all" | Status; onChange: (value: "all" | Status) => void; isThai: boolean; isLight: boolean }) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeFilterCount = Number(value !== "all");

  useEffect(() => {
    if (!open) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (event.target instanceof Node && !rootRef.current?.contains(event.target)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div className="relative shrink-0" ref={rootRef}>
      <FilterButton controls="preview-filter-panel" expanded={open} label={isThai ? "ตัวกรอง" : "Filters"} activeFilterCount={activeFilterCount} onClick={() => setOpen((current) => !current)} />
      {open && (
        <div id="preview-filter-panel" role="region" aria-label={isThai ? "ตัวกรองสถานะ" : "Status filters"} className={`absolute right-0 top-full z-30 mt-2 w-[min(300px,calc(100vw-2rem))] space-y-4 rounded-xl border p-4 shadow-xl ${isLight ? "border-[#E4E4E7] bg-white text-[#222222]" : "border-[#444444] bg-[#383838] text-white"}`}>
          <label className="block space-y-1.5 text-sm font-medium">
            <span>{isThai ? "สถานะ" : "Status"}</span>
            <FilterDropdown value={value} onChange={onChange} options={[{ value: "all", label: isThai ? "ทุกสถานะ" : "All statuses" }, { value: "active", label: isThai ? "ใช้งาน" : "Active" }, { value: "inactive", label: isThai ? "ปิดใช้งาน" : "Inactive" }]} className="w-full" />
          </label>
          {activeFilterCount > 0 && (
            <div className="flex justify-end border-t border-slate-200 pt-3 dark:border-white/10">
              <CommonButton variant="outline" onClick={() => { onChange("all"); setOpen(false); }}>{isThai ? "ล้างตัวกรอง" : "Clear filters"}</CommonButton>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
