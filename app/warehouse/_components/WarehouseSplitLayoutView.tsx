"use client";

import React, { useState } from "react";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  UploadCloud,
  Download,
  Plus,
  X,
  Edit,
  Info,
  ExternalLink,
  ArrowUpRight,
  TrendingUp,
  History,
  Layers,
  Barcode as BarcodeIcon,
  ShieldAlert,
  ArrowRightLeft,
  MapPin,
  Sparkles,
  Search,
  MoreHorizontal,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface StockLocationItem {
  bin: string;
  zone: string;
  qty: number;
  isPrimary?: boolean;
}

export interface InventoryItem {
  id: string;
  sku: string;
  barcode: string;
  nameTh: string;
  nameEn: string;
  categoryTh: string;
  categoryEn: string;
  brand: string;
  onHand: number;
  reserved: number;
  quarantine: number;
  damaged: number;
  safetyStock: number;
  reorderPoint: number;
  stockUnit: string;
  secondaryUnit?: string;
  conversionRate?: string;
  trackingMethod: "none" | "lot" | "serial";
  lotNumber?: string;
  expiryDate?: string;
  updatedAt?: string;
  location: string;
  locationDetail: string;
  locationsList: StockLocationItem[];
  priceThb: number;
  descriptionTh: string;
  descriptionEn: string;
  imageUrl: string;
  historyBars: Array<{ label: string; value: number; color: string; heightPct: number }>;
}

