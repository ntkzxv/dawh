"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Building2, Plus, Save } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import DataTable, {
  dataTableFrameClassName,
  type DataTableColumn,
} from "@/components/common/DataTable";
import SearchInput from "@/components/common/SearchInput";
import CommonButton from "@/components/common/Button";
import FilterButton from "@/components/common/FilterButton";
import FilterDropdown from "@/components/common/FilterDropdown";
import SidePanel from "@/components/common/SidePanel";
import { Pagination } from "@/components/common";
import { warehouseApi, type CatalogItem } from "@/lib/api/warehouse";
import { canEditCatalog } from "@/lib/contracts/warehouse-policy";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import { useTheme } from "@/context/ThemeContext";
import { useAccountMenu } from "@/hooks/useAccountMenu";
import { Field, input, message, Notice, useRemote } from "./Ui";

const PAGE_SIZE = 10;

export default function BranchManagement({ onTotalChange }: { onTotalChange: (total: number) => void }) {
  const { theme } = useTheme();
  const { isThai } = useAccountMenu();
  const account = useOptionalWarehouseAccount();
  const canEdit = canEditCatalog(account?.me?.role, "branches");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const isLight = theme === "light";

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

  const loadBranches = useCallback(async (signal: AbortSignal) => {
    const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
    if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
    if (statusFilter !== "all") params.set("status", statusFilter);
    return warehouseApi.catalogPage("branches", params, signal);
  }, [page, debouncedSearch, statusFilter]);
  const { data, loading, error, refresh } = useRemote(loadBranches);
  const rows = data?.items ?? [];
  const totalPages = Math.ceil((data?.page.total ?? 0) / PAGE_SIZE);
  const activeFilterCount = Number(statusFilter !== "all");

  useEffect(() => {
    if (data?.page.total !== undefined && !debouncedSearch.trim() && statusFilter === "all") {
      onTotalChange(data.page.total);
    }
  }, [data?.page.total, debouncedSearch, statusFilter, onTotalChange]);

  useEffect(() => {
    if (!filtersOpen) return;
    const closeOnOutsideClick = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element) || target.closest('[role="listbox"]')) return;
      if (!filtersRef.current?.contains(target)) setFiltersOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setFiltersOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [filtersOpen]);

  const columns = useMemo<DataTableColumn<CatalogItem>[]>(() => [
    {
      key: "code",
      header: isThai ? "รหัสสาขา" : "Branch code",
      className: "w-40 font-mono font-semibold",
      render: (branch) => branch.code || `#${branch.id}`,
    },
    {
      key: "name",
      header: isThai ? "ชื่อสาขา" : "Branch name",
      render: (branch) => <span className="font-medium">{branch.name}</span>,
    },
    {
      key: "address",
      header: isThai ? "ที่อยู่" : "Address",
      className: "text-slate-500 dark:text-zinc-300",
      render: (branch) => branch.address ? String(branch.address) : <span className="text-slate-400">—</span>,
    },
    {
      key: "active",
      header: isThai ? "สถานะ" : "Status",
      align: "center",
      className: "w-32",
      render: (branch) => (
        <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${branch.active === false ? "border-[#E4E4E7] bg-[#F4F4F5] text-slate-600 dark:border-[#555555] dark:bg-white/10 dark:text-[#E4E4E7]" : "border-[#2EC4B6]/30 bg-[#2EC4B6]/10 text-[#168D82] dark:text-[#2EC4B6]"}`}>
          {branch.active === false ? (isThai ? "ปิดใช้งาน" : "Inactive") : (isThai ? "ใช้งาน" : "Active")}
        </span>
      ),
    },
    ...(canEdit ? [{
      key: "edit",
      header: isThai ? "จัดการ" : "Manage",
      align: "right" as const,
      className: "w-28",
      render: (branch: CatalogItem) => (
        <button type="button" className="rounded-md px-3 py-1.5 font-semibold text-[#222222] hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500 dark:text-white dark:hover:bg-white/10" onClick={() => { setEditing(branch); setPanelOpen(true); }}>
          {isThai ? "แก้ไข" : "Edit"}
        </button>
      ),
    }] : []),
  ], [canEdit, isThai]);

  const openCreate = () => { setEditing(null); setPanelOpen(true); };
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const body = {
      code: String(form.get("code") ?? "").trim(),
      name: String(form.get("name") ?? "").trim(),
      address: String(form.get("address") ?? "").trim() || null,
      ...(editing ? { active: form.get("active") === "true" } : {}),
    };
    setFailure(null);
    setNotice(null);
    try {
      if (editing) await warehouseApi.updateCatalog("branches", editing.id, body);
      else await warehouseApi.createCatalog("branches", body);
      setPanelOpen(false);
      setNotice(editing ? (isThai ? "บันทึกการแก้ไขสาขาแล้ว" : "Branch updated") : (isThai ? "เพิ่มสาขาแล้ว" : "Branch added"));
      await refresh();
    } catch (cause) {
      setFailure(message(cause));
    }
  };

  return (
    <main className="mx-auto w-full max-w-[1600px] min-w-0 space-y-6 p-4 pb-10 sm:p-8 lg:p-10">
      {notice && <Notice tone="success">{notice}</Notice>}
      {(failure || error) && <Notice tone="error">{failure ?? error}</Notice>}

      <section className="flex flex-col gap-4 rounded-2xl border border-[#E4E4E7] bg-white p-5 dark:border-[#444444] dark:bg-[#383838] sm:flex-row sm:items-center sm:justify-between sm:p-7">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F4F4F5] text-[#222222] dark:bg-white/10 dark:text-white">
            <Building2 size={22} aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-500 dark:text-[#E4E4E7]">{isThai ? "ข้อมูลหลัก" : "Master data"}</p>
            <h2 className="mt-1 text-xl font-bold tracking-tight sm:text-2xl">{isThai ? "รายชื่อสาขา" : "Branch directory"}</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-[#E4E4E7]">
              {isThai ? "ค้นหา ตรวจสอบสถานะ และจัดการข้อมูลสาขาที่ใช้งานในระบบ" : "Find branches, review their status, and manage branch records."}
            </p>
          </div>
        </div>
        <div className="inline-flex w-fit shrink-0 items-baseline gap-2 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] px-4 py-2.5 dark:border-[#555555] dark:bg-[#323232]">
          <span className="text-lg font-bold tabular-nums">{data?.page.total ?? "—"}</span>
          <span className="text-xs text-slate-500 dark:text-[#E4E4E7]">
            {search.trim() || statusFilter !== "all" ? (isThai ? "ผลลัพธ์" : "Results") : (isThai ? "สาขาทั้งหมด" : "Total branches")}
          </span>
        </div>
      </section>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <SearchInput
              value={search}
              onChange={(value) => { setSearch(value); setPage(1); }}
              placeholder={isThai ? "ค้นหารหัสหรือชื่อสาขา" : "Search branch code or name"}
              aria-label={isThai ? "ค้นหาสาขา" : "Search branches"}
              width="w-full sm:w-72"
            />
            <div className="relative shrink-0" ref={filtersRef}>
            <FilterButton
              controls="branches-filter-panel"
              expanded={filtersOpen}
              label={isThai ? "ตัวกรอง" : "Filters"}
              activeFilterCount={activeFilterCount}
              onClick={() => setFiltersOpen((open) => !open)}
            />
            <AnimatePresence initial={false}>
              {filtersOpen && (
                <motion.div
                  id="branches-filter-panel"
                  role="region"
                  aria-label={isThai ? "ตัวกรองสาขา" : "Branch filters"}
                  initial={{ opacity: 0, scale: 0.96, y: -6 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: -4 }}
                  transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className={`absolute right-0 top-full z-30 mt-2 w-[min(320px,calc(100vw-2rem))] origin-top-right space-y-4 rounded-2xl border p-4 shadow-2xl ${isLight ? "border-[#E4E4E7] bg-white text-[#222222]" : "border-[#444444] bg-[#383838] text-white"}`}
                >
                  <label className="space-y-1.5 text-sm font-medium">
                    <span>{isThai ? "สถานะ" : "Status"}</span>
                    <FilterDropdown<"all" | "active" | "inactive">
                      value={statusFilter}
                      onChange={(value) => { setStatusFilter(value); setPage(1); }}
                      options={[
                        { value: "all", label: isThai ? "ทุกสถานะ" : "All statuses" },
                        { value: "active", label: isThai ? "ใช้งาน" : "Active" },
                        { value: "inactive", label: isThai ? "ปิดใช้งาน" : "Inactive" },
                      ]}
                      className="w-full"
                    />
                  </label>
                  {activeFilterCount > 0 && (
                    <div className="flex justify-end border-t border-slate-200 pt-3 dark:border-white/10">
                      <CommonButton variant="outline" onClick={() => { setStatusFilter("all"); setFiltersOpen(false); }}>
                        {isThai ? "ล้างตัวกรอง" : "Clear filters"}
                      </CommonButton>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
            </div>
          </div>
          {canEdit && (
            <CommonButton variant="primary" onClick={openCreate} className="shrink-0 sm:ml-auto" icon={<Plus size={14} />}>
              {isThai ? "เพิ่มสาขา" : "Add branch"}
            </CommonButton>
          )}
        </div>
        <section className={dataTableFrameClassName(isLight)}>
          <DataTable
            columns={columns}
            data={rows}
            keyExtractor={(branch) => branch.id}
            isLoading={loading}
            skeletonRowCount={6}
            minWidth="760px"
            className="w-full"
            emptyIcon={<Building2 size={24} />}
            emptyTitle={search.trim() || statusFilter !== "all" ? (isThai ? "ไม่พบสาขาที่ตรงกับคำค้นหาหรือตัวกรอง" : "No branches match the search or filters") : (isThai ? "ยังไม่มีสาขา" : "No branches yet")}
          />
        </section>
        {(data?.page.total ?? 0) > 0 && (
          <Pagination currentPage={page} totalPages={totalPages} totalItems={data?.page.total ?? 0} pageSize={PAGE_SIZE} onPageChange={setPage} className="px-1" />
        )}
      </div>

      {panelOpen && canEdit && (
        <SidePanel item={null} onClose={() => setPanelOpen(false)} title={editing ? (isThai ? "แก้ไขข้อมูลสาขา" : "Edit branch") : (isThai ? "เพิ่มสาขา" : "Add branch")}>
          <form onSubmit={save} className="space-y-5 p-5">
            <p className="text-sm text-slate-500 dark:text-zinc-300">
              {isThai ? "กรอกข้อมูลที่ใช้ระบุสาขาในระบบ" : "Enter the details used to identify this branch."}
            </p>
            <Field label={isThai ? "รหัสสาขา" : "Branch code"}>
              <input className={input} name="code" required maxLength={50} defaultValue={editing?.code ?? ""} />
            </Field>
            <Field label={isThai ? "ชื่อสาขา" : "Branch name"}>
              <input className={input} name="name" required maxLength={160} defaultValue={editing?.name ?? ""} />
            </Field>
            <Field label={isThai ? "ที่อยู่" : "Address"}>
              <textarea className={`${input} min-h-24 resize-y`} name="address" maxLength={1000} defaultValue={String(editing?.address ?? "")} />
            </Field>
            {editing && (
              <Field label={isThai ? "สถานะ" : "Status"}>
                <select className={input} name="active" defaultValue={String(editing.active !== false)}>
                  <option value="true">{isThai ? "ใช้งาน" : "Active"}</option>
                  <option value="false">{isThai ? "ปิดใช้งาน" : "Inactive"}</option>
                </select>
              </Field>
            )}
            <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-white/10">
              <CommonButton type="submit" variant="primary" icon={<Save size={15} />}>{isThai ? "บันทึก" : "Save"}</CommonButton>
            </div>
          </form>
        </SidePanel>
      )}
    </main>
  );
}
