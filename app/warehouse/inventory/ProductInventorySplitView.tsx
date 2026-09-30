"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import { warehouseApi, type CatalogItem } from "@/lib/api/warehouse";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import { canEditCatalog } from "@/lib/contracts/warehouse-policy";
import { useRemote, Notice, message } from "@/components/warehouse/Ui";
import CustomDropdown from "@/components/common/CustomDropdown";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import {
  SidePanel,
  Pagination,
  Button,
  SecondaryButton,
  SearchInput,
  FilterDropdown,
  type ProductDetailItem,
} from "@/components/common";
import { UploadCloud, Download, Plus, X, MoreVertical } from "lucide-react";

export type InventoryRowItem = ProductDetailItem;

export default function ProductInventorySplitView() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";
  const account = useOptionalWarehouseAccount();

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [debouncedSearch, setDebouncedSearch] = useState("");
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
      className={`w-full flex-1 flex flex-col lg:flex-row items-start justify-start p-0 min-h-0 self-stretch ${
        isLight ? "bg-[#F8FAFC] text-[#222222]" : "bg-[#2C2C2C] text-[#F8FAFC]"
      }`}
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      {/* ========================================================= */}
      {/* 📌 [LEFT PANE]: Auto layout padding: 32px gap: 24px      */}
      {/* ========================================================= */}
      <div className="flex-1 w-full min-w-0 flex flex-col items-start p-6 lg:p-8 gap-6 self-stretch overflow-y-auto">
        {error && <Notice tone="error">{error}</Notice>}

        <div className="flex w-full justify-end gap-2.5">
          <SecondaryButton icon={<UploadCloud size={14} />}>
            {isThai ? "ส่งออก" : "Export"}
          </SecondaryButton>
          <SecondaryButton icon={<Download size={14} />}>
            {isThai ? "นำเข้า" : "Import"}
          </SecondaryButton>
          {canEdit && (
            <Button
              variant="primary"
              onClick={openAddModal}
              icon={<Plus size={14} />}
            >
              {isThai ? "เพิ่มสินค้า" : "Add Product"}
            </Button>
          )}
        </div>

        <div
          className={`w-full rounded-[12px] border p-4 shadow-sm overflow-hidden flex flex-col transition-colors ${
            isLight
              ? "bg-white border-[#E4E4E7]"
              : "bg-[#383838] border-[#444444]"
          }`}
        >
        {/* filter-bar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#E4E4E7] dark:border-[#444444]">
          {/* filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* f-category */}
            <FilterDropdown
              value={selectedCategory}
              onChange={(value) => {
                setSelectedCategory(value);
                setCurrentPage(1);
              }}
              options={[
                {
                  value: "all",
                  label: isThai ? "หมวดหมู่: ทั้งหมด" : "All Categories",
                },
                ...(filters?.categories || []).map((c) => ({
                  value: String(c.id),
                  label: c.name,
                })),
              ]}
            />

            {/* f-status */}
            <FilterDropdown
              value={selectedStatus}
              onChange={(value) => {
                setSelectedStatus(value);
                setCurrentPage(1);
              }}
              options={[
                {
                  value: "all",
                  label: isThai ? "สถานะ: ทั้งหมด" : "All Status",
                },
                {
                  value: "in_stock",
                  label: isThai ? "สถานะ: ปกติ" : "In Stock",
                },
                {
                  value: "low_stock",
                  label: isThai ? "สถานะ: ใกล้หมด" : "Low Stock",
                },
                {
                  value: "out_of_stock",
                  label: isThai ? "สถานะ: วิกฤต" : "Out of Stock",
                },
              ]}
            />

            {/* f-warehouse */}
            <FilterDropdown
              value={selectedWarehouse}
              onChange={(value) => {
                setSelectedWarehouse(value);
                setCurrentPage(1);
              }}
              options={[
                {
                  value: "all",
                  label: isThai ? "คลัง: ทั้งหมด" : "All Warehouses",
                },
                ...(filters?.warehouses || []).map((w) => ({
                  value: String(w.id),
                  label: `คลัง: ${w.name}`,
                })),
              ]}
            />
            <SearchInput
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                setCurrentPage(1);
              }}
              placeholder={
                isThai ? "ค้นหา SKU, ชื่อ..." : "Search SKU, Name..."
              }
            />
          </div>

        </div>

        {/* inventory-table-container */}
          {loading && !data ? (
            <div
              role="status"
              aria-label={
                isThai ? "กำลังโหลดข้อมูลสินค้า" : "Loading inventory"
              }
              className="w-full overflow-x-auto"
            >
              <table
                className="w-full text-left text-[13px]"
                aria-hidden="true"
              >
                <thead>
                  <tr
                    className={`h-[36px] text-xs ${isLight ? "bg-[#F4F4F5]" : "bg-[#2C2C2C]"}`}
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
                      <th key={index} className={`px-3 py-2 ${width}`}>
                        <SkeletonBox
                          className={`h-3 ${index === 1 ? "w-3/4" : "w-2/3"}`}
                        />
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody
                  className={`divide-y ${isLight ? "divide-[#E4E4E7]" : "divide-[#444444]"}`}
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
            <div className="py-12 text-center text-sm">
              <button
                type="button"
                className="underline"
                onClick={() => void refresh()}
              >
                {isThai ? "ลองโหลดข้อมูลอีกครั้ง" : "Try loading again"}
              </button>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#A1A1AA]">
              {isThai ? "ไม่พบรายการสินค้าที่ค้นหา" : "No products found."}
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                {/* row-header */}
                <thead>
                  <tr
                    className={`h-[36px] rounded-[6px] text-xs font-semibold ${isLight ? "bg-[#F4F4F5] text-[#666666]" : "bg-[#2C2C2C] text-[#A1A1AA]"}`}
                  >
                    <th className="py-2 px-3 w-[190px] rounded-l-[6px]">
                      {isThai ? "รหัส SKU" : "SKU"}
                    </th>
                    <th className="py-2 px-3 min-w-[220px]">
                      {isThai ? "ชื่อสินค้า" : "Product Name"}
                    </th>
                    <th className="py-2 px-3 w-[130px]">
                      {isThai ? "หมวดหมู่" : "Category"}
                    </th>
                    <th className="py-2 px-3 w-[120px]">
                      {isThai ? "ยี่ห้อ" : "Brand"}
                    </th>
                    <th className="py-2 px-3 text-right w-[120px]">
                      {isThai ? "คงเหลือ" : "On Hand"}
                    </th>
                    <th className="py-2 px-3 w-[90px]">
                      {isThai ? "หน่วย" : "Unit"}
                    </th>
                    <th className="py-2 px-3 text-right w-[120px]">
                      {isThai ? "จุดสั่งซื้อ" : "Reorder Point"}
                    </th>
                    <th className="py-2 px-3 w-[100px]">
                      {isThai ? "สถานะ" : "Status"}
                    </th>
                    <th
                      className="py-2 px-3 w-[48px] rounded-r-[6px]"
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
                        className={`h-[56px] transition-colors select-none ${
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
                          className={`py-3 px-3 font-mono text-[12px] font-medium ${isLight ? "text-slate-900" : "text-[#F8FAFC]"}`}
                        >
                          <span className="block truncate" title={item.sku}>
                            {item.sku}
                          </span>
                        </td>

                        {/* Name */}
                        <td className="py-3 px-3 font-medium">
                          <span
                            className={`line-clamp-1 ${isLight ? "text-slate-900" : "text-[#F8FAFC]"}`}
                          >
                            {item.name}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3 text-[#A1A1AA] text-xs">
                          {item.category}
                        </td>

                        {/* Brand */}
                        <td className="py-3 px-3 text-[#A1A1AA] text-xs">
                          {item.brand}
                        </td>

                        {/* On Hand */}
                        <td className="py-3 px-3 text-right font-mono font-bold text-[13px]">
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
                        <td className="py-3 px-3 text-xs">{item.unit}</td>

                        {/* Reorder point */}
                        <td className="py-3 px-3 text-right font-mono text-xs">
                          {item.minStock == null
                            ? "-"
                            : item.minStock.toLocaleString()}
                        </td>

                        {/* Status */}
                        <td className="py-3 px-3">
                          {renderStatusBadge(item.status)}
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 text-right">
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
        </div>
        {filteredItems.length > 0 && (
          <Pagination
            currentPage={displayedPage}
            totalPages={totalPages}
            totalItems={totalItems}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            isThai={isThai}
            className="w-full px-1"
          />
        )}
      </div>

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
        <div
          className="fixed inset-0 z-[100] flex items-stretch justify-end bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setIsModalOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="product-form-title"
            className={`relative w-full max-w-[560px] h-full overflow-y-auto border-l p-5 sm:p-6 shadow-2xl transition-all animate-in slide-in-from-right duration-300 flex flex-col justify-between ${
              isLight
                ? "bg-white border-[#E4E4E7]"
                : "bg-[#282828] border-[#444444]"
            }`}
          >
            {/* Absolute Close button at top right */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className={`absolute top-4 right-4 p-1.5 rounded-[8px] transition-colors cursor-pointer z-10 ${
                isLight
                  ? "text-[#666666] hover:bg-[#F4F4F5] hover:text-[#222222]"
                  : "text-[#A1A1AA] hover:bg-[#444444] hover:text-white"
              }`}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Header Title (Not sharing inline space with close button) */}
            <div className="w-full pb-3 border-b border-[#444444]/30 shrink-0 pr-8">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                  {editingProduct
                    ? isThai
                      ? "จัดการข้อมูล"
                      : "Manage SKU"
                    : isThai
                      ? "สร้างข้อมูลใหม่"
                      : "New SKU"}
                </span>
                <h3
                  id="product-form-title"
                  className={`font-bold text-[18px] leading-[24px] ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}
                >
                  {editingProduct
                    ? isThai
                      ? "แก้ไขข้อมูลสินค้า"
                      : "Edit Product"
                    : isThai
                      ? "เพิ่มสินค้าใหม่"
                      : "Add New Product"}
                </h3>
              </div>
            </div>

            {/* Form */}
            <form
              onSubmit={handleSaveProduct}
              className="flex-1 flex flex-col justify-between pt-6 text-xs min-h-0"
            >
              <div className="space-y-6 overflow-y-auto pr-1">
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
                <div className="flex flex-col gap-3">
                  <span
                    className={`text-[12px] font-bold uppercase tracking-wider ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}
                  >
                    {isThai ? "1. ข้อมูลพื้นฐานสินค้า" : "1. Basic Information"}
                  </span>

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
                        className={`h-[38px] px-3.5 rounded-[8px] border text-[13px] font-mono outline-none transition-colors ${
                          isLight
                            ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222] focus:border-[#222222]"
                            : "bg-[#222222] border-[#444444] text-[#F4F4F5] focus:border-[#E4E4E7]"
                        }`}
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
                        className={`h-[38px] px-3.5 rounded-[8px] border text-[13px] outline-none transition-colors ${
                          isLight
                            ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222] focus:border-[#222222]"
                            : "bg-[#222222] border-[#444444] text-[#F4F4F5] focus:border-[#E4E4E7]"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 2: การจัดหมวดหมู่และหน่วย */}
                <div className="flex flex-col gap-3 pt-2 border-t border-[#444444]/20">
                  <span
                    className={`text-[12px] font-bold uppercase tracking-wider ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}
                  >
                    {isThai
                      ? "2. การจัดหมวดหมู่และหน่วยนับ"
                      : "2. Classification & Unit"}
                  </span>

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
                        triggerClassName={`h-[38px] px-3.5 rounded-[8px] border text-[13px] ${
                          isLight
                            ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]"
                            : "bg-[#222222] border-[#444444] text-[#F4F4F5]"
                        }`}
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
                        triggerClassName={`h-[38px] px-3.5 rounded-[8px] border text-[13px] ${
                          isLight
                            ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]"
                            : "bg-[#222222] border-[#444444] text-[#F4F4F5]"
                        }`}
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
                        triggerClassName={`h-[38px] px-3.5 rounded-[8px] border text-[13px] ${
                          isLight
                            ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]"
                            : "bg-[#222222] border-[#444444] text-[#F4F4F5]"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: ราคาและการควบคุมสต็อก */}
                <div className="flex flex-col gap-3 pt-2 border-t border-[#444444]/20">
                  <span
                    className={`text-[12px] font-bold uppercase tracking-wider ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}
                  >
                    {isThai
                      ? "3. ราคาและจุดสั่งซื้อ"
                      : "3. Pricing & Reorder Point"}
                  </span>

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
                        className={`h-[38px] px-3.5 rounded-[8px] border text-[13px] font-mono outline-none transition-colors ${
                          isLight
                            ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222] focus:border-[#222222]"
                            : "bg-[#222222] border-[#444444] text-[#F4F4F5] focus:border-[#E4E4E7]"
                        }`}
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
                        className={`h-[38px] px-3.5 rounded-[8px] border text-[13px] font-mono outline-none transition-colors ${
                          isLight
                            ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222] focus:border-[#222222]"
                            : "bg-[#222222] border-[#444444] text-[#F4F4F5] focus:border-[#E4E4E7]"
                        }`}
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
                        className={`h-[38px] px-3.5 rounded-[8px] border text-[13px] font-mono outline-none transition-colors ${
                          isLight
                            ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222] focus:border-[#222222]"
                            : "bg-[#222222] border-[#444444] text-[#F4F4F5] focus:border-[#E4E4E7]"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-5 border-t border-[#444444]/30 flex justify-end items-center gap-3 shrink-0 mt-6">
                <button
                  type="button"
                  disabled={formSubmitting}
                  onClick={() => setIsModalOpen(false)}
                  className={`h-[42px] px-6 rounded-[8px] border text-[14px] font-bold transition-colors cursor-pointer ${
                    isLight
                      ? "bg-white border-[#E4E4E7] text-[#222222] hover:bg-[#F4F4F5]"
                      : "bg-[#383838] border-[#444444] text-[#F4F4F5] hover:bg-[#444444]"
                  }`}
                >
                  {isThai ? "ยกเลิก" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting || !formRefs}
                  className={`h-[42px] px-6 rounded-[8px] text-[14px] font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-50 ${
                    isLight
                      ? "bg-[#222222] hover:bg-black text-white"
                      : "bg-white hover:bg-[#F4F4F5] text-[#222222]"
                  }`}
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
          </div>
        </div>
      )}
    </div>
  );
}
