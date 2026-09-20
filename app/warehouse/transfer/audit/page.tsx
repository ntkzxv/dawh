"use client";

import React, { useState } from "react";
import WarehousePageTemplate from "../../_components/WarehousePageTemplate";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import { Download, Kanban, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TransferManifestItem {
  id: string;
  transferId: string;
  sourceHubTh: string;
  sourceHubEn: string;
  destHubTh: string;
  destHubEn: string;
  itemCount: number;
  status: "draft" | "approved" | "in_transit" | "completed";
  statusTh: string;
  statusEn: string;
  dateTh: string;
  dateEn: string;
  creatorTh: string;
  creatorEn: string;
}

const MANIFEST_ITEMS: TransferManifestItem[] = [
  {
    id: "m-1",
    transferId: "TRF-2023101",
    sourceHubTh: "คลังหลัก A",
    sourceHubEn: "Main Hub A",
    destHubTh: "คลังย่อย B",
    destHubEn: "Sub Hub B",
    itemCount: 15,
    status: "draft",
    statusTh: "ร่างสัญญา",
    statusEn: "Draft",
    dateTh: "24 ต.ค. 2566",
    dateEn: "24 Oct 2023",
    creatorTh: "สมชาย ใจดี",
    creatorEn: "Somchai Jaidee",
  },
  {
    id: "m-2",
    transferId: "TRF-2023098",
    sourceHubTh: "คลังหลัก A",
    sourceHubEn: "Main Hub A",
    destHubTh: "คลังสาขาตะวันออก",
    destHubEn: "East Coast Depot",
    itemCount: 42,
    status: "approved",
    statusTh: "อนุมัติแล้ว",
    statusEn: "Approved",
    dateTh: "23 ต.ค. 2566",
    dateEn: "23 Oct 2023",
    creatorTh: "วิชัย ยอดรัก",
    creatorEn: "Wichai Yodrak",
  },
  {
    id: "m-3",
    transferId: "TRF-2023095",
    sourceHubTh: "คลังหลัก A",
    sourceHubEn: "Main Hub A",
    destHubTh: "คลังสาขาเหนือ",
    destHubEn: "North Branch Hub",
    itemCount: 112,
    status: "in_transit",
    statusTh: "กำลังจัดส่ง",
    statusEn: "In Transit",
    dateTh: "22 ต.ค. 2566",
    dateEn: "22 Oct 2023",
    creatorTh: "สมชาย ใจดี",
    creatorEn: "Somchai Jaidee",
  },
  {
    id: "m-4",
    transferId: "TRF-2023090",
    sourceHubTh: "คลังสาขาใต้",
    sourceHubEn: "South Branch Hub",
    destHubTh: "คลังหลัก A",
    destHubEn: "Main Hub A",
    itemCount: 30,
    status: "completed",
    statusTh: "เสร็จสิ้น",
    statusEn: "Completed",
    dateTh: "21 ต.ค. 2566",
    dateEn: "21 Oct 2023",
    creatorTh: "นภา มั่นคง",
    creatorEn: "Napa Mankong",
  },
];

export default function TransferAuditPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";

  // Tab state: "board" = Relocation Status Board, "manifest" = Audit Manifest
  const [activeTab, setActiveTab] = useState<"board" | "manifest">("board");

  return (
    <WarehousePageTemplate
      titleEn="Status Board & Audit Manifest"
      titleTh="กระดานสถานะและประวัติโอนย้าย"
      routePath="/warehouse/transfer/audit"
      iconName="transfer"
      fullBleed
    >
      {/* workspace-content: Conforms strictly to Figma CSS specs */}
      <div className="flex-1 w-full min-w-0 flex flex-col items-start p-4 sm:p-6 lg:p-8 gap-6 self-stretch">
        {/* Tab Switcher Controls (No outer box, clean animated underline) */}
        <div className="w-full flex items-center justify-between border-b border-zinc-200 dark:border-white/10">
          <div className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActiveTab("board")}
              className={`relative flex items-center gap-2 pb-3 text-[14px] font-semibold transition-colors cursor-pointer select-none ${
                activeTab === "board"
                  ? isLight
                    ? "text-slate-950"
                    : "text-white"
                  : isLight
                  ? "text-slate-500 hover:text-slate-900"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <Kanban size={15} />
              <span>{isThai ? "กระดานสถานะการโอนย้าย" : "Relocation Status Board"}</span>
              {activeTab === "board" && (
                <motion.div
                  layoutId="audit-tab-active-indicator"
                  className={`absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full ${
                    isLight ? "bg-slate-950" : "bg-white"
                  }`}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("manifest")}
              className={`relative flex items-center gap-2 pb-3 text-[14px] font-semibold transition-colors cursor-pointer select-none ${
                activeTab === "manifest"
                  ? isLight
                    ? "text-slate-950"
                    : "text-white"
                  : isLight
                  ? "text-slate-500 hover:text-slate-900"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <FileText size={15} />
              <span>{isThai ? "รายการใบสั่งโอนย้าย" : "Transfer Orders Manifest"}</span>
              {activeTab === "manifest" && (
                <motion.div
                  layoutId="audit-tab-active-indicator"
                  className={`absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full ${
                    isLight ? "bg-slate-950" : "bg-white"
                  }`}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          </div>
        </div>

        {/* Tab Content with slide and fade animation */}
        <div className="w-full relative min-h-[300px]">
          <AnimatePresence mode="wait">
            {activeTab === "board" ? (
              <motion.div
                key="board-view"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="w-full flex flex-col items-start gap-4"
              >
            <div className="w-full flex items-center justify-between">
              <h3
                className={`text-[16px] font-bold leading-[21px] ${
                  isLight ? "text-slate-900" : "text-[#F8FAFC]"
                }`}
                style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
              >
                {isThai ? "กระดานสถานะการโอนย้าย" : "Relocation Status Board"}
              </h3>
              <span className="text-[12px] font-mono text-zinc-400">
                {isThai ? "4 ขั้นตอนกระบวนการ" : "4 Workflow Stages"}
              </span>
            </div>

            {/* kanban-row */}
            <div className="w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {/* col 1: ร่างสัญญา */}
              <div className="flex flex-col items-start gap-3 min-h-[220px]">
                <div
                  className={`w-full flex flex-row justify-between items-start pb-2 border-b-2 ${
                    isLight ? "border-slate-200" : "border-[#444444]"
                  }`}
                >
                  <span
                    className={`text-[14px] font-semibold leading-[18px] ${
                      isLight ? "text-slate-900" : "text-[#F8FAFC]"
                    }`}
                    style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                  >
                    {isThai ? "ร่างสัญญารายการ" : "Draft Orders"}
                  </span>
                  <span className="text-[14px] font-semibold font-mono text-[#A1A1AA]">2</span>
                </div>

                <div
                  className={`w-full box-border flex flex-col items-start p-3.5 gap-2.5 rounded-[8px] border transition-all ${
                    isLight
                      ? "bg-white border-[#E4E4E7] shadow-xs"
                      : "bg-[#383838] border-[#444444]"
                  }`}
                >
                  <span className="font-mono font-bold text-[12px] text-[#0D99FF]">TRF-2023101</span>
                  <span className={`text-[13px] font-normal ${isLight ? "text-slate-900" : "text-[#F8FAFC]"}`}>
                    {isThai ? "คลังหลัก A → คลังย่อย B" : "Main Hub A → Sub Hub B"}
                  </span>
                  <div className="w-full flex justify-between text-[11.5px] text-[#A1A1AA]">
                    <span>{isThai ? "15 รายการ" : "15 items"}</span>
                    <span>{isThai ? "24 ต.ค." : "24 Oct"}</span>
                  </div>
                </div>

                <div
                  className={`w-full box-border flex flex-col items-start p-3.5 gap-2.5 rounded-[8px] border transition-all ${
                    isLight
                      ? "bg-white border-[#E4E4E7] shadow-xs"
                      : "bg-[#383838] border-[#444444]"
                  }`}
                >
                  <span className="font-mono font-bold text-[12px] text-[#0D99FF]">TRF-2023102</span>
                  <span className={`text-[13px] font-normal ${isLight ? "text-slate-900" : "text-[#F8FAFC]"}`}>
                    {isThai ? "คลังย่อย C → คลังหลัก A" : "Sub Hub C → Main Hub A"}
                  </span>
                  <div className="w-full flex justify-between text-[11.5px] text-[#A1A1AA]">
                    <span>{isThai ? "5 รายการ" : "5 items"}</span>
                    <span>{isThai ? "24 ต.ค." : "24 Oct"}</span>
                  </div>
                </div>
              </div>

              {/* col 2: อนุมัติแล้ว */}
              <div className="flex flex-col items-start gap-3 min-h-[220px]">
                <div
                  className={`w-full flex flex-row justify-between items-start pb-2 border-b-2 ${
                    isLight ? "border-slate-200" : "border-[#444444]"
                  }`}
                >
                  <span
                    className={`text-[14px] font-semibold leading-[18px] ${
                      isLight ? "text-slate-900" : "text-[#F8FAFC]"
                    }`}
                    style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                  >
                    {isThai ? "อนุมัติเรียบร้อย" : "Approved"}
                  </span>
                  <span className="text-[14px] font-semibold font-mono text-[#A1A1AA]">1</span>
                </div>

                <div
                  className={`w-full box-border flex flex-col items-start p-3.5 gap-2.5 rounded-[8px] border transition-all ${
                    isLight
                      ? "bg-white border-[#E4E4E7] shadow-xs"
                      : "bg-[#383838] border-[#444444]"
                  }`}
                >
                  <span className="font-mono font-bold text-[12px] text-[#FF9F1C]">TRF-2023098</span>
                  <span className={`text-[13px] font-normal ${isLight ? "text-slate-900" : "text-[#F8FAFC]"}`}>
                    {isThai ? "คลังหลัก A → คลังสาขาตะวันออก" : "Main Hub A → East Coast Depot"}
                  </span>
                  <div className="w-full flex justify-between text-[11.5px] text-[#A1A1AA]">
                    <span>{isThai ? "42 รายการ" : "42 items"}</span>
                    <span>{isThai ? "23 ต.ค." : "23 Oct"}</span>
                  </div>
                </div>
              </div>

              {/* col 3: อยู่ระหว่างจัดส่ง */}
              <div className="flex flex-col items-start gap-3 min-h-[220px]">
                <div
                  className={`w-full flex flex-row justify-between items-start pb-2 border-b-2 ${
                    isLight ? "border-slate-200" : "border-[#444444]"
                  }`}
                >
                  <span
                    className={`text-[14px] font-semibold leading-[18px] ${
                      isLight ? "text-slate-900" : "text-[#F8FAFC]"
                    }`}
                    style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                  >
                    {isThai ? "อยู่ระหว่างจัดส่ง" : "In Transit"}
                  </span>
                  <span className="text-[14px] font-semibold font-mono text-[#A1A1AA]">1</span>
                </div>

                <div
                  className={`w-full box-border flex flex-col items-start p-3.5 gap-2.5 rounded-[8px] border transition-all ${
                    isLight
                      ? "bg-white border-[#E4E4E7] shadow-xs"
                      : "bg-[#383838] border-[#444444]"
                  }`}
                >
                  <span className="font-mono font-bold text-[12px] text-[#0D99FF]">TRF-2023095</span>
                  <span className={`text-[13px] font-normal ${isLight ? "text-slate-900" : "text-[#F8FAFC]"}`}>
                    {isThai ? "คลังหลัก A → คลังสาขาเหนือ" : "Main Hub A → North Branch Hub"}
                  </span>
                  <div className="w-full flex justify-between text-[11.5px] text-[#A1A1AA]">
                    <span>{isThai ? "112 รายการ" : "112 items"}</span>
                    <span>{isThai ? "22 ต.ค." : "22 Oct"}</span>
                  </div>
                </div>
              </div>

              {/* col 4: รับสินค้าเรียบร้อย */}
              <div className="flex flex-col items-start gap-3 min-h-[220px]">
                <div
                  className={`w-full flex flex-row justify-between items-start pb-2 border-b-2 ${
                    isLight ? "border-slate-200" : "border-[#444444]"
                  }`}
                >
                  <span
                    className={`text-[14px] font-semibold leading-[18px] ${
                      isLight ? "text-slate-900" : "text-[#F8FAFC]"
                    }`}
                    style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                  >
                    {isThai ? "รับสินค้าเรียบร้อย" : "Completed"}
                  </span>
                  <span className="text-[14px] font-semibold font-mono text-[#A1A1AA]">1</span>
                </div>

                <div
                  className={`w-full box-border flex flex-col items-start p-3.5 gap-2.5 rounded-[8px] border opacity-80 transition-all ${
                    isLight
                      ? "bg-white border-[#E4E4E7] shadow-xs"
                      : "bg-[#383838] border-[#444444]"
                  }`}
                >
                  <span className="font-mono font-bold text-[12px] text-[#2EC4B6]">TRF-2023090</span>
                  <span className={`text-[13px] font-normal ${isLight ? "text-slate-900" : "text-[#F8FAFC]"}`}>
                    {isThai ? "คลังสาขาใต้ → คลังหลัก A" : "South Branch Hub → Main Hub A"}
                  </span>
                  <div className="w-full flex justify-between text-[11.5px] text-[#A1A1AA]">
                    <span>{isThai ? "30 รายการ" : "30 items"}</span>
                    <span>{isThai ? "21 ต.ค." : "21 Oct"}</span>
                  </div>
                </div>
              </div>
            </div>
            </motion.div>
          ) : (
            <motion.div
              key="manifest-view"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="w-full flex flex-col items-start gap-4"
            >
              <div className="w-full flex flex-row justify-between items-center">
                <h3
                  className={`text-[16px] font-bold leading-[21px] ${
                    isLight ? "text-slate-900" : "text-[#F8FAFC]"
                  }`}
                  style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                >
                  {isThai ? "รายการใบสั่งโอนย้ายล่าสุด" : "Recent Transfer Orders"}
                </h3>

                <button
                  type="button"
                  className={`box-border flex flex-row items-center px-3.5 py-1.5 gap-1.5 h-[34px] rounded-[6px] border text-[12.5px] font-medium transition-colors cursor-pointer ${
                    isLight
                      ? "bg-slate-50 border-[#E4E4E7] text-slate-800 hover:bg-slate-100"
                      : "bg-[#383838] border-[#444444] text-[#F8FAFC] hover:bg-white/5"
                  }`}
                  style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                >
                  <Download size={14} className={isLight ? "text-slate-700" : "text-[#F8FAFC]"} />
                  <span>{isThai ? "ส่งออกข้อมูล" : "Export Data"}</span>
                </button>
              </div>

              <div
                className={`w-full rounded-[12px] border overflow-hidden ${
                  isLight
                    ? "border-[#E4E4E7] bg-white shadow-xs"
                    : "border-[#444444] bg-[#383838]"
                }`}
              >
                <div className="w-full overflow-x-auto">
                  <table className="w-full text-left text-[13px] border-collapse min-w-[840px]">
                    <thead>
                      <tr
                        className={`h-[42px] text-[12.5px] font-semibold border-b text-white select-none ${
                          isLight
                            ? "bg-slate-900 border-slate-800"
                            : "bg-[#282828] border-[#444444]"
                        }`}
                        style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                      >
                      <th className="py-2.5 px-4 w-[130px]">{isThai ? "เลขที่โอน" : "Transfer ID"}</th>
                      <th className="py-2.5 px-4 w-[200px]">{isThai ? "คลังต้นทาง" : "Origin Depot"}</th>
                      <th className="py-2.5 px-4 w-[200px]">{isThai ? "คลังปลายทาง" : "Destination"}</th>
                      <th className="py-2.5 px-4 text-right w-[120px]">{isThai ? "จำนวนรายการ" : "Items"}</th>
                      <th className="py-2.5 px-4 text-center w-[120px]">{isThai ? "สถานะ" : "Status"}</th>
                      <th className="py-2.5 px-4 w-[140px]">{isThai ? "วันที่สร้าง" : "Date Created"}</th>
                      <th className="py-2.5 px-4">{isThai ? "ผู้สร้างเอกสาร" : "Created By"}</th>
                    </tr>
                  </thead>
                  <tbody
                    className={`divide-y ${
                      isLight ? "divide-slate-200" : "divide-[#444444]"
                    }`}
                  >
                    {MANIFEST_ITEMS.map((item) => (
                      <tr
                        key={item.id}
                        className={`h-[50px] transition-colors ${
                          isLight ? "hover:bg-slate-50" : "hover:bg-white/[0.02]"
                        }`}
                      >
                        <td className="py-3 px-4 font-mono font-medium">
                          <span className={isLight ? "text-slate-900" : "text-[#F8FAFC]"}>
                            {item.transferId}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={isLight ? "text-slate-800" : "text-[#F8FAFC]"}>
                            {isThai ? item.sourceHubTh : item.sourceHubEn}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={isLight ? "text-slate-800" : "text-[#F8FAFC]"}>
                            {isThai ? item.destHubTh : item.destHubEn}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-medium">
                          <span className={isLight ? "text-slate-900" : "text-[#F8FAFC]"}>
                            {item.itemCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {item.status === "draft" && (
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-[4px] text-[11px] font-semibold"
                              style={{
                                backgroundColor: "rgba(13, 153, 255, 0.082)",
                                color: "#0D99FF",
                                fontFamily: "'Geist', var(--font-geist-sans), sans-serif",
                              }}
                            >
                              {isThai ? item.statusTh : item.statusEn}
                            </span>
                          )}
                          {item.status === "approved" && (
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-[4px] text-[11px] font-semibold"
                              style={{
                                backgroundColor: "rgba(255, 159, 28, 0.082)",
                                color: "#FF9F1C",
                                fontFamily: "'Geist', var(--font-geist-sans), sans-serif",
                              }}
                            >
                              {isThai ? item.statusTh : item.statusEn}
                            </span>
                          )}
                          {item.status === "in_transit" && (
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-[4px] text-[11px] font-semibold"
                              style={{
                                backgroundColor: "rgba(13, 153, 255, 0.082)",
                                color: "#0D99FF",
                                fontFamily: "'Geist', var(--font-geist-sans), sans-serif",
                              }}
                            >
                              {isThai ? item.statusTh : item.statusEn}
                            </span>
                          )}
                          {item.status === "completed" && (
                            <span
                              className="inline-flex items-center px-2.5 py-1 rounded-[4px] text-[11px] font-semibold"
                              style={{
                                backgroundColor: "rgba(46, 196, 182, 0.082)",
                                color: "#2EC4B6",
                                fontFamily: "'Geist', var(--font-geist-sans), sans-serif",
                              }}
                            >
                              {isThai ? item.statusTh : item.statusEn}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-[#A1A1AA] text-[12.5px]">
                          {isThai ? item.dateTh : item.dateEn}
                        </td>
                        <td className="py-3 px-4">
                          <span className={isLight ? "text-slate-800" : "text-[#F8FAFC]"}>
                            {isThai ? item.creatorTh : item.creatorEn}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>
    </WarehousePageTemplate>
  );
}