const INVENTORY_DATA: InventoryItem[] = [
  {
    id: "item-1",
    sku: "SKU-99420",
    barcode: "8850123994201",
    nameTh: "เครื่องปั่นไฟดีเซล 5KW",
    nameEn: "Diesel Generator 5KW",
    categoryTh: "เครื่องใช้ไฟฟ้า",
    categoryEn: "Electrical Appliances",
    brand: "PowerPro Industrial",
    onHand: 15,
    reserved: 2,
    quarantine: 0,
    damaged: 0,
    safetyStock: 5,
    reorderPoint: 7,
    stockUnit: "เครื่อง",
    secondaryUnit: "ชุด",
    conversionRate: "1 ชุด = 1 เครื่อง",
    trackingMethod: "serial",
    lotNumber: "LOT-2026-A12",
    expiryDate: "2029-12-31",
    updatedAt: "2026-03-18",
    location: "A-04-12",
    locationDetail: "โซน A / ชั้น 4 / ล็อก 12",
    locationsList: [
      { bin: "A-04-12", zone: "คลังหลัก A", qty: 10, isPrimary: true },
      { bin: "A-04-13", zone: "คลังสำรอง A2", qty: 5, isPrimary: false },
    ],
    priceThb: 38500,
    descriptionTh: "เครื่องปั่นไฟดีเซลกำลังสูงสำหรับไซต์งานและระบบไฟฟ้าสำรองอัตโนมัติ",
    descriptionEn: "Heavy-duty diesel generator for construction sites and emergency backup.",
    imageUrl:
      "https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80",
    historyBars: [
      { label: "10", value: 10, color: "#2EC4B6", heightPct: 40 },
      { label: "18", value: 18, color: "#2EC4B6", heightPct: 70 },
      { label: "20", value: 20, color: "#2EC4B6", heightPct: 80 },
      { label: "16", value: 16, color: "#2EC4B6", heightPct: 65 },
      { label: "15", value: 15, color: "#2EC4B6", heightPct: 60 },
    ],
  },
  {
    id: "item-2",
    sku: "SKU-99421",
    barcode: "8850123994218",
    nameTh: "หม้อแปลงกระแสไฟฟ้า CT 100/5A",
    nameEn: "Current Transformer CT 100/5A",
    categoryTh: "เครื่องควบคุม",
    categoryEn: "Power Control Units",
    brand: "Schneider Tech",
    onHand: 8,
    reserved: 1,
    quarantine: 1,
    damaged: 0,
    safetyStock: 10,
    reorderPoint: 12,
    stockUnit: "ชิ้น",
    secondaryUnit: "กล่อง",
    conversionRate: "1 กล่อง = 4 ชิ้น",
    trackingMethod: "lot",
    lotNumber: "LOT-CT-2026-03",
    expiryDate: "2031-05-15",
    updatedAt: "2026-03-17",
    location: "B-02-04",
    locationDetail: "โซน B / ชั้น 2 / ล็อก 04",
    locationsList: [
      { bin: "B-02-04", zone: "คลังหลัก A", qty: 7, isPrimary: true },
      { bin: "Q-01-01", zone: "โซนกักกันสินค้า", qty: 1, isPrimary: false },
    ],
    priceThb: 1250,
    descriptionTh: "ใช้สำหรับวัดและตรวจสอบกระแสไฟฟ้าที่ไหลผ่านในระบบไฟฟ้าหลักเพื่อนำไปวิเคราะห์ค่าการใช้พลังงาน",
    descriptionEn: "Precision current transformer for monitoring main power flow.",
    imageUrl:
      "https://images.unsplash.com/photo-1617788138017-80ad40651399?auto=format&fit=crop&w=600&q=80",
    historyBars: [
      { label: "10", value: 10, color: "#2EC4B6", heightPct: 35 },
      { label: "25", value: 25, color: "#2EC4B6", heightPct: 90 },
      { label: "18", value: 18, color: "#2EC4B6", heightPct: 65 },
      { label: "12", value: 12, color: "#2EC4B6", heightPct: 45 },
      { label: "8", value: 8, color: "#FF9F1C", heightPct: 30 },
    ],
  },
  {
    id: "item-3",
    sku: "SKU-99422",
    barcode: "8850123994225",
    nameTh: "สายเคเบิลหุ้มฉนวน XLPE 4 Core",
    nameEn: "Insulated Cable XLPE 4 Core",
    categoryTh: "วัสดุไฟฟ้า",
    categoryEn: "Electrical Materials",
    brand: "Thai Yazaki",
    onHand: 240,
    reserved: 40,
    quarantine: 0,
    damaged: 0,
    safetyStock: 100,
    reorderPoint: 150,
    stockUnit: "เมตร",
    secondaryUnit: "ม้วน",
    conversionRate: "1 ม้วน = 100 เมตร",
    trackingMethod: "lot",
    lotNumber: "LOT-CAB-988",
    expiryDate: "2036-01-01",
    updatedAt: "2026-03-15",
    location: "C-08-01",
    locationDetail: "โซน C / ชั้น 8 / ล็อก 01",
    locationsList: [
      { bin: "C-08-01", zone: "คลังหลัก A", qty: 200, isPrimary: true },
      { bin: "P-01-05", zone: "พื้นที่จัดเตรียมสินค้า", qty: 40, isPrimary: false },
    ],
    priceThb: 420,
    descriptionTh: "สายส่งกำลังไฟฟ้าหุ้มฉนวนชนิดทนไฟสูงสำหรับเดินท่อใต้ดินและในโรงงาน",
    descriptionEn: "High-grade fire-resistant industrial power cable.",
    imageUrl:
      "https://images.unsplash.com/photo-1558346490-a72e53ae2d4f?auto=format&fit=crop&w=600&q=80",
    historyBars: [
      { label: "180", value: 180, color: "#2EC4B6", heightPct: 55 },
      { label: "220", value: 220, color: "#2EC4B6", heightPct: 70 },
      { label: "290", value: 290, color: "#2EC4B6", heightPct: 95 },
      { label: "260", value: 260, color: "#2EC4B6", heightPct: 82 },
      { label: "240", value: 240, color: "#2EC4B6", heightPct: 75 },
    ],
  },
  {
    id: "item-4",
    sku: "SKU-99423",
    barcode: "8850123994232",
    nameTh: "สปอตไลท์ LED 200W IP66",
    nameEn: "Industrial Floodlight LED 200W",
    categoryTh: "โคมไฟอุตสาหกรรม",
    categoryEn: "Industrial Lighting",
    brand: "Philips Lighting",
    onHand: 45,
    reserved: 5,
    quarantine: 0,
    damaged: 0,
    safetyStock: 20,
    reorderPoint: 25,
    stockUnit: "ชุด",
    secondaryUnit: "กล่อง",
    conversionRate: "1 กล่อง = 5 ชุด",
    trackingMethod: "serial",
    lotNumber: "LOT-LED-2026-Q1",
    expiryDate: "2030-08-20",
    updatedAt: "2026-03-12",
    location: "A-12-05",
    locationDetail: "โซน A / ชั้น 12 / ล็อก 05",
    locationsList: [
      { bin: "A-12-05", zone: "คลังหลัก A", qty: 35, isPrimary: true },
      { bin: "P-02-10", zone: "พื้นที่จัดเตรียมสินค้า", qty: 10, isPrimary: false },
    ],
    priceThb: 2890,
    descriptionTh: "โคมไฟส่องสว่างกำลังสูงกันน้ำกันฝุ่นระดับ IP66 สำหรับคลังสินค้าและลานจอดรถ",
    descriptionEn: "High-power waterproof outdoor LED floodlight with IP66 protection.",
    imageUrl:
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?auto=format&fit=crop&w=600&q=80",
    historyBars: [
      { label: "30", value: 30, color: "#2EC4B6", heightPct: 50 },
      { label: "40", value: 40, color: "#2EC4B6", heightPct: 65 },
      { label: "50", value: 50, color: "#2EC4B6", heightPct: 85 },
      { label: "48", value: 48, color: "#2EC4B6", heightPct: 80 },
      { label: "45", value: 45, color: "#2EC4B6", heightPct: 75 },
    ],
  },
  {
    id: "item-5",
    sku: "SKU-99424",
    barcode: "8850123994249",
    nameTh: "ชุดเบรกเกอร์กันดูด RCBO 2P",
    nameEn: "Circuit Breaker RCBO 2P",
    categoryTh: "เบรกเกอร์",
    categoryEn: "Circuit Breakers",
    brand: "ABB Electrics",
    onHand: 3,
    reserved: 0,
    quarantine: 0,
    damaged: 0,
    safetyStock: 15,
    reorderPoint: 20,
    stockUnit: "ตัว",
    secondaryUnit: "กล่อง",
    conversionRate: "1 กล่อง = 10 ตัว",
    trackingMethod: "none",
    lotNumber: "LOT-RCBO-044",
    expiryDate: "2032-12-31",
    updatedAt: "2026-03-10",
    location: "D-01-09",
    locationDetail: "โซน D / ชั้น 1 / ล็อก 09",
    locationsList: [
      { bin: "D-01-09", zone: "คลังหลัก A", qty: 3, isPrimary: true },
    ],
    priceThb: 850,
    descriptionTh: "อุปกรณ์ตัดวงจรอัตโนมัติ ป้องกันกระแสไฟรั่วและไฟช็อตตามมาตรฐาน IEC",
    descriptionEn: "Residual current breaker with overcurrent protection for electrical safety.",
    imageUrl:
      "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?auto=format&fit=crop&w=600&q=80",
    historyBars: [
      { label: "18", value: 18, color: "#2EC4B6", heightPct: 75 },
      { label: "14", value: 14, color: "#2EC4B6", heightPct: 60 },
      { label: "9", value: 9, color: "#FF9F1C", heightPct: 40 },
      { label: "5", value: 5, color: "#E71D36", heightPct: 25 },
      { label: "3", value: 3, color: "#E71D36", heightPct: 15 },
    ],
  },
];

