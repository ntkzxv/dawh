"use client";

import React, { useState, useEffect } from "react";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import { Pagination, CustomDropdown } from "@/components/common";
import {
  Package,
  Layers,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  TrendingDown,
  Building2,
  RefreshCw,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  X,
} from "lucide-react";

interface StockBalanceItem {
  id: string;
  sku: string;
  nameTh: string;
  nameEn: string;
  category: string;
  onHand: number;
  safetyStock: number;
  incoming: number; // กำลังเติมสต็อก
  shortage: number; // สินค้าขาดสต็อก
  costPrice: number; // ราคาต้นทุน
  sellingPrice: number; // ราคาขาย
  unit: string;
  status: "in_stock" | "low_stock" | "out_of_stock" | "replenishing";
  location: string;
  warehouse: string;
}

const STOCK_BALANCES: StockBalanceItem[] = [
  {
    id: "stk-1",
    sku: "SKU-99420",
    nameTh: "เครื่องปั่นไฟดีเซล 5KW",
    nameEn: "Diesel Generator 5KW",
    category: "เครื่องใช้ไฟฟ้า",
    onHand: 15,
    safetyStock: 5,
    incoming: 10,
    shortage: 0,
    costPrice: 28500,
    sellingPrice: 38500,
    unit: "เครื่อง",
    status: "in_stock",
    location: "A-04-12",
    warehouse: "คลังสินค้ากลาง สำนักงานใหญ่",
  },
  {
    id: "stk-2",
    sku: "SKU-99421",
    nameTh: "หม้อแปลงกระแสไฟฟ้า CT 100/5A",
    nameEn: "Current Transformer CT 100/5A",
    category: "เครื่องควบคุม",
    onHand: 8,
    safetyStock: 15,
    incoming: 20,
    shortage: 7,
    costPrice: 1800,
    sellingPrice: 2450,
    unit: "ชิ้น",
    status: "replenishing",
    location: "B-02-04",
    warehouse: "คลังสินค้าสาขา บางนา",
  },
  {
    id: "stk-3",
    sku: "SKU-99422",
    nameTh: "สายเคเบิลหุ้มฉนวน XLPE 4 Core",
    nameEn: "Insulated Cable XLPE 4 Core",
    category: "วัสดุไฟฟ้า",
    onHand: 240,
    safetyStock: 100,
    incoming: 0,
    shortage: 0,
    costPrice: 310,
    sellingPrice: 420,
    unit: "เมตร",
    status: "in_stock",
    location: "C-08-01",
    warehouse: "คลังสินค้ากลาง สำนักงานใหญ่",
  },
  {
    id: "stk-4",
    sku: "SKU-99423",
    nameTh: "สปอตไลท์ LED 200W IP66",
    nameEn: "Industrial Floodlight LED 200W",
    category: "โคมไฟอุตสาหกรรม",
    onHand: 45,
    safetyStock: 50,
    incoming: 30,
    shortage: 5,
    costPrice: 1200,
    sellingPrice: 1650,
    unit: "ชุด",
    status: "replenishing",
    location: "A-12-05",
    warehouse: "คลังสินค้าสาขา ชลบุรี",
  },
  {
    id: "stk-5",
    sku: "SKU-99424",
    nameTh: "ชุดเบรกเกอร์กันดูด RCBO 2P",
    nameEn: "Circuit Breaker RCBO 2P",
    category: "เบรกเกอร์",
    onHand: 0,
    safetyStock: 20,
    incoming: 50,
    shortage: 20,
    costPrice: 620,
    sellingPrice: 890,
    unit: "ตัว",
    status: "out_of_stock",
    location: "D-01-09",
    warehouse: "คลังสินค้ากลาง สำนักงานใหญ่",
  },
  {
    id: "stk-6",
    sku: "SKU-99425",
    nameTh: "ท่อร้อยสายไฟ EMT 1/2 นิ้ว",
    nameEn: "EMT Conduit Pipe 1/2 Inch",
    category: "วัสดุไฟฟ้า",
    onHand: 350,
    safetyStock: 100,
    incoming: 0,
    shortage: 0,
    costPrice: 110,
    sellingPrice: 165,
    unit: "เส้น",
    status: "in_stock",
    location: "C-03-02",
    warehouse: "คลังสินค้ากลาง สำนักงานใหญ่",
  },
  {
    id: "stk-7",
    sku: "SKU-99426",
    nameTh: "ตู้ควบคุมไฟฟ้า MDB 800A",
    nameEn: "Main Distribution Board MDB 800A",
    category: "เครื่องควบคุม",
    onHand: 2,
    safetyStock: 3,
    incoming: 4,
    shortage: 1,
    costPrice: 125000,
    sellingPrice: 165000,
    unit: "ตู้",
    status: "replenishing",
    location: "A-01-01",
    warehouse: "คลังสินค้ากลาง สำนักงานใหญ่",
  },
  {
    id: "stk-8",
    sku: "SKU-99427",
    nameTh: "มอเตอร์เหนี่ยวนำ 3 เฟส 10HP",
    nameEn: "3-Phase Induction Motor 10HP",
    category: "มอเตอร์และปั๊ม",
    onHand: 12,
    safetyStock: 5,
    incoming: 0,
    shortage: 0,
    costPrice: 18500,
    sellingPrice: 24500,
    unit: "ตัว",
    status: "in_stock",
    location: "B-05-11",
    warehouse: "คลังสินค้าสาขา บางนา",
  },
  {
    id: "stk-9",
    sku: "SKU-99428",
    nameTh: "อินเวอร์เตอร์ควบคุมรอบ 7.5KW",
    nameEn: "VFD Frequency Inverter 7.5KW",
    category: "เครื่องควบคุม",
    onHand: 0,
    safetyStock: 8,
    incoming: 15,
    shortage: 8,
    costPrice: 14200,
    sellingPrice: 19800,
    unit: "เครื่อง",
    status: "out_of_stock",
    location: "B-03-08",
    warehouse: "คลังสินค้าสาขา บางนา",
  },
  {
    id: "stk-10",
    sku: "SKU-99429",
    nameTh: "แมกเนติกคอนแทกเตอร์ 32A",
    nameEn: "Magnetic Contactor 32A 220V",
    category: "เบรกเกอร์",
    onHand: 85,
    safetyStock: 30,
    incoming: 0,
    shortage: 0,
    costPrice: 480,
    sellingPrice: 720,
    unit: "ตัว",
    status: "in_stock",
    location: "D-02-14",
    warehouse: "คลังสินค้ากลาง สำนักงานใหญ่",
  },
  {
    id: "stk-11",
    sku: "SKU-99430",
    nameTh: "โคมไฟถนนโซลาร์เซลล์ 300W",
    nameEn: "Solar Street Light 300W IP67",
    category: "โคมไฟอุตสาหกรรม",
    onHand: 32,
    safetyStock: 20,
    incoming: 40,
    shortage: 0,
    costPrice: 2100,
    sellingPrice: 3200,
    unit: "ชุด",
    status: "replenishing",
    location: "A-11-04",
    warehouse: "คลังสินค้าสาขา ชลบุรี",
  },
  {
    id: "stk-12",
    sku: "SKU-99431",
    nameTh: "รีเลย์ตรวจจับกระแสไฟรั่ว ELCB",
    nameEn: "Earth Leakage Relay Unit",
    category: "เบรกเกอร์",
    onHand: 19,
    safetyStock: 10,
    incoming: 0,
    shortage: 0,
    costPrice: 1450,
    sellingPrice: 2100,
    unit: "ตัว",
    status: "in_stock",
    location: "D-03-02",
    warehouse: "คลังสินค้ากลาง สำนักงานใหญ่",
  },
  {
    id: "stk-13",
    sku: "SKU-99432",
    nameTh: "สายดินทองแดงเปลือย 50 ตร.มม.",
    nameEn: "Bare Copper Ground Wire 50 sq.mm.",
    category: "วัสดุไฟฟ้า",
    onHand: 180,
    safetyStock: 50,
    incoming: 0,
    shortage: 0,
    costPrice: 240,
    sellingPrice: 350,
    unit: "เมตร",
    status: "in_stock",
    location: "C-09-03",
    warehouse: "คลังสินค้ากลาง สำนักงานใหญ่",
  },
  {
    id: "stk-14",
    sku: "SKU-99433",
    nameTh: "เครื่องวัดพลังงานไฟฟ้าดิจิทัล",
    nameEn: "Digital Multi-function Power Meter",
    category: "เครื่องควบคุม",
    onHand: 6,
    safetyStock: 10,
    incoming: 12,
    shortage: 4,
    costPrice: 3800,
    sellingPrice: 5400,
    unit: "เครื่อง",
    status: "replenishing",
    location: "B-04-02",
    warehouse: "คลังสินค้าสาขา บางนา",
  },
  {
    id: "stk-15",
    sku: "SKU-99434",
    nameTh: "ปั๊มน้ำหอยโข่งอุตสาหกรรม 3HP",
    nameEn: "Centrifugal Water Pump 3HP",
    category: "มอเตอร์และปั๊ม",
    onHand: 0,
    safetyStock: 6,
    incoming: 10,
    shortage: 6,
    costPrice: 9200,
    sellingPrice: 13500,
    unit: "เครื่อง",
    status: "out_of_stock",
    location: "B-06-03",
    warehouse: "คลังสินค้าสาขา ชลบุรี",
  },
  {
    id: "stk-16",
    sku: "SKU-99435",
    nameTh: "รางวายเวย์พ่นสี 100x100 มม.",
    nameEn: "Wireway Cable Tray 100x100 mm",
    category: "วัสดุไฟฟ้า",
    onHand: 120,
    safetyStock: 40,
    incoming: 0,
    shortage: 0,
    costPrice: 420,
    sellingPrice: 590,
    unit: "ท่อน",
    status: "in_stock",
    location: "C-05-09",
    warehouse: "คลังสินค้ากลาง สำนักงานใหญ่",
  },
  {
    id: "stk-17",
    sku: "SKU-99436",
    nameTh: "คาปาซิเตอร์แบงก์ 50kVAR",
    nameEn: "Power Capacitor Bank 50kVAR",
    category: "เครื่องควบคุม",
    onHand: 7,
    safetyStock: 8,
    incoming: 10,
    shortage: 1,
    costPrice: 11500,
    sellingPrice: 16000,
    unit: "ชุด",
    status: "replenishing",
    location: "A-06-07",
    warehouse: "คลังสินค้ากลาง สำนักงานใหญ่",
  },
  {
    id: "stk-18",
    sku: "SKU-99437",
    nameTh: "ชุดไฟฉุกเฉิน LED อัตโนมัติ",
    nameEn: "Automatic Emergency Light LED",
    category: "โคมไฟอุตสาหกรรม",
    onHand: 42,
    safetyStock: 15,
    incoming: 0,
    shortage: 0,
    costPrice: 1100,
    sellingPrice: 1750,
    unit: "ชุด",
    status: "in_stock",
    location: "A-10-02",
    warehouse: "คลังสินค้าสาขา บางนา",
  },
  {
    id: "stk-19",
    sku: "SKU-99438",
    nameTh: "ฟิวส์แรงสูง HRC 100A",
    nameEn: "High Voltage HRC Fuse 100A",
    category: "เบรกเกอร์",
    onHand: 60,
    safetyStock: 25,
    incoming: 0,
    shortage: 0,
    costPrice: 550,
    sellingPrice: 850,
    unit: "ตัว",
    status: "in_stock",
    location: "D-04-06",
    warehouse: "คลังสินค้ากลาง สำนักงานใหญ่",
  },
  {
    id: "stk-20",
    sku: "SKU-99439",
    nameTh: "เทอร์มินอลบล็อกต่อสาย 10 ช่อง",
    nameEn: "Screw Terminal Block 10P",
    category: "วัสดุไฟฟ้า",
    onHand: 310,
    safetyStock: 80,
    incoming: 0,
    shortage: 0,
    costPrice: 65,
    sellingPrice: 120,
    unit: "แถว",
    status: "in_stock",
    location: "C-01-15",
    warehouse: "คลังสินค้ากลาง สำนักงานใหญ่",
  },
  {
    id: "stk-21",
    sku: "SKU-99440",
    nameTh: "สวิตช์ปุ่มกดฉุกเฉิน Emergency Stop",
    nameEn: "Emergency Stop Push Button Switch",
    category: "เครื่องควบคุม",
    onHand: 28,
    safetyStock: 10,
    incoming: 0,
    shortage: 0,
    costPrice: 320,
    sellingPrice: 520,
    unit: "ตัว",
    status: "in_stock",
    location: "B-01-10",
    warehouse: "คลังสินค้าสาขา ชลบุรี",
  },
  {
    id: "stk-22",
    sku: "SKU-99441",
    nameTh: "ตู้พักสายไฟกันน้ำสแตนเลส IP66",
    nameEn: "Stainless Junction Box IP66",
    category: "วัสดุไฟฟ้า",
    onHand: 14,
    safetyStock: 15,
    incoming: 20,
    shortage: 1,
    costPrice: 2600,
    sellingPrice: 3750,
    unit: "ใบ",
    status: "replenishing",
    location: "A-08-03",
    warehouse: "คลังสินค้ากลาง สำนักงานใหญ่",
  },
  {
    id: "stk-23",
    sku: "SKU-99442",
    nameTh: "มิเตอร์วัดแรงดันไฟฟ้าแอนะล็อก",
    nameEn: "Analog AC Voltmeter 0-500V",
    category: "เครื่องควบคุม",
    onHand: 0,
    safetyStock: 10,
    incoming: 25,
    shortage: 10,
    costPrice: 680,
    sellingPrice: 1050,
    unit: "ตัว",
    status: "out_of_stock",
    location: "B-02-12",
    warehouse: "คลังสินค้าสาขา บางนา",
  },
  {
    id: "stk-24",
    sku: "SKU-99443",
    nameTh: "โคมไฮเบย์ LED High Bay 150W",
    nameEn: "LED High Bay Lamp 150W",
    category: "โคมไฟอุตสาหกรรม",
    onHand: 38,
    safetyStock: 20,
    incoming: 0,
    shortage: 0,
    costPrice: 1850,
    sellingPrice: 2650,
    unit: "ชุด",
    status: "in_stock",
    location: "A-12-10",
    warehouse: "คลังสินค้าสาขา ชลบุรี",
  },
  {
    id: "stk-25",
    sku: "SKU-99444",
    nameTh: "เซอร์กิตเบรกเกอร์ MCCB 3P 250A",
    nameEn: "Molded Case Circuit Breaker 250A",
    category: "เบรกเกอร์",
    onHand: 5,
    safetyStock: 8,
    incoming: 15,
    shortage: 3,
    costPrice: 5800,
    sellingPrice: 8200,
    unit: "ตัว",
    status: "replenishing",
    location: "D-01-02",
    warehouse: "คลังสินค้ากลาง สำนักงานใหญ่",
  },
];

