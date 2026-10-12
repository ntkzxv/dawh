"use client";

import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import { warehouseApi, type CatalogItem } from "@/lib/api/warehouse";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import { canEditCatalog } from "@/lib/contracts/warehouse-policy";
import { useRemote, Notice, message } from "@/components/warehouse/Ui";
import CustomDropdown from "@/components/common/CustomDropdown";
import {
  DATA_TABLE_STYLES,
  dataTableFrameClassName,
} from "@/components/common/DataTable";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import {
  SidePanel,
  sidePanelFormStyles,
  Pagination,
  Button,
  SecondaryButton,
  SearchInput,
  FilterDropdown,
  FilterButton,
  type ProductDetailItem,
} from "@/components/common";
import { UploadCloud, Download, Plus, MoreVertical } from "lucide-react";

export type InventoryRowItem = ProductDetailItem;

export default function ProductInventorySplitView({
  showAddProduct = true,
}: {
  showAddProduct?: boolean;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const panelStyles = sidePanelFormStyles(isLight);
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";
  const account = useOptionalWarehouseAccount();

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const filterDropdownRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);
  const [filterPanelPosition, setFilterPanelPosition] = useState({ top: 0, left: 16 });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  useEffect(() => {
    if (!filtersOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!(event.target instanceof Node)) return;
      if (filterDropdownRef.current?.contains(event.target)) return;
      if (filterPanelRef.current?.contains(event.target)) return;

      // CustomDropdown renders its options in a portal under document.body.
      // Keep the filter panel mounted while a user interacts with that portal.
      if (
        event.target instanceof Element &&
        event.target.closest('[role="listbox"]')
      ) {
        return;
      }

      setFiltersOpen(false);
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
    if (!filtersOpen) return;
    const updateFilterPanelPosition = () => {
      const trigger = filterDropdownRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const panelWidth = Math.min(680, window.innerWidth - 32);
      setFilterPanelPosition({
        top: rect.bottom + 8,
        left: Math.max(16, Math.min(rect.left, window.innerWidth - panelWidth - 16)),
      });
    };
    updateFilterPanelPosition();
    window.addEventListener("resize", updateFilterPanelPosition);
    window.addEventListener("scroll", updateFilterPanelPosition, true);
    return () => {
      window.removeEventListener("resize", updateFilterPanelPosition);
      window.removeEventListener("scroll", updateFilterPanelPosition, true);
    };
  }, [filtersOpen]);
  useEffect(() => {
    const timer = window.setTimeout(
      () => setDebouncedSearch(searchQuery.trim()),
      250,
    );
    return () => window.clearTimeout(timer);
  }, [searchQuery]);

  const queryKey = useMemo(() => {
    const params = new URLSearchParams({
      page: String(currentPage),
      limit: String(pageSize),
    });
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (selectedCategory !== "all") params.set("categoryId", selectedCategory);
    if (selectedStatus !== "all") params.set("status", selectedStatus);
    if (selectedWarehouse !== "all")
      params.set("warehouseId", selectedWarehouse);
    return params.toString();
  }, [
    currentPage,
    debouncedSearch,
    selectedCategory,
    selectedStatus,
    selectedWarehouse,
  ]);
  const loadData = useCallback(
    async (signal: AbortSignal) => ({
      ...(await warehouseApi.inventoryProducts(
        new URLSearchParams(queryKey),
        signal,
      )),
      queryKey,
    }),
    [queryKey],
  );
  const { data: loadedData, loading, error, refresh } = useRemote(loadData);
  const data = loadedData?.queryKey === queryKey ? loadedData : null;
  const loadFilters = useCallback(
    (signal: AbortSignal) =>
      Promise.all([
        warehouseApi.catalog("product-categories", signal),
        warehouseApi.catalog("warehouses", signal),
      ]).then(([categories, warehouses]) => ({ categories, warehouses })),
    [],
  );
  const { data: filters } = useRemote(loadFilters);
  const loadFormRefs = useCallback(
    (signal: AbortSignal) =>
      Promise.all([
        warehouseApi.catalog("units", signal),
        warehouseApi.catalog("brands", signal),
      ]).then(([units, brands]) => ({ units, brands })),
    [],
  );
  const { data: formRefs, error: formRefsError } = useRemote(loadFormRefs, {
    enabled: isModalOpen,
  });

  // Selected Item for Drawer
  const [selectedItem, setSelectedItem] = useState<InventoryRowItem | null>(
    null,
  );

  // Modal State for Add / Edit Product
  const [editingProduct, setEditingProduct] = useState<CatalogItem | null>(
    null,
  );
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // New/Edit Form Values
  const [formSku, setFormSku] = useState("");
  const [formName, setFormName] = useState("");
  const [formCategoryId, setFormCategoryId] = useState("");
  const [formBrandId, setFormBrandId] = useState("");
  const [formUnitId, setFormUnitId] = useState("");
  const [formCost, setFormCost] = useState("");
  const [formSalePrice, setFormSalePrice] = useState("");
  const [formReorderPoint, setFormReorderPoint] = useState("");

  const canEdit = canEditCatalog(account?.me?.role, "products");

  const items: InventoryRowItem[] = useMemo(() => {
    if (!data) return [];
    return data.items.map((p) => {
      const onHand = Number(p.on_hand);
      const reorder =
        p.reorder_point == null ? undefined : Number(p.reorder_point);
      return {
        id: String(p.id),
        sku: p.sku || `SKU-${p.id}`,
        name: p.name,
        category: p.category_name || "-",
        brand: p.brand_name || "-",
        onHand,
        warehouse: p.warehouse_names || "-",
        status: p.status,
        unit: p.unit_code,
        price:
          p.sale_price != null
            ? Number(p.sale_price)
            : p.cost != null
              ? Number(p.cost)
              : null,
        ...(reorder == null ? {} : { minStock: reorder }),
      };
    });
  }, [data]);

  const filteredItems = items;
  const totalItems = data?.page.total ?? 0;
  const totalPages = Math.ceil(totalItems / pageSize);
  const displayedPage = currentPage;
  const paginatedItems = items;
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

  // Set default selected item
  const activeDetailItem = selectedItem;

  // Open modal for add / edit
  const openAddModal = () => {
    setEditingProduct(null);
    setFormSku("");
    setFormName("");
    setFormCategoryId("");
    setFormBrandId("");
    setFormUnitId("");
    setFormCost("");
    setFormSalePrice("");
    setFormReorderPoint("10");
    setFormError(null);
    setFormSuccess(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: InventoryRowItem) => {
    const raw = data?.items.find((p) => String(p.id) === item.id) || null;
    setEditingProduct(raw);
    setFormSku(raw?.sku || item.sku);
    setFormName(raw?.name || item.name);
    setFormCategoryId(String(raw?.category_id || ""));
    setFormBrandId(String(raw?.brand_id || ""));
    setFormUnitId(String(raw?.unit_id || ""));
    setFormCost(String(raw?.cost || ""));
    setFormSalePrice(String(raw?.sale_price ?? raw?.cost ?? item.price ?? ""));
    setFormReorderPoint(String(raw?.reorder_point || item.minStock || "10"));
    setFormError(null);
    setFormSuccess(null);
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formSku.trim() || !formName.trim()) {
      setFormError("กรุณากรอกรหัส SKU และชื่อสินค้า");
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    try {
      const payload: Record<string, unknown> = {
        sku: formSku.trim(),
        name: formName.trim(),
        categoryId: formCategoryId ? Number(formCategoryId) : null,
        brandId: formBrandId ? Number(formBrandId) : null,
        unitId: formUnitId ? Number(formUnitId) : null,
        cost: formCost ? Number(formCost) : null,
        salePrice: formSalePrice ? Number(formSalePrice) : null,
        reorderPoint: formReorderPoint ? Number(formReorderPoint) : 10,
      };

      if (editingProduct) {
        await warehouseApi.updateCatalog(
          "products",
          editingProduct.id,
          payload,
        );
        setFormSuccess("แก้ไขข้อมูลสินค้าเรียบร้อย");
      } else {
        await warehouseApi.createCatalog("products", payload);
        setFormSuccess("สร้างสินค้าใหม่เรียบร้อยแล้ว");
      }

      await refresh();
      setTimeout(() => {
        setIsModalOpen(false);
      }, 700);
    } catch (err) {
      setFormError(message(err));
    } finally {
      setFormSubmitting(false);
    }
  };

  // Status badge helper
  const renderStatusBadge = (
    status: "in_stock" | "low_stock" | "out_of_stock",
  ) => {
    if (status === "out_of_stock") {
      return (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#E71D36]/10 text-[#E71D36]">
          {isThai ? "วิกฤต" : "Out"}
        </span>
      );
    }
    if (status === "low_stock") {
      return (
        <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#FF9F1C]/10 text-[#FF9F1C]">
          {isThai ? "ใกล้หมด" : "Low"}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold bg-[#2EC4B6]/10 text-[#2EC4B6]">
        {isThai ? "ปกติ" : "In Stock"}
      </span>
    );
  };

  return (
    <div
      className={`w-full flex-1 min-h-full ${
        isLight ? "bg-[#F8FAFC] text-[#222222]" : "bg-[#2C2C2C] text-[#F8FAFC]"
      }`}
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      <main className="mx-auto w-full max-w-[1600px] min-w-0 space-y-6 p-4 pb-10 sm:p-8 lg:p-10">
        {error && <Notice tone="error">{error}</Notice>}

        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <SearchInput
                value={searchQuery}
                onChange={(val) => {
                  setSearchQuery(val);
                  setCurrentPage(1);
                }}
                placeholder={isThai ? "ค้นหา SKU, ชื่อ..." : "Search SKU, Name..."}
                aria-label={isThai ? "ค้นหาสินค้า" : "Search products"}
                width="w-full sm:w-72"
              />
              <div className="relative shrink-0" ref={filterDropdownRef}>
                <FilterButton
                  controls="inventory-filter-panel"
                  expanded={filtersOpen}
                  label={isThai ? "ตัวกรอง" : "Filters"}
                  activeFilterCount={
                    Number(selectedCategory !== "all") +
                    Number(selectedStatus !== "all") +
                    Number(selectedWarehouse !== "all")
                  }
                  onClick={() => {
                    if (filtersOpen) {
                      setFiltersOpen(false);
                      return;
                    }
                    const rect = filterDropdownRef.current?.getBoundingClientRect();
                    if (rect) {
                      const panelWidth = Math.min(680, window.innerWidth - 32);
                      setFilterPanelPosition({
                        top: rect.bottom + 8,
                        left: Math.max(16, Math.min(rect.left, window.innerWidth - panelWidth - 16)),
                      });
                    }
                    setFiltersOpen(true);
                  }}
                />
                {filtersOpen && createPortal(
                  <div
                    ref={filterPanelRef}
                    id="inventory-filter-panel"
                    style={{ top: filterPanelPosition.top, left: filterPanelPosition.left }}
                    className={`fixed z-[99998] w-[min(680px,calc(100vw-2rem))] space-y-4 rounded-2xl border p-4 shadow-2xl sm:p-5 ${
                      isLight
                        ? "border-[#E4E4E7] bg-white text-[#222222]"
                        : "border-[#444444] bg-[#383838] text-white"
                    }`}
                  >
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="space-y-1.5 text-sm font-medium">
                    <span>{isThai ? "หมวดหมู่" : "Category"}</span>
                    <FilterDropdown
                      value={selectedCategory}
                      onChange={(value) => {
                        setSelectedCategory(value);
                        setCurrentPage(1);
                      }}
                      className="w-full"
                      options={[
                        {
                          value: "all",
                          label: isThai ? "ทั้งหมด" : "All categories",
                        },
                        ...(filters?.categories || []).map((category) => ({
                          value: String(category.id),
                          label: category.name,
                        })),
                      ]}
                    />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium">
                    <span>{isThai ? "สถานะสินค้า" : "Product status"}</span>
                    <FilterDropdown
                      value={selectedStatus}
                      onChange={(value) => {
                        setSelectedStatus(value);
                        setCurrentPage(1);
                      }}
                      className="w-full"
                      options={[
                        { value: "all", label: isThai ? "ทั้งหมด" : "All statuses" },
                        { value: "in_stock", label: isThai ? "ปกติ" : "In stock" },
                        { value: "low_stock", label: isThai ? "ใกล้หมด" : "Low stock" },
                        { value: "out_of_stock", label: isThai ? "วิกฤต" : "Out of stock" },
                      ]}
                    />
                  </label>
                  <label className="space-y-1.5 text-sm font-medium sm:col-span-2 lg:col-span-1">
                    <span>{isThai ? "คลังสินค้า" : "Warehouse"}</span>
                    <FilterDropdown
                      value={selectedWarehouse}
                      onChange={(value) => {
                        setSelectedWarehouse(value);
                        setCurrentPage(1);
                      }}
                      className="w-full"
                      options={[
                        { value: "all", label: isThai ? "ทั้งหมด" : "All warehouses" },
                        ...(filters?.warehouses || []).map((warehouse) => ({
                          value: String(warehouse.id),
                          label: warehouse.name,
                        })),
                      ]}
                    />
                  </label>
                </div>
                <div className={`flex justify-end gap-2 border-t pt-3 ${isLight ? "border-[#E4E4E7]" : "border-white/10"}`}>
                  <button
                    type="button"
                    className={`rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${isLight ? "border-slate-300 hover:bg-slate-100" : "border-white/15 hover:bg-white/5"}`}
                    onClick={() => {
                      setSelectedCategory("all");
                      setSelectedStatus("all");
                      setSelectedWarehouse("all");
                      setCurrentPage(1);
                    }}
                  >
                    {isThai ? "ล้างตัวกรอง" : "Clear filters"}
                  </button>
                </div>
                  </div>
                , document.body)}
              </div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-2.5 sm:ml-auto">
              <SecondaryButton icon={<UploadCloud size={14} />}>
                {isThai ? "ส่งออก" : "Export"}
              </SecondaryButton>
              <SecondaryButton icon={<Download size={14} />}>
                {isThai ? "นำเข้า" : "Import"}
              </SecondaryButton>
              {showAddProduct && canEdit && (
                <Button
                  variant="primary"
                  onClick={openAddModal}
                  icon={<Plus size={14} />}
                >
                  {isThai ? "เพิ่มสินค้า" : "Add Product"}
                </Button>
              )}
            </div>
          </div>

        {/* inventory-table-container */}
          {loading && !data ? (
            <div
              role="status"
              aria-label={
                isThai ? "กำลังโหลดข้อมูลสินค้า" : "Loading inventory"
              }
              className={`${dataTableFrameClassName(isLight)} w-full overflow-x-auto`}
            >
              <table
                className={DATA_TABLE_STYLES.table}
                aria-hidden="true"
              >
                <thead>
                  <tr
                    className={`${DATA_TABLE_STYLES.headerRow} ${isLight ? "bg-[#F4F4F5]" : "bg-[#2C2C2C]"}`}
                  >
                    {[
                      "w-[190px]",
                      "",
                      "w-[130px]",
                      "w-[120px]",
                      "w-[120px]",
                      "w-[90px]",
                      "w-[120px]",
                      "w-[100px]",
                      "w-[48px]",
                    ].map((width, index) => (
                      <th key={index} className={`${DATA_TABLE_STYLES.headerCell} ${width}`}>
                        <SkeletonBox
                          className={`h-3 ${index === 1 ? "w-3/4" : "w-2/3"}`}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  className={`${DATA_TABLE_STYLES.body} ${isLight ? "divide-[#E4E4E7]" : "divide-[#444444]"}`}
                >
                  {Array.from({ length: 6 }).map((_, row) => (
                    <tr key={row} className="h-[56px]">
                      <td className="px-3 py-3">
                        <SkeletonBox className="h-3.5 w-3/4" />
                      </td>
                      <td className="px-3 py-3">
                        <SkeletonBox className="h-3.5 w-20" />
                      </td>
                      <td className="px-3 py-3">
                        <SkeletonBox className="h-3.5 w-20" />
                      </td>
                      <td className="px-3 py-3">
                        <SkeletonBox className="h-3.5 w-20" />
                      </td>
                      <td className="px-3 py-3">
                        <SkeletonBox className="ml-auto h-3.5 w-12" />
                      </td>
                      <td className="px-3 py-3">
                        <SkeletonBox className="h-3.5 w-14" />
                      </td>
                      <td className="px-3 py-3">
                        <SkeletonBox className="ml-auto h-3.5 w-12" />
                      </td>
                      <td className="px-3 py-3">
                        <SkeletonBox className="h-5 w-14 rounded-full" />
                      </td>
                      <td className="px-3 py-3">
                        <SkeletonBox className="ml-auto size-8 rounded-[6px]" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : !data && error ? (
            <div className={`${dataTableFrameClassName(isLight)} w-full py-12 text-center text-sm`}>
              <button
                type="button"
                className="underline"
                onClick={() => void refresh()}
              >
                {isThai ? "ลองโหลดข้อมูลอีกครั้ง" : "Try loading again"}
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className={`${dataTableFrameClassName(isLight)} w-full py-12 text-center text-sm text-[#A1A1AA]`}>
              {isThai ? "ไม่พบรายการสินค้าที่ค้นหา" : "No products found."}
            </div>
          ) : (
            <div className={`${dataTableFrameClassName(isLight)} w-full overflow-x-auto`}>
              <table className={DATA_TABLE_STYLES.table}>
                {/* row-header */}
                <thead>
                  <tr
                    className={`${DATA_TABLE_STYLES.headerRow} ${isLight ? "bg-[#F4F4F5] text-[#666666]" : "bg-[#2C2C2C] text-[#A1A1AA]"}`}
                  >
                    <th className={`${DATA_TABLE_STYLES.headerCell} w-[190px] rounded-l-[6px]`}>
                      {isThai ? "รหัส SKU" : "SKU"}
                    </th>
                    <th className={`${DATA_TABLE_STYLES.headerCell} min-w-[220px]`}>
                      {isThai ? "ชื่อสินค้า" : "Product Name"}
                    </th>
                    <th className={`${DATA_TABLE_STYLES.headerCell} w-[130px]`}>
                      {isThai ? "หมวดหมู่" : "Category"}
                    </th>
                    <th className={`${DATA_TABLE_STYLES.headerCell} w-[120px]`}>
                      {isThai ? "ยี่ห้อ" : "Brand"}
                    </th>
                    <th className={`${DATA_TABLE_STYLES.headerCell} text-right w-[120px]`}>
                      {isThai ? "คงเหลือ" : "On Hand"}
                    </th>
                    <th className={`${DATA_TABLE_STYLES.headerCell} w-[90px]`}>
                      {isThai ? "หน่วย" : "Unit"}
                    </th>
                    <th className={`${DATA_TABLE_STYLES.headerCell} text-right w-[120px]`}>
                      {isThai ? "จุดสั่งซื้อ" : "Reorder Point"}
                    </th>
                    <th className={`${DATA_TABLE_STYLES.headerCell} w-[100px]`}>
                      {isThai ? "สถานะ" : "Status"}
                    </th>
                    <th
                      className={`${DATA_TABLE_STYLES.headerCell} w-[48px] rounded-r-[6px]`}
                      aria-label={isThai ? "การทำงาน" : "Actions"}
                    />
                  </tr>
                </thead>

                {/* table rows */}
                <tbody
                  className={`divide-y ${isLight ? "divide-[#E4E4E7]" : "divide-[#444444]"}`}
                >
                  {paginatedItems.map((item) => {
                    const isSelected = activeDetailItem?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        className={`${DATA_TABLE_STYLES.bodyRow} ${
                          isSelected
                            ? isLight
                              ? "bg-slate-100"
                              : "bg-[#2C2C2C]"
                            : isLight
                              ? "hover:bg-slate-50"
                              : "hover:bg-white/[0.02]"
                        }`}
                      >
                        {/* SKU */}
                        <td
                          className={`${DATA_TABLE_STYLES.bodyCell} font-mono text-[12px] font-medium ${isLight ? "text-slate-900" : "text-[#F8FAFC]"}`}
                        >
                          <span className="block truncate" title={item.sku}>
                            {item.sku}
                          </span>
                        </td>

                        {/* Name */}
                        <td className={`${DATA_TABLE_STYLES.bodyCell} font-medium`}>
                          <span
                            className={`line-clamp-1 ${isLight ? "text-slate-900" : "text-[#F8FAFC]"}`}
                          >
                            {item.name}
                          </span>
                        </td>

                        {/* Category */}
                        <td className={`${DATA_TABLE_STYLES.bodyCell} text-[#A1A1AA] text-xs`}>
                          {item.category}
                        </td>

                        {/* Brand */}
                        <td className={`${DATA_TABLE_STYLES.bodyCell} text-[#A1A1AA] text-xs`}>
                          {item.brand}
                        </td>

                        {/* On Hand */}
                        <td className={`${DATA_TABLE_STYLES.bodyCell} text-right font-mono font-bold text-[13px]`}>
                          <span
                            className={
                              item.status === "out_of_stock"
                                ? "text-[#E71D36]"
                                : item.status === "low_stock"
                                  ? "text-[#FF9F1C]"
                                  : isLight
                                    ? "text-[#2EC4B6]"
                                    : "text-[#2EC4B6]"
                            }
                          >
                            {item.onHand.toLocaleString()}
                          </span>
                        </td>

                        {/* Unit */}
                        <td className={`${DATA_TABLE_STYLES.bodyCell} text-xs`}>{item.unit}</td>

                        {/* Reorder point */}
                        <td className={`${DATA_TABLE_STYLES.bodyCell} text-right font-mono text-xs`}>
                          {item.minStock == null
                            ? "-"
                            : item.minStock.toLocaleString()}
                        </td>

                        {/* Status */}
                        <td className={DATA_TABLE_STYLES.bodyCell}>
                          {renderStatusBadge(item.status)}
                        </td>

                        {/* Actions */}
                        <td className={`${DATA_TABLE_STYLES.bodyCell} text-right`}>
                          <button
                            type="button"
                            onClick={() => setSelectedItem(item)}
                            aria-label={
                              isThai
                                ? `ดูรายละเอียด ${item.name}`
                                : `View ${item.name} details`
                            }
                            title={
                              isThai
                                ? "ดูรายละเอียดสินค้า"
                                : "View product details"
                            }
                            className={`inline-flex size-8 items-center justify-center rounded-[6px] transition-colors cursor-pointer ${
                              isLight
                                ? "text-[#666666] hover:bg-[#E4E4E7] hover:text-[#222222]"
                                : "text-[#A1A1AA] hover:bg-[#444444] hover:text-[#F8FAFC]"
                            }`}
                          >
                            <MoreVertical size={17} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        {filteredItems.length > 0 && (
          <Pagination
            currentPage={displayedPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            isThai={isThai}
            className="px-1"
          />
          )}
        </div>
      </main>

      {/* Product detail drawer (Shared component) */}
      <SidePanel
        item={activeDetailItem}
        onClose={() => setSelectedItem(null)}
        canEdit={canEdit}
        onEdit={(item) => openEditModal(item)}
      />

      {/* ========================================================= */}
      {/* 📌 [MODAL / SIDE DRAWER]: Add / Edit Product Form         */}
      {/* ========================================================= */}
      {isModalOpen && canEdit && (
        <SidePanel
          item={null}
          onClose={() => setIsModalOpen(false)}
          eyebrow={
            editingProduct
              ? isThai
                ? "จัดการข้อมูล"
                : "Manage SKU"
              : isThai
                ? "สร้างข้อมูลใหม่"
                : "New SKU"
          }
          title={
            editingProduct
              ? isThai
                ? "แก้ไขข้อมูลสินค้า"
                : "Edit Product"
              : isThai
                ? "เพิ่มสินค้าใหม่"
                : "Add New Product"
          }
        >
            {/* Form */}
            <form
              onSubmit={handleSaveProduct}
              className={panelStyles.form}
            >
              <div className={panelStyles.content}>
                {formError && (
                  <div className="p-3.5 rounded-[8px] bg-[#E71D36]/10 border border-[#E71D36]/30 text-[#E71D36] text-[13px] font-medium">
                    {formError}
                  </div>
                )}
                {formRefsError && (
                  <p className="text-rose-600">{formRefsError}</p>
                )}
                {formSuccess && (
                  <div className="p-3.5 rounded-[8px] bg-[#2EC4B6]/10 border border-[#2EC4B6]/30 text-[#2EC4B6] text-[13px] font-medium">
                    {formSuccess}
                  </div>
                )}

                {/* Section 1: ข้อมูลระบุตัวตนสินค้า */}
                <div className={panelStyles.section}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label
                        className={`text-[12px] font-bold ${isLight ? "text-[#444444]" : "text-[#E4E4E7]"}`}
                      >
                        {isThai ? "รหัสสินค้า (SKU)" : "SKU Code"}{" "}
                        <span className="text-[#E71D36]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formSku}
                        onChange={(e) => setFormSku(e.target.value)}
                        placeholder="เช่น SKU-00120"
                        className={`${panelStyles.input} font-mono`}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        className={`text-[12px] font-bold ${isLight ? "text-[#444444]" : "text-[#E4E4E7]"}`}
                      >
                        {isThai ? "ชื่อสินค้า" : "Product Name"}{" "}
                        <span className="text-[#E71D36]">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formName}
                        onChange={(e) => setFormName(e.target.value)}
                        placeholder="เช่น เครื่องปั่นไฟดีเซล 5KW"
                        className={panelStyles.input}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: การจัดหมวดหมู่และหน่วย */}
                <div className={panelStyles.dividedSection}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label
                        className={`text-[12px] font-bold ${isLight ? "text-[#444444]" : "text-[#E4E4E7]"}`}
                      >
                        {isThai ? "หมวดหมู่สินค้า" : "Category"}
                      </label>
                      <CustomDropdown
                        value={formCategoryId}
                        onChange={setFormCategoryId}
                        options={[
                          {
                            value: "",
                            label: isThai ? "- เลือกหมวดหมู่ -" : "- Select -",
                          },
                          ...(filters?.categories || []).map((c) => ({
                            value: String(c.id),
                            label: c.name,
                          })),
                        ]}
                        searchable
                        className="w-full"
                        triggerClassName={panelStyles.dropdown}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        className={`text-[12px] font-bold ${isLight ? "text-[#444444]" : "text-[#E4E4E7]"}`}
                      >
                        {isThai ? "ยี่ห้อ / แบรนด์" : "Brand"}
                      </label>
                      <CustomDropdown
                        value={formBrandId}
                        onChange={setFormBrandId}
                        options={[
                          {
                            value: "",
                            label: isThai ? "- เลือกยี่ห้อ -" : "- Select -",
                          },
                          ...(formRefs?.brands || []).map((b) => ({
                            value: String(b.id),
                            label: b.name,
                          })),
                        ]}
                        searchable
                        className="w-full"
                        triggerClassName={panelStyles.dropdown}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        className={`text-[12px] font-bold ${isLight ? "text-[#444444]" : "text-[#E4E4E7]"}`}
                      >
                        {isThai ? "หน่วยนับ" : "Unit"}
                      </label>
                      <CustomDropdown
                        value={formUnitId}
                        onChange={setFormUnitId}
                        options={[
                          {
                            value: "",
                            label: isThai ? "- เลือกหน่วย -" : "- Select -",
                          },
                          ...(formRefs?.units || []).map((u) => ({
                            value: String(u.id),
                            label: u.name,
                          })),
                        ]}
                        searchable
                        className="w-full"
                        triggerClassName={panelStyles.dropdown}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: ราคาและการควบคุมสต็อก */}
                <div className={panelStyles.dividedSection}>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label
                        className={`text-[12px] font-bold ${isLight ? "text-[#444444]" : "text-[#E4E4E7]"}`}
                      >
                        {isThai ? "ต้นทุน (บาท)" : "Cost (THB)"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formCost}
                        onChange={(e) => setFormCost(e.target.value)}
                        placeholder="0.00"
                        className={`${panelStyles.input} font-mono`}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        className={`text-[12px] font-bold ${isLight ? "text-[#444444]" : "text-[#E4E4E7]"}`}
                      >
                        {isThai ? "ราคาขาย (บาท)" : "Sale Price (THB)"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formSalePrice}
                        onChange={(e) => setFormSalePrice(e.target.value)}
                        placeholder="0.00"
                        className={`${panelStyles.input} font-mono`}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label
                        className={`text-[12px] font-bold ${isLight ? "text-[#444444]" : "text-[#E4E4E7]"}`}
                      >
                        {isThai ? "จุดสั่งซื้อ (ขั้นต่ำ)" : "Reorder Point"}
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formReorderPoint}
                        onChange={(e) => setFormReorderPoint(e.target.value)}
                        placeholder="10"
                        className={`${panelStyles.input} font-mono`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className={panelStyles.footer}>
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className={panelStyles.cancel}
                >
                  {isThai ? "ยกเลิก" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || !formRefs}
                  className={panelStyles.submit}
                >
                  {formSubmitting
                    ? isThai
                      ? "กำลังบันทึก..."
                      : "Saving..."
                    : editingProduct
                      ? isThai
                        ? "บันทึกการแก้ไข"
                        : "Update"
                      : isThai
                        ? "สร้างสินค้า"
                        : "Create"}
                </button>
              </div>
            </form>
        </SidePanel>
      )}
    </div>
  );
}
