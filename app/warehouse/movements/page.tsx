"use client";

import React, { useState, useMemo } from "react";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import {
  Calendar,
  ChevronDown,
  Download,
  Filter,
  User,
  ArrowRight,
  CheckCircle2,
} from "lucide-react";

interface MovementRecord {
  id: string;
  timestamp: string;
  type: "inbound" | "outbound" | "transfer" | "adjustment";
  typeTh: string;
  typeEn: string;
  sku: string;
  productNameTh: string;
  productNameEn: string;
  quantityChange: number;
  warehouseTh: string;
  warehouseEn: string;
  operatorTh: string;
  operatorEn: string;
  notesTh: string;
  notesEn: string;
}

const INITIAL_LOGS: MovementRecord[] = [
  {
    id: "log-1",
    timestamp: "24 ต.ค. 66 15:42:10",
    type: "inbound",
    typeTh: "รับสินค้าเข้า",
    typeEn: "Inbound",
    sku: "SKU-99420",
    productNameTh: "เครื่องปั่นไฟดีเซล 5KW",
    productNameEn: "Diesel Generator 5KW",
    quantityChange: 5,
    warehouseTh: "คลังหลัก A",
    warehouseEn: "Main Hub A",
    operatorTh: "สมชาย ใจดี",
    operatorEn: "Somchai Jaidee",
    notesTh: "รับสินค้าสั่งซื้อ PO-9011",
    notesEn: "Procurement PO-9011 Received",
  },
  {
    id: "log-2",
    timestamp: "24 ต.ค. 66 14:15:22",
    type: "outbound",
    typeTh: "เบิกออก",
    typeEn: "Outbound",
    sku: "SKU-99422",
    productNameTh: "สายเคเบิลหุ้มฉนวน XLPE 4 Core",
    productNameEn: "XLPE 4 Core Power Cable",
    quantityChange: -50,
    warehouseTh: "คลังย่อย B",
    warehouseEn: "Sub Hub B",
    operatorTh: "วิชัย ยอดรัก",
    operatorEn: "Wichai Yodrak",
    notesTh: "ใช้ในงานติดตั้งหน่วยผลิต 3",
    notesEn: "Dispatched for Plant 3 Installation",
  },
  {
    id: "log-3",
    timestamp: "23 ต.ค. 66 11:30:00",
    type: "transfer",
    typeTh: "โอนย้ายคลัง",
    typeEn: "Transfer",
    sku: "SKU-99423",
    productNameTh: "สปอตไลท์ LED 200W IP66",
    productNameEn: "Industrial Floodlight LED 200W",
    quantityChange: -20,
    warehouseTh: "คลังหลัก A → B",
    warehouseEn: "Main Hub A → B",
    operatorTh: "สมชาย ใจดี",
    operatorEn: "Somchai Jaidee",
    notesTh: "ใบโอนย้าย TRF-2023090",
    notesEn: "Transfer Order TRF-2023090",
  },
  {
    id: "log-4",
    timestamp: "23 ต.ค. 66 09:12:05",
    type: "adjustment",
    typeTh: "ปรับปรุงยอด",
    typeEn: "Adjustment",
    sku: "SKU-99424",
    productNameTh: "ชุดเบรกเกอร์กันดูด RCBO 2P",
    productNameEn: "RCBO 2P Breaker",
    quantityChange: 2,
    warehouseTh: "คลังหลัก A",
    warehouseEn: "Main Hub A",
    operatorTh: "สมชาย ใจดี",
    operatorEn: "Somchai Jaidee",
    notesTh: "ปรับปรุงจากการตรวจรอบสัปดาห์",
    notesEn: "Audit Reconciliation Adjustment",
  },
  {
    id: "log-5",
    timestamp: "22 ต.ค. 66 16:05:40",
    type: "outbound",
    typeTh: "เบิกออก",
    typeEn: "Outbound",
    sku: "SKU-99421",
    productNameTh: "หม้อแปลงกระแสไฟฟ้า CT 100/5A",
    productNameEn: "Current Transformer CT 100/5A",
    quantityChange: -4,
    warehouseTh: "คลังสาขาตะวันออก",
    warehouseEn: "East Coast Depot",
    operatorTh: "นภา มั่นคง",
    operatorEn: "Napa Mankong",
    notesTh: "ใบเบิกโครงการก่อสร้างโรงงาน",
    notesEn: "Construction Project Dispatch",
  },
];

