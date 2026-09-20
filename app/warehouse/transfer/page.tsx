"use client";

import React, { useState, useMemo } from "react";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import {
  ArrowRight,
  ChevronDown,
  Info,
  CheckCircle2,
  FileCheck,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface NodeCenter {
  id: string;
  nameTh: string;
  nameEn: string;
  code: string;
}

const NODE_CENTERS: NodeCenter[] = [
  { id: "hub-1", code: "HQ-BKK", nameTh: "คลังสินค้ากลาง สำนักงานใหญ่", nameEn: "Main Dist. Hub (HQ)" },
  { id: "hub-2", code: "DEPOT-CHON", nameTh: "คลังสินค้าสาขา ภาคตะวันออก (ชลบุรี)", nameEn: "East Coast Depot" },
  { id: "hub-3", code: "NODE-BANGNA", nameTh: "คลังสินค้าสาขา บางนา", nameEn: "Bangna Node Center" },
  { id: "hub-4", code: "STORAGE-NORTH", nameTh: "คลังสินค้าสาขา ภาคเหนือ", nameEn: "North Storage" },
];

interface TransferProduct {
  sku: string;
  nameTh: string;
  nameEn: string;
  availableAtHQ: number;
  targetThresholdCap: number;
  unitTh: string;
  unitEn: string;
}

const AVAILABLE_PRODUCTS: TransferProduct[] = [
  {
    sku: "SKU-99420",
    nameTh: "เครื่องปั่นไฟดีเซล Cummins 500kVA",
    nameEn: "Cummins 500kVA Generator",
    availableAtHQ: 12,
    targetThresholdCap: 15,
    unitTh: "ชุด",
    unitEn: "Units",
  },
  {
    sku: "SKU-99428",
    nameTh: "รถโฟล์คลิฟท์ไฟฟ้า Toyota 2.5T",
    nameEn: "Toyota Forklift 2.5T",
    availableAtHQ: 4,
    targetThresholdCap: 6,
    unitTh: "คัน",
    unitEn: "Units",
  },
  {
    sku: "SKU-99421",
    nameTh: "หม้อแปลงปรับแรงดันไฟฟ้า 3 เฟส 800V",
    nameEn: "3-Phase Step Down Transformer 800V",
    availableAtHQ: 8,
    targetThresholdCap: 10,
    unitTh: "ตู้",
    unitEn: "Units",
  },
  {
    sku: "SKU-99425",
    nameTh: "ท่อร้อยสายไฟ EMT 1/2 นิ้ว (แพ็ค 50)",
    nameEn: "EMT Conduit Pipe 1/2 Inch (Pack 50)",
    availableAtHQ: 350,
    targetThresholdCap: 400,
    unitTh: "แพ็ค",
    unitEn: "Packs",
  },
];

interface TransferRecord {
  id: string;
  transferId: string;
  fromNodeTh: string;
  fromNodeEn: string;
  toNodeTh: string;
  toNodeEn: string;
  itemDescriptionTh: string;
  itemDescriptionEn: string;
  dateInitiated: string;
  status: "in_transit" | "completed" | "pending";
}

const INITIAL_RECORDS: TransferRecord[] = [
  {
    id: "rec-1",
    transferId: "TRF-294-81",
    fromNodeTh: "คลังสินค้ากลาง",
    fromNodeEn: "HQ Dist. Hub",
    toNodeTh: "คลังชลบุรี",
    toNodeEn: "East Coast Depot",
    itemDescriptionTh: "3x เครื่องปั่นไฟ Cummins 500kVA",
    itemDescriptionEn: "3x Cummins 500kVA Gen",
    dateInitiated: "18 Feb 2026",
    status: "in_transit",
  },
  {
    id: "rec-2",
    transferId: "TRF-902-12",
    fromNodeTh: "คลังภาคเหนือ",
    fromNodeEn: "North Storage",
    toNodeTh: "คลังสินค้ากลาง",
    toNodeEn: "HQ Dist. Hub",
    itemDescriptionTh: "1x รถโฟล์คลิฟท์ Toyota 2.5T",
    itemDescriptionEn: "1x Toyota Forklift 2.5T",
    dateInitiated: "17 Feb 2026",
    status: "completed",
  },
];

export default function TransferPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";

  // Form State
  const [fromNode, setFromNode] = useState("hub-1");
  const [toNode, setToNode] = useState("hub-2");
  const [selectedSku, setSelectedSku] = useState("SKU-99420");
  const [qtyToMove, setQtyToMove] = useState(3);
  const [records, setRecords] = useState<TransferRecord[]>(INITIAL_RECORDS);
  const [notification, setNotification] = useState<string | null>(null);

  // Selected product metadata
  const currentProduct = useMemo(() => {
    return AVAILABLE_PRODUCTS.find((p) => p.sku === selectedSku) || AVAILABLE_PRODUCTS[0];
  }, [selectedSku]);

  const fromNodeObj = useMemo(() => {
    return NODE_CENTERS.find((n) => n.id === fromNode) || NODE_CENTERS[0];
  }, [fromNode]);

  const toNodeObj = useMemo(() => {
    return NODE_CENTERS.find((n) => n.id === toNode) || NODE_CENTERS[1];
  }, [toNode]);

  const handleSwapNodes = () => {
    const temp = fromNode;
    setFromNode(toNode);
    setToNode(temp);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (fromNode === toNode) {
      alert(isThai ? "สาขาต้นทางและปลายทางต้องไม่เป็นสาขาเดียวกัน" : "Source and target node cannot be identical.");
      return;
    }
    if (qtyToMove <= 0) {
      alert(isThai ? "กรุณาระบุจำนวนสินค้าที่ต้องการโอนย้าย" : "Please enter a valid quantity to move.");
      return;
    }

    const newId = `TRF-${Math.floor(100 + Math.random() * 900)}-${Math.floor(10 + Math.random() * 90)}`;
    const newRecord: TransferRecord = {
      id: `rec-${Date.now()}`,
      transferId: newId,
      fromNodeTh: fromNodeObj.nameTh.replace("คลังสินค้าสาขา ", "").replace("คลังสินค้า", ""),
      fromNodeEn: fromNodeObj.nameEn.replace(" Dist. Hub", "").replace(" Center", ""),
      toNodeTh: toNodeObj.nameTh.replace("คลังสินค้าสาขา ", "").replace("คลังสินค้า", ""),
      toNodeEn: toNodeObj.nameEn.replace(" Dist. Hub", "").replace(" Center", ""),
      itemDescriptionTh: `${qtyToMove}x ${currentProduct.nameTh.split(" ")[0]} ${currentProduct.nameTh.split(" ")[1] || ""}`,
      itemDescriptionEn: `${qtyToMove}x ${currentProduct.nameEn}`,
      dateInitiated: isThai ? "วันนี้ 20 ก.พ. 2026" : "Today 20 Feb 2026",
      status: "in_transit",
    };

    setRecords([newRecord, ...records]);
    setNotification(
      isThai
        ? `สร้างคำสั่งโอนย้าย ${newId} สำเร็จแล้ว`
        : `Transfer order ${newId} created successfully.`
    );
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <WarehousePageTemplate
      titleEn="Stock Transfer Control"
      titleTh="ระบบควบคุมการโอนย้ายสินค้าระหว่างสาขา"
      routePath="/warehouse/transfer"
      iconName="transfer"
      fullBleed
    >
      {/* workspace-content: 24px/32px padding conforming to Figma CSS */}
      <div className="flex-1 w-full min-w-0 flex flex-col items-start p-4 sm:p-6 lg:p-8 gap-6 self-stretch">
        {/* Quick Notification Toast */}
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

        {/* transfer-form-card */}
        <form
          onSubmit={handleExecuteTransfer}
          className={`box-border flex flex-col items-start p-5 sm:p-6 gap-5 w-full rounded-[12px] border transition-all ${
            isLight
              ? "bg-white border-[#E4E4E7] shadow-xs"
              : "bg-[#383838] border-[#444444]"
          }`}
        >
          {/* Frame: Input Fields Row */}
          <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-center gap-4">
            {/* input-field: From Node Center */}
            <div className="flex-1 flex flex-col items-start gap-1.5 min-w-[200px]">
              <label
                className={`text-[12px] font-bold leading-[16px] ${
                  isLight ? "text-slate-700" : "text-[#E4E4E7]"
                }`}
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                {isThai ? "สาขาต้นทาง" : "From Node Center"}
              </label>
              <div
                className={`w-full box-border flex flex-row items-center px-3.5 py-2 gap-2 h-[38px] rounded-[8px] border transition-colors ${
                  isLight
                    ? "bg-[#F8FAFC] border-[#E4E4E7] text-slate-900 focus-within:border-slate-900"
                    : "bg-[#2C2C2C] border-[#444444] text-[#F4F4F5] focus-within:border-white"
                }`}
              >
                <select
                  value={fromNode}
                  onChange={(e) => setFromNode(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[13px] cursor-pointer appearance-none truncate"
                  style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                >
                  {NODE_CENTERS.map((node) => (
                    <option
                      key={node.id}
                      value={node.id}
                      className={isLight ? "bg-white text-black" : "bg-[#2C2C2C] text-white"}
                    >
                      {isThai ? node.nameTh : node.nameEn}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className={`shrink-0 ${isLight ? "text-slate-500" : "text-zinc-400"}`} />
              </div>
            </div>

            {/* arrow-transfer: Swap Button */}
            <div className="flex items-center justify-center pt-0 lg:pt-5 shrink-0 self-center">
              <button
                type="button"
                onClick={handleSwapNodes}
                className={`w-[36px] h-[36px] rounded-lg border flex items-center justify-center transition-all cursor-pointer ${
                  isLight
                    ? "bg-slate-100 border-[#E4E4E7] text-slate-700 hover:bg-slate-200"
                    : "bg-[#2C2C2C] border-[#444444] text-zinc-300 hover:bg-white/10 hover:text-white"
                }`}
                title={isThai ? "สลับสาขาต้นทาง-ปลายทาง" : "Swap nodes"}
              >
                <ArrowRight size={16} className="shrink-0" />
              </button>
            </div>

            {/* input-field: Target To Node */}
            <div className="flex-1 flex flex-col items-start gap-1.5 min-w-[200px]">
              <label
                className={`text-[12px] font-bold leading-[16px] ${
                  isLight ? "text-slate-700" : "text-[#E4E4E7]"
                }`}
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                {isThai ? "สาขาปลายทาง" : "Target To Node"}
              </label>
              <div
                className={`w-full box-border flex flex-row items-center px-3.5 py-2 gap-2 h-[38px] rounded-[8px] border transition-colors ${
                  isLight
                    ? "bg-[#F8FAFC] border-[#E4E4E7] text-slate-900 focus-within:border-slate-900"
                    : "bg-[#2C2C2C] border-[#444444] text-[#F4F4F5] focus-within:border-white"
                }`}
              >
                <select
                  value={toNode}
                  onChange={(e) => setToNode(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[13px] cursor-pointer appearance-none truncate"
                  style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                >
                  {NODE_CENTERS.map((node) => (
                    <option
                      key={node.id}
                      value={node.id}
                      className={isLight ? "bg-white text-black" : "bg-[#2C2C2C] text-white"}
                    >
                      {isThai ? node.nameTh : node.nameEn}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className={`shrink-0 ${isLight ? "text-slate-500" : "text-zinc-400"}`} />
              </div>
            </div>

            {/* input-field: Product Select */}
            <div className="flex-1 flex flex-col items-start gap-1.5 min-w-[220px]">
              <label
                className={`text-[12px] font-bold leading-[16px] ${
                  isLight ? "text-slate-700" : "text-[#E4E4E7]"
                }`}
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                {isThai ? "เลือกสินค้าที่ต้องการย้าย" : "Product Select"}
              </label>
              <div
                className={`w-full box-border flex flex-row items-center px-3.5 py-2 gap-2 h-[38px] rounded-[8px] border transition-colors ${
                  isLight
                    ? "bg-[#F8FAFC] border-[#E4E4E7] text-slate-900 focus-within:border-slate-900"
                    : "bg-[#2C2C2C] border-[#444444] text-[#F4F4F5] focus-within:border-white"
                }`}
              >
                <select
                  value={selectedSku}
                  onChange={(e) => setSelectedSku(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-[13px] cursor-pointer appearance-none truncate font-medium"
                  style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                >
                  {AVAILABLE_PRODUCTS.map((prod) => (
                    <option
                      key={prod.sku}
                      value={prod.sku}
                      className={isLight ? "bg-white text-black" : "bg-[#2C2C2C] text-white"}
                    >
                      {isThai ? prod.nameTh : prod.nameEn}
                    </option>
                  ))}
                </select>
                <ChevronDown size={15} className={`shrink-0 ${isLight ? "text-slate-500" : "text-zinc-400"}`} />
              </div>
            </div>

            {/* input-field: Qty to Move */}
            <div className="w-full sm:w-[140px] flex flex-col items-start gap-1.5 shrink-0">
              <label
                className={`text-[12px] font-bold leading-[16px] ${
                  isLight ? "text-slate-700" : "text-[#E4E4E7]"
                }`}
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                {isThai ? "จำนวนที่โอนย้าย" : "Qty to Move"}
              </label>
              <div
                className={`w-full box-border flex flex-row items-center px-3.5 py-2 gap-2 h-[38px] rounded-[8px] border transition-colors ${
                  isLight
                    ? "bg-[#F8FAFC] border-[#E4E4E7] text-slate-900 focus-within:border-slate-900"
                    : "bg-[#2C2C2C] border-[#444444] text-[#F4F4F5] focus-within:border-white"
                }`}
              >
                <input
                  type="number"
                  min={1}
                  max={currentProduct.availableAtHQ}
                  value={qtyToMove}
                  onChange={(e) => setQtyToMove(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-transparent border-none outline-none text-[13px] font-mono font-bold text-center"
                  style={{ fontFamily: "'Geist Mono', monospace" }}
                />
                <span className={`text-[11px] font-medium shrink-0 ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                  {isThai ? currentProduct.unitTh : currentProduct.unitEn}
                </span>
              </div>
            </div>
          </div>

          {/* stock-indicator-bar */}
          <div
            className={`w-full box-border flex flex-row items-center px-3.5 py-2.5 gap-3 rounded-[8px] border text-[12.5px] ${
              isLight
                ? "bg-[#F8FAFC] border-[#E4E4E7] text-slate-600"
                : "bg-[#2C2C2C] border-[#444444] text-[#999999]"
            }`}
          >
            <Info size={15} className={`shrink-0 ${isLight ? "text-slate-700" : "text-zinc-300"}`} />
            <div className="flex-1 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[12px] leading-[17px]">
              <span>
                {isThai ? "สต็อกพร้อมจ่ายต้นทาง:" : "HQ Stock Availability:"}{" "}
                <strong className={isLight ? "text-slate-900" : "text-white"}>
                  {currentProduct.availableAtHQ} {isThai ? currentProduct.unitTh : currentProduct.unitEn}
                </strong>
              </span>
              <span className="hidden sm:inline text-zinc-400">|</span>
              <span>
                {isThai ? "ขีดจำกัดความจุปลายทาง:" : "Target Depot Threshold Cap:"}{" "}
                <strong className={isLight ? "text-slate-900" : "text-white"}>
                  {isThai ? "ไม่เกิน" : "Max"} {currentProduct.targetThresholdCap} {isThai ? currentProduct.unitTh : currentProduct.unitEn}
                </strong>
              </span>
            </div>
          </div>

          {/* action-btn-row */}
          <div className="w-full flex flex-row justify-end items-center pt-1">
            <button
              type="submit"
              className={`box-border flex flex-row justify-center items-center px-5 py-2.5 gap-2 h-[38px] rounded-[8px] font-bold text-[13.5px] transition-all cursor-pointer shadow-xs ${
                isLight
                  ? "bg-slate-900 hover:bg-black text-white"
                  : "bg-white hover:bg-zinc-200 text-black"
              }`}
              style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
            >
              <FileCheck size={16} />
              <span>{isThai ? "ออกคำสั่งโอนย้ายสินค้า" : "Execute Transfer Order"}</span>
            </button>
          </div>
        </form>

        {/* pending-table-section */}
        <div className="w-full flex flex-col items-start gap-3">
          <div className="w-full flex items-center justify-between">
            <h3
              className={`text-[16px] font-bold leading-[21px] ${
                isLight ? "text-[#222222]" : "text-[#FFFFFF]"
              }`}
              style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
            >
              {isThai ? "รายการโอนย้ายระหว่างสาขาที่กำลังดำเนินการ" : "Active Inter-Branch Dispatches"}
            </h3>
            <span className="text-[12px] font-mono text-zinc-400">
              {records.length} {isThai ? "รายการในระบบ" : "Active Transfers"}
            </span>
          </div>

          {/* watchlist-table-card */}
          <div
            className={`w-full rounded-[12px] border overflow-hidden ${
              isLight ? "bg-white border-[#E4E4E7] shadow-xs" : "bg-[#383838] border-[#444444]"
            }`}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-[13px] border-collapse min-w-[760px]">
                {/* table-headers */}
                <thead>
                  <tr
                    className={`h-[42px] border-b text-[12.5px] font-semibold text-white select-none ${
                      isLight
                        ? "bg-slate-900 border-slate-800"
                        : "bg-[#282828] border-[#444444]"
                    }`}
                    style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                  >
                    <th className="py-3 px-4 w-[160px]">
                      {isThai ? "รหัสคำสั่งโอนย้าย" : "Transfer ID"}
                    </th>
                    <th className="py-3 px-4 w-[340px]">
                      {isThai ? "เส้นทางขนย้าย (ต้นทาง → ปลายทาง)" : "Inbound / Outbound Node Path"}
                    </th>
                    <th className="py-3 px-4 w-[280px]">
                      {isThai ? "รายการสินค้าที่บรรทุก" : "Items Loaded"}
                    </th>
                    <th className="py-3 px-4 w-[160px]">
                      {isThai ? "วันที่บันทึกคำสั่ง" : "Date Initiated"}
                    </th>
                    <th className="py-3 px-4 text-center w-[130px]">
                      {isThai ? "สถานะการนำส่ง" : "Status State"}
                    </th>
                  </tr>
                </thead>

                {/* Table Body */}
                <tbody
                  className={`divide-y ${
                    isLight ? "divide-slate-200" : "divide-white/5"
                  }`}
                >
                  {records.map((rec) => {
                    return (
                      <tr
                        key={rec.id}
                        className={`transition-colors ${
                          isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.03]"
                        }`}
                      >
                        {/* Transfer ID */}
                        <td className="py-3.5 px-4">
                          <span
                            className={`font-mono font-semibold text-[12.5px] ${
                              isLight ? "text-slate-900" : "text-[#F4F4F5]"
                            }`}
                          >
                            {rec.transferId}
                          </span>
                        </td>

                        {/* Inbound / Outbound Node Path */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2 text-[13px]">
                            <span className={`font-bold ${isLight ? "text-slate-900" : "text-[#F4F4F5]"}`}>
                              {isThai ? rec.fromNodeTh : rec.fromNodeEn}
                            </span>
                            <div className="flex items-center justify-center w-4 h-4 shrink-0">
                              <ArrowRight size={13} className="text-zinc-400" />
                            </div>
                            <span className={isLight ? "text-slate-700" : "text-[#F4F4F5]"}>
                              {isThai ? rec.toNodeTh : rec.toNodeEn}
                            </span>
                          </div>
                        </td>

                        {/* Items Loaded */}
                        <td className="py-3.5 px-4">
                          <div
                            className={`font-medium ${
                              isLight ? "text-slate-800" : "text-[#F8FAFC]"
                            }`}
                          >
                            {isThai ? rec.itemDescriptionTh : rec.itemDescriptionEn}
                          </div>
                        </td>

                        {/* Date Initiated */}
                        <td className="py-3.5 px-4">
                          <span className={`text-[12.5px] ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                            {rec.dateInitiated}
                          </span>
                        </td>

                        {/* Status State */}
                        <td className="py-3.5 px-4 text-center">
                          {rec.status === "in_transit" ? (
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                              style={{
                                backgroundColor: "rgba(255, 159, 28, 0.15)",
                                color: "#FF9F1C",
                              }}
                            >
                              {isThai ? "กำลังขนส่ง" : "In Transit"}
                            </span>
                          ) : rec.status === "completed" ? (
                            <span
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold"
                              style={{
                                backgroundColor: "rgba(46, 196, 182, 0.15)",
                                color: "#2EC4B6",
                              }}
                            >
                              {isThai ? "ส่งมอบแล้ว" : "Completed"}
                            </span>
                          ) : (
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                isLight
                                  ? "bg-slate-100 text-slate-700"
                                  : "bg-white/10 text-zinc-300"
                              }`}
                            >
                              {isThai ? "รออนุมัติ" : "Pending"}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </WarehousePageTemplate>
  );
}
