"use client";

import React, { useState } from "react";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import {
  Check,
  CheckCircle2,
  ChevronDown,
  Plus,
  ScanBarcode,
  Barcode,
  User,
  Building2,
  Calendar,
  AlertCircle,
  FileCheck,
  Save,
  X,
  ShieldCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface POItem {
  id: number;
  sku: string;
  nameTh: string;
  nameEn: string;
  orderedQty: number;
  receivedQty: number;
  unitTh: string;
  unitEn: string;
  status: "pass" | "shortage" | "pending";
  shortageCount?: number;
}

const INITIAL_PO_ITEMS: POItem[] = [
  {
    id: 1,
    sku: "SKU-99420",
    nameTh: "เครื่องปั่นไฟดีเซล 5KW",
    nameEn: "Diesel Generator 5KW",
    orderedQty: 20,
    receivedQty: 20,
    unitTh: "เครื่อง",
    unitEn: "Units",
    status: "pass",
  },
  {
    id: 2,
    sku: "SKU-99421",
    nameTh: "หม้อแปลงกระแสไฟฟ้า CT 100/5A",
    nameEn: "Current Transformer CT 100/5A",
    orderedQty: 10,
    receivedQty: 8,
    unitTh: "ชิ้น",
    unitEn: "Pcs",
    status: "shortage",
    shortageCount: 2,
  },
  {
    id: 3,
    sku: "SKU-99422",
    nameTh: "สายเคเบิลหุ้มฉนวน XLPE 4 Core",
    nameEn: "XLPE 4 Core Power Cable",
    orderedQty: 300,
    receivedQty: 300,
    unitTh: "เมตร",
    unitEn: "Meters",
    status: "pass",
  },
  {
    id: 4,
    sku: "SKU-99423",
    nameTh: "สปอตไลท์ LED 200W IP66",
    nameEn: "Industrial Floodlight LED 200W",
    orderedQty: 50,
    receivedQty: 50,
    unitTh: "กล่อง",
    unitEn: "Boxes",
    status: "pass",
  },
];

interface QCCheckItem {
  id: string;
  titleTh: string;
  titleEn: string;
  passed: boolean;
  issue: boolean;
}

const INITIAL_QC_ITEMS: QCCheckItem[] = [
  {
    id: "qc-1",
    titleTh: "ตรวจสอบสภาพกล่องและบรรจุภัณฑ์ภายนอก",
    titleEn: "Inspect external packaging condition",
    passed: true,
    issue: false,
  },
  {
    id: "qc-2",
    titleTh: "ตรวจนับจำนวนสินค้าจริงตรงตามใบส่งของ",
    titleEn: "Verify actual item count against dispatch note",
    passed: true,
    issue: false,
  },
  {
    id: "qc-3",
    titleTh: "ตรวจสอบความเสียหายของตัวสินค้าทางกายภาพ",
    titleEn: "Physical damage inspection on products",
    passed: true,
    issue: false,
  },
  {
    id: "qc-4",
    titleTh: "ทดสอบการเปิดใช้งานเบื้องต้น (เครื่องปั่นไฟ)",
    titleEn: "Operational power test (Generators)",
    passed: true,
    issue: false,
  },
  {
    id: "qc-5",
    titleTh: "ตรวจสอบหมายเลขซีเรียลตรงตามเอกสาร",
    titleEn: "Cross-check serial numbers with docs",
    passed: false,
    issue: true,
  },
];

export default function ReceivingPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";

  // Form State
  const [grnNumber] = useState("GRN-2566-1024");
  const [supplierName, setSupplierName] = useState("บริษัท สยาม อิเล็กทริค พาวเวอร์ ซัพพลาย จำกัด");
  const [receiveDate] = useState(isThai ? "24 ต.ค. 2566" : "24 Oct 2023");
  const [destinationWarehouse, setDestinationWarehouse] = useState("คลังหลัก A - โซนเครื่องใช้ไฟฟ้า");

  // Items State
  const [poItems, setPoItems] = useState<POItem[]>(INITIAL_PO_ITEMS);
  const [qcItems, setQcItems] = useState<QCCheckItem[]>(INITIAL_QC_ITEMS);
  const [barcodeInput, setBarcodeInput] = useState("");
  const [notification, setNotification] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const handleQtyChange = (id: number, val: number) => {
    setPoItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(0, val);
          const isShortage = newQty < item.orderedQty;
          return {
            ...item,
            receivedQty: newQty,
            status: isShortage ? "shortage" : "pass",
            shortageCount: isShortage ? item.orderedQty - newQty : undefined,
          };
        }
        return item;
      })
    );
  };

  const toggleQc = (id: string) => {
    setQcItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextPassed = !item.passed;
          return {
            ...item,
            passed: nextPassed,
            issue: !nextPassed,
          };
        }
        return item;
      })
    );
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    setNotification(
      isThai
        ? `ตรวจพบบาร์โค้ด [${barcodeInput}] สแกนบันทึกเข้าระบบแล้ว`
        : `Barcode [${barcodeInput}] logged successfully.`
    );
    setBarcodeInput("");
    setTimeout(() => setNotification(null), 3500);
  };

  const handleConfirmReceiving = () => {
    setNotification(
      isThai
        ? `ยืนยันการรับสินค้าเข้าคลังสำเร็จ (เลขที่ ${grnNumber})`
        : `Receiving confirmed successfully (${grnNumber})`
    );
    setTimeout(() => setNotification(null), 4000);
  };

  // QC Passed count
  const qcPassedCount = qcItems.filter((q) => q.passed).length;
  const qcPercentage = Math.round((qcPassedCount / qcItems.length) * 100);

  return (
    <WarehousePageTemplate
      titleEn="Goods Receiving Inspection"
      titleTh="การตรวจรับสินค้าเข้าคลัง"
      routePath="/warehouse/receive"
      iconName="inbound"
      fullBleed
    >
      {/* split-layout: Full bleed two-pane container */}
      <div className="flex-1 w-full min-w-0 flex flex-col xl:flex-row items-stretch self-stretch">
        {/* ========================================================= */}
        {/* 📌 [LEFT PANE]: Auto layout padding: 32px, gap: 24px      */}
        {/* ========================================================= */}
        <div className="flex-1 min-w-0 flex flex-col items-start p-4 sm:p-6 lg:p-8 gap-6">
          {/* Notification Toast */}
          <AnimatePresence>
            {notification && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg border text-[12.5px] font-medium self-end ${
                  isLight
                    ? "bg-slate-900 text-white border-black"
                    : "bg-white text-black border-zinc-200"
                }`}
              >
                <CheckCircle2 size={14} />
                <span>{notification}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* progress-stepper */}
          <div
            className={`w-full box-border flex flex-row items-center px-4 sm:px-6 py-3.5 gap-3 sm:gap-4 rounded-[12px] border overflow-x-auto ${
              isLight
                ? "bg-white border-[#E4E4E7] shadow-xs"
                : "bg-[#383838] border-[#444444]"
            }`}
          >
            {/* step-1: สร้างใบรับ (Completed) */}
            <div className="flex flex-row items-center gap-2.5 sm:gap-3 flex-1 min-w-[130px]">
              <div
                className={`w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0 ${
                  isLight ? "bg-slate-900 text-white" : "bg-white text-black font-bold"
                }`}
              >
                <Check size={14} strokeWidth={2.5} />
              </div>
              <span
                className={`text-[13px] sm:text-[14px] font-semibold whitespace-nowrap ${
                  isLight ? "text-slate-900" : "text-white"
                }`}
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                {isThai ? "สร้างใบรับ" : "Create GR"}
              </span>
              <div
                className={`flex-1 h-[2px] min-w-[20px] ${
                  isLight ? "bg-slate-900" : "bg-white"
                }`}
              />
            </div>

            {/* step-2: ตรวจสอบ (Current Active) */}
            <div className="flex flex-row items-center gap-2.5 sm:gap-3 flex-1 min-w-[130px]">
              <div
                className={`w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0 font-bold text-[13px] border ${
                  isLight
                    ? "bg-slate-100 text-slate-900 border-slate-900"
                    : "bg-white/15 text-white border-white"
                }`}
              >
                2
              </div>
              <span
                className={`text-[13px] sm:text-[14px] font-bold whitespace-nowrap ${
                  isLight ? "text-slate-900" : "text-[#F8FAFC]"
                }`}
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                {isThai ? "ตรวจสอบ" : "Inspect"}
              </span>
              <div
                className={`flex-1 h-[2px] min-w-[20px] ${
                  isLight ? "bg-[#E4E4E7]" : "bg-[#444444]"
                }`}
              />
            </div>

            {/* step-3: ยืนยัน (Upcoming) */}
            <div className="flex flex-row items-center gap-2.5 sm:gap-3 flex-1 min-w-[110px]">
              <div
                className={`w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0 font-bold text-[13px] ${
                  isLight ? "bg-slate-100 text-slate-400" : "bg-[#444444] text-[#A1A1AA]"
                }`}
              >
                3
              </div>
              <span
                className={`text-[13px] sm:text-[14px] font-medium whitespace-nowrap ${
                  isLight ? "text-slate-400" : "text-[#A1A1AA]"
                }`}
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                {isThai ? "ยืนยัน" : "Confirm"}
              </span>
              <div
                className={`flex-1 h-[2px] min-w-[20px] ${
                  isLight ? "bg-[#E4E4E7]" : "bg-[#444444]"
                }`}
              />
            </div>

            {/* step-4: เสร็จสิ้น (Upcoming) */}
            <div className="flex flex-row items-center gap-2.5 sm:gap-3 shrink-0">
              <div
                className={`w-[28px] h-[28px] rounded-full flex items-center justify-center shrink-0 font-bold text-[13px] ${
                  isLight ? "bg-slate-100 text-slate-400" : "bg-[#444444] text-[#A1A1AA]"
                }`}
              >
                4
              </div>
              <span
                className={`text-[13px] sm:text-[14px] font-medium whitespace-nowrap ${
                  isLight ? "text-slate-400" : "text-[#A1A1AA]"
                }`}
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                {isThai ? "เสร็จสิ้น" : "Completed"}
              </span>
            </div>
          </div>

          {/* ========================================================= */}
          {/* form-container: ข้อมูลการตรวจรับเบื้องต้น */}
          {/* ========================================================= */}
          <div
            className={`w-full box-border flex flex-col items-start p-5 sm:p-6 gap-4 rounded-[12px] border ${
              isLight
                ? "bg-white border-[#E4E4E7] shadow-xs"
                : "bg-[#383838] border-[#444444]"
            }`}
          >
            <h3
              className={`text-[16px] font-bold leading-[21px] ${
                isLight ? "text-slate-900" : "text-[#F8FAFC]"
              }`}
              style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
            >
              {isThai ? "ข้อมูลการตรวจรับเบื้องต้น" : "Initial Receiving Information"}
            </h3>

            {/* form-grid */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* text-field: เลขที่ใบรับสินค้า */}
              <div className="flex flex-col items-start gap-2">
                <label
                  className={`text-[12.5px] font-medium leading-[17px] ${
                    isLight ? "text-slate-600" : "text-[#A1A1AA]"
                  }`}
                  style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                >
                  {isThai ? "เลขที่ใบรับสินค้า" : "GRN Number"}
                </label>
                <div
                  className={`w-full box-border flex items-center px-3.5 h-[40px] rounded-[8px] border font-mono text-[13.5px] ${
                    isLight
                      ? "bg-[#F8FAFC] border-[#E4E4E7] text-slate-900"
                      : "bg-[#2C2C2C] border-[#444444] text-[#F8FAFC]"
                  }`}
                >
                  {grnNumber}
                </div>
              </div>

              {/* dropdown-field: ซัพพลายเออร์ */}
              <div className="flex flex-col items-start gap-2">
                <label
                  className={`text-[12.5px] font-medium leading-[17px] ${
                    isLight ? "text-slate-600" : "text-[#A1A1AA]"
                  }`}
                  style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                >
                  {isThai ? "ซัพพลายเออร์" : "Supplier"}
                </label>
                <div
                  className={`w-full box-border flex items-center justify-between px-3.5 h-[40px] rounded-[8px] border ${
                    isLight
                      ? "bg-[#F8FAFC] border-[#E4E4E7] text-slate-900"
                      : "bg-[#2C2C2C] border-[#444444] text-[#F8FAFC]"
                  }`}
                >
                  <span className="text-[13px] truncate">
                    {supplierName}
                  </span>
                  <ChevronDown size={15} className="shrink-0 text-[#A1A1AA]" />
                </div>
              </div>

              {/* text-field: วันที่รับสินค้า */}
              <div className="flex flex-col items-start gap-2">
                <label
                  className={`text-[12.5px] font-medium leading-[17px] ${
                    isLight ? "text-slate-600" : "text-[#A1A1AA]"
                  }`}
                  style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                >
                  {isThai ? "วันที่รับสินค้า" : "Receive Date"}
                </label>
                <div
                  className={`w-full box-border flex items-center px-3.5 h-[40px] rounded-[8px] border text-[13px] ${
                    isLight
                      ? "bg-[#F8FAFC] border-[#E4E4E7] text-slate-900"
                      : "bg-[#2C2C2C] border-[#444444] text-[#F8FAFC]"
                  }`}
                >
                  {receiveDate}
                </div>
              </div>

              {/* dropdown-field: คลังสินค้าปลายทาง */}
              <div className="flex flex-col items-start gap-2">
                <label
                  className={`text-[12.5px] font-medium leading-[17px] ${
                    isLight ? "text-slate-600" : "text-[#A1A1AA]"
                  }`}
                  style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                >
                  {isThai ? "คลังสินค้าปลายทาง" : "Destination Warehouse"}
                </label>
                <div
                  className={`w-full box-border flex items-center justify-between px-3.5 h-[40px] rounded-[8px] border ${
                    isLight
                      ? "bg-[#F8FAFC] border-[#E4E4E7] text-slate-900"
                      : "bg-[#2C2C2C] border-[#444444] text-[#F8FAFC]"
                  }`}
                >
                  <span className="text-[13px] truncate">
                    {destinationWarehouse}
                  </span>
                  <ChevronDown size={15} className="shrink-0 text-[#A1A1AA]" />
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================= */}
          {/* table-container: รายการสินค้าตามใบสั่งซื้อ (PO) */}
          {/* ========================================================= */}
          <div
            className={`w-full box-border flex flex-col items-start p-5 sm:p-6 gap-4 rounded-[12px] border ${
              isLight
                ? "bg-white border-[#E4E4E7] shadow-xs"
                : "bg-[#383838] border-[#444444]"
            }`}
          >
            {/* table-header-row */}
            <div className="w-full flex flex-row justify-between items-center">
              <h3
                className={`text-[16px] font-bold leading-[21px] ${
                  isLight ? "text-slate-900" : "text-[#F8FAFC]"
                }`}
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                {isThai ? "รายการสินค้าตามใบสั่งซื้อ" : "Purchase Order Items"}
              </h3>

              {/* table-actions */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className={`box-border flex flex-row items-center px-3.5 py-1.5 gap-1.5 h-[34px] rounded-[6px] border text-[12.5px] font-medium transition-colors cursor-pointer ${
                    isLight
                      ? "bg-slate-50 border-[#E4E4E7] text-slate-800 hover:bg-slate-100"
                      : "bg-[#2C2C2C] border-[#444444] text-[#F8FAFC] hover:bg-white/5"
                  }`}
                  style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                >
                  <ScanBarcode size={14} className={isLight ? "text-slate-800" : "text-[#F8FAFC]"} />
                  <span>{isThai ? "สแกนบาร์โค้ด / ตรวจ QC" : "Barcode / QC Panel"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(true)}
                  className={`box-border flex flex-row items-center px-3.5 py-1.5 gap-1.5 h-[34px] rounded-[6px] border text-[12.5px] font-medium transition-colors cursor-pointer ${
                    isLight
                      ? "bg-slate-900 border-slate-900 text-white hover:bg-black"
                      : "bg-white border-white text-black hover:bg-zinc-200"
                  }`}
                  style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                >
                  <Plus size={14} />
                  <span>{isThai ? "เพิ่มรายการนอกใบสั่งซื้อ" : "Add Non-PO Item"}</span>
                </button>
              </div>
            </div>

            {/* table wrapper */}
            <div
              className={`w-full rounded-[12px] border overflow-hidden ${
                isLight ? "bg-white border-[#E4E4E7] shadow-xs" : "bg-[#383838] border-[#444444]"
              }`}
            >
              <div className="w-full overflow-x-auto">
                <table className="w-full text-left text-[13px] border-collapse min-w-[640px]">
                  <thead>
                    <tr
                      className={`h-[42px] border-b text-[12.5px] font-semibold text-white select-none ${
                        isLight ? "bg-slate-900 border-slate-800" : "bg-[#282828] border-[#444444]"
                      }`}
                      style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                    >
                      <th className="py-2.5 px-3 w-[45px] text-center">{isThai ? "ลำดับ" : "No."}</th>
                      <th className="py-2.5 px-3 w-[120px]">{isThai ? "รหัสสินค้า" : "SKU"}</th>
                      <th className="py-2.5 px-3">{isThai ? "ชื่อสินค้า" : "Product Name"}</th>
                      <th className="py-2.5 px-3 text-right w-[95px]">{isThai ? "จำนวนสั่ง" : "Ordered"}</th>
                      <th className="py-2.5 px-3 text-right w-[110px]">{isThai ? "จำนวนรับ" : "Received"}</th>
                      <th className="py-2.5 px-3 text-center w-[75px]">{isThai ? "หน่วย" : "UOM"}</th>
                      <th className="py-2.5 px-3 text-center w-[100px]">{isThai ? "สถานะตรวจ" : "Status"}</th>
                    </tr>
                  </thead>
                <tbody
                  className={`divide-y ${
                    isLight ? "divide-slate-200" : "divide-[#444444]"
                  }`}
                >
                  {poItems.map((item) => (
                    <tr
                      key={item.id}
                      className={`h-[49px] transition-colors ${
                        isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.02]"
                      }`}
                    >
                      {/* ลำดับ */}
                      <td className="py-2.5 px-3 text-center font-mono text-[#A1A1AA]">
                        {item.id}
                      </td>

                      {/* รหัสสินค้า */}
                      <td className="py-2.5 px-3 font-mono font-medium">
                        <span className={isLight ? "text-slate-800" : "text-[#F8FAFC]"}>
                          {item.sku}
                        </span>
                      </td>

                      {/* ชื่อสินค้า */}
                      <td className="py-2.5 px-3 font-medium">
                        <span className={isLight ? "text-slate-900" : "text-[#F8FAFC]"}>
                          {isThai ? item.nameTh : item.nameEn}
                        </span>
                      </td>

                      {/* จำนวนสั่ง */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-[#A1A1AA]">
                        {item.orderedQty}
                      </td>

                      {/* จำนวนรับ (editable) */}
                      <td className="py-2.5 px-3 text-right">
                        <div className="flex justify-end">
                          <input
                            type="number"
                            value={item.receivedQty}
                            onChange={(e) => handleQtyChange(item.id, parseInt(e.target.value) || 0)}
                            className={`w-[64px] h-[26px] px-2 text-right font-mono font-bold text-[13px] rounded border outline-none ${
                              item.status === "shortage"
                                ? "text-amber-500 border-amber-500/40"
                                : isLight
                                ? "bg-white border-slate-300 text-slate-900 focus:border-slate-900"
                                : "bg-[#2C2C2C] border-[#444444] text-white focus:border-white"
                            }`}
                          />
                        </div>
                      </td>

                      {/* หน่วย */}
                      <td className="py-2.5 px-3 text-center text-[#A1A1AA]">
                        {isThai ? item.unitTh : item.unitEn}
                      </td>

                      {/* สถานะตรวจ (Color reserved strictly for status distinction) */}
                      <td className="py-2.5 px-3 text-center">
                        {item.status === "pass" ? (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold"
                            style={{
                              backgroundColor: "rgba(46, 196, 182, 0.12)",
                              color: "#2EC4B6",
                            }}
                          >
                            {isThai ? "ผ่าน" : "Pass"}
                          </span>
                        ) : (
                          <span
                            className="inline-flex items-center px-2.5 py-0.5 rounded text-[11px] font-bold"
                            style={{
                              backgroundColor: "rgba(231, 29, 54, 0.12)",
                              color: "#E71D36",
                            }}
                          >
                            {isThai ? `ขาด ${item.shortageCount}` : `Short ${item.shortageCount}`}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

          {/* ========================================================= */}
          {/* bottom-action-bar */}
          {/* ========================================================= */}
          <div className="w-full flex flex-col sm:flex-row justify-between items-center gap-3 pt-2">
            {/* btn-cancel */}
            <button
              type="button"
              className={`box-border flex items-center justify-center px-5 py-2.5 h-[40px] rounded-[8px] border text-[13.5px] font-semibold transition-colors cursor-pointer w-full sm:w-auto ${
                isLight
                  ? "bg-white border-[#E4E4E7] text-slate-600 hover:bg-slate-100"
                  : "bg-[#383838] border-[#444444] text-[#A1A1AA] hover:bg-white/5"
              }`}
              style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
            >
              {isThai ? "ยกเลิกขั้นตอน" : "Cancel Process"}
            </button>

            {/* right-actions: draft & submit */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
              <button
                type="button"
                className={`box-border flex items-center justify-center px-5 py-2.5 h-[40px] rounded-[8px] border text-[13.5px] font-semibold transition-colors cursor-pointer ${
                  isLight
                    ? "bg-white border-[#E4E4E7] text-slate-800 hover:bg-slate-100"
                    : "bg-[#383838] border-[#444444] text-[#F8FAFC] hover:bg-white/5"
                }`}
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                {isThai ? "บันทึกแบบร่าง" : "Save Draft"}
              </button>

              <button
                type="button"
                onClick={handleConfirmReceiving}
                className={`box-border flex items-center justify-center px-6 py-2.5 h-[40px] rounded-[8px] text-[13.5px] font-bold transition-all cursor-pointer shadow-xs ${
                  isLight
                    ? "bg-slate-900 hover:bg-black text-white"
                    : "bg-white hover:bg-zinc-200 text-black"
                }`}
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                {isThai ? "ยืนยันการรับสินค้าเข้าคลัง" : "Confirm Receiving"}
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 📌 [RIGHT DETAIL DRAWER]: Slide-over Drawer (Action Driven) */}
        {/* ========================================================= */}
        <AnimatePresence>
          {isDrawerOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0, x: 20 }}
              animate={{ width: "auto", opacity: 1, x: 0 }}
              exit={{ width: 0, opacity: 0, x: 20 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className={`w-full xl:w-[380px] shrink-0 border-t xl:border-t-0 xl:border-l p-5 sm:p-6 flex flex-col gap-6 overflow-hidden ${
                isLight
                  ? "bg-[#F8FAFC] border-slate-200 text-slate-800"
                  : "bg-[#383838] border-[#444444] text-[#F8FAFC]"
              }`}
            >
              {/* Drawer Top Header with Close Button */}
              <div className="w-full flex items-center justify-between pb-1 border-b border-zinc-200 dark:border-white/10">
                <div className="flex items-center gap-2">
                  <ScanBarcode size={18} className={isLight ? "text-slate-900" : "text-white"} />
                  <span
                    className="text-[14.5px] font-bold"
                    style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                  >
                    {isThai ? "แผงสแกนและตรวจสอบ" : "Inspection & Scan Panel"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className={`w-7 h-7 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                    isLight
                      ? "border-slate-200 text-slate-600 hover:bg-slate-200 hover:text-slate-950"
                      : "border-[#555555] text-zinc-300 hover:bg-white/10 hover:text-white"
                  }`}
                  title={isThai ? "ปิดแผง" : "Close panel"}
                >
                  <X size={15} />
                </button>
              </div>

              {/* barcode-section */}
              <div className="flex flex-col items-start gap-3 w-full">
                <h4
                  className="text-[15px] font-bold leading-[20px]"
                  style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                >
                  {isThai ? "สแกนบาร์โค้ดรับสินค้า" : "Barcode Receiving Scan"}
                </h4>

            {/* scan-placeholder */}
            <form
              onSubmit={handleBarcodeSubmit}
              className={`w-full box-border flex flex-col justify-center items-center p-6 gap-3 rounded-[12px] border border-dashed transition-colors ${
                isLight
                  ? "bg-white border-slate-300 text-slate-700"
                  : "bg-[#2C2C2C] border-zinc-600 text-zinc-300"
              }`}
            >
              <Barcode size={44} className={isLight ? "text-slate-800" : "text-white"} />
              <input
                type="text"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value)}
                placeholder={
                  isThai
                    ? "สแกนรหัสสินค้า หรือพิมพ์รหัสที่นี่..."
                    : "Scan item barcode or enter code here..."
                }
                className={`w-full text-[12.5px] text-center bg-transparent border-b pb-1 outline-none font-mono ${
                  isLight
                    ? "border-slate-300 placeholder:text-slate-400"
                    : "border-zinc-700 placeholder:text-zinc-500"
                }`}
              />
            </form>
          </div>

          <div
            className={`w-full h-[1px] ${
              isLight ? "bg-slate-200" : "bg-[#444444]"
            }`}
          />

          {/* qc-section */}
          <div className="flex flex-col items-start gap-3 w-full">
            <div className="w-full flex justify-between items-center">
              <h4
                className="text-[16px] font-bold leading-[21px]"
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                {isThai ? "รายการตรวจสอบคุณภาพ" : "Quality Inspection"}
              </h4>

              {/* qc-percentage badge */}
              <div
                className="px-2.5 py-1 rounded-full text-[11px] font-mono font-bold"
                style={{
                  backgroundColor: "rgba(46, 196, 182, 0.12)",
                  color: "#2EC4B6",
                }}
              >
                {qcPercentage}% {isThai ? "สำเร็จ" : "Done"}
              </div>
            </div>

            {/* qc-list */}
            <div className="w-full flex flex-col gap-2">
              {qcItems.map((qc) => {
                return (
                  <div
                    key={qc.id}
                    onClick={() => toggleQc(qc.id)}
                    className={`box-border flex items-center justify-between p-3 gap-2.5 rounded-[8px] border transition-all cursor-pointer select-none ${
                      isLight
                        ? "bg-white border-slate-200 hover:border-slate-300"
                        : "bg-[#2C2C2C] border-[#444444] hover:border-zinc-500"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {/* checkbox */}
                      <div
                        className={`w-[18px] h-[18px] rounded flex items-center justify-center shrink-0 transition-colors ${
                          qc.passed
                            ? isLight
                              ? "bg-slate-900 text-white"
                              : "bg-white text-black font-bold"
                            : isLight
                            ? "border border-slate-300 bg-slate-50"
                            : "border border-[#555555] bg-[#383838]"
                        }`}
                      >
                        {qc.passed && <Check size={11} strokeWidth={3} />}
                      </div>

                      <span
                        className={`text-[12.5px] leading-tight line-clamp-2 ${
                          isLight ? "text-slate-800" : "text-[#F8FAFC]"
                        }`}
                        style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                      >
                        {isThai ? qc.titleTh : qc.titleEn}
                      </span>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {qc.passed ? (
                        <span
                          className="px-2 py-0.5 rounded text-[10.5px] font-semibold"
                          style={{
                            backgroundColor: "rgba(46, 196, 182, 0.12)",
                            color: "#2EC4B6",
                          }}
                        >
                          {isThai ? "ผ่าน" : "Pass"}
                        </span>
                      ) : (
                        <span
                          className="px-2 py-0.5 rounded text-[10.5px] font-semibold"
                          style={{
                            backgroundColor: "rgba(231, 29, 54, 0.12)",
                            color: "#E71D36",
                          }}
                        >
                          {isThai ? "พบปัญหา" : "Issue"}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div
            className={`w-full h-[1px] ${
              isLight ? "bg-slate-200" : "bg-[#444444]"
            }`}
          />

          {/* assignee-section */}
          <div className="flex flex-col items-start gap-2.5 w-full mt-auto">
            <span
              className={`text-[12px] font-semibold leading-[17px] ${
                isLight ? "text-slate-500" : "text-[#A1A1AA]"
              }`}
              style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
            >
              {isThai ? "เจ้าหน้าที่ผู้ตรวจรับ" : "Inspecting Officer"}
            </span>

            {/* user-card */}
            <div
              className={`w-full box-border flex items-center p-3 gap-3 rounded-[8px] border ${
                isLight
                  ? "bg-white border-slate-200"
                  : "bg-[#2C2C2C] border-[#444444]"
              }`}
            >
              <div
                className={`w-[34px] h-[34px] rounded-full flex items-center justify-center font-bold text-[13px] shrink-0 ${
                  isLight
                    ? "bg-slate-900 text-white"
                    : "bg-white text-black"
                }`}
              >
                สช
              </div>
              <div className="flex flex-col items-start min-w-0">
                <span
                  className={`text-[13px] font-semibold leading-tight truncate ${
                    isLight ? "text-slate-900" : "text-[#F8FAFC]"
                  }`}
                  style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                >
                  {isThai ? "สมชาย ใจดี" : "Somchai Jaidee"}
                </span>
                <span
                  className="text-[11.5px] text-[#A1A1AA] truncate mt-0.5"
                  style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                >
                  {isThai ? "แผนกตรวจสอบคุณภาพสินค้าเข้า" : "Inbound Quality Assurance Dept."}
                </span>
              </div>
            </div>
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  </div>
    </WarehousePageTemplate>
  );
}
