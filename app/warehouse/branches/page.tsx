"use client";

import React, { useState } from "react";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import {
  Download,
  GitBranch,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  MapPin,
  Users,
  Package,
  Boxes,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Phone,
  ArrowUpRight,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface BranchItem {
  nameTh: string;
  nameEn: string;
  sku: string;
  percentage: number;
  currentUnits: number;
  maxUnits: number;
  statusTh: string;
  statusEn: string;
  statusColor: string; // hex for progress bar fill & text
  statusType: "secure" | "low" | "critical";
}

interface BranchSection {
  id: string;
  nameTh: string;
  nameEn: string;
  locationTh: string;
  locationEn: string;
  managerTh: string;
  managerEn: string;
  phone: string;
  totalCapacity: string;
  usedCapacityPct: number;
  badgeTh: string;
  badgeEn: string;
  badgeColor: string;
  badgeBg: string;
  summary: {
    totalSkus: number;
    activeStaff: number;
    lastRestock: string;
    temperatureControlled: boolean;
  };
  items: BranchItem[];
}

const BRANCH_DATA: BranchSection[] = [
  {
    id: "branch-1",
    nameTh: "ศูนย์กระจายสินค้าหลัก สำนักงานใหญ่ (กรุงเทพฯ)",
    nameEn: "Main Central Distribution Hub (HQ)",
    locationTh: "เขตบางนา กรุงเทพมหานคร (เชื่อมต่อบางนา-ตราด กม. 18)",
    locationEn: "Bangna, Bangkok (Direct access to Bangna-Trad Rd.)",
    managerTh: "คุณสมชาย วรเวชกุล (ผู้จัดการศูนย์คลังใหญ่)",
    managerEn: "Somchai Voravechkul (General Warehouse Manager)",
    phone: "02-749-8800 ต่อ 101",
    totalCapacity: "15,000 ตร.ม. / 8,500 พาเลท",
    usedCapacityPct: 78,
    badgeTh: "สต็อกพร้อมใช้สมบูรณ์",
    badgeEn: "Optimal Stocking",
    badgeColor: "#2EC4B6",
    badgeBg: "rgba(46, 196, 182, 0.15)",
    summary: {
      totalSkus: 840,
      activeStaff: 32,
      lastRestock: "วันนี้ 14:30 น.",
      temperatureControlled: true,
    },
    items: [
      {
        sku: "SKU-99420",
        nameTh: "เครื่องปั่นไฟดีเซล Cummins 500kVA",
        nameEn: "Cummins 500kVA Diesel Generator",
        percentage: 80,
        currentUnits: 12,
        maxUnits: 15,
        statusTh: "สต็อกปลอดภัย",
        statusEn: "Stock Secure",
        statusColor: "#2EC4B6",
        statusType: "secure",
      },
      {
        sku: "SKU-99421",
        nameTh: "หม้อแปลงปรับแรงดันไฟฟ้า 3 เฟส 800V",
        nameEn: "3-Phase Step Down Transformer 800V",
        percentage: 35,
        currentUnits: 2,
        maxUnits: 8,
        statusTh: "ต่ำกว่าเกณฑ์ควบคุม",
        statusEn: "Threshold Low",
        statusColor: "#FF9F1C",
        statusType: "low",
      },
      {
        sku: "SKU-99425",
        nameTh: "ท่อร้อยสายไฟ EMT 1/2 นิ้ว (แพ็ค 50 เส้น)",
        nameEn: "EMT Conduit Pipe 1/2 Inch (Pack 50)",
        percentage: 92,
        currentUnits: 350,
        maxUnits: 380,
        statusTh: "สต็อกปลอดภัย",
        statusEn: "Stock Secure",
        statusColor: "#2EC4B6",
        statusType: "secure",
      },
    ],
  },
  {
    id: "branch-2",
    nameTh: "คลังสินค้าสาขา ภาคตะวันออก (แหลมฉบัง-ชลบุรี)",
    nameEn: "Eastern Seaboard Logistics Depot (Chonburi)",
    locationTh: "นิคมอุตสาหกรรมแหลมฉบัง อ.ศรีราชา จ.ชลบุรี",
    locationEn: "Laem Chabang Industrial Estate, Sriracha, Chonburi",
    managerTh: "คุณประเสริฐ สุขสวัสดิ์ (หัวหน้าคลังสินค้าชลบุรี)",
    managerEn: "Prasert Suksawat (Depot Supervisor)",
    phone: "038-490-220 ต่อ 204",
    totalCapacity: "8,200 ตร.ม. / 4,200 พาเลท",
    usedCapacityPct: 64,
    badgeTh: "แจ้งเตือนวิกฤตต้องเติมสต็อก",
    badgeEn: "Reorder Critical Alert",
    badgeColor: "#E71D36",
    badgeBg: "rgba(231, 29, 54, 0.15)",
    summary: {
      totalSkus: 420,
      activeStaff: 18,
      lastRestock: "เมื่อวาน 17:00 น.",
      temperatureControlled: false,
    },
    items: [
      {
        sku: "SKU-99428",
        nameTh: "รถโฟล์คลิฟท์ไฟฟ้า Toyota 2.5T",
        nameEn: "Toyota Electric Forklift 2.5T",
        percentage: 10,
        currentUnits: 0,
        maxUnits: 6,
        statusTh: "สินค้าหมด ต้องดำเนินการด่วน",
        statusEn: "Depleted (Action Required)",
        statusColor: "#E71D36",
        statusType: "critical",
      },
      {
        sku: "SKU-99430",
        nameTh: "โคมไฟถนนโซลาร์เซลล์ 300W IP67",
        nameEn: "Solar Street Light 300W IP67",
        percentage: 45,
        currentUnits: 32,
        maxUnits: 70,
        statusTh: "กำลังเติมสต็อก",
        statusEn: "Replenishing",
        statusColor: "#6366F1",
        statusType: "low",
      },
      {
        sku: "SKU-99434",
        nameTh: "ปั๊มน้ำหอยโข่งอุตสาหกรรม 3HP",
        nameEn: "Centrifugal Water Pump 3HP",
        percentage: 5,
        currentUnits: 0,
        maxUnits: 12,
        statusTh: "สินค้าหมดสต็อก",
        statusEn: "Out of Stock",
        statusColor: "#E71D36",
        statusType: "critical",
      },
    ],
  },
  {
    id: "branch-3",
    nameTh: "คลังสินค้าสาขา บางนา-กม.12 (ศูนย์ส่งด่วนปริมณฑล)",
    nameEn: "Bangna Express Distribution Node",
    locationTh: "ถนนกิ่งแก้ว-บางพลี จ.สมุทรปราการ",
    locationEn: "Kingkaew-Bangplee, Samut Prakan",
    managerTh: "คุณนภัทร ธรรมรักษ์ (ผู้ช่วยผู้จัดการฝ่ายโลจิสติกส์)",
    managerEn: "Naphat Thammarak (Assistant Logistics Manager)",
    phone: "02-316-4455 ต่อ 12",
    totalCapacity: "6,000 ตร.ม. / 3,000 พาเลท",
    usedCapacityPct: 82,
    badgeTh: "ความจุสูงใกล้เต็ม",
    badgeEn: "High Capacity Load",
    badgeColor: "#FF9F1C",
    badgeBg: "rgba(255, 159, 28, 0.15)",
    summary: {
      totalSkus: 310,
      activeStaff: 14,
      lastRestock: "วันนี้ 09:15 น.",
      temperatureControlled: true,
    },
    items: [
      {
        sku: "SKU-99421",
        nameTh: "หม้อแปลงกระแสไฟฟ้า CT 100/5A",
        nameEn: "Current Transformer CT 100/5A",
        percentage: 30,
        currentUnits: 8,
        maxUnits: 25,
        statusTh: "กำลังเติมสต็อก",
        statusEn: "Replenishing",
        statusColor: "#6366F1",
        statusType: "low",
      },
      {
        sku: "SKU-99433",
        nameTh: "เครื่องวัดพลังงานไฟฟ้าดิจิทัล 3 เฟส",
        nameEn: "Digital Multi-function Power Meter",
        percentage: 38,
        currentUnits: 6,
        maxUnits: 16,
        statusTh: "ต่ำกว่าเกณฑ์ควบคุม",
        statusEn: "Threshold Low",
        statusColor: "#FF9F1C",
        statusType: "low",
      },
      {
        sku: "SKU-99442",
        nameTh: "มิเตอร์วัดแรงดันไฟฟ้าแอนะล็อก 0-500V",
        nameEn: "Analog AC Voltmeter 0-500V",
        percentage: 0,
        currentUnits: 0,
        maxUnits: 10,
        statusTh: "สินค้าหมดสต็อก",
        statusEn: "Depleted",
        statusColor: "#E71D36",
        statusType: "critical",
      },
    ],
  },
];

export default function BranchesPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";

  // Accordion state: เก็บ id ของสาขาที่กำลังเปิด dropdown รายละเอียด (หรือ null หากปิดหมด)
  const [expandedBranchId, setExpandedBranchId] = useState<string | null>("branch-1");

  const toggleBranch = (branchId: string) => {
    setExpandedBranchId((prev) => (prev === branchId ? null : branchId));
  };

  return (
    <WarehousePageTemplate
      titleEn="Branch Stock Levels"
      titleTh="ระดับสต็อกสินค้าแต่ละสาขา"
      routePath="/warehouse/branches"
      iconName="branches"
      fullBleed
    >
      {/* workspace-content: fullBleed width layout matching inventory & stock */}
      <div className="flex-1 w-full min-w-0 flex flex-col items-start p-4 sm:p-6 lg:p-8 gap-6 self-stretch">
        {/* Action Header bar: export button */}
        <div className="w-full flex justify-end items-center">
          <button
            type="button"
            className={`box-border flex flex-row justify-center items-center px-4 py-2 gap-2 h-[36px] rounded-lg border text-[13px] font-medium transition-all cursor-pointer shrink-0 ${
              isLight
                ? "bg-white border-[#E4E4E7] text-[#222222] hover:bg-slate-50 shadow-xs"
                : "bg-[#383838] border-[#444444] text-[#F4F4F5] hover:bg-white/5"
            }`}
            style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
          >
            <Download size={14} className={isLight ? "text-slate-600" : "text-[#F4F4F5]"} />
            <span>{isThai ? "ส่งออกรายงานความจุ" : "Export Capacity Report"}</span>
          </button>
        </div>

        {/* Branch Panels Grid / List */}
        <div className="w-full flex flex-col gap-3.5">
          {BRANCH_DATA.map((branch) => {
            const isExpanded = expandedBranchId === branch.id;

            return (
              <div
                key={branch.id}
                onClick={() => toggleBranch(branch.id)}
                className={`group w-full box-border flex flex-col items-start px-5 sm:px-6 py-4 sm:py-4.5 rounded-xl border transition-all duration-200 cursor-pointer select-none ${
                  isLight
                    ? isExpanded
                      ? "bg-white border-slate-900 shadow-md ring-1 ring-slate-900/15"
                      : "bg-white border-[#E4E4E7] shadow-xs hover:border-slate-400 hover:shadow-sm"
                    : isExpanded
                    ? "bg-[#333333] border-white shadow-lg ring-1 ring-white/20"
                    : "bg-[#333333] border-[#444444] hover:border-[#666666] hover:bg-[#383838]"
                }`}
              >
                {/* branch-header: Compact & Clean Main Bar */}
                <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Branch Title Frame */}
                  <div className="flex flex-row items-center gap-3 min-w-0">
                    <div
                      className={`w-[36px] h-[36px] rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                        isExpanded
                          ? isLight
                            ? "bg-slate-900 text-white shadow-sm"
                            : "bg-white text-black shadow-sm"
                          : isLight
                          ? "bg-slate-100 text-slate-700 group-hover:bg-slate-200"
                          : "bg-[#282828] text-[#F4F4F5] group-hover:bg-[#202020]"
                      }`}
                    >
                      <GitBranch size={18} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3
                          className={`text-[15.5px] sm:text-[16.5px] font-bold leading-tight truncate ${
                            isLight ? "text-[#18181B]" : "text-[#FFFFFF]"
                          }`}
                          style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                        >
                          {isThai ? branch.nameTh : branch.nameEn}
                        </h3>
                        <span
                          className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded-md ${
                            isLight ? "bg-slate-100 text-slate-600" : "bg-[#282828] text-zinc-300"
                          }`}
                        >
                          {branch.id.toUpperCase()}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[12px] text-zinc-400">
                        <MapPin size={12} className={`shrink-0 ${isLight ? "text-slate-500" : "text-zinc-400"}`} />
                        <span className="truncate max-w-[280px] sm:max-w-md text-[11.5px] sm:text-[12px]">
                          {isThai ? branch.locationTh : branch.locationEn}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Status Badge (Compact) */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-zinc-100 dark:border-white/5">
                    {/* Capacity Indicator Pill */}
                    <div className="flex items-center gap-2">
                      <div className="text-right">
                        <span className={`text-[12px] font-mono font-bold ${branch.usedCapacityPct > 80 ? "text-amber-500" : "text-emerald-500"}`}>
                          {branch.usedCapacityPct}%
                        </span>
                        <span className={`hidden md:inline text-[11px] ml-1 ${isLight ? "text-slate-400" : "text-zinc-500"}`}>
                          {isThai ? "ความจุ" : "load"}
                        </span>
                      </div>
                      <div
                        className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold leading-none"
                        style={{
                          backgroundColor: branch.badgeBg,
                          color: branch.badgeColor,
                          fontFamily: "'Geist', var(--font-geist-sans), sans-serif",
                        }}
                      >
                        {isThai ? branch.badgeTh : branch.badgeEn}
                      </div>
                    </div>

                    {/* Toggle Button */}
                    <div
                      className={`flex items-center gap-1 text-[12px] font-medium px-2.5 py-1.5 rounded-lg transition-colors ${
                        isExpanded
                          ? isLight
                            ? "bg-slate-100 text-slate-900 font-semibold"
                            : "bg-white/10 text-white font-semibold"
                          : isLight
                          ? "text-slate-500 group-hover:text-slate-900 group-hover:bg-slate-100"
                          : "text-zinc-400 group-hover:text-white group-hover:bg-white/5"
                      }`}
                    >
                      <span className="whitespace-nowrap">
                        {isExpanded
                          ? isThai
                            ? "ย่อ"
                            : "Hide"
                          : isThai
                          ? "ดูเพิ่มเติม"
                          : "More Details"}
                      </span>
                      {isExpanded ? (
                        <ChevronUp size={15} className={isLight ? "text-slate-800" : "text-zinc-200"} />
                      ) : (
                        <ChevronDown size={15} className={isLight ? "text-slate-600" : "text-zinc-400"} />
                      )}
                    </div>
                  </div>
                </div>

                {/* ========================================================= */}
                {/* 📌 [DROPDOWN PANEL]: รายละเอียดเชิงลึกเมื่อกด "ดูเพิ่มเติม" */}
                {/* ========================================================= */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.28, ease: "easeInOut" }}
                      className="w-full overflow-hidden"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div
                        className={`w-full mt-3 p-4 sm:p-5 rounded-xl border flex flex-col gap-4.5 ${
                          isLight
                            ? "bg-[#F8FAFC] border-slate-200 text-slate-800"
                            : "bg-[#282828] border-[#444444] text-zinc-100"
                        }`}
                      >
                        {/* 4 Detail Badges Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                          <div
                            className={`p-3 rounded-lg border flex flex-col gap-0.5 ${
                              isLight ? "bg-white border-slate-200 shadow-xs" : "bg-[#333333] border-[#484848]"
                            }`}
                          >
                            <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                              <Boxes size={12} className={isLight ? "text-slate-600" : "text-zinc-300"} />
                              {isThai ? "พื้นที่ & ความจุ" : "Total Capacity"}
                            </span>
                            <span className="text-[12.5px] font-bold">
                              {branch.totalCapacity}
                            </span>
                          </div>

                          <div
                            className={`p-3 rounded-lg border flex flex-col gap-0.5 ${
                              isLight ? "bg-white border-slate-200 shadow-xs" : "bg-[#333333] border-[#484848]"
                            }`}
                          >
                            <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                              <TrendingUp size={12} className={isLight ? "text-slate-600" : "text-zinc-300"} />
                              {isThai ? "อัตราการจัดเก็บ" : "Storage Load"}
                            </span>
                            <span className="text-[12.5px] font-bold font-mono">
                              {branch.usedCapacityPct}% {isThai ? "ใช้งานแล้ว" : "Utilized"}
                            </span>
                          </div>

                          <div
                            className={`p-3 rounded-lg border flex flex-col gap-0.5 ${
                              isLight ? "bg-white border-slate-200 shadow-xs" : "bg-[#333333] border-[#484848]"
                            }`}
                          >
                            <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                              <Package size={12} className={isLight ? "text-slate-600" : "text-zinc-300"} />
                              {isThai ? "รายการสินค้าในคลัง" : "Active SKUs"}
                            </span>
                            <span className="text-[12.5px] font-bold font-mono">
                              {branch.summary.totalSkus} {isThai ? "SKUs" : "Items"}
                            </span>
                          </div>

                          <div
                            className={`p-3 rounded-lg border flex flex-col gap-0.5 ${
                              isLight ? "bg-white border-slate-200 shadow-xs" : "bg-[#333333] border-[#484848]"
                            }`}
                          >
                            <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                              <Users size={12} className={isLight ? "text-slate-600" : "text-zinc-300"} />
                              {isThai ? "เจ้าหน้าที่คลัง" : "Stationed Staff"}
                            </span>
                            <span className="text-[12.5px] font-bold font-mono">
                              {branch.summary.activeStaff} {isThai ? "คน" : "Persons"}
                            </span>
                          </div>
                        </div>

                        {/* Location, Supervisor and Contact */}
                        <div
                          className={`p-3.5 rounded-lg border grid grid-cols-1 sm:grid-cols-2 gap-3 text-[12px] ${
                            isLight ? "bg-white border-slate-200" : "bg-[#303030] border-[#444444]"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <MapPin size={14} className={`shrink-0 mt-0.5 ${isLight ? "text-slate-600" : "text-zinc-300"}`} />
                            <div>
                              <span className="text-[10.5px] text-zinc-400 block font-medium">
                                {isThai ? "ที่ตั้งศูนย์คลัง" : "Hub Address"}
                              </span>
                              <span className="font-medium">
                                {isThai ? branch.locationTh : branch.locationEn}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-start gap-2">
                            <Phone size={14} className={`shrink-0 mt-0.5 ${isLight ? "text-slate-600" : "text-zinc-300"}`} />
                            <div>
                              <span className="text-[10.5px] text-zinc-400 block font-medium">
                                {isThai ? "ผู้จัดการและติดต่อ" : "Supervisor & Contact"}
                              </span>
                              <span className="font-medium">
                                {isThai ? branch.managerTh : branch.managerEn} ({branch.phone})
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Monitored Products Table in Branch */}
                        <div className="flex flex-col gap-2">
                          <h5 className="text-[12.5px] font-bold flex items-center justify-between text-zinc-400">
                            <span>{isThai ? "ระดับสต็อกสินค้าควบคุมในสาขา" : "Monitored Stock Levels"}</span>
                            <span className="text-[11px] font-normal">
                              {branch.items.length} {isThai ? "รายการหลัก" : "Items"}
                            </span>
                          </h5>

                          <div
                            className={`w-full rounded-lg border overflow-hidden divide-y ${
                              isLight ? "bg-white border-slate-200 divide-slate-100" : "bg-[#303030] border-[#444444] divide-white/5"
                            }`}
                          >
                            {branch.items.map((item, idx) => (
                              <div
                                key={idx}
                                className="w-full flex flex-col sm:flex-row sm:items-center justify-between p-3 gap-2.5 text-[12.5px]"
                              >
                                {/* Product SKU & Name */}
                                <div className="sm:w-[280px] truncate">
                                  <span className={`font-mono text-[11px] font-semibold mr-1.5 ${isLight ? "text-slate-800" : "text-zinc-200"}`}>
                                    {item.sku}
                                  </span>
                                  <span className={`font-semibold ${isLight ? "text-slate-800" : "text-white"}`}>
                                    {isThai ? item.nameTh : item.nameEn}
                                  </span>
                                </div>

                                {/* Progress Bar */}
                                <div className="flex items-center gap-2 sm:w-[200px]">
                                  <div
                                    className={`flex-1 h-1.5 rounded-full overflow-hidden ${
                                      isLight ? "bg-slate-200" : "bg-[#202020]"
                                    }`}
                                  >
                                    <div
                                      className="h-full rounded-full transition-all"
                                      style={{
                                        width: `${item.percentage}%`,
                                        backgroundColor: item.statusColor,
                                      }}
                                    />
                                  </div>
                                  <span className="w-10 text-[11.5px] font-mono text-right text-zinc-400">
                                    {item.percentage}%
                                  </span>
                                </div>

                                {/* Units */}
                                <div className="text-[12px] font-mono text-zinc-400 sm:w-[110px]">
                                  {item.currentUnits} / {item.maxUnits} {isThai ? "หน่วย" : "Units"}
                                </div>

                                {/* Status */}
                                <div
                                  className="text-[12px] font-semibold sm:w-[140px] text-left sm:text-right"
                                  style={{ color: item.statusColor }}
                                >
                                  {isThai ? item.statusTh : item.statusEn}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Action Footer */}
                        <div className="flex items-center justify-between pt-1 border-t border-zinc-200 dark:border-white/10 text-[12px]">
                          <div className="flex items-center gap-1.5 text-zinc-400">
                            <Clock size={13} className={isLight ? "text-slate-500" : "text-zinc-400"} />
                            <span>
                              {isThai ? "รอบเติมสต็อกล่าสุด:" : "Latest restock:"}{" "}
                              <strong className={isLight ? "text-slate-800" : "text-zinc-200"}>
                                {branch.summary.lastRestock}
                              </strong>
                            </span>
                          </div>

                          <a
                            href={`/warehouse/stock?q=${encodeURIComponent(branch.nameTh.split(" ")[0])}`}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg font-semibold transition-all text-[12px] ${
                              isLight
                                ? "bg-slate-900 hover:bg-black text-white shadow-xs"
                                : "bg-white hover:bg-zinc-200 text-black shadow-xs"
                            }`}
                          >
                            <span>{isThai ? "เปิดดูสต็อกสาขานี้" : "View Branch Stock"}</span>
                            <ArrowUpRight size={13} />
                          </a>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </WarehousePageTemplate>
  );
}
