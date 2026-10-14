"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { EllipsisVertical, Plus, X } from "lucide-react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import {
  warehouseApi,
  type CatalogItem,
  type CatalogKind,
} from "@/lib/api/warehouse";
import DataTable, {
  dataTableFrameClassName,
  type DataTableColumn,
} from "@/components/common/DataTable";
import { message, Notice, useRemote } from "./Ui";
import { useTheme } from "@/context/ThemeContext";
import CustomDropdown from "@/components/common/CustomDropdown";
import SearchInput from "@/components/common/SearchInput";
import FilterButton from "@/components/common/FilterButton";
import FilterDropdown from "@/components/common/FilterDropdown";
import CommonButton from "@/components/common/Button";
import SidePanel, {
  SidePanelAlert,
  SidePanelFieldError,
  sidePanelInvalidFieldClassName,
  sidePanelFormStyles,
} from "@/components/common/SidePanel";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import { Pagination } from "@/components/common";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import { invalidateCatalogReference } from "@/lib/api/warehouse-reference-cache";
import { WAREHOUSE_TABLE_PAGE_SIZE } from "@/lib/warehouse/pagination-config";
import { canEditCatalog } from "@/lib/contracts/warehouse-policy";
import { useAccountMenu } from "@/hooks/useAccountMenu";

const kinds: Array<{ key: CatalogKind; label: string }> = [
  { key: "branches", label: "สาขา" },
  { key: "warehouses", label: "คลัง" },
  { key: "suppliers", label: "ผู้ขาย" },
  { key: "units", label: "หน่วยสินค้า" },
  { key: "product-groups", label: "กลุ่มสินค้า" },
  { key: "product-categories", label: "หมวดสินค้า" },
  { key: "brands", label: "ยี่ห้อ" },
  { key: "product-models", label: "รุ่น" },
  { key: "products", label: "สินค้า" },
];

const labels: Record<string, string> = {
  sku: "รหัสสินค้า",
  code: "รหัส",
  name: "ชื่อ",
  address: "ที่อยู่",
  contact: "ผู้ติดต่อ",
  phone: "โทรศัพท์",
  cost: "ต้นทุน",
  salePrice: "ราคาขาย",
  reorderPoint: "จุดสั่งซื้อ",
  serialTracked: "ติดตาม Serial",
  branchId: "สาขา",
  unitId: "หน่วย",
  groupId: "กลุ่มสินค้า",
  categoryId: "หมวดสินค้า",
  brandId: "ยี่ห้อ",
  modelId: "รุ่น",
};

const fields: Record<CatalogKind, string[]> = {
  branches: ["code", "name", "address"],
  warehouses: ["branchId", "code", "name"],
  suppliers: ["code", "name", "contact", "phone", "address"],
  units: ["code", "name"],
  "product-groups": ["name"],
  "product-categories": ["name", "groupId"],
  brands: ["name"],
  "product-models": ["name", "brandId"],
  products: [
    "sku",
    "name",
    "unitId",
    "groupId",
    "categoryId",
    "brandId",
    "modelId",
    "serialTracked",
    "cost",
    "salePrice",
    "reorderPoint",
  ],
};

const referenceKind: Record<string, CatalogKind> = {
  branchId: "branches",
  unitId: "units",
  groupId: "product-groups",
  categoryId: "product-categories",
  brandId: "brands",
  modelId: "product-models",
};

const toDbKey = (key: string) =>
  key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