export default function WarehouseSplitLayoutView() {
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";

  const [items] = useState<InventoryItem[]>(INVENTORY_DATA);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("ทั้งหมด");
  const [warehouseFilter, setWarehouseFilter] = useState("คลังหลัก A");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = items.filter((item) => {
    if (categoryFilter !== "ทั้งหมด" && item.categoryTh !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchSku = item.sku.toLowerCase().includes(q);
      const matchNameTh = item.nameTh.toLowerCase().includes(q);
      const matchNameEn = item.nameEn.toLowerCase().includes(q);
      const matchBrand = item.brand.toLowerCase().includes(q);
      const matchLocation = item.location.toLowerCase().includes(q);
      const matchBarcode = item.barcode.toLowerCase().includes(q);
      if (!matchSku && !matchNameTh && !matchNameEn && !matchBrand && !matchLocation && !matchBarcode) {
        return false;
      }
    }
    return true;
  });

  return (
    <div
      className={`w-full flex flex-col lg:flex-row items-start justify-start p-0 min-h-0 self-stretch flex-1 ${
        isLight ? "bg-[#F8FAFC] text-[#222222]" : "bg-[#2C2C2C] text-[#F8FAFC]"
      }`}
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      {/* ========================================================= */}
      {/* 📌 [LEFT PANE]: Auto layout padding: 24px sm: 32px        */}
      {/* ========================================================= */}
      <div className="flex-1 w-full min-w-0 flex flex-col items-start p-4 sm:p-6 lg:p-8 gap-6 self-stretch">
        {/* filter-bar & search */}
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          {/* search & filters: Search input, Category, Warehouse */}
          <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
            {/* Search Input */}
            <div
              className={`box-border flex flex-row items-center px-3.5 py-1.5 gap-2.5 h-[36px] rounded-[8px] border text-[13px] w-full sm:w-[280px] md:w-[340px] transition-colors ${
                isLight
                  ? "bg-white border-[#E4E4E7] text-[#222222] focus-within:border-slate-900 shadow-xs"
                  : "bg-[#383838] border-[#444444] text-[#F8FAFC] focus-within:border-white"
              }`}
            >
              <Search size={15} className="text-[#A1A1AA] shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={isThai ? "ค้นหา SKU, ชื่อสินค้า, หมวดหมู่, ที่ตั้ง..." : "Search SKU, Name, Category, Bin..."}
                className="w-full bg-transparent border-none outline-none text-[13px] placeholder:text-[#A1A1AA]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors p-0.5"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            {/* f-category */}
            <div
              className={`box-border flex flex-row items-center px-3.5 py-2 gap-2 h-[36px] rounded-[8px] border text-[13px] select-none ${
                isLight
                  ? "bg-white border-[#E4E4E7] text-[#222222]"
                  : "bg-[#383838] border-[#444444] text-[#F8FAFC]"
              }`}
            >
              <span className="whitespace-nowrap font-medium">
                {isThai ? `หมวดหมู่: ${categoryFilter}` : `Category: ${categoryFilter}`}
              </span>
              <ChevronDown size={13} className="text-[#A1A1AA] shrink-0" />
            </div>

            {/* f-warehouse */}
            <div
              className={`box-border flex flex-row items-center px-3.5 py-2 gap-2 h-[36px] rounded-[8px] border text-[13px] select-none ${
                isLight
                  ? "bg-white border-[#E4E4E7] text-[#222222]"
                  : "bg-[#383838] border-[#444444] text-[#F8FAFC]"
              }`}
            >
              <span className="whitespace-nowrap font-medium">
                {isThai ? `คลัง: ${warehouseFilter}` : `Warehouse: ${warehouseFilter}`}
              </span>
              <ChevronDown size={13} className="text-[#A1A1AA] shrink-0" />
            </div>
          </div>

          {/* actions: Export, Import, Add Product */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* btn-export */}
            <button
              type="button"
              className={`box-border flex flex-row items-center px-4 py-2 gap-1.5 h-[36px] rounded-[8px] border text-[13px] font-normal transition-colors cursor-pointer outline-none ${
                isLight
                  ? "bg-white border-[#E4E4E7] text-[#222222] hover:bg-slate-100"
                  : "bg-[#383838] border-[#444444] text-[#F8FAFC] hover:bg-[#444444]"
              }`}
            >
              <UploadCloud size={14} className={`shrink-0 ${isLight ? "text-slate-700" : "text-[#F8FAFC]"}`} />
              <span>{isThai ? "ส่งออก" : "Export"}</span>
            </button>

            {/* btn-import */}
            <button
              type="button"
              className={`box-border flex flex-row items-center px-4 py-2 gap-1.5 h-[36px] rounded-[8px] border text-[13px] font-normal transition-colors cursor-pointer outline-none ${
                isLight
                  ? "bg-white border-[#E4E4E7] text-[#222222] hover:bg-slate-100"
                  : "bg-[#383838] border-[#444444] text-[#F8FAFC] hover:bg-[#444444]"
              }`}
            >
              <Download size={14} className={`shrink-0 ${isLight ? "text-slate-700" : "text-[#F8FAFC]"}`} />
              <span>{isThai ? "นำเข้า" : "Import"}</span>
            </button>

            {/* btn-add (Theme-adaptive Black/White Primary CTA) */}
            <button
              type="button"
              className={`flex flex-row items-center px-4 py-2 gap-1.5 h-[36px] rounded-[8px] text-[13px] font-semibold transition-colors cursor-pointer outline-none shadow-xs ${
                isLight
                  ? "bg-slate-900 hover:bg-black text-white"
                  : "bg-white hover:bg-zinc-200 text-black"
              }`}
            >
              <Plus size={14} className={`shrink-0 ${isLight ? "text-white" : "text-black"}`} />
              <span>{isThai ? "เพิ่มสินค้า" : "Add Product"}</span>
            </button>
          </div>
        </div>

        {/* inventory-table: Product Master & SKU Catalog (Rounded & Bordered matching Stock Table) */}
        <div
          className={`w-full rounded-[12px] border overflow-hidden ${
            isLight ? "bg-white border-[#E4E4E7] shadow-xs" : "bg-[#383838] border-[#444444]"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse min-w-[940px]">
            <thead>
              <tr
                className={`h-[42px] border-b text-[12px] font-semibold text-white select-none ${
                  isLight
                    ? "bg-slate-900 border-slate-800"
                    : "bg-[#282828] border-[#444444]"
                }`}
              >
                <th className="py-2.5 px-4">{isThai ? "รหัสสินค้า & SKU" : "SKU & Product"}</th>
                <th className="py-2.5 px-4">{isThai ? "หมวดหมู่" : "Category"}</th>
                <th className="py-2.5 px-4 text-right">{isThai ? "คงเหลือในคลัง" : "Stock On Hand"}</th>
                <th className="py-2.5 px-4">{isThai ? "หน่วยนับ" : "Unit"}</th>
                <th className="py-2.5 px-4">{isThai ? "ที่ตั้งหลัก" : "Location"}</th>
                <th className="py-2.5 px-4">{isThai ? "วันที่ปรับปรุง" : "Updated Date"}</th>
                <th className="py-2.5 pl-2 pr-4 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isLight ? "divide-slate-200" : "divide-white/5"}`}>
              {filteredItems.map((item) => {
                const isSelected = selectedItem?.id === item.id;

                return (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`transition-colors cursor-pointer select-none ${
                      isSelected
                        ? isLight
                          ? "bg-slate-100/90"
                          : "bg-white/[0.08]"
                        : isLight
                        ? "hover:bg-slate-50"
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    {/* รหัสสินค้า & SKU */}
                    <td className="py-3.5 px-4">
                      <div className={`font-mono font-semibold text-[12.5px] ${isLight ? "text-slate-800" : "text-zinc-200"}`}>
                        {item.sku}
                      </div>
                      <div
                        className={`font-medium text-[13.5px] line-clamp-1 max-w-[280px] ${
                          isLight ? "text-slate-900" : "text-white/90"
                        }`}
                      >
                        {isThai ? item.nameTh : item.nameEn}
                      </div>
                      <div className={`text-[11px] ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                        {item.brand}
                      </div>
                    </td>

                    {/* หมวดหมู่ */}
                    <td className="py-3.5 px-4">
                      <span className={`text-[12.5px] ${isLight ? "text-slate-600" : "text-zinc-400"}`}>
                        {isThai ? item.categoryTh : item.categoryEn}
                      </span>
                    </td>

                    {/* คงเหลือในคลัง */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-mono font-bold text-[14px]">
                        <span
                          className={
                            item.onHand <= item.reorderPoint
                              ? "text-amber-500 font-semibold"
                              : isLight
                              ? "text-emerald-600 font-semibold"
                              : "text-emerald-400 font-semibold"
                          }
                        >
                          {item.onHand.toLocaleString()}
                        </span>{" "}
                        <span className={`text-[11px] font-normal ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                          {item.stockUnit}
                        </span>
                      </div>
                    </td>

                    {/* หน่วยนับ */}
                    <td className="py-3.5 px-4">
                      <div className={`text-[12px] font-medium ${isLight ? "text-slate-800" : "text-white/90"}`}>
                        {item.stockUnit}
                      </div>
                      {item.secondaryUnit && (
                        <div className={`text-[11px] ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                          {item.secondaryUnit}
                        </div>
                      )}
                    </td>

                    {/* ที่ตั้งหลัก */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[12.5px] font-mono font-medium ${
                          isLight ? "text-slate-700" : "text-zinc-300"
                        }`}
                        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                      >
                        {item.location}
                      </span>
                    </td>

                    {/* วันที่ปรับปรุง */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`text-[12px] font-mono ${
                          isLight ? "text-slate-500" : "text-zinc-400"
                        }`}
                        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                      >
                        {item.updatedAt || "-"}
                      </span>
                    </td>

                    {/* ไอคอน 3 จุด ดูรายละเอียด */}
                    <td className="py-3.5 pl-2 pr-4 text-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedItem(item);
                        }}
                        title={isThai ? "ดูรายละเอียดเพิ่มเติม" : "View Details"}
                        className={`p-1 transition-colors inline-flex items-center justify-center cursor-pointer ${
                          isLight
                            ? "text-slate-400 hover:text-slate-900"
                            : "text-zinc-500 hover:text-zinc-200"
                        }`}
                      >
                        <MoreHorizontal size={17} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>

      {/* ========================================================= */}
      {/* 📌 [DETAIL DRAWER]: Popup Overlay เด้งมาทับด้านข้าง ไม่บีบตาราง */}
      {/* width: 420px, padding: 24px, gap: 20px, bg: #383838       */}
      {/* ========================================================= */}
      <AnimatePresence>
        {selectedItem && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setSelectedItem(null)}
              className="fixed inset-0 bg-black/45 backdrop-blur-[2px] z-40"
            />

            {/* Floating Overlay Drawer Panel */}
            <motion.aside
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className={`fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[420px] h-full shadow-2xl flex flex-col p-6 gap-4 overflow-y-auto ${
                isLight
                  ? "bg-white border-l border-[#E4E4E7] text-[#222222]"
                  : "bg-[#383838] border-l border-[#444444] text-[#F8FAFC]"
              }`}
              style={{ boxSizing: "border-box" }}
            >
              {/* drawer-header: Close button only without title and border line */}
              <div className="w-full flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setSelectedItem(null)}
                  className="text-[#A1A1AA] hover:text-white transition-colors cursor-pointer outline-none p-1 rounded-md hover:bg-white/5"
                  title={isThai ? "ปิดแผงรายละเอียด" : "Close drawer"}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Rectangle Large Product Photo */}
              <div className="w-full h-[170px] rounded-[8px] overflow-hidden relative shrink-0 bg-neutral-900 border border-white/10 shadow-inner">
                <Image
                  src={selectedItem.imageUrl}
                  alt={selectedItem.nameTh}
                  fill
                  sizes="420px"
                  className="object-cover"
                  priority
                />
              </div>

              {/* item-info: SKU, Name, Description */}
              <div className="w-full flex flex-col items-start gap-1.5">
                <div className="w-full flex items-center justify-between text-[11.5px] font-mono">
                  <span className={`font-semibold ${isLight ? "text-slate-900" : "text-white"}`}>
                    {selectedItem.sku}
                  </span>
                  <span className="text-[#A1A1AA] flex items-center gap-1">
                    <BarcodeIcon size={12} />
                    {selectedItem.barcode}
                  </span>
                </div>
                <h3 className="text-[17px] font-bold leading-tight text-[#F8FAFC] break-words">
                  <span className={isLight ? "text-[#222222]" : "text-[#F8FAFC]"}>
                    {isThai ? selectedItem.nameTh : selectedItem.nameEn}
                  </span>
                </h3>
                <p className="text-[12.5px] font-normal leading-[17px] text-[#A1A1AA]">
                  {isThai ? selectedItem.descriptionTh : selectedItem.descriptionEn}
                </p>
              </div>



              {/* 📌 Storage Bins Multi-Location (DESIGN.md 5 & 19.3) */}
              <div className="w-full flex flex-col gap-2 text-[12.5px]">
                <div className="flex items-center justify-between">
                  <span className={`font-semibold ${isLight ? "text-slate-800" : "text-zinc-300"}`}>
                    {isThai ? "ตำแหน่งจัดเก็บตามพิกัด" : "Storage Locations"}
                  </span>
                  <span className={`text-[11px] font-mono ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                    {selectedItem.locationsList.length} Bins
                  </span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {/* แสดงรายการโดยนำคลังหลัก (highlight) ไว้บนสุด */}
                  {[...selectedItem.locationsList]
                    .sort((a, b) => (b.isPrimary ? 1 : 0) - (a.isPrimary ? 1 : 0))
                    .map((loc, i) => {
                      const isHighlighted = loc.isPrimary ?? (i === 0);
                      return (
                        <div
                          key={i}
                          className={`flex items-center justify-between px-3 py-1.5 rounded-lg border transition-colors ${
                            isHighlighted
                              ? isLight
                                ? "bg-teal-500/10 border-[#2EC4B6]/50 shadow-sm"
                                : "bg-[#2EC4B6]/10 border-[#2EC4B6]/40 shadow-sm"
                              : isLight
                              ? "bg-slate-50 border-slate-200"
                              : "bg-black/20 border-white/5"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`font-mono font-bold ${
                                isHighlighted
                                  ? isLight
                                    ? "text-teal-900"
                                    : "text-white"
                                  : isLight
                                  ? "text-slate-700"
                                  : "text-white/80"
                              }`}
                            >
                              {loc.bin}
                            </span>
                            <span className={`text-[11px] font-normal ${isLight ? "text-slate-500" : "text-zinc-400"}`}>{loc.zone}</span>
                          </div>
                          <span
                            className={`font-mono font-bold ${
                              isHighlighted
                                ? "text-[#2EC4B6]"
                                : isLight
                                ? "text-slate-900"
                                : "text-white"
                            }`}
                          >
                            {loc.qty} {selectedItem.stockUnit}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* specs: Lot, Unit Conversion & Valuation */}
              <div className="w-full flex flex-col items-start gap-2 text-[12.5px] pt-1">
                {/* Brand */}
                <div className="w-full flex flex-row justify-between items-start">
                  <span className={isLight ? "text-slate-500" : "text-[#A1A1AA]"}>
                    {isThai ? "แบรนด์/ผู้ผลิต" : "Brand / Maker"}
                  </span>
                  <span className={`font-medium text-right ${isLight ? "text-slate-900" : "text-zinc-100"}`}>{selectedItem.brand}</span>
                </div>

                {/* Unit Conversion */}
                {selectedItem.conversionRate && (
                  <div className="w-full flex flex-row justify-between items-start">
                    <span className={isLight ? "text-slate-500" : "text-[#A1A1AA]"}>
                      {isThai ? "อัตราแปลงหน่วยนับ" : "Unit Conversion"}
                    </span>
                    <span className={`font-medium text-right ${isLight ? "text-slate-800" : "text-zinc-300"}`}>
                      {selectedItem.conversionRate}
                    </span>
                  </div>
                )}

                {/* Unit Price & Stock Valuation */}
                <div className="w-full flex flex-row justify-between items-start">
                  <span className={isLight ? "text-slate-500" : "text-[#A1A1AA]"}>
                    {isThai ? "ราคาต้นทุนเฉลี่ย" : "Unit Cost"}
                  </span>
                  <span
                    className={`font-medium text-right font-mono ${isLight ? "text-slate-900" : "text-zinc-100"}`}
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {selectedItem.priceThb.toLocaleString()} {isThai ? "บาท" : "THB"}
                  </span>
                </div>

                <div className="w-full flex flex-row justify-between items-start">
                  <span className={isLight ? "text-slate-500" : "text-[#A1A1AA]"}>
                    {isThai ? "มูลค่าสต็อกรวม" : "Total Valuation"}
                  </span>
                  <span
                    className="font-bold text-right font-mono text-[#2EC4B6]"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {(selectedItem.onHand * selectedItem.priceThb).toLocaleString()} {isThai ? "บาท" : "THB"}
                  </span>
                </div>

                {/* Lot & Expiry */}
                {selectedItem.lotNumber && (
                  <div className="w-full flex flex-row justify-between items-start">
                    <span className={isLight ? "text-slate-500" : "text-[#A1A1AA]"}>
                      {isThai ? "ล็อตสินค้า / หมดอายุ" : "Lot / Expiry"}
                    </span>
                    <span className={`font-medium text-right font-mono ${isLight ? "text-slate-800" : "text-zinc-300"}`}>
                      {selectedItem.lotNumber} {selectedItem.expiryDate ? `· ${selectedItem.expiryDate}` : ""}
                    </span>
                  </div>
                )}
              </div>

              {/* drawer-actions: ปุ่มดูรายละเอียดเพิ่มเติม */}
              <div className="w-full flex flex-row items-center mt-auto pt-3">
                <button
                  type="button"
                  onClick={() => router.push(`/warehouse/inventory/${selectedItem.sku}`)}
                  className={`w-full h-[38px] box-border flex flex-row justify-center items-center px-4 py-2 gap-1.5 rounded-[6px] border text-[13px] font-medium transition-colors cursor-pointer outline-none ${
                    isLight
                      ? "bg-white border-[#E4E4E7] text-[#222222] hover:bg-slate-100"
                      : "bg-[#2C2C2C] border-[#444444] text-[#F8FAFC] hover:bg-[#333333] hover:border-white/20"
                  }`}
                  title={isThai ? "เปิดดูรายละเอียดสินค้าในหน้าเต็ม" : "Open product details page"}
                >
                  <ArrowUpRight size={15} className={`shrink-0 ${isLight ? "text-slate-700" : "text-zinc-300"}`} />
                  <span>{isThai ? "ดูรายละเอียดเพิ่มเติม" : "More Details"}</span>
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
