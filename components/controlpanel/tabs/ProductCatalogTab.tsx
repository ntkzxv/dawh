"use client";

import React, { useState, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { CustomDropdown } from "@/components/common";
import type {
  ProductRecord,
  ProductCategoryRecord,
  BrandRecord,
  UnitOfMeasureRecord,
  ReasonCodeRecord,
} from "../types";
import {
  Package,
  Layers,
  Tag,
  Scale,
  Barcode,
  Plus,
  Edit,
  Search,
  X,
  FileQuestion,
  Boxes,
  CheckCircle,
  Clock,
} from "lucide-react";

import type { ProductSubTabKey } from "../types";

interface ProductCatalogTabProps {
  products: ProductRecord[];
  categories: ProductCategoryRecord[];
  brands: BrandRecord[];
  uoms: UnitOfMeasureRecord[];
  reasonCodes: ReasonCodeRecord[];
  activeSubTab?: ProductSubTabKey;
  onSubTabChange?: (tab: ProductSubTabKey) => void;
  onAddProduct: (data: Partial<ProductRecord>) => void;
  onUpdateProduct: (id: string, data: Partial<ProductRecord>) => void;
  onAddCategory: (data: Partial<ProductCategoryRecord>) => void;
  onAddBrand: (data: Partial<BrandRecord>) => void;
  onAddReasonCode: (data: Partial<ReasonCodeRecord>) => void;
  isThai: boolean;
}

export default function ProductCatalogTab({
  products,
  categories,
  brands,
  uoms,
  reasonCodes,
  activeSubTab: controlledSubTab,
  onSubTabChange,
  onAddProduct,
  onUpdateProduct,
  onAddCategory,
  onAddBrand,
  onAddReasonCode,
  isThai,
}: ProductCatalogTabProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [internalSubTab, setInternalSubTab] = useState<ProductSubTabKey>("products");
  const activeSubTab = controlledSubTab ?? internalSubTab;
  const setActiveSubTab = onSubTabChange ?? setInternalSubTab;
  const [productSearch, setProductSearch] = useState("");

  // Product Modals
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductRecord | null>(null);
  const [selectedProductForUnits, setSelectedProductForUnits] = useState<ProductRecord | null>(null);
  const [productForm, setProductForm] = useState<Partial<ProductRecord>>({
    sku: "",
    nameTh: "",
    nameEn: "",
    categoryId: categories[0]?.id || "",
    brandId: brands[0]?.id || "",
    baseUnit: "PCS",
    trackingMethod: "NONE",
    pickingStrategy: "FIFO",
    weightKg: 1.0,
    dimensionsCm: { width: 10, length: 10, height: 10 },
    shelfLifeDays: 0,
    storageCondition: "Dry Ambient",
    isActive: true,
  });

  // Dropdown Options
  const categoryOptions = useMemo(() => {
    return categories.map((c) => ({
      value: c.id,
      label: c.nameEn,
      subLabel: c.code,
    }));
  }, [categories]);

  const brandOptions = useMemo(() => {
    return brands.map((b) => ({
      value: b.id,
      label: b.name,
      subLabel: b.code,
    }));
  }, [brands]);

  const uomOptions = useMemo(() => {
    return uoms.map((u) => ({
      value: u.code,
      label: `${u.code} (${u.symbol})`,
    }));
  }, [uoms]);

  const trackingMethodOptions = useMemo(() => [
    { value: "NONE" as ProductRecord["trackingMethod"], label: "NONE" },
    { value: "LOT" as ProductRecord["trackingMethod"], label: "LOT" },
    { value: "SERIAL" as ProductRecord["trackingMethod"], label: "SERIAL" },
  ], []);

  const pickingStrategyOptions = useMemo(() => [
    { value: "FIFO" as ProductRecord["pickingStrategy"], label: "FIFO" },
    { value: "FEFO" as ProductRecord["pickingStrategy"], label: "FEFO" },
  ], []);

  const filteredProducts = products.filter((p) => {
    const q = productSearch.toLowerCase().trim();
    return !q || p.sku.toLowerCase().includes(q) || p.nameTh.toLowerCase().includes(q) || p.nameEn.toLowerCase().includes(q);
  });

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = categories.find((c) => c.id === productForm.categoryId);
    const brand = brands.find((b) => b.id === productForm.brandId);

    const payload = {
      ...productForm,
      categoryName: cat?.nameEn || "",
      brandName: brand?.name || "",
      units: editingProduct ? editingProduct.units : [{ id: `pu-${Date.now()}`, unitCode: "BOX", unitName: "Box", multiplier: 1 }],
      barcodes: editingProduct ? editingProduct.barcodes : [{ id: `bc-${Date.now()}`, barcode: `8859012300${Math.floor(Math.random()*900)+100}`, unitCode: "PCS", isPrimary: true }],
    };

    if (editingProduct) {
      onUpdateProduct(editingProduct.id, payload);
      setEditingProduct(null);
    } else {
      onAddProduct(payload);
      setIsAddProductOpen(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Banner Notice */}
      <div className="flex items-start sm:items-center justify-between py-2 px-1">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              isLight ? "bg-zinc-100 text-zinc-800" : "bg-[#2C2C2C] text-white"
            }`}
          >
            <Package size={18} />
          </div>
          <div>
            <h2 className="font-bold text-[16px] leading-tight">
              {isThai ? "การจัดการข้อมูลสินค้าและ Master Data" : "Product Catalog & Master Data Governance"}
            </h2>
            <p className={`text-[12px] mt-0.5 ${isLight ? "text-zinc-500" : "text-[#E4E4E7]"}`}>
              {isThai
                ? "สินค้า SKU, หมวดหมู่ ลำดับชั้น, แบรนด์, หน่วยนับ, บาร์โค้ด และรหัสเหตุผลปรับปรุงสต็อก"
                : "SKU catalog, packaging hierarchies, barcodes, brand directory & operational reason codes"}
            </p>
          </div>
        </div>

        {activeSubTab === "products" && (
          <button
            type="button"
            onClick={() => {
              setProductForm({
                sku: `SKU-${Date.now().toString().slice(-4)}`,
                nameTh: "",
                nameEn: "",
                categoryId: categories[0]?.id || "",
                brandId: brands[0]?.id || "",
                baseUnit: "PCS",
                trackingMethod: "NONE",
                pickingStrategy: "FIFO",
                weightKg: 1.0,
                dimensionsCm: { width: 10, length: 10, height: 10 },
                shelfLifeDays: 0,
                storageCondition: "Dry Ambient",
                isActive: true,
              });
              setEditingProduct(null);
              setIsAddProductOpen(true);
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
              isLight ? "bg-[#222222] hover:bg-black text-white" : "bg-[#2C2C2C] hover:bg-[#333333] text-white border border-[#444444]"
            }`}
          >
            <Plus size={14} />
            <span>{isThai ? "เพิ่มสินค้าใหม่" : "Add Product"}</span>
          </button>
        )}
      </div>


      {/* 1. Products Sub-tab */}
      {activeSubTab === "products" && (
        <div className="flex flex-col gap-4">
          <div
            className={`p-3 rounded-xl border flex items-center justify-between gap-3 text-xs ${
              isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
            }`}
          >
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40" />
              <input
                type="text"
                placeholder={isThai ? "ค้นหาด้วย SKU หรือชื่อสินค้า..." : "Search SKU or name..."}
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className={`w-full pl-8 pr-3 py-1.5 rounded-lg border text-xs outline-none ${
                  isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#2C2C2C] border-[#444444] text-white"
                }`}
              />
            </div>
            <span className="opacity-60">{filteredProducts.length} {isThai ? "รายการสินค้า" : "products found"}</span>
          </div>

          <div
            className={`rounded-xl border overflow-hidden ${
              isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
            }`}
          >
            <div className="overflow-x-auto [scrollbar-width:thin]">
              <table className="w-full text-xs text-left">
                <thead
                  className={`text-[11px] font-bold uppercase ${
                    isLight ? "bg-[#F4F4F5] text-zinc-600" : "bg-[#333333] text-zinc-300"
                  }`}
                >
                  <tr>
                    <th className="p-3">SKU</th>
                    <th className="p-3">{isThai ? "ชื่อสินค้า" : "Product Name"}</th>
                    <th className="p-3">{isThai ? "หมวดหมู่และแบรนด์" : "Category & Brand"}</th>
                    <th className="p-3">{isThai ? "การติดตาม" : "Tracking"}</th>
                    <th className="p-3">{isThai ? "กลยุทธ์หยิบ" : "Picking"}</th>
                    <th className="p-3">{isThai ? "หน่วยและบาร์โค้ด" : "Packaging & Barcode"}</th>
                    <th className="p-3">{isThai ? "สถานะ" : "Status"}</th>
                    <th className="p-3 text-right">{isThai ? "จัดการ" : "Action"}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#444444]/30">
                  {filteredProducts.map((p) => (
                    <tr
                      key={p.id}
                      className={`transition-colors ${
                        isLight ? "hover:bg-zinc-50" : "hover:bg-white/[0.03]"
                      }`}
                    >
                      <td className="p-3 font-mono font-bold text-[#6366F1]">{p.sku}</td>
                      <td className="p-3">
                        <div className="font-semibold">{isThai ? p.nameTh : p.nameEn}</div>
                        <div className="text-[11px] opacity-60">{isThai ? p.nameEn : p.nameTh}</div>
                      </td>
                      <td className="p-3">
                        <div className="font-medium">{p.categoryName}</div>
                        <div className="text-[11px] opacity-60">{p.brandName}</div>
                      </td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-zinc-500/15">
                          {p.trackingMethod}
                        </span>
                      </td>
                      <td className="p-3 font-bold font-mono text-[11px]">{p.pickingStrategy}</td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => setSelectedProductForUnits(p)}
                          className="flex items-center gap-1 font-semibold text-[11px] text-[#6366F1] hover:underline"
                        >
                          <Barcode size={13} />
                          <span>{p.units.length} units, {p.barcodes.length} codes</span>
                        </button>
                      </td>
                      <td className="p-3">
                        <button
                          type="button"
                          onClick={() => onUpdateProduct(p.id, { isActive: !p.isActive })}
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.isActive ? "bg-[#2EC4B6]/20 text-[#2EC4B6]" : "bg-zinc-500/20 text-zinc-400"
                          }`}
                        >
                          {p.isActive ? (isThai ? "เปิดใช้งาน" : "ACTIVE") : (isThai ? "ปิดการขาย" : "INACTIVE")}
                        </button>
                      </td>
                      <td className="p-3 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingProduct(p);
                            setProductForm(p);
                            setIsAddProductOpen(true);
                          }}
                          className={`p-1.5 rounded ${
                            isLight ? "hover:bg-zinc-100 text-zinc-700" : "hover:bg-white/10 text-zinc-300"
                          }`}
                        >
                          <Edit size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. Categories Sub-tab */}
      {activeSubTab === "categories" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {categories.map((c) => (
            <div
              key={c.id}
              className={`p-4 rounded-xl border flex items-center justify-between ${
                isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
              }`}
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold opacity-60">{c.code}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-500/10 font-bold">
                    Level {c.depth}
                  </span>
                </div>
                <h4 className="font-bold text-sm mt-1">{isThai ? c.nameTh : c.nameEn}</h4>
                <p className="text-xs opacity-60">{isThai ? c.nameEn : c.nameTh}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 3. Brands & UOM Sub-tab */}
      {activeSubTab === "brands_uoms" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Brands */}
          <div
            className={`p-5 rounded-2xl border ${
              isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
            }`}
          >
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Tag size={16} />
              <span>{isThai ? "รายชื่อแบรนด์ที่ลงทะเบียน" : "Registered Brands"} ({brands.length})</span>
            </h3>
            <div className="divide-y divide-[#444444]/30 text-xs">
              {brands.map((b) => (
                <div key={b.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold">{b.name}</span>
                    <span className="font-mono text-[11px] opacity-60 ml-2">({b.code})</span>
                  </div>
                  <span className="opacity-70 text-[11px]">{b.country}</span>
                </div>
              ))}
            </div>
          </div>

          {/* UOMs */}
          <div
            className={`p-5 rounded-2xl border ${
              isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
            }`}
          >
            <h3 className="font-bold text-sm mb-3 flex items-center gap-2">
              <Scale size={16} />
              <span>{isThai ? "หน่วยนับสินค้ามาตรฐาน (UOM)" : "Units of Measure"} ({uoms.length})</span>
            </h3>
            <div className="divide-y divide-[#444444]/30 text-xs">
              {uoms.map((u) => (
                <div key={u.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-bold">{isThai ? u.nameTh : u.nameEn}</span>
                    <span className="font-mono text-[11px] opacity-60 ml-2">({u.code})</span>
                  </div>
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-zinc-500/15 font-bold">
                    {u.symbol}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 4. Reason Codes Sub-tab */}
      {activeSubTab === "reasons" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reasonCodes.map((rc) => (
            <div
              key={rc.id}
              className={`p-4 rounded-xl border flex flex-col justify-between ${
                isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-bold text-xs opacity-60">{rc.code}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-zinc-500/20">
                    {rc.category}
                  </span>
                </div>
                <h4 className="font-bold text-sm mt-2">{isThai ? rc.nameTh : rc.nameEn}</h4>
                <p className="text-xs opacity-70 mt-1">{rc.description}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Secondary Units & Barcodes Breakdown */}
      {selectedProductForUnits && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-[500px] rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
              isLight ? "bg-white border-zinc-300 text-zinc-900" : "bg-[#282828] border-[#444444] text-white"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#444444]/40">
              <div>
                <h4 className="font-bold text-base">{isThai ? "หน่วยรองและบาร์โค้ดสินค้า" : "Secondary Units & Barcodes"}</h4>
                <p className="text-xs opacity-60">{selectedProductForUnits.sku}</p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForUnits(null)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-col gap-3 text-xs">
              <h5 className="font-bold">{isThai ? "หน่วยบรรจุภัณฑ์รอง (Conversion Units):" : "Packaging Multipliers:"}</h5>
              <div className="divide-y divide-[#444444]/30 border rounded-xl overflow-hidden">
                {selectedProductForUnits.units.map((u) => (
                  <div key={u.id} className="p-3 flex items-center justify-between">
                    <div>
                      <span className="font-bold">{u.unitName}</span>
                      <span className="font-mono opacity-60 ml-2">({u.unitCode})</span>
                    </div>
                    <span className="font-mono font-semibold">1 {u.unitCode} = {u.multiplier} {selectedProductForUnits.baseUnit}</span>
                  </div>
                ))}
              </div>

              <h5 className="font-bold mt-2">{isThai ? "รายการบาร์โค้ด (Barcodes):" : "Registered Barcodes:"}</h5>
              <div className="divide-y divide-[#444444]/30 border rounded-xl overflow-hidden">
                {selectedProductForUnits.barcodes.map((bc) => (
                  <div key={bc.id} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Barcode size={16} />
                      <span className="font-mono font-bold">{bc.barcode}</span>
                      {bc.isPrimary && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#6366F1]/20 text-[#6366F1] font-bold">
                          PRIMARY
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs opacity-70">{bc.unitCode}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#444444]/40">
              <button
                type="button"
                onClick={() => setSelectedProductForUnits(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-800 text-white hover:bg-zinc-700"
              >
                {isThai ? "ปิด" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add/Edit Product */}
      {isAddProductOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
          <div
            className={`w-full max-w-[560px] max-h-[90vh] overflow-y-auto rounded-2xl border p-6 flex flex-col gap-4 shadow-2xl ${
              isLight ? "bg-white border-zinc-300 text-zinc-900" : "bg-[#282828] border-[#444444] text-white"
            }`}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#444444]/40">
              <h4 className="font-bold text-base">
                {editingProduct ? (isThai ? "แก้ไขข้อมูลสินค้า" : "Edit Product") : (isThai ? "ลงทะเบียนสินค้าใหม่" : "Register Product")}
              </h4>
              <button
                type="button"
                onClick={() => setIsAddProductOpen(false)}
                className="p-1 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleProductSubmit} className="flex flex-col gap-3 text-xs">
              <div className="flex flex-col gap-1">
                <label className="font-semibold opacity-80">SKU</label>
                <input
                  type="text"
                  required
                  value={productForm.sku || ""}
                  onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                  className={`w-full px-3 py-2 rounded-lg border text-xs outline-none font-mono ${
                    isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                  }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold opacity-80">{isThai ? "ชื่อภาษาไทย" : "Name (Thai)"}</label>
                  <input
                    type="text"
                    required
                    value={productForm.nameTh || ""}
                    onChange={(e) => setProductForm({ ...productForm, nameTh: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                      isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                    }`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="font-semibold opacity-80">{isThai ? "ชื่อภาษาอังกฤษ" : "Name (English)"}</label>
                  <input
                    type="text"
                    required
                    value={productForm.nameEn || ""}
                    onChange={(e) => setProductForm({ ...productForm, nameEn: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg border text-xs outline-none ${
                      isLight ? "bg-zinc-100 border-zinc-300" : "bg-[#333333] border-[#444444] text-white"
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold opacity-80">{isThai ? "หมวดหมู่สินค้า" : "Category"}</label>
                  <CustomDropdown
                    value={productForm.categoryId || categories[0]?.id || ""}
                    onChange={(val) => setProductForm({ ...productForm, categoryId: val })}
                    options={categoryOptions}
                    searchable={categories.length > 5}
                    searchPlaceholder={isThai ? "ค้นหาหมวดหมู่..." : "Search category..."}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold opacity-80">{isThai ? "แบรนด์ผู้ผลิต" : "Brand"}</label>
                  <CustomDropdown
                    value={productForm.brandId || brands[0]?.id || ""}
                    onChange={(val) => setProductForm({ ...productForm, brandId: val })}
                    options={brandOptions}
                    searchable={brands.length > 5}
                    searchPlaceholder={isThai ? "ค้นหาแบรนด์..." : "Search brand..."}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="font-semibold opacity-80">{isThai ? "หน่วยนับหลัก" : "Base Unit"}</label>
                  <CustomDropdown
                    value={productForm.baseUnit || uoms[0]?.code || "PCS"}
                    onChange={(val) => setProductForm({ ...productForm, baseUnit: val })}
                    options={uomOptions}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold opacity-80">{isThai ? "วิธีติดตามสินค้า" : "Tracking"}</label>
                  <CustomDropdown
                    value={productForm.trackingMethod || "NONE"}
                    onChange={(val) => setProductForm({ ...productForm, trackingMethod: val as ProductRecord["trackingMethod"] })}
                    options={trackingMethodOptions}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="font-semibold opacity-80">{isThai ? "กลยุทธ์การหยิบ" : "Picking"}</label>
                  <CustomDropdown
                    value={productForm.pickingStrategy || "FIFO"}
                    onChange={(val) => setProductForm({ ...productForm, pickingStrategy: val as ProductRecord["pickingStrategy"] })}
                    options={pickingStrategyOptions}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-3 border-t border-[#444444]/40">
                <button
                  type="button"
                  onClick={() => setIsAddProductOpen(false)}
                  className="px-4 py-2 rounded-lg border border-zinc-500/30 hover:bg-white/5 font-medium"
                >
                  {isThai ? "ยกเลิก" : "Cancel"}
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-lg font-bold transition-all shadow-sm ${
                    isLight ? "bg-zinc-900 hover:bg-black text-white" : "bg-white hover:bg-zinc-200 text-zinc-900"
                  }`}
                >
                  {isThai ? "บันทึกสินค้า" : "Save Product"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
