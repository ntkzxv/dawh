"use client";

import React, { useState, useMemo, useCallback } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import { warehouseApi, type CatalogItem } from "@/lib/api/warehouse";
import { useRemote, Notice, message } from "@/components/warehouse/Ui";
import CustomDropdown from "@/components/common/CustomDropdown";
import { Pagination } from "@/components/common";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import {
  UploadCloud,
  Download,
  Plus,
  X,
  Search,
  Package,
  Edit,
  MoreVertical,
} from "lucide-react";

export interface InventoryRowItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  brand: string;
  onHand: number;
  warehouse: string;
  status: "in_stock" | "low_stock" | "out_of_stock";
  unit: string;
  price: number | null;
  description?: string;
  minStock?: number;
  historyBars: Array<{ label: string; value: number; color: string; heightPct: number }>;
}

export default function ProductInventorySplitView() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";

  // Data Loading
  const loadData = useCallback(async () => {
    const [me, products, balances, categories, warehouses, units, brands] = await Promise.all([
      warehouseApi.me(),
      warehouseApi.catalog("products"),
      warehouseApi.balances(),
      warehouseApi.catalog("product-categories"),
      warehouseApi.catalog("warehouses"),
      warehouseApi.catalog("units"),
      warehouseApi.catalog("brands"),
    ]);
    return { me, products, balances, categories, warehouses, units, brands };
  }, []);

  const { data, loading, error, refresh } = useRemote(loadData);

  // Filters State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedWarehouse, setSelectedWarehouse] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected Item for Drawer
  const [selectedItem, setSelectedItem] = useState<InventoryRowItem | null>(null);

  // Modal State for Add / Edit Product
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<CatalogItem | null>(null);
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

  const canEdit = !!data && ["ADMIN", "CEO"].includes(data.me.role);

  // Map products & balances into unified rows
  const items: InventoryRowItem[] = useMemo(() => {
    if (!data?.products) return [];

    return data.products.map((p) => {
      // Find matching stock balances
      const matching = data.balances.filter(
        (b) => String(b.product_id) === String(p.id) || b.sku === p.sku
      );

      const onHand = matching.reduce((sum, b) => sum + (parseFloat(String(b.quantity)) || 0), 0);
      const whName = matching[0]?.warehouse_name || "-";
      const unitItem = data.units.find((unit) => String(unit.id) === String(p.unit_id));
      const unitCode = matching[0]?.unit_code || unitItem?.code || unitItem?.name || "-";
      const catObj = data.categories.find((c) => String(c.id) === String(p.category_id));
      const brandObj = data.brands.find((brand) => String(brand.id) === String(p.brand_id));
      const categoryName = catObj?.name || "-";
      const brandName = brandObj?.name || "-";

      // Status calculation
      let status: "in_stock" | "low_stock" | "out_of_stock" = "in_stock";
      const reorderValue = p.reorder_point == null ? undefined : Number(p.reorder_point);
      const reorder = reorderValue != null && Number.isFinite(reorderValue) ? reorderValue : undefined;
      if (onHand <= 0) {
        status = "out_of_stock";
      } else if (reorder != null && onHand < reorder) {
        status = "low_stock";
      }

      // Simulated history bars
      const historyBars = [
        { label: "10", value: 10, color: "#2EC4B6", heightPct: 35 },
        { label: "25", value: 25, color: "#2EC4B6", heightPct: 80 },
        { label: "18", value: 18, color: "#2EC4B6", heightPct: 60 },
        { label: "12", value: 12, color: "#2EC4B6", heightPct: 45 },
        {
          label: String(Math.round(onHand)),
          value: Math.round(onHand),
          color: status === "out_of_stock" ? "#E71D36" : status === "low_stock" ? "#FF9F1C" : "#2EC4B6",
          heightPct: Math.min(100, Math.max(25, (onHand / 40) * 100)),
        },
      ];

      return {
        id: String(p.id),
        sku: p.sku || `SKU-${p.id}`,
        name: p.name,
        category: categoryName,
        brand: brandName,
        onHand,
        warehouse: whName,
        status,
        unit: unitCode,
        price: p.sale_price != null ? Number(p.sale_price) : p.cost != null ? Number(p.cost) : null,
        description: "อุปกรณ์และอะไหล่สินค้ามาตรฐานสำหรับการปฏิบัติงานและการจัดเก็บในคลังสินค้า",
        ...(reorder == null ? {} : { minStock: reorder }),
        historyBars,
      };
    });
  }, [data]);

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.trim().toLowerCase();
      if (q && !item.sku.toLowerCase().includes(q) && !item.name.toLowerCase().includes(q) && !item.category.toLowerCase().includes(q)) {
        return false;
      }
      if (selectedCategory !== "all" && item.category !== selectedCategory) {
        return false;
      }
      if (selectedStatus !== "all" && item.status !== selectedStatus) {
        return false;
      }
      if (selectedWarehouse !== "all" && item.warehouse !== selectedWarehouse) {
        return false;
      }
      return true;
    });
  }, [items, searchQuery, selectedCategory, selectedStatus, selectedWarehouse]);
  const totalPages = Math.ceil(filteredItems.length / pageSize);
  const displayedPage = Math.min(currentPage, Math.max(1, totalPages));
  const paginatedItems = filteredItems.slice((displayedPage - 1) * pageSize, displayedPage * pageSize);

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
    const raw = data?.products.find((p) => String(p.id) === item.id) || null;
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
        await warehouseApi.updateCatalog("products", editingProduct.id, payload);
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
  const renderStatusBadge = (status: "in_stock" | "low_stock" | "out_of_stock") => {
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

        {/* filter-bar */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          {/* filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* f-category */}
            <CustomDropdown
              value={selectedCategory}
                onChange={(value) => { setSelectedCategory(value); setCurrentPage(1); }}
              options={[
                { value: "all", label: isThai ? "หมวดหมู่: ทั้งหมด" : "All Categories" },
                ...(data?.categories || []).map((c) => ({
                  value: c.name,
                  label: c.name,
                })),
              ]}
              size="sm"
              triggerClassName={`h-[33px] px-3 py-2 rounded-[6px] border text-[13px] font-normal transition-colors ${
                isLight ? "bg-white border-[#E4E4E7] text-[#222222]" : "bg-[#383838] border-[#444444] text-[#F8FAFC]"
              }`}
            />

            {/* f-status */}
            <CustomDropdown
              value={selectedStatus}
              onChange={(value) => { setSelectedStatus(value); setCurrentPage(1); }}
              options={[
                { value: "all", label: isThai ? "สถานะ: ทั้งหมด" : "All Status" },
                { value: "in_stock", label: isThai ? "สถานะ: ปกติ" : "In Stock" },
                { value: "low_stock", label: isThai ? "สถานะ: ใกล้หมด" : "Low Stock" },
                { value: "out_of_stock", label: isThai ? "สถานะ: วิกฤต" : "Out of Stock" },
              ]}
              size="sm"
              triggerClassName={`h-[33px] px-3 py-2 rounded-[6px] border text-[13px] font-normal transition-colors ${
                isLight ? "bg-white border-[#E4E4E7] text-[#222222]" : "bg-[#383838] border-[#444444] text-[#F8FAFC]"
              }`}
            />

            {/* f-warehouse */}
            <CustomDropdown
              value={selectedWarehouse}
              onChange={(value) => { setSelectedWarehouse(value); setCurrentPage(1); }}
              options={[
                { value: "all", label: isThai ? "คลัง: ทั้งหมด" : "All Warehouses" },
                ...(data?.warehouses || []).map((w) => ({
                  value: w.name,
                  label: `คลัง: ${w.name}`,
                })),
              ]}
              size="sm"
              triggerClassName={`h-[33px] px-3 py-2 rounded-[6px] border text-[13px] font-normal transition-colors ${
                isLight ? "bg-white border-[#E4E4E7] text-[#222222]" : "bg-[#383838] border-[#444444] text-[#F8FAFC]"
              }`}
            />
          </div>

          {/* actions */}
          <div className="flex items-center gap-2.5">
            {/* Search Input */}
            <div
              className={`flex items-center px-3 py-1.5 h-[33px] rounded-[6px] border text-[13px] w-[180px] sm:w-[220px] transition-colors ${
                isLight ? "bg-white border-[#E4E4E7] text-[#222222]" : "bg-[#383838] border-[#444444] text-[#F8FAFC]"
              }`}
            >
              <Search size={14} className="text-[#A1A1AA] shrink-0 mr-2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                placeholder={isThai ? "ค้นหา SKU, ชื่อ..." : "Search SKU, Name..."}
                className="w-full bg-transparent border-none outline-none text-[13px] placeholder:text-[#A1A1AA]"
              />
            </div>

            {/* btn-export */}
            <button
              type="button"
              className={`flex items-center justify-center px-4 py-2 gap-1.5 h-[33px] rounded-[6px] border text-[13px] font-normal transition-colors cursor-pointer ${
                isLight ? "bg-white border-[#E4E4E7] text-[#222222] hover:bg-slate-100" : "bg-[#383838] border-[#444444] text-[#F8FAFC] hover:bg-[#444444]"
              }`}
            >
              <UploadCloud size={14} />
              <span>{isThai ? "ส่งออก" : "Export"}</span>
            </button>

            {/* btn-import */}
            <button
              type="button"
              className={`flex items-center justify-center px-4 py-2 gap-1.5 h-[33px] rounded-[6px] border text-[13px] font-normal transition-colors cursor-pointer ${
                isLight ? "bg-white border-[#E4E4E7] text-[#222222] hover:bg-slate-100" : "bg-[#383838] border-[#444444] text-[#F8FAFC] hover:bg-[#444444]"
              }`}
            >
              <Download size={14} />
              <span>{isThai ? "นำเข้า" : "Import"}</span>
            </button>

            {/* btn-add (Theme-adaptive Black/White Primary CTA) */}
            {canEdit && (
              <button
                type="button"
                onClick={openAddModal}
                className={`flex items-center justify-center px-4 py-2 gap-1.5 h-[33px] rounded-[6px] text-[13px] font-semibold transition-colors cursor-pointer shadow-xs ${
                  isLight
                    ? "bg-[#222222] hover:bg-black text-white"
                    : "bg-white hover:bg-[#F4F4F5] text-[#222222]"
                }`}
              >
                <Plus size={14} className={isLight ? "text-white" : "text-[#222222]"} />
                <span>{isThai ? "เพิ่มสินค้า" : "Add Product"}</span>
              </button>
            )}
          </div>
        </div>

        {/* inventory-table-container */}
        <div
          className={`w-full rounded-[12px] border p-4 shadow-sm overflow-hidden flex flex-col transition-colors ${
            isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
          }`}
        >
          {loading && !data ? (
            <div role="status" aria-label={isThai ? "กำลังโหลดข้อมูลสินค้า" : "Loading inventory"} className="w-full overflow-x-auto">
              <table className="w-full text-left text-[13px]" aria-hidden="true">
                <thead>
                  <tr className={`h-[36px] text-xs ${isLight ? "bg-[#F4F4F5]" : "bg-[#2C2C2C]"}`}>
                    {["w-[190px]", "", "w-[130px]", "w-[120px]", "w-[120px]", "w-[90px]", "w-[120px]", "w-[100px]", "w-[48px]"].map((width, index) => (
                      <th key={index} className={`px-3 py-2 ${width}`}><SkeletonBox className={`h-3 ${index === 1 ? "w-3/4" : "w-2/3"}`} /></th>
                    ))}
                  </tr>
                </thead>
                <tbody className={`divide-y ${isLight ? "divide-[#E4E4E7]" : "divide-[#444444]"}`}>
                  {Array.from({ length: 6 }).map((_, row) => (
                    <tr key={row} className="h-[56px]">
                      <td className="px-3 py-3"><SkeletonBox className="h-3.5 w-3/4" /></td>
                      <td className="px-3 py-3"><SkeletonBox className="h-3.5 w-20" /></td>
                      <td className="px-3 py-3"><SkeletonBox className="h-3.5 w-20" /></td>
                      <td className="px-3 py-3"><SkeletonBox className="h-3.5 w-20" /></td>
                      <td className="px-3 py-3"><SkeletonBox className="ml-auto h-3.5 w-12" /></td>
                      <td className="px-3 py-3"><SkeletonBox className="h-3.5 w-14" /></td>
                      <td className="px-3 py-3"><SkeletonBox className="ml-auto h-3.5 w-12" /></td>
                      <td className="px-3 py-3"><SkeletonBox className="h-5 w-14 rounded-full" /></td>
                      <td className="px-3 py-3"><SkeletonBox className="ml-auto size-8 rounded-[6px]" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
                  <tr className={`h-[36px] rounded-[6px] text-xs font-semibold ${isLight ? "bg-[#F4F4F5] text-[#666666]" : "bg-[#2C2C2C] text-[#A1A1AA]"}`}>
                    <th className="py-2 px-3 w-[190px] rounded-l-[6px]">{isThai ? "รหัส SKU" : "SKU"}</th>
                    <th className="py-2 px-3 min-w-[220px]">{isThai ? "ชื่อสินค้า" : "Product Name"}</th>
                    <th className="py-2 px-3 w-[130px]">{isThai ? "หมวดหมู่" : "Category"}</th>
                    <th className="py-2 px-3 w-[120px]">{isThai ? "ยี่ห้อ" : "Brand"}</th>
                    <th className="py-2 px-3 text-right w-[120px]">{isThai ? "คงเหลือ" : "On Hand"}</th>
                    <th className="py-2 px-3 w-[90px]">{isThai ? "หน่วย" : "Unit"}</th>
                    <th className="py-2 px-3 text-right w-[120px]">{isThai ? "จุดสั่งซื้อ" : "Reorder Point"}</th>
                    <th className="py-2 px-3 w-[100px]">{isThai ? "สถานะ" : "Status"}</th>
                    <th className="py-2 px-3 w-[48px] rounded-r-[6px]" aria-label={isThai ? "การทำงาน" : "Actions"} />
                  </tr>
                </thead>

                {/* table rows */}
                <tbody className={`divide-y ${isLight ? "divide-[#E4E4E7]" : "divide-[#444444]"}`}>
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
                        <td className={`py-3 px-3 font-mono text-[12px] font-medium ${isLight ? "text-slate-900" : "text-[#F8FAFC]"}`}>
                          <span className="block truncate" title={item.sku}>{item.sku}</span>
                        </td>

                        {/* Name */}
                        <td className="py-3 px-3 font-medium">
                          <span className={`line-clamp-1 ${isLight ? "text-slate-900" : "text-[#F8FAFC]"}`}>
                            {item.name}
                          </span>
                        </td>

                        {/* Category */}
                        <td className="py-3 px-3 text-[#A1A1AA] text-xs">
                          {item.category}
                        </td>

                        {/* Brand */}
                        <td className="py-3 px-3 text-[#A1A1AA] text-xs">{item.brand}</td>

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
                          {item.minStock == null ? "-" : item.minStock.toLocaleString()}
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
                            aria-label={isThai ? `ดูรายละเอียด ${item.name}` : `View ${item.name} details`}
                            title={isThai ? "ดูรายละเอียดสินค้า" : "View product details"}
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
            totalItems={filteredItems.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            isThai={isThai}
            className="w-full px-1"
          />
        )}
      </div>

      {/* Product detail modal */}
      {activeDetailItem && (
        <div
          className="fixed inset-0 z-[90] flex items-stretch justify-end bg-black/70 backdrop-blur-xs"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setSelectedItem(null);
          }}
        >
        <aside
          role="dialog"
          aria-modal="true"
          aria-labelledby="product-detail-title"
          className={`h-full w-full max-w-[380px] shrink-0 rounded-l-[8px] border-y border-l border-r-0 p-6 flex flex-col gap-5 overflow-y-auto shadow-2xl transition-colors ${
            isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
          }`}
        >
          {/* drawer-header */}
          <div className="w-full flex items-center justify-between">
            <h3 id="product-detail-title" className={`font-bold text-[16px] leading-[21px] ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}>
              {isThai ? "รายละเอียดสินค้า" : "Item Details"}
            </h3>
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer p-0.5"
            >
              <X size={16} />
            </button>
          </div>

          {/* Product Image Showcase */}
          <div className="w-full h-[180px] rounded-[8px] border border-[#444444]/40 bg-[#2C2C2C] flex flex-col items-center justify-center text-[#A1A1AA] overflow-hidden relative shadow-inner">
            <Package size={48} className="opacity-40" />
            <span className="text-[11.5px] mt-2 font-mono text-[#A1A1AA]/80">
              {activeDetailItem.sku}
            </span>
          </div>

          {/* item-info */}
          <div className="w-full flex flex-col gap-2">
            <span className="font-mono font-semibold text-[12px] text-[#0D99FF]">
              {activeDetailItem.sku}
            </span>
            <h4 className={`font-bold text-[18px] leading-[23px] ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}>
              {activeDetailItem.name}
            </h4>
            <p className="text-[13px] leading-[17px] text-[#A1A1AA]">
              {activeDetailItem.description}
            </p>
          </div>

          {/* Line divider */}
          <div className={`w-full border-b ${isLight ? "border-[#E4E4E7]" : "border-[#444444]"}`} />

          {/* specs */}
          <div className="w-full flex flex-col gap-2.5 text-[13px]">
            <div className="flex items-center justify-between">
              <span className="text-[#A1A1AA]">{isThai ? "หมวดหมู่หลัก" : "Category"}</span>
              <span className={`font-medium ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}>
                {activeDetailItem.category}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#A1A1AA]">{isThai ? "ยี่ห้อ" : "Brand"}</span>
              <span className={`font-medium ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}>
                {activeDetailItem.brand}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#A1A1AA]">{isThai ? "คลังที่มีสินค้า" : "Warehouse"}</span>
              <span className={`font-medium ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}>
                {activeDetailItem.warehouse}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#A1A1AA]">{isThai ? "หน่วยนับ" : "Unit"}</span>
              <span className={`font-medium ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}>
                {activeDetailItem.unit}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#A1A1AA]">{isThai ? "ราคาต่อหน่วย" : "Unit Price"}</span>
              <span className={`font-medium ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}>
                {activeDetailItem.price == null ? "-" : `${activeDetailItem.price.toLocaleString()} ${isThai ? "บาท" : "THB"}`}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#A1A1AA]">{isThai ? "ระดับสต็อกขั้นต่ำ" : "Safety Stock"}</span>
              <span className={`font-medium ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}>
                {activeDetailItem.minStock == null ? "-" : `${activeDetailItem.minStock} ${activeDetailItem.unit}`}
              </span>
            </div>
          </div>

          {/* history-mini */}
          <div className="w-full flex flex-col gap-3">
            <span className={`font-semibold text-[13px] ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}>
              {isThai ? "ประวัติการเปลี่ยนแปลงสต็อกล่าสุด" : "Recent Stock Activity"}
            </span>

            {/* chart-box */}
            <div className={`w-full h-[60px] rounded-[6px] p-2.5 flex items-end justify-between ${
              isLight ? "bg-[#F4F4F5]" : "bg-[#2C2C2C]"
            }`}>
              {activeDetailItem.historyBars.map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-[12px] rounded-[2px] transition-all"
                    style={{
                      height: `${Math.max(6, (bar.heightPct / 100) * 32)}px`,
                      backgroundColor: bar.color,
                    }}
                  />
                  <span className="font-mono text-[10px] text-[#A1A1AA]">
                    {bar.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* drawer-actions */}
          {canEdit && (
            <div className="w-full flex items-center gap-3 pt-2">
              {/* btn-edit */}
              <button
                type="button"
                onClick={() => openEditModal(activeDetailItem)}
                className={`flex-1 h-[41px] px-4 py-3 rounded-[6px] border flex items-center justify-center gap-1.5 text-[13px] font-medium transition-colors cursor-pointer ${
                  isLight
                    ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222] hover:bg-slate-200"
                    : "bg-[#2C2C2C] border-[#444444] text-[#F8FAFC] hover:bg-[#333333]"
                }`}
              >
                <Edit size={14} />
                <span>{isThai ? "แก้ไขข้อมูล" : "Edit"}</span>
              </button>

              {/* btn-receive */}
              <button
                type="button"
                onClick={() => openEditModal(activeDetailItem)}
                className="flex-1 h-[41px] px-4 py-3 rounded-[6px] flex items-center justify-center gap-1.5 text-[13px] font-semibold text-white bg-[#2EC4B6] hover:bg-[#25A99D] transition-colors cursor-pointer"
              >
                <Plus size={14} />
                <span>{isThai ? "ปรับปรุงยอด" : "Adjust"}</span>
              </button>
            </div>
          )}
        </aside>
        </div>
      )}

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
              isLight ? "bg-white border-[#E4E4E7]" : "bg-[#282828] border-[#444444]"
            }`}
          >
            {/* Absolute Close button at top right */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className={`absolute top-4 right-4 p-1.5 rounded-[8px] transition-colors cursor-pointer z-10 ${
                isLight ? "text-[#666666] hover:bg-[#F4F4F5] hover:text-[#222222]" : "text-[#A1A1AA] hover:bg-[#444444] hover:text-white"
              }`}
              aria-label="Close"
            >
              <X size={18} />
            </button>

            {/* Header Title (Not sharing inline space with close button) */}
            <div className="w-full pb-3 border-b border-[#444444]/30 shrink-0 pr-8">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#A1A1AA]">
                  {editingProduct ? (isThai ? "จัดการข้อมูล" : "Manage SKU") : (isThai ? "สร้างข้อมูลใหม่" : "New SKU")}
                </span>
                <h3 id="product-form-title" className={`font-bold text-[18px] leading-[24px] ${isLight ? "text-[#222222]" : "text-[#F8FAFC]"}`}>
                  {editingProduct ? (isThai ? "แก้ไขข้อมูลสินค้า" : "Edit Product") : (isThai ? "เพิ่มสินค้าใหม่" : "Add New Product")}
                </h3>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveProduct} className="flex-1 flex flex-col justify-between pt-6 text-xs min-h-0">
              <div className="space-y-6 overflow-y-auto pr-1">
                {formError && (
                  <div className="p-3.5 rounded-[8px] bg-[#E71D36]/10 border border-[#E71D36]/30 text-[#E71D36] text-[13px] font-medium">
                    {formError}
                  </div>
                )}
                {formSuccess && (
                  <div className="p-3.5 rounded-[8px] bg-[#2EC4B6]/10 border border-[#2EC4B6]/30 text-[#2EC4B6] text-[13px] font-medium">
                    {formSuccess}
                  </div>
                )}

                {/* Section 1: ข้อมูลระบุตัวตนสินค้า */}
                <div className="flex flex-col gap-3">
                  <span className={`text-[12px] font-bold uppercase tracking-wider ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                    {isThai ? "1. ข้อมูลพื้นฐานสินค้า" : "1. Basic Information"}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className={`text-[12px] font-bold ${isLight ? "text-[#444444]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "รหัสสินค้า (SKU)" : "SKU Code"} <span className="text-[#E71D36]">*</span>
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
                      <label className={`text-[12px] font-bold ${isLight ? "text-[#444444]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "ชื่อสินค้า" : "Product Name"} <span className="text-[#E71D36]">*</span>
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
                  <span className={`text-[12px] font-bold uppercase tracking-wider ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                    {isThai ? "2. การจัดหมวดหมู่และหน่วยนับ" : "2. Classification & Unit"}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className={`text-[12px] font-bold ${isLight ? "text-[#444444]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "หมวดหมู่สินค้า" : "Category"}
                      </label>
                      <CustomDropdown
                        value={formCategoryId}
                        onChange={setFormCategoryId}
                        options={[
                          { value: "", label: isThai ? "- เลือกหมวดหมู่ -" : "- Select -" },
                          ...(data?.categories || []).map((c) => ({
                            value: String(c.id),
                            label: c.name,
                          })),
                        ]}
                        searchable
                        className="w-full"
                        triggerClassName={`h-[38px] px-3.5 rounded-[8px] border text-[13px] ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#222222] border-[#444444] text-[#F4F4F5]"
                        }`}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={`text-[12px] font-bold ${isLight ? "text-[#444444]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "ยี่ห้อ / แบรนด์" : "Brand"}
                      </label>
                      <CustomDropdown
                        value={formBrandId}
                        onChange={setFormBrandId}
                        options={[
                          { value: "", label: isThai ? "- เลือกยี่ห้อ -" : "- Select -" },
                          ...(data?.brands || []).map((b) => ({
                            value: String(b.id),
                            label: b.name,
                          })),
                        ]}
                        searchable
                        className="w-full"
                        triggerClassName={`h-[38px] px-3.5 rounded-[8px] border text-[13px] ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#222222] border-[#444444] text-[#F4F4F5]"
                        }`}
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className={`text-[12px] font-bold ${isLight ? "text-[#444444]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "หน่วยนับ" : "Unit"}
                      </label>
                      <CustomDropdown
                        value={formUnitId}
                        onChange={setFormUnitId}
                        options={[
                          { value: "", label: isThai ? "- เลือกหน่วย -" : "- Select -" },
                          ...(data?.units || []).map((u) => ({
                            value: String(u.id),
                            label: u.name,
                          })),
                        ]}
                        searchable
                        className="w-full"
                        triggerClassName={`h-[38px] px-3.5 rounded-[8px] border text-[13px] ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#222222] border-[#444444] text-[#F4F4F5]"
                        }`}
                      />
                    </div>
                  </div>
                </div>

                {/* Section 3: ราคาและการควบคุมสต็อก */}
                <div className="flex flex-col gap-3 pt-2 border-t border-[#444444]/20">
                  <span className={`text-[12px] font-bold uppercase tracking-wider ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                    {isThai ? "3. ราคาและจุดสั่งซื้อ" : "3. Pricing & Reorder Point"}
                  </span>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div className="flex flex-col gap-1.5">
                      <label className={`text-[12px] font-bold ${isLight ? "text-[#444444]" : "text-[#E4E4E7]"}`}>
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
                      <label className={`text-[12px] font-bold ${isLight ? "text-[#444444]" : "text-[#E4E4E7]"}`}>
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
                      <label className={`text-[12px] font-bold ${isLight ? "text-[#444444]" : "text-[#E4E4E7]"}`}>
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
                  disabled={formSubmitting}
                  className={`h-[42px] px-6 rounded-[8px] text-[14px] font-bold cursor-pointer transition-colors shadow-sm disabled:opacity-50 ${
                    isLight
                      ? "bg-[#222222] hover:bg-black text-white"
                      : "bg-white hover:bg-[#F4F4F5] text-[#222222]"
                  }`}
                >
                  {formSubmitting
                    ? isThai ? "กำลังบันทึก..." : "Saving..."
                    : editingProduct ? (isThai ? "บันทึกการแก้ไข" : "Update") : (isThai ? "สร้างสินค้า" : "Create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