export default function MovementsPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";

  // Filter States
  const [dateRange] = useState("20 ต.ค. - 24 ต.ค. 2566");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Filter records
  const filteredRecords = useMemo(() => {
    return INITIAL_LOGS.filter((record) => {
      const matchType = selectedType === "all" || record.type === selectedType;
      const matchUser = selectedUser === "all" || record.operatorTh === selectedUser;
      return matchType && matchUser;
    });
  }, [selectedType, selectedUser]);

  return (
    <WarehousePageTemplate
      titleEn="Movement Log & History"
      titleTh="ประวัติการเคลื่อนย้ายสินค้า"
      routePath="/warehouse/movements"
      iconName="history"
      fullBleed
    >
      {/* scrollable-content: Conforms directly to Figma CSS */}
      <div className="flex-1 w-full min-w-0 flex flex-col items-start p-4 sm:p-6 lg:p-8 gap-6 self-stretch">
        {/* ========================================================= */}
        {/* 📌 [filter-bar]: Filters Row + Actions                     */}
        {/* ========================================================= */}
        <div
          className={`w-full box-border flex flex-col lg:flex-row justify-between items-start lg:items-center p-4 sm:p-5 gap-4 rounded-[12px] border ${
            isLight
              ? "bg-white border-[#E4E4E7] shadow-xs"
              : "bg-[#383838] border-[#444444]"
          }`}
        >
          {/* filters container */}
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 flex-1">
            {/* filter-date */}
            <div
              className={`box-border flex flex-row items-center px-3 py-1.5 gap-2 h-[34px] rounded-[6px] border text-[13px] transition-colors cursor-pointer select-none ${
                isLight
                  ? "bg-slate-50 border-[#E4E4E7] text-slate-800 hover:bg-slate-100"
                  : "bg-[#2C2C2C] border-[#444444] text-[#F8FAFC] hover:bg-white/5"
              }`}
              style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
            >
              <Calendar size={14} className={isLight ? "text-slate-600" : "text-[#A1A1AA]"} />
              <span>
                {isThai ? `ช่วงเวลา: ${dateRange}` : `Period: 20 Oct - 24 Oct 2023`}
              </span>
              <ChevronDown size={13} className={isLight ? "text-slate-600" : "text-[#A1A1AA]"} />
            </div>

            {/* filter-type */}
            <div
              className={`box-border flex flex-row items-center px-3 py-1.5 gap-2 h-[34px] rounded-[6px] border text-[13px] transition-colors ${
                isLight
                  ? "bg-slate-50 border-[#E4E4E7] text-slate-800"
                  : "bg-[#2C2C2C] border-[#444444] text-[#F8FAFC]"
              }`}
              style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
            >
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="bg-transparent border-none outline-none cursor-pointer text-[13px] appearance-none pr-3"
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                <option value="all" className={isLight ? "bg-white text-black" : "bg-[#2C2C2C] text-white"}>
                  {isThai ? "ประเภทการเคลื่อนไหว: ทั้งหมด" : "Movement: All"}
                </option>
                <option value="inbound" className={isLight ? "bg-white text-black" : "bg-[#2C2C2C] text-white"}>
                  {isThai ? "รับสินค้าเข้า" : "Inbound"}
                </option>
                <option value="outbound" className={isLight ? "bg-white text-black" : "bg-[#2C2C2C] text-white"}>
                  {isThai ? "เบิกออก" : "Outbound"}
                </option>
                <option value="transfer" className={isLight ? "bg-white text-black" : "bg-[#2C2C2C] text-white"}>
                  {isThai ? "โอนย้ายคลัง" : "Transfer"}
                </option>
                <option value="adjustment" className={isLight ? "bg-white text-black" : "bg-[#2C2C2C] text-white"}>
                  {isThai ? "ปรับปรุงยอด" : "Adjustment"}
                </option>
              </select>
              <ChevronDown size={13} className={isLight ? "text-slate-600" : "text-[#A1A1AA] pointer-events-none"} />
            </div>

            {/* filter-user */}
            <div
              className={`box-border flex flex-row items-center px-3 py-1.5 gap-2 h-[34px] rounded-[6px] border text-[13px] transition-colors ${
                isLight
                  ? "bg-slate-50 border-[#E4E4E7] text-slate-800"
                  : "bg-[#2C2C2C] border-[#444444] text-[#F8FAFC]"
              }`}
              style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
            >
              <select
                value={selectedUser}
                onChange={(e) => setSelectedUser(e.target.value)}
                className="bg-transparent border-none outline-none cursor-pointer text-[13px] appearance-none pr-3"
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                <option value="all" className={isLight ? "bg-white text-black" : "bg-[#2C2C2C] text-white"}>
                  {isThai ? "ผู้ดำเนินการ: ทั้งหมด" : "Operator: All"}
                </option>
                <option value="สมชาย ใจดี" className={isLight ? "bg-white text-black" : "bg-[#2C2C2C] text-white"}>
                  {isThai ? "ผู้ดำเนินการ: สมชาย ใจดี" : "Somchai Jaidee"}
                </option>
                <option value="วิชัย ยอดรัก" className={isLight ? "bg-white text-black" : "bg-[#2C2C2C] text-white"}>
                  {isThai ? "ผู้ดำเนินการ: วิชัย ยอดรัก" : "Wichai Yodrak"}
                </option>
                <option value="นภา มั่นคง" className={isLight ? "bg-white text-black" : "bg-[#2C2C2C] text-white"}>
                  {isThai ? "ผู้ดำเนินการ: นภา มั่นคง" : "Napa Mankong"}
                </option>
              </select>
              <ChevronDown size={13} className={isLight ? "text-slate-600" : "text-[#A1A1AA] pointer-events-none"} />
            </div>
          </div>

          {/* actions: btn-export */}
          <div className="flex items-center shrink-0">
            <button
              type="button"
              className={`box-border flex flex-row items-center px-4 py-1.5 gap-2 h-[34px] rounded-[6px] border text-[13px] font-medium transition-colors cursor-pointer ${
                isLight
                  ? "bg-slate-50 border-[#E4E4E7] text-slate-800 hover:bg-slate-100"
                  : "bg-[#2C2C2C] border-[#444444] text-[#F8FAFC] hover:bg-white/5"
              }`}
              style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
            >
              <Download size={14} className={isLight ? "text-slate-700" : "text-[#F8FAFC]"} />
              <span>{isThai ? "ดาวน์โหลดเอกสาร" : "Export Logs"}</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 📌 [audit-log-container]: Table & Pagination               */}
        {/* ========================================================= */}
        <div
          className={`w-full box-border flex flex-col items-start p-4 sm:p-5 gap-4 rounded-[12px] border ${
            isLight
              ? "bg-white border-[#E4E4E7] shadow-sm"
              : "bg-[#383838] border-[#444444]"
          }`}
        >
          {/* table wrapper */}
          <div
            className={`w-full rounded-[12px] border overflow-hidden ${
              isLight ? "bg-white border-[#E4E4E7] shadow-xs" : "bg-[#383838] border-[#444444]"
            }`}
          >
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left text-[13px] border-collapse min-w-[900px]">
                {/* row-header */}
                <thead>
                  <tr
                    className={`h-[42px] border-b text-[12.5px] font-semibold text-white select-none ${
                      isLight ? "bg-slate-900 border-slate-800" : "bg-[#282828] border-[#444444]"
                    }`}
                    style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                  >
                  <th className="py-2.5 px-4 w-[170px]">{isThai ? "วันเวลา" : "Timestamp"}</th>
                  <th className="py-2.5 px-3 w-[120px]">{isThai ? "ประเภท" : "Type"}</th>
                  <th className="py-2.5 px-3 w-[120px]">{isThai ? "รหัสสินค้า" : "SKU"}</th>
                  <th className="py-2.5 px-4">{isThai ? "ชื่อสินค้า" : "Product Name"}</th>
                  <th className="py-2.5 px-3 text-right w-[90px]">{isThai ? "จำนวน" : "Qty"}</th>
                  <th className="py-2.5 px-4 w-[140px]">{isThai ? "คลัง" : "Warehouse"}</th>
                  <th className="py-2.5 px-4 w-[130px]">{isThai ? "ผู้ดำเนินการ" : "Operator"}</th>
                  <th className="py-2.5 px-4 w-[210px]">{isThai ? "หมายเหตุ" : "Notes"}</th>
                </tr>
              </thead>

              {/* table body */}
              <tbody
                className={`divide-y ${
                  isLight ? "divide-slate-200" : "divide-[#444444]"
                }`}
              >
                {filteredRecords.map((log) => (
                  <tr
                    key={log.id}
                    className={`h-[50px] transition-colors ${
                      isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.02]"
                    }`}
                  >
                    {/* วันเวลา */}
                    <td className="py-3 px-4 font-mono text-[12.5px]">
                      <span className={isLight ? "text-slate-900" : "text-[#F8FAFC]"}>
                        {log.timestamp}
                      </span>
                    </td>

                    {/* ประเภท (Color badge per Figma specs) */}
                    <td className="py-3 px-3">
                      {log.type === "inbound" && (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold"
                          style={{
                            backgroundColor: "rgba(46, 196, 182, 0.12)",
                            color: "#2EC4B6",
                            fontFamily: "'Geist', var(--font-geist-sans), sans-serif",
                          }}
                        >
                          {isThai ? log.typeTh : log.typeEn}
                        </span>
                      )}
                      {log.type === "outbound" && (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold"
                          style={{
                            backgroundColor: "rgba(231, 29, 54, 0.12)",
                            color: "#E71D36",
                            fontFamily: "'Geist', var(--font-geist-sans), sans-serif",
                          }}
                        >
                          {isThai ? log.typeTh : log.typeEn}
                        </span>
                      )}
                      {log.type === "transfer" && (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold"
                          style={{
                            backgroundColor: "rgba(13, 153, 255, 0.12)",
                            color: "#0D99FF",
                            fontFamily: "'Geist', var(--font-geist-sans), sans-serif",
                          }}
                        >
                          {isThai ? log.typeTh : log.typeEn}
                        </span>
                      )}
                      {log.type === "adjustment" && (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-[4px] text-[11px] font-semibold"
                          style={{
                            backgroundColor: "rgba(255, 159, 28, 0.12)",
                            color: "#FF9F1C",
                            fontFamily: "'Geist', var(--font-geist-sans), sans-serif",
                          }}
                        >
                          {isThai ? log.typeTh : log.typeEn}
                        </span>
                      )}
                    </td>

                    {/* รหัสสินค้า */}
                    <td className="py-3 px-3 font-mono font-medium text-[12.5px]">
                      <span className={isLight ? "text-slate-800" : "text-[#F8FAFC]"}>
                        {log.sku}
                      </span>
                    </td>

                    {/* ชื่อสินค้า */}
                    <td className="py-3 px-4 font-medium">
                      <span className={isLight ? "text-slate-900" : "text-[#F8FAFC]"}>
                        {isThai ? log.productNameTh : log.productNameEn}
                      </span>
                    </td>

                    {/* จำนวน (Green for +, Red for -) */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-[13px]">
                      <span
                        style={{
                          color: log.quantityChange > 0 ? "#2EC4B6" : "#E71D36",
                        }}
                      >
                        {log.quantityChange > 0 ? `+${log.quantityChange}` : log.quantityChange}
                      </span>
                    </td>

                    {/* คลัง */}
                    <td className="py-3 px-4">
                      <span className={isLight ? "text-slate-800" : "text-[#F8FAFC]"}>
                        {isThai ? log.warehouseTh : log.warehouseEn}
                      </span>
                    </td>

                    {/* ผู้ดำเนินการ */}
                    <td className="py-3 px-4">
                      <span className={isLight ? "text-slate-800" : "text-[#F8FAFC]"}>
                        {isThai ? log.operatorTh : log.operatorEn}
                      </span>
                    </td>

                    {/* หมายเหตุ */}
                    <td className="py-3 px-4 text-[#A1A1AA] text-[12.5px] truncate max-w-[210px]">
                      {isThai ? log.notesTh : log.notesEn}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

          {/* ========================================================= */}
          {/* pagination                                                */}
          {/* ========================================================= */}
          <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-zinc-200 dark:border-white/5">
            {/* แสดงรายการ */}
            <span
              className={`text-[12.5px] ${
                isLight ? "text-slate-500" : "text-[#A1A1AA]"
              }`}
              style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
            >
              {isThai
                ? "แสดง 1-5 จากทั้งหมด 1,240 รายการ"
                : "Showing 1-5 of 1,240 records"}
            </span>

            {/* pages-btn */}
            <div className="flex items-center gap-2">
              {/* ก่อนหน้า */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`box-border flex items-center justify-center px-3 py-1.5 h-[29px] rounded-[4px] border text-[12px] transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                  isLight
                    ? "bg-slate-50 border-[#E4E4E7] text-slate-600 hover:bg-slate-100"
                    : "bg-[#2C2C2C] border-[#444444] text-[#A1A1AA] hover:bg-white/5"
                }`}
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                {isThai ? "ก่อนหน้า" : "Previous"}
              </button>

              {/* Page 1 (Active) */}
              <button
                type="button"
                onClick={() => setCurrentPage(1)}
                className={`flex items-center justify-center px-3 py-1.5 h-[29px] rounded-[4px] text-[12px] font-bold transition-colors cursor-pointer ${
                  currentPage === 1
                    ? isLight
                      ? "bg-slate-900 text-white"
                      : "bg-white text-black"
                    : isLight
                    ? "bg-slate-50 border border-[#E4E4E7] text-slate-700"
                    : "bg-[#2C2C2C] border border-[#444444] text-[#F8FAFC]"
                }`}
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                1
              </button>

              {/* Page 2 */}
              <button
                type="button"
                onClick={() => setCurrentPage(2)}
                className={`flex items-center justify-center px-3 py-1.5 h-[29px] rounded-[4px] text-[12px] font-medium transition-colors cursor-pointer ${
                  currentPage === 2
                    ? isLight
                      ? "bg-slate-900 text-white"
                      : "bg-white text-black"
                    : isLight
                    ? "bg-slate-50 border border-[#E4E4E7] text-slate-700 hover:bg-slate-100"
                    : "bg-[#2C2C2C] border border-[#444444] text-[#F8FAFC] hover:bg-white/5"
                }`}
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                2
              </button>

              {/* Page 3 */}
              <button
                type="button"
                onClick={() => setCurrentPage(3)}
                className={`flex items-center justify-center px-3 py-1.5 h-[29px] rounded-[4px] text-[12px] font-medium transition-colors cursor-pointer ${
                  currentPage === 3
                    ? isLight
                      ? "bg-slate-900 text-white"
                      : "bg-white text-black"
                    : isLight
                    ? "bg-slate-50 border border-[#E4E4E7] text-slate-700 hover:bg-slate-100"
                    : "bg-[#2C2C2C] border border-[#444444] text-[#F8FAFC] hover:bg-white/5"
                }`}
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                3
              </button>

              {/* ถัดไป */}
              <button
                type="button"
                onClick={() => setCurrentPage((p) => p + 1)}
                className={`box-border flex items-center justify-center px-3 py-1.5 h-[29px] rounded-[4px] border text-[12px] transition-colors cursor-pointer ${
                  isLight
                    ? "bg-slate-50 border-[#E4E4E7] text-slate-600 hover:bg-slate-100"
                    : "bg-[#2C2C2C] border-[#444444] text-[#A1A1AA] hover:bg-white/5"
                }`}
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                {isThai ? "ถัดไป" : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </WarehousePageTemplate>
  );
}