export default function CatalogScreen({
  initialKind = "products",
}: {
  initialKind?: CatalogKind;
}) {
  const account = useOptionalWarehouseAccount();
  const { theme } = useTheme();
  const { isThai } = useAccountMenu();
  const isLight = theme === "light";
  const kind = initialKind;
  const supportsStatusFilter = ["branches", "warehouses", "suppliers"].includes(kind);
  const supportsUsageFilter = ["units", "product-groups", "product-categories", "brands", "product-models"].includes(kind);
  const supportsSearchAndFilters = supportsStatusFilter || supportsUsageFilter;
  const usesSidePanel = [
    "branches",
    "warehouses",
    "suppliers",
    "units",
    "product-groups",
    "product-categories",
    "brands",
    "product-models",
  ].includes(kind);
  const kindItemEn = kind === "branches"
    ? "branch"
    : kind === "warehouses"
      ? "warehouse"
      : kind === "suppliers"
        ? "supplier"
        : kind === "units"
          ? "unit"
          : kind === "product-groups"
            ? "product group"
            : kind === "product-categories"
              ? "product category"
              : kind === "brands"
                ? "brand"
                : kind === "product-models"
                  ? "product model"
                  : "item";
  const [editing, setEditing] = useState<CatalogItem | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, right: 16 });
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const [usageFilter, setUsageFilter] = useState<"all" | "assigned" | "unassigned">("all");
  const [groupFilter, setGroupFilter] = useState("all");
  const [brandFilter, setBrandFilter] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filtersRef = useRef<HTMLDivElement>(null);
  const pageSize = WAREHOUSE_TABLE_PAGE_SIZE;

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => window.clearTimeout(timeout);
  }, [search]);

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

  const requiredRefs = useMemo(
    () => [
      ...new Set(
        fields[kind]
          .map((field) => referenceKind[field])
          .filter((reference): reference is CatalogKind => Boolean(reference)),
      ),
    ],
    [kind],
  );
  const load = useCallback(
    (signal: AbortSignal) => {
      const params = new URLSearchParams({
        page: String(currentPage),
        limit: String(pageSize),
      });
      if (supportsSearchAndFilters) {
        if (debouncedSearch.trim()) params.set("q", debouncedSearch.trim());
        if (supportsStatusFilter && statusFilter !== "all") params.set("status", statusFilter);
        if (kind === "warehouses" && branchFilter !== "all") params.set("branchId", branchFilter);
        if (supportsUsageFilter && usageFilter !== "all") params.set("usage", usageFilter);
        if (kind === "product-categories" && groupFilter !== "all") params.set("groupId", groupFilter);
        if (kind === "product-models" && brandFilter !== "all") params.set("brandId", brandFilter);
      }
      return warehouseApi.catalogPage(kind, params, signal);
    },
    [kind, currentPage, debouncedSearch, statusFilter, branchFilter, usageFilter, groupFilter, brandFilter, supportsSearchAndFilters, supportsStatusFilter, supportsUsageFilter],
  );
  const loadRefs = useCallback(
    async (signal: AbortSignal) => {
      const rows = await Promise.all(
        requiredRefs.map((reference) =>
          warehouseApi.catalog(reference, signal),
        ),
      );
      return Object.fromEntries(
        requiredRefs.map((reference, index) => [reference, rows[index]]),
      ) as Record<string, CatalogItem[]>;
    },
    [requiredRefs],
  );
  const { data: refs } = useRemote(loadRefs, {
    enabled: isFormOpen || (filtersOpen && (kind === "warehouses" || kind === "product-categories" || kind === "product-models")),
  });

  const { data, loading, error, refresh } = useRemote(load, {
    resetDataOnLoadChange: true,
  });
  const currentData = data?.page.page === currentPage ? data : null;
  const totalItems = data?.page.total ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const displayedPage = currentPage;
  const visibleRows = currentData?.items ?? [];
  useEffect(() => {
    if (!data || totalPages < 1 || currentPage <= totalPages) return;
    let active = true;
    queueMicrotask(() => {
      if (active) setCurrentPage(totalPages);
    });
    return () => {
      active = false;
    };
  }, [data, totalPages, currentPage]);
  const canEdit = !!currentData && canEditCatalog(account?.me?.role, kind);

  const save = async (body: Record<string, unknown>) => {
    setFailure(null);
    setSuccess(null);
    try {
      if (editing) {
        await warehouseApi.updateCatalog(kind, editing.id, body);
      } else {
        await warehouseApi.createCatalog(kind, body);
      }
      if (kind === "warehouses" || kind === "branches") {
        invalidateCatalogReference(kind);
      }
      setSuccess(editing
        ? (isThai ? "แก้ไขแล้ว" : `${kindItemEn[0].toUpperCase()}${kindItemEn.slice(1)} updated`)
        : (isThai ? "เพิ่มข้อมูลแล้ว" : `${kindItemEn[0].toUpperCase()}${kindItemEn.slice(1)} added`));
      setEditing(null);
      setIsFormOpen(false);
      await refresh();
    } catch (cause) {
      setFailure(message(cause, isThai));
    }
  };

  const kindLabel =
    kinds.find((item) => item.key === kind)?.label ?? "ข้อมูลหลัก";
  const kindLabelEn = kind === "branches" ? "Branches"
    : kind === "warehouses" ? "Warehouses"
      : kind === "suppliers" ? "Suppliers"
        : kind === "units" ? "Units"
          : kind === "product-groups" ? "Product groups"
            : kind === "product-categories" ? "Product categories"
              : kind === "brands" ? "Brands"
                : kind === "product-models" ? "Product models"
                  : "Master data";
  const searchPlaceholder = kind === "branches" ? (isThai ? "ค้นหารหัสหรือชื่อสาขา" : "Search branch code or name")
    : kind === "warehouses" ? (isThai ? "ค้นหารหัสหรือชื่อคลัง" : "Search warehouse code or name")
      : kind === "suppliers" ? (isThai ? "ค้นหารหัสหรือชื่อผู้ขาย" : "Search supplier code or name")
        : isThai ? `ค้นหา${kindLabel}` : `Search ${kindLabelEn.toLowerCase()}`;
  const filterPanelLabel = isThai ? `ตัวกรอง${kindLabel}` : `${kindLabelEn} filters`;
  const activeFilterCount = Number(supportsStatusFilter && statusFilter !== "all")
    + Number(kind === "warehouses" && branchFilter !== "all")
    + Number(supportsUsageFilter && usageFilter !== "all")
    + Number(kind === "product-categories" && groupFilter !== "all")
    + Number(kind === "product-models" && brandFilter !== "all");
  const clearFilters = () => {
    setStatusFilter("all");
    setBranchFilter("all");
    setUsageFilter("all");
    setGroupFilter("all");
    setBrandFilter("all");
    setCurrentPage(1);
    setFiltersOpen(false);
  };
  const openForm = useCallback((item: CatalogItem | null) => {
    setEditing(item);
    const rect = addButtonRef.current?.getBoundingClientRect();
    if (rect) {
      setPopoverPosition({
        top: Math.min(rect.bottom + 8, Math.max(16, window.innerHeight - 420)),
        right: Math.max(16, window.innerWidth - rect.right),
      });
    }
    setIsFormOpen(true);
  }, []);
  const hasCodeColumn = ["branches", "warehouses", "suppliers", "units"].includes(kind);
  const columns = useMemo<DataTableColumn<CatalogItem>[]>(() => [
    {
      key: "code",
      header: hasCodeColumn
        ? (kind === "units" ? (isThai ? "รหัสหน่วย" : "Unit code") : isThai ? `รหัส${kindLabel}` : `${kindItemEn[0].toUpperCase()}${kindItemEn.slice(1)} code`)
        : (isThai ? "รหัส" : "ID"),
      className: "font-mono",
      render: (row) => row.sku ?? row.code ?? row.id,
    },
    { key: "name", header: supportsSearchAndFilters
      ? (isThai ? `ชื่อ${kindLabel}` : `${kindItemEn[0].toUpperCase()}${kindItemEn.slice(1)} name`)
      : "ชื่อ", className: "font-medium" },
    ...(supportsStatusFilter ? [{
      key: "status",
      header: isThai ? "สถานะ" : "Status",
      headerClassName: "w-[120px]",
      className: "whitespace-nowrap",
      render: (row: CatalogItem) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${row.active === false ? "bg-[#E74C3C]/15 text-[#E74C3C]" : "bg-[#2EC4B6]/15 text-[#2EC4B6]"}`}>
          {row.active === false
            ? (isThai ? "ปิดใช้งาน" : "Inactive")
            : (isThai ? "ใช้งาน" : "Active")}
        </span>
      ),
    }] : []),
    {
      key: "actions",
      header: null,
      headerClassName: "w-[88px]",
      align: "right",
      render: (row) => canEdit ? (
        <button
          type="button"
          aria-label={supportsSearchAndFilters
            ? (isThai ? `แก้ไข${kindLabel} ${row.name}` : `Edit ${kindItemEn} ${row.name}`)
            : (isThai ? `แก้ไข${kindLabel}` : `Edit ${kindLabelEn}`)}
          title={supportsSearchAndFilters ? (isThai ? "แก้ไข" : "Edit") : undefined}
          className={supportsSearchAndFilters
            ? "inline-flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 dark:text-zinc-300 dark:hover:bg-white/10 dark:hover:text-white"
            : `rounded-[4px] px-2 py-1 font-semibold transition-colors cursor-pointer ${isLight ? "text-[#222222] hover:bg-[#E4E4E7]" : "text-white hover:bg-[#444444]"}`}
          onClick={() => openForm(row)}
        >
          {supportsSearchAndFilters ? <EllipsisVertical className="h-5 w-5" aria-hidden="true" /> : (isThai ? "แก้ไข" : "Edit")}
        </button>
      ) : null,
    },
  ], [canEdit, hasCodeColumn, isLight, isThai, kind, kindItemEn, kindLabel, kindLabelEn, openForm, supportsSearchAndFilters, supportsStatusFilter]);
  const closeForm = useCallback(() => {
    setEditing(null);
    setIsFormOpen(false);
  }, []);

  useEffect(() => {
    if (!isFormOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeForm();
    };
    window.addEventListener("keydown", closeOnEscape);
    if (!usesSidePanel) {
      window.addEventListener("resize", closeForm);
      window.addEventListener("scroll", closeForm, true);
    }
    return () => {
      window.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("resize", closeForm);
      window.removeEventListener("scroll", closeForm, true);
    };
  }, [isFormOpen, closeForm, usesSidePanel]);

  return (
    <WarehousePageTemplate
      titleEn={kindLabelEn}
      titleTh={kindLabel}
      routePath="/warehouse/inventory"
      iconName="box"
      fullBleed
    >
      <div className="flex w-full min-h-0 flex-1 flex-col gap-6 self-stretch overflow-y-auto p-6 lg:p-8">
        {error && <Notice tone="error">{error}</Notice>}
        {failure && <Notice tone="error">{failure}</Notice>}
        {success && <Notice tone="success">{success}</Notice>}

        {!currentData && !error && (
          <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {supportsSearchAndFilters && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <SkeletonBox className="h-9 w-full rounded-xl sm:w-72" />
                  <SkeletonBox className="h-9 w-28 rounded-xl" />
                </div>
              )}
              <SkeletonBox className="h-[33px] w-32 rounded-[6px]" />
            </div>
            <section
              role="status"
              aria-label={isThai ? "กำลังโหลดข้อมูล" : "Loading data"}
              className={`w-full ${dataTableFrameClassName(isLight)}`}
            >
              <DataTable
                columns={columns}
                data={[]}
                keyExtractor={(row) => row.id}
                isLoading
                skeletonRowCount={6}
                minWidth="520px"
              />
            </section>
          </div>
        )}

        {currentData && (
          <div className="w-full">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {supportsSearchAndFilters && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <SearchInput
                    value={search}
                    onChange={(value) => { setSearch(value); setCurrentPage(1); }}
                    placeholder={searchPlaceholder}
                    aria-label={isThai ? `ค้นหา${kindLabel}` : `Search ${kindLabelEn.toLowerCase()}`}
                    clearLabel={isThai ? "ล้างคำค้นหา" : "Clear search"}
                    width="w-full sm:w-72"
                  />
                  <div className="relative shrink-0" ref={filtersRef}>
                    <FilterButton
                      controls="catalog-filter-panel"
                      expanded={filtersOpen}
                      label={isThai ? "ตัวกรอง" : "Filters"}
                      clearLabel={isThai ? "ล้างตัวกรอง" : "Clear filters"}
                      activeFilterCount={activeFilterCount}
                      onClear={clearFilters}
                      onClick={() => setFiltersOpen((open) => !open)}
                    />
                    {filtersOpen && (
                      <div
                        id="catalog-filter-panel"
                        role="region"
                        aria-label={filterPanelLabel}
                        className={`absolute left-0 top-full z-30 mt-2 w-[min(320px,calc(100vw-2rem))] space-y-4 rounded-2xl border p-4 shadow-2xl sm:left-auto sm:right-0 ${isLight ? "border-[#E4E4E7] bg-white text-[#222222]" : "border-[#444444] bg-[#383838] text-white"}`}
                      >
                        {supportsStatusFilter && <label className="space-y-1.5 text-sm font-medium">
                          <span>{isThai ? "สถานะ" : "Status"}</span>
                          <FilterDropdown<"all" | "active" | "inactive">
                            value={statusFilter}
                            onChange={(value) => { setStatusFilter(value); setCurrentPage(1); }}
                            options={[
                              { value: "all", label: isThai ? "ทุกสถานะ" : "All statuses" },
                              { value: "active", label: isThai ? "ใช้งาน" : "Active" },
                              { value: "inactive", label: isThai ? "ปิดใช้งาน" : "Inactive" },
                            ]}
                            className="w-full"
                          />
                        </label>}
                        {kind === "warehouses" && (
                          <label className="space-y-1.5 text-sm font-medium">
                            <span>{isThai ? "สาขา" : "Branch"}</span>
                            <FilterDropdown<string>
                              value={branchFilter}
                              onChange={(value) => { setBranchFilter(value); setCurrentPage(1); }}
                              options={[
                                { value: "all", label: isThai ? "ทุกสาขา" : "All branches" },
                                ...(refs?.branches ?? []).map((branch) => ({ value: String(branch.id), label: branch.name })),
                              ]}
                              className="w-full"
                            />
                          </label>
                        )}
                        {supportsUsageFilter && (
                          <label className="space-y-1.5 text-sm font-medium">
                            <span>{isThai ? "การใช้งานสินค้า" : "Product assignment"}</span>
                            <FilterDropdown<"all" | "assigned" | "unassigned">
                              value={usageFilter}
                              onChange={(value) => { setUsageFilter(value); setCurrentPage(1); }}
                              options={[
                                { value: "all", label: isThai ? "ทั้งหมด" : "All" },
                                { value: "assigned", label: isThai ? "มีสินค้าใช้งาน" : "Used by products" },
                                { value: "unassigned", label: isThai ? "ยังไม่มีสินค้าใช้งาน" : "Not used by products" },
                              ]}
                              className="w-full"
                            />
                          </label>
                        )}
                        {kind === "product-categories" && (
                          <label className="space-y-1.5 text-sm font-medium">
                            <span>{isThai ? "กลุ่มสินค้า" : "Product group"}</span>
                            <FilterDropdown<string>
                              value={groupFilter}
                              onChange={(value) => { setGroupFilter(value); setCurrentPage(1); }}
                              options={[
                                { value: "all", label: isThai ? "ทุกกลุ่ม" : "All groups" },
                                { value: "none", label: isThai ? "ไม่มีกลุ่ม" : "No group" },
                                ...(refs?.["product-groups"] ?? []).map((group) => ({ value: String(group.id), label: group.name })),
                              ]}
                              className="w-full"
                              searchable
                            />
                          </label>
                        )}
                        {kind === "product-models" && (
                          <label className="space-y-1.5 text-sm font-medium">
                            <span>{isThai ? "ยี่ห้อ" : "Brand"}</span>
                            <FilterDropdown<string>
                              value={brandFilter}
                              onChange={(value) => { setBrandFilter(value); setCurrentPage(1); }}
                              options={[
                                { value: "all", label: isThai ? "ทุกยี่ห้อ" : "All brands" },
                                { value: "none", label: isThai ? "ไม่มียี่ห้อ" : "No brand" },
                                ...(refs?.brands ?? []).map((brand) => ({ value: String(brand.id), label: brand.name })),
                              ]}
                              className="w-full"
                              searchable
                            />
                          </label>
                        )}
                        {activeFilterCount > 0 && (
                          <div className="flex justify-end border-t border-slate-200 pt-3 dark:border-white/10">
                            <CommonButton variant="outline" onClick={clearFilters}>
                              {isThai ? "ล้างตัวกรอง" : "Clear filters"}
                            </CommonButton>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              {canEdit && (
                <button
                  type="button"
                  ref={addButtonRef}
                  aria-label={isThai ? `เพิ่ม${kindLabel}` : `Add ${kindItemEn}`}
                  className={`inline-flex h-[33px] shrink-0 items-center gap-1.5 rounded-[6px] px-4 text-[13px] font-semibold transition-colors cursor-pointer ${isLight ? "bg-[#222222] text-white hover:bg-black" : "bg-white text-[#222222] hover:bg-[#F4F4F5]"}`}
                  onClick={() => openForm(null)}
                >
                  <Plus size={14} />
                  {isThai ? `เพิ่ม${kindLabel}` : `Add ${kindItemEn}`}
                </button>
              )}
            </div>

            <section className={`w-full ${dataTableFrameClassName(isLight)}`}>
              <DataTable
                columns={columns}
                data={visibleRows}
                keyExtractor={(row) => row.id}
                minWidth="520px"
                emptyTitle={supportsSearchAndFilters && (
                  search.trim() ||
                  statusFilter !== "all" ||
                  (kind === "warehouses" && branchFilter !== "all")
                )
                  ? (isThai
                    ? `ไม่พบ${kindLabel}ที่ตรงกับคำค้นหาหรือตัวกรอง`
                    : `No ${kindLabelEn.toLowerCase()} match your search or filters`)
                  : (isThai
                    ? `ยังไม่มี${kindLabel} เพิ่มรายการแรกจากปุ่มด้านบน`
                    : `No ${kindLabelEn.toLowerCase()} yet. Add the first item using the button above.`)}
              />
            </section>
            <Pagination
              currentPage={displayedPage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={pageSize}
              isThai={isThai}
              onPageChange={setCurrentPage}
              className="px-1"
            />
          </div>
        )}

        {isFormOpen && canEdit && currentData && usesSidePanel && (
          <SidePanel
            item={null}
            onClose={closeForm}
            eyebrow={editing
              ? (isThai ? "จัดการข้อมูล" : `Manage ${kindItemEn}`)
              : (isThai ? "สร้างข้อมูลใหม่" : `New ${kindItemEn}`)}
            title={editing
              ? (isThai ? `แก้ไขข้อมูล${kindLabel}` : `Edit ${kindItemEn}`)
              : (isThai ? `เพิ่ม${kindLabel}ใหม่` : `Add ${kindItemEn}`)}
          >
            {requiredRefs.length > 0 && !refs ? null : (
              <CatalogForm
                key={`${kind}-${editing?.id ?? "new"}`}
                kind={kind}
                current={editing}
                refs={refs ?? {}}
                isLight={isLight}
                onSave={save}
                onCancel={closeForm}
                sidePanel
                formAlert={failure}
                isThai={isThai}
              />
            )}
          </SidePanel>
        )}

        {isFormOpen && canEdit && currentData && !usesSidePanel && (
          <div
            className="fixed inset-0 z-[100]"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget) closeForm();
            }}
          >
            <div
              role="dialog"
              aria-labelledby="catalog-form-title"
              onMouseDown={(event) => event.stopPropagation()}
              style={{
                top: popoverPosition.top,
                right: popoverPosition.right,
                maxHeight: `calc(100vh - ${popoverPosition.top}px - 16px)`,
                boxShadow: "0 12px 32px rgba(0, 0, 0, 0.24)",
              }}
              className={`fixed flex w-[min(360px,calc(100vw-2rem))] flex-col gap-4 overflow-y-auto rounded-[12px] border p-4 sm:p-5 transition-colors ${isLight ? "bg-white border-[#E4E4E7] text-[#222222]" : "bg-[#383838] border-[#444444] text-[#F4F4F5]"}`}
            >
              {/* Absolute Close Button at Top-Right */}
              <button
                type="button"
                aria-label="ปิดฟอร์ม"
                className={`absolute top-3.5 right-3.5 rounded-[6px] p-1 transition-colors cursor-pointer z-10 ${
                  isLight
                    ? "text-[#666666] hover:bg-[#F4F4F5] hover:text-[#222222]"
                    : "text-[#A1A1AA] hover:bg-[#444444] hover:text-[#F4F4F5]"
                }`}
                onClick={closeForm}
              >
                <X size={18} />
              </button>

              {/* Header Title (Not sharing inline space with close button) */}
              <div className="w-full border-b border-[#444444]/30 pb-2.5 pr-8">
                <h2
                  id="catalog-form-title"
                  className={`text-[16px] font-bold ${isLight ? "text-[#222222]" : "text-[#F4F4F5]"}`}
                >
                  {editing ? "แก้ไข" : "เพิ่ม"}
                  {kinds.find((item) => item.key === kind)?.label}
                </h2>
              </div>

              {requiredRefs.length > 0 && !refs ? null : (
                <CatalogForm
                  key={`${kind}-${editing?.id ?? "new"}`}
                  kind={kind}
                  current={editing}
                  refs={refs ?? {}}
                  isLight={isLight}
                  onSave={save}
                  onCancel={closeForm}
                  isThai={isThai}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </WarehousePageTemplate>
  );
}

function CatalogForm({
  kind,
  current,
  refs,
  isLight,
  onSave,
  onCancel,
  sidePanel = false,
  formAlert,
  isThai = true,
}: {
  kind: CatalogKind;
  current: CatalogItem | null;
  refs: Record<string, CatalogItem[]>;
  isLight: boolean;
  onSave: (body: Record<string, unknown>) => void;
  onCancel: () => void;
  sidePanel?: boolean;
  formAlert?: string | null;
  isThai?: boolean;
}) {
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);
  const [values, setValues] = useState<Record<string, string | boolean>>(
    () =>
      Object.fromEntries(
        fields[kind].map((key) => [
          key,
          current?.[toDbKey(key)] ?? (key === "serialTracked" ? false : ""),
        ]),
      ) as Record<string, string | boolean>,
  );

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const missingFields = sidePanel
      ? fields[kind].filter((key) =>
          ["code", "name"].includes(key) && !String(values[key] ?? "").trim(),
        )
      : [];
    setFieldErrors(missingFields);
    if (missingFields.length) return;

    const body: Record<string, unknown> = {};
    for (const key of fields[kind]) {
      const value = values[key];
      body[key] =
        key === "serialTracked"
          ? value === true
          : referenceKind[key]
            ? value
              ? Number(value)
              : null
            : ["code", "name", "sku"].includes(key)
              ? String(value ?? "").trim()
              : value === "" && !["sku", "code", "name"].includes(key)
              ? null
              : value;
    }
    if (current && "active" in current)
      body.active = values.active ?? current.active ?? true;
    onSave(body);
  };

  const formFields = fields[kind].filter(
    (key) => !(current && key === "branchId"),
  );

  const isMultiField = formFields.length > 1;

  const panelStyles = sidePanelFormStyles(isLight);
  const itemEnglish = kind === "branches"
    ? "branch"
    : kind === "warehouses"
      ? "warehouse"
      : kind === "suppliers"
        ? "supplier"
        : kind === "units"
          ? "unit"
          : kind === "product-groups"
            ? "product group"
            : kind === "product-categories"
              ? "product category"
              : kind === "brands"
                ? "brand"
                : kind === "product-models"
                  ? "product model"
                  : "item";
  const itemThai = kinds.find((item) => item.key === kind)?.label ?? "ข้อมูล";
  const inputFrameStyle = sidePanel ? panelStyles.input : `box-border flex flex-row items-center px-[12px] py-[10px] gap-2 w-full max-w-[160px] h-[38px] rounded-[8px] border text-[13px] leading-[17px] font-normal outline-none transition-colors ${
    isLight
      ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222] focus:border-[#222222]"
      : "bg-[#2C2C2C] border-[#444444] text-[#F4F4F5] focus:border-[#E4E4E7]"
  }`;

  const labelStyle = sidePanel ? panelStyles.label : `font-bold text-[12px] leading-[16px] ${isLight ? "text-[#555555]" : "text-[#E4E4E7]"}`;
  const fieldLabel = (key: string) => {
    if (!sidePanel || !["branches", "warehouses", "suppliers"].includes(kind))
      return labels[key] ?? key;
    const itemLabel = kinds.find((item) => item.key === kind)?.label ?? "ข้อมูล";
    if (isThai) {
      const thaiLabels: Record<string, string> = {
        code: `รหัส${itemLabel}`,
        name: `ชื่อ${itemLabel}`,
        address: "ที่อยู่",
        contact: "ผู้ติดต่อ",
        phone: "โทรศัพท์",
        branchId: "สาขา",
      };
      return thaiLabels[key] ?? labels[key] ?? key;
    }
    const englishLabels: Record<string, string> = {
      code: `${itemEnglish[0].toUpperCase()}${itemEnglish.slice(1)} code`,
      name: `${itemEnglish[0].toUpperCase()}${itemEnglish.slice(1)} name`,
      address: "Address",
      contact: "Contact person",
      phone: "Phone",
      branchId: "Branch",
    };
    return englishLabels[key] ?? key;
  };

  return (
    <form
      className={sidePanel ? panelStyles.form : "ml-auto flex w-full max-w-[320px] flex-col items-center gap-5"}
      noValidate={sidePanel}
      onSubmit={submit}
    >
      <div className={sidePanel ? panelStyles.content : "w-full"}>
        {sidePanel && formAlert && <SidePanelAlert>{formAlert}</SidePanelAlert>}
        <div className={`w-full ${formFields.length === 1 && !sidePanel ? "max-w-[160px]" : isMultiField ? "grid grid-cols-1 sm:grid-cols-2 gap-3" : "flex flex-col gap-3"}`}>
        {formFields.map((key) => {
          const isFullWidth = key === "address" ||
            (sidePanel && kind === "warehouses" && key === "branchId") ||
            (!sidePanel && key === "name" &&
              (kind === "suppliers" || kind === "warehouses"));
          return (
            <div
              key={key}
              className={`${sidePanel ? panelStyles.field : "flex flex-col items-start gap-[6px]"} w-full ${isFullWidth ? "sm:col-span-2" : ""}`}
            >
              <label className={labelStyle}>
                {fieldLabel(key)}{" "}
                {["sku", "code", "name"].includes(key) && (
                  <span className="text-[#E71D36]">*</span>
                )}
              </label>

              {key === "serialTracked" ? (
                <label className="flex items-center gap-2 cursor-pointer text-[13px] h-[38px]">
                  <input
                    type="checkbox"
                    className={`rounded focus:ring-0 ${isLight ? "border-[#A1A1AA] bg-white text-[#222222]" : "border-[#444444] bg-[#2C2C2C] text-white"}`}
                    checked={values[key] === true}
                    onChange={(event) =>
                      setValues({ ...values, [key]: event.target.checked })
                    }
                  />
                  <span
                    className={isLight ? "text-[#222222]" : "text-[#F4F4F5]"}
                  >
                    {isThai ? "เปิดใช้งานการติดตาม Serial" : "Enable serial tracking"}
                  </span>
                </label>
              ) : referenceKind[key] ? (
                <CustomDropdown
                  value={String(values[key] ?? "")}
                  onChange={(value) => setValues({ ...values, [key]: value })}
                  options={[
                    { value: "", label: isThai ? `เลือก${fieldLabel(key)}` : `Select ${fieldLabel(key).toLowerCase()}` },
                    ...(refs[referenceKind[key]] ?? [])
                      .filter((item) => item.active !== false)
                      .map((item) => ({
                        value: String(item.id),
                        label: item.name,
                      })),
                  ]}
                  searchable
                  className="w-full"
                  triggerClassName={inputFrameStyle}
                />
              ) : key === "address" ? (
                <textarea
                  rows={2}
                  className={sidePanel ? `${panelStyles.input} min-h-24 resize-y py-2.5` : `box-border flex w-full rounded-[8px] border p-2.5 text-[13px] leading-[18px] font-normal outline-none transition-colors resize-none ${isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222] focus:border-[#222222]" : "bg-[#2C2C2C] border-[#444444] text-[#F4F4F5] focus:border-[#E4E4E7]"}`}
                  value={String(values[key] ?? "")}
                  onChange={(event) =>
                    setValues({ ...values, [key]: event.target.value })
                  }
                  placeholder={isThai ? `กรอก${fieldLabel(key)}` : `Enter ${fieldLabel(key).toLowerCase()}`}
                />
              ) : (
                <input
                  className={`${inputFrameStyle} ${fieldErrors.includes(key) ? sidePanelInvalidFieldClassName : ""}`}
                  aria-invalid={fieldErrors.includes(key)}
                  required={["sku", "code", "name"].includes(key)}
                  type={
                    ["cost", "salePrice", "reorderPoint"].includes(key)
                      ? "number"
                      : key === "phone"
                        ? "tel"
                        : "text"
                  }
                  min={key === "reorderPoint" ? "0" : undefined}
                  step={
                    ["cost", "salePrice"].includes(key)
                      ? "0.01"
                      : key === "reorderPoint"
                        ? "0.001"
                        : undefined
                  }
                  value={String(values[key] ?? "")}
                  onChange={(event) => {
                    setValues({ ...values, [key]: event.target.value });
                    if (sidePanel) setFieldErrors((errors) => errors.filter((field) => field !== key));
                  }}
                  placeholder={isThai ? `กรอก${fieldLabel(key)}` : `Enter ${fieldLabel(key).toLowerCase()}`}
                />
              )}
              {fieldErrors.includes(key) && (
                <SidePanelFieldError>
                  {isThai
                    ? `กรุณากรอก${fieldLabel(key)}`
                    : `Enter ${fieldLabel(key).toLowerCase()}.`}
                </SidePanelFieldError>
              )}
            </div>
          );
        })}

        {current && "active" in current && (
          <div
            className={`${sidePanel ? panelStyles.field : "flex flex-col items-start gap-[6px]"} w-full ${isMultiField ? "sm:col-span-2" : ""}`}
          >
            <label className={labelStyle}>{isThai ? "สถานะการใช้งาน" : "Status"}</label>
            <CustomDropdown
              value={String(values.active ?? current.active ?? true)}
              onChange={(value) =>
                setValues({ ...values, active: value === "true" })
              }
              options={[
                { value: "true", label: isThai ? "ใช้งาน" : "Active" },
                { value: "false", label: isThai ? "ปิดใช้งาน" : "Inactive" },
              ]}
              className="w-full"
              triggerClassName={inputFrameStyle}
            />
          </div>
        )}
        </div>
      </div>

      {/* Actions (Bottom-Right aligned) */}
      <div className={sidePanel ? panelStyles.footer : "flex flex-row justify-end items-center gap-[10px] w-full pt-4"}>
        {/* btn-secondary */}
        <button
          type="button"
          onClick={onCancel}
          className={sidePanel ? panelStyles.cancel : `box-border flex flex-row justify-center items-center px-5 py-2.5 min-w-[84px] h-[38px] rounded-[8px] border font-bold text-[13px] leading-[18px] transition-colors cursor-pointer ${
            isLight
              ? "bg-[#FFFFFF] border-[#E4E4E7] text-[#222222] hover:bg-[#F4F4F5]"
              : "bg-[#383838] border-[#444444] text-[#F4F4F5] hover:bg-[#444444]"
          }`}
        >
          {isThai ? "ยกเลิก" : "Cancel"}
        </button>

        {/* btn-primary */}
        <button
          type="submit"
          className={sidePanel ? panelStyles.submit : `box-border flex flex-row justify-center items-center px-5 py-2.5 min-w-[96px] h-[38px] rounded-[8px] font-bold text-[13px] leading-[18px] transition-colors cursor-pointer ${
            isLight
              ? "bg-[#222222] text-[#F4F4F5] hover:bg-black"
              : "bg-white hover:bg-[#F4F4F5] text-[#222222]"
          }`}
        >
          {current
            ? (isThai ? "บันทึก" : "Save changes")
            : (isThai ? `เพิ่ม${itemThai}` : `Add ${itemEnglish}`)}
        </button>
      </div>
    </form>
  );
}