export default function StockBalancePage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";

  const [statusFilter, setStatusFilter] = useState<string>("ทั้งหมด");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDetailItem, setSelectedDetailItem] = useState<StockBalanceItem | null>(null);

  const statusOptions = React.useMemo(() => [
    { value: "ทั้งหมด", label: isThai ? "ทั้งหมด (ทุกสถานะ)" : "All Status" },
    { value: "มีสินค้า", label: isThai ? "มีสินค้า (In Stock)" : "In Stock", badge: isThai ? "พร้อมจำหน่าย" : "Available" },
    { value: "กำลังเติมสต็อก", label: isThai ? "กำลังเติมสต็อก" : "Replenishing", badge: isThai ? "รอดำเนินการ" : "Pending" },
    { value: "ขาดสต็อก", label: isThai ? "ขาดสต็อก (Out of Stock)" : "Out of Stock", badge: isThai ? "หมด" : "Depleted" },
  ], [isThai]);

  // Pagination state: กำหนดคงที่ 10 รายการต่อหน้า
  const pageSize = 10;
  const [currentPage, setCurrentPage] = useState(1);

  // 2. เมื่อเปลี่ยนหน้า (Pagination) ให้เลื่อนหน้าจอกลับขึ้นไปบนสุดอย่างนุ่มนวล
  useEffect(() => {
    const container = document.getElementById("warehouse-page-scroll-container");
    if (container) {
      container.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  const filteredData = STOCK_BALANCES.filter((item) => {
    if (statusFilter === "มีสินค้า" && item.status !== "in_stock") return false;
    if (statusFilter === "กำลังเติมสต็อก" && item.status !== "replenishing") return false;
    if (statusFilter === "ขาดสต็อก" && item.status !== "out_of_stock") return false;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        item.sku.toLowerCase().includes(q) ||
        item.nameTh.toLowerCase().includes(q) ||
        item.nameEn.toLowerCase().includes(q) ||
        item.warehouse.toLowerCase().includes(q) ||
        item.location.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // รีเซ็ตหน้ากลับเป็นหน้า 1 เมื่อมีการค้นหาหรือเปลี่ยนตัวกรอง
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const validCurrentPage = Math.min(currentPage, totalPages);
  const paginatedData = filteredData.slice(
    (validCurrentPage - 1) * pageSize,
    validCurrentPage * pageSize
  );

  // คำนวณสรุปข้อมูลกล่องทั้ง 4
  const totalSkuCount = STOCK_BALANCES.length; // สินค้าทั้งหมด (SKU)
  const totalUnits = STOCK_BALANCES.reduce((acc, curr) => acc + curr.onHand, 0); // ชิ้นทั้งหมด
  const totalValuation = STOCK_BALANCES.reduce((acc, curr) => acc + curr.onHand * curr.costPrice, 0); // มูลค่าคลังรวม
  const inStockUnits = STOCK_BALANCES.filter((i) => i.onHand > 0).reduce((acc, curr) => acc + curr.onHand, 0); // สินค้าพร้อมจำหน่าย
  
  // แยกยอดสินค้าตามสาขาคลัง (Branch Breakdown)
  const bkkQty = STOCK_BALANCES.filter((i) => i.warehouse.includes("สำนักงานใหญ่")).reduce((acc, curr) => acc + curr.onHand, 0);
  const bangnaQty = STOCK_BALANCES.filter((i) => i.warehouse.includes("บางนา")).reduce((acc, curr) => acc + curr.onHand, 0);
  const chonburiQty = STOCK_BALANCES.filter((i) => i.warehouse.includes("ชลบุรี")).reduce((acc, curr) => acc + curr.onHand, 0);

  return (
    <WarehousePageTemplate
      titleEn="Stock Balance & Replenishment Status"
      titleTh="ยอดสินค้าคงคลังและสถานะสต็อก"
      routePath="/warehouse/stock"
      iconName="package"
      fullBleed
      metrics={[
        {
          title: isThai ? "สินค้าทั้งหมด" : "Total Products (SKU)",
          value: `${totalSkuCount.toLocaleString()} รายการ`,
          sub: isThai ? `รวม ${totalUnits.toLocaleString()} ชิ้นในระบบ` : `${totalUnits.toLocaleString()} total units`,
          color: "#6366F1",
          iconName: "package",
        },
        {
          title: isThai ? "มูลค่าคลังรวม" : "Total Inventory Value",
          value: `฿${totalValuation.toLocaleString()}`,
          sub: isThai ? "ประเมินตามต้นทุนเฉลี่ย" : "Based on weighted avg cost",
          color: "#FF9F1C",
          iconName: "layers",
        },
        {
          title: isThai ? "สินค้าพร้อมจำหน่าย" : "Available Stock",
          value: `${inStockUnits.toLocaleString()} ชิ้น`,
          sub: isThai ? "สถานะพร้อมหยิบและจัดส่งทันที" : "Ready for dispatch",
          color: "#2EC4B6",
          iconName: "box",
        },
        {
          title: isThai ? "สินค้าในคลังแยกตามสาขา" : "Stock by Branch Hub",
          value: `${bkkQty} ชิ้น`,
          sub: isThai
            ? `คลังกลาง ${bkkQty} · บางนา ${bangnaQty} · ชลบุรี ${chonburiQty}`
            : `HQ: ${bkkQty} · Bangna: ${bangnaQty} · Chonburi: ${chonburiQty}`,
          color: "#818CF8",
          iconName: "branches",
        },
      ]}
    >
      <div className="flex-1 w-full min-w-0 flex flex-col items-start p-4 sm:p-6 lg:p-8 gap-6 self-stretch">
        {/* Controls: Search, Filter, Action */}
        <div className="w-full flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Box */}
            <div
              className={`flex items-center gap-2 px-3 py-2 rounded-xl border h-[38px] text-[13px] ${
                isLight ? "bg-white border-[#E4E4E7]" : "bg-[#282828] border-[#444444]"
              }`}
            >
              <Search size={15} className={isLight ? "text-slate-400" : "text-zinc-400"} />
              <input
                type="text"
                placeholder={isThai ? "ค้นหา SKU, ชื่อสินค้า, คลัง, ที่ตั้ง..." : "Search SKU, Name, Warehouse..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`bg-transparent border-none outline-none text-[13px] w-[180px] sm:w-[240px] ${
                  isLight ? "text-slate-900 placeholder:text-slate-400" : "text-white placeholder:text-zinc-500"
                }`}
              />
            </div>

            {/* Filter Dropdown using Central CustomDropdown */}
            <CustomDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={statusOptions}
              icon={<Filter size={14} className={isLight ? "text-slate-500" : "text-zinc-400"} />}
              triggerClassName={`h-[38px] rounded-xl text-[13px] font-medium ${
                isLight
                  ? "bg-white border-[#E4E4E7] text-slate-700 hover:bg-slate-50"
                  : "bg-[#282828] border-[#444444] text-zinc-200 hover:bg-white/5"
              }`}
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-[13px] font-medium transition-colors ${
                isLight ? "bg-white border-[#E4E4E7] text-slate-700 hover:bg-slate-50" : "bg-[#282828] border-[#444444] text-zinc-200 hover:bg-white/5"
              }`}
            >
              <RefreshCw size={13} className={isLight ? "text-slate-500" : "text-zinc-400"} />
              <span>{isThai ? "รีเฟรชข้อมูลสต็อก" : "Refresh Stock"}</span>
            </button>
          </div>
        </div>

        {/* Stock Ledger / Balance Table */}
        <div
          className={`w-full rounded-[12px] border overflow-hidden ${
            isLight ? "bg-white border-[#E4E4E7] shadow-xs" : "bg-[#383838] border-[#444444]"
          }`}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px] border-collapse min-w-[700px]">
              <thead>
                <tr
                  className={`h-[42px] border-b text-[12px] font-semibold text-white select-none ${
                    isLight ? "bg-slate-900 border-slate-800" : "bg-[#282828] border-[#444444]"
                  }`}
                >
                  <th className="py-2.5 px-4">{isThai ? "รหัสสินค้า" : "SKU & Product"}</th>
                  <th className="py-2.5 px-4">{isThai ? "คลังและที่ตั้ง" : "Warehouse & Location"}</th>
                  <th className="py-2.5 px-4 text-right">{isThai ? "จำนวนสินค้า" : "Quantity"}</th>
                  <th className="py-2.5 px-4 text-center">{isThai ? "สถานะสต็อก" : "Stock Status"}</th>
                  <th className="py-2.5 pl-2 pr-6 text-center w-14"></th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isLight ? "divide-slate-200" : "divide-white/5"}`}>
                {paginatedData.map((row) => {
                  let statusBadgeBg = "rgba(46, 196, 182, 0.12)";
                  let statusBadgeColor = "#2EC4B6";
                  let statusText = isThai ? "มีสินค้าในสต็อก" : "In Stock";

                  if (row.status === "replenishing") {
                    statusBadgeBg = "rgba(99, 102, 241, 0.12)";
                    statusBadgeColor = "#6366F1";
                    statusText = isThai ? "กำลังเติมสต็อก" : "Replenishing";
                  } else if (row.status === "out_of_stock") {
                    statusBadgeBg = "rgba(231, 29, 54, 0.12)";
                    statusBadgeColor = "#E71D36";
                    statusText = isThai ? "สินค้าขาดสต็อก" : "Out of Stock";
                  } else if (row.status === "low_stock") {
                    statusBadgeBg = "rgba(255, 159, 28, 0.12)";
                    statusBadgeColor = "#FF9F1C";
                    statusText = isThai ? "สินค้าใกล้หมด" : "Low Stock";
                  }

                  return (
                    <tr
                      key={row.id}
                      className={`transition-colors hover:bg-white/[0.02] ${
                        isLight ? "hover:bg-slate-50" : ""
                      }`}
                    >
                      {/* รหัสสินค้า */}
                      <td className="py-3.5 px-4">
                        <div className={`font-mono font-semibold text-[12.5px] ${isLight ? "text-slate-800" : "text-zinc-200"}`}>
                          {row.sku}
                        </div>
                        <div className={`font-medium text-[13px] truncate max-w-[240px] ${
                          isLight ? "text-slate-900" : "text-white/90"
                        }`}>
                          {isThai ? row.nameTh : row.nameEn}
                        </div>
                        <div className={`text-[11px] ${isLight ? "text-slate-500" : "text-zinc-500"}`}>{row.category}</div>
                      </td>

                      {/* คลังและที่ตั้ง */}
                      <td className="py-3.5 px-4">
                        <div className={`flex items-center gap-1.5 font-medium ${
                          isLight ? "text-slate-800" : "text-white/90"
                        }`}>
                          <Building2 size={13} className={isLight ? "text-slate-500" : "text-zinc-400"} />
                          <span>{row.warehouse}</span>
                        </div>
                        <div className={`text-[11.5px] font-mono mt-0.5 ${
                          isLight ? "text-slate-500" : "text-zinc-400"
                        }`}>
                          พิกัด {row.location}
                        </div>
                      </td>

                      {/* จำนวนสินค้า */}
                      <td className="py-3.5 px-4 text-right">
                        <div className={`font-mono font-bold text-[14px] ${
                          isLight ? "text-slate-900" : "text-white"
                        }`}>
                          {row.onHand > 0 ? (
                            <>
                              <span className={isLight ? "text-emerald-600" : "text-emerald-400"}>{row.onHand.toLocaleString()}</span>{" "}
                              <span className={`text-[11px] font-normal ${isLight ? "text-slate-500" : "text-zinc-400"}`}>{row.unit}</span>
                            </>
                          ) : (
                            <span className={isLight ? "text-rose-600 font-semibold" : "text-rose-400 font-semibold"}>{isThai ? "หมดสต็อก" : "0"}</span>
                          )}
                        </div>
                      </td>

                      {/* สถานะสต็อก */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className="inline-flex items-center justify-center px-2.5 py-1 rounded-[6px] text-[11px] font-bold"
                          style={{
                            backgroundColor: statusBadgeBg,
                            color: statusBadgeColor,
                          }}
                        >
                          {statusText}
                        </span>
                      </td>

                      {/* ไอคอน 3 จุด ดูรายละเอียดเพิ่มเติม */}
                      <td className="py-3.5 pl-2 pr-6 text-center">
                        <button
                          type="button"
                          onClick={() => setSelectedDetailItem(row)}
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

        {/* Pagination (Outside Table Card) */}
        {filteredData.length > 0 && (
          <div className="w-full mt-2">
            <Pagination
              currentPage={validCurrentPage}
              totalPages={totalPages}
              totalItems={filteredData.length}
              pageSize={10}
              onPageChange={setCurrentPage}
              isThai={isThai}
            />
          </div>
        )}
      </div>

      {/* Modal / Slide-over ดูรายละเอียดสินค้า */}
      {selectedDetailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
          <div
            className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl transition-all ${
              isLight ? "bg-white border-slate-200 text-slate-800" : "bg-[#282828] border-[#444444] text-zinc-100"
            }`}
          >
            <div className={`flex items-center justify-between pb-4 border-b ${
              isLight ? "border-slate-200" : "border-white/10"
            }`}>
              <div className="flex items-center gap-2">
                <MoreHorizontal size={18} className={isLight ? "text-slate-800" : "text-white"} />
                <h3 className={`font-bold text-[16px] ${isLight ? "text-slate-900" : "text-white"}`}>
                  {isThai ? "รายละเอียดสินค้าคงคลัง" : "Stock Item Details"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className={`p-1.5 rounded-lg transition-colors ${
                  isLight ? "hover:bg-slate-100 text-slate-500" : "hover:bg-white/10 text-zinc-400"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 space-y-4 text-[13px]">
              <div>
                <span className={`text-[11px] font-semibold uppercase ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                  {isThai ? "รหัสสินค้า / SKU" : "SKU"}
                </span>
                <p className={`font-mono text-[15px] font-bold mt-0.5 ${isLight ? "text-slate-900" : "text-white"}`}>
                  {selectedDetailItem.sku}
                </p>
              </div>

              <div>
                <span className={`text-[11px] font-semibold uppercase ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                  {isThai ? "ชื่อสินค้า" : "Product Name"}
                </span>
                <p className={`font-semibold text-[14.5px] mt-0.5 ${isLight ? "text-slate-900" : "text-white"}`}>
                  {isThai ? selectedDetailItem.nameTh : selectedDetailItem.nameEn}
                </p>
                <p className={`text-[12px] ${isLight ? "text-slate-500" : "text-zinc-400"}`}>{selectedDetailItem.category}</p>
              </div>

              <div className={`grid grid-cols-2 gap-4 pt-2 border-t ${isLight ? "border-slate-200" : "border-white/10"}`}>
                <div>
                  <span className={`text-[11px] font-semibold uppercase ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                    {isThai ? "คลังสินค้า" : "Warehouse"}
                  </span>
                  <p className={`font-medium mt-0.5 ${isLight ? "text-slate-800" : "text-zinc-200"}`}>{selectedDetailItem.warehouse}</p>
                </div>
                <div>
                  <span className={`text-[11px] font-semibold uppercase ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                    {isThai ? "พิกัดที่ตั้ง (Bin)" : "Location Bin"}
                  </span>
                  <p className={`font-mono font-medium mt-0.5 ${isLight ? "text-slate-800" : "text-zinc-200"}`}>{selectedDetailItem.location}</p>
                </div>
              </div>

              <div className={`grid grid-cols-2 gap-4 pt-2 border-t ${isLight ? "border-slate-200" : "border-white/10"}`}>
                <div>
                  <span className={`text-[11px] font-semibold uppercase ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                    {isThai ? "ยอดคงคลังพร้อมใช้" : "On-Hand Stock"}
                  </span>
                  <p className={`font-mono text-[16px] font-bold mt-0.5 ${isLight ? "text-emerald-600" : "text-emerald-400"}`}>
                    {selectedDetailItem.onHand.toLocaleString()} {selectedDetailItem.unit}
                  </p>
                </div>
                <div>
                  <span className={`text-[11px] font-semibold uppercase ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                    {isThai ? "สต็อกขั้นต่ำที่ปลอดภัย" : "Safety Stock"}
                  </span>
                  <p className={`font-mono text-[16px] font-medium mt-0.5 ${isLight ? "text-slate-800" : "text-zinc-300"}`}>
                    {selectedDetailItem.safetyStock.toLocaleString()} {selectedDetailItem.unit}
                  </p>
                </div>
              </div>

              <div className={`grid grid-cols-2 gap-4 pt-2 border-t ${isLight ? "border-slate-200" : "border-white/10"}`}>
                <div>
                  <span className={`text-[11px] font-semibold uppercase ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                    {isThai ? "กำลังเติมสต็อก (In-Transit)" : "Replenishing"}
                  </span>
                  <p className={`font-mono font-bold mt-0.5 ${isLight ? "text-indigo-600" : "text-indigo-400"}`}>
                    {selectedDetailItem.incoming > 0 ? `+${selectedDetailItem.incoming.toLocaleString()}` : "-"}
                  </p>
                </div>
                <div>
                  <span className={`text-[11px] font-semibold uppercase ${isLight ? "text-slate-500" : "text-zinc-500"}`}>
                    {isThai ? "ยอดขาดสต็อก (Shortage)" : "Shortage"}
                  </span>
                  <p className={`font-mono font-bold mt-0.5 ${isLight ? "text-rose-600" : "text-rose-400"}`}>
                    {selectedDetailItem.shortage > 0 ? `-${selectedDetailItem.shortage.toLocaleString()}` : "-"}
                  </p>
                </div>
              </div>
            </div>

            <div className={`pt-4 border-t flex justify-end ${isLight ? "border-slate-200" : "border-white/10"}`}>
              <button
                type="button"
                onClick={() => setSelectedDetailItem(null)}
                className={`px-4 py-2 rounded-xl text-[13px] font-semibold transition-colors ${
                  isLight ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white text-zinc-900 hover:bg-zinc-200"
                }`}
              >
                {isThai ? "ปิดหน้าต่าง" : "Close"}
              </button>
            </div>
          </div>
        </div>
      )}
    </WarehousePageTemplate>
  );
}
