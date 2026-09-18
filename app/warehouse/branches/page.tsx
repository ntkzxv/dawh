"use client";

import React, { useState } from "react";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import { Download, GitBranch } from "lucide-react";

interface BranchItem {
  nameTh: string;
  nameEn: string;
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
  badgeTh: string;
  badgeEn: string;
  badgeColor: string;
  badgeBg: string;
  items: BranchItem[];
}

const BRANCH_DATA: BranchSection[] = [
  {
    id: "branch-1",
    nameTh: "ศูนย์กระจายสินค้าหลัก สำนักงานใหญ่",
    nameEn: "Main Dist. Hub (HQ)",
    badgeTh: "สต็อกพร้อมใช้สมบูรณ์",
    badgeEn: "Optimal Stocking",
    badgeColor: "#2EC4B6",
    badgeBg: "rgba(46, 196, 182, 0.15)",
    items: [
      {
        nameTh: "เครื่องปั่นไฟดีเซล Cummins 500kVA",
        nameEn: "Cummins 500kVA Generator",
        percentage: 80,
        currentUnits: 12,
        maxUnits: 15,
        statusTh: "สต็อกปลอดภัย",
        statusEn: "Stock Secure",
        statusColor: "#2EC4B6",
        statusType: "secure",
      },
      {
        nameTh: "หม้อแปลงปรับแรงดันไฟฟ้า 3 เฟส",
        nameEn: "3-Phase Step Down Transformer",
        percentage: 35,
        currentUnits: 2,
        maxUnits: 8,
        statusTh: "ต่ำกว่าเกณฑ์ควบคุม",
        statusEn: "Threshold Low",
        statusColor: "#FF9F1C",
        statusType: "low",
      },
    ],
  },
  {
    id: "branch-2",
    nameTh: "คลังสินค้าสาขา ภาคตะวันออก",
    nameEn: "East Coast Depot",
    badgeTh: "แจ้งเตือนวิกฤตต้องเติมสต็อก",
    badgeEn: "Reorder Critical Alert",
    badgeColor: "#E71D36",
    badgeBg: "rgba(231, 29, 54, 0.15)",
    items: [
      {
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
    ],
  },
];

export default function BranchesPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";

  return (
    <WarehousePageTemplate
      titleEn="Branch Stock Levels"
      titleTh="ระดับสต็อกสินค้าแต่ละสาขา"
      routePath="/warehouse/branches"
      iconName="branches"
    >
      {/* workspace-content: width: 1200px max, padding: 24px, gap: 24px */}
      <div className="w-full max-w-[1200px] mx-auto flex flex-col items-start gap-6">
        {/* header-titles: flex row, justify-between, align-center */}
        <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* titles */}
          <div className="flex flex-col items-start gap-1">
            <h2
              className={`text-[28px] font-bold leading-[35px] ${
                isLight ? "text-[#222222]" : "text-[#FFFFFF]"
              }`}
              style={{ fontFamily: "'Outfit', var(--font-geist-sans), sans-serif" }}
            >
              {isThai ? "ระดับสต็อกสินค้าแต่ละสาขา" : "Branch Stock Levels"}
            </h2>
            <p
              className={`text-[14px] font-normal leading-[18px] ${
                isLight ? "text-slate-600" : "text-[#F4F4F5]"
              }`}
              style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
            >
              {isThai
                ? "ติดตามตรวจสอบความจุ ปริมาณสต็อกเป้าหมาย และเกณฑ์ระดับสินค้าคงคลังในแต่ละสาขา"
                : "Monitor current volume capacity, replenishment targets and threshold markers per node."}
            </p>
          </div>

          {/* button: Export Capacity Report */}
          <button
            type="button"
            className={`box-border flex flex-row justify-center items-center px-4 py-2.5 gap-2 h-[38px] rounded-lg border text-[14px] font-bold transition-all cursor-pointer shrink-0 ${
              isLight
                ? "bg-white border-[#E4E4E7] text-[#222222] hover:bg-slate-50 shadow-xs"
                : "bg-[#383838] border-[#444444] text-[#F4F4F5] hover:bg-white/5"
            }`}
            style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
          >
            <Download size={16} className={isLight ? "text-slate-600" : "text-[#F4F4F5]"} />
            <span>{isThai ? "ส่งออกรายงานความจุ" : "Export Capacity Report"}</span>
          </button>
        </div>

        {/* Branch Cards Container - Separate Distinct Cards */}
        <div className="w-full flex flex-col gap-6">
          {BRANCH_DATA.map((branch) => (
            <div
              key={branch.id}
              className={`w-full box-border flex flex-col items-start p-5 sm:p-6 gap-4 rounded-xl border transition-all duration-300 ${
                isLight
                  ? "bg-white border-[#E4E4E7] shadow-xs hover:border-slate-300"
                  : "bg-[#383838] border-[#444444] hover:border-[#555555]"
              }`}
            >
              {/* branch-header */}
              <div
                className={`w-full box-border flex flex-row justify-between items-center pb-3 border-b ${
                  isLight ? "border-slate-100" : "border-[#444444]"
                }`}
              >
                {/* Branch Title Frame */}
                <div className="flex flex-row items-center gap-2.5">
                  <div
                    className={`w-[28px] h-[28px] rounded-lg flex items-center justify-center shrink-0 ${
                      isLight ? "bg-slate-100 text-slate-700" : "bg-[#2C2C2C] text-[#F4F4F5]"
                    }`}
                  >
                    <GitBranch size={16} />
                  </div>
                  <div>
                    <h3
                      className={`text-[16px] font-bold leading-[21px] ${
                        isLight ? "text-[#222222]" : "text-[#F4F4F5]"
                      }`}
                      style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                    >
                      {isThai ? branch.nameTh : branch.nameEn}
                    </h3>
                    <span
                      className={`text-[11px] font-mono ${
                        isLight ? "text-slate-500" : "text-zinc-400"
                      }`}
                    >
                      {branch.id.toUpperCase()} • {isThai ? "ศูนย์คลังกระจายสินค้า" : "Distribution Node"}
                    </span>
                  </div>
                </div>

                {/* Status Badge */}
                <div
                  className="flex flex-row items-center px-2.5 py-1 rounded-full text-[11px] font-bold leading-[14px]"
                  style={{
                    backgroundColor: branch.badgeBg,
                    color: branch.badgeColor,
                    fontFamily: "'Geist', var(--font-geist-sans), sans-serif",
                  }}
                >
                  {isThai ? branch.badgeTh : branch.badgeEn}
                </div>
              </div>

              {/* items-table */}
              <div className="w-full flex flex-col items-start gap-1 divide-y divide-white/5">
                {branch.items.map((item, idx) => (
                  <div
                    key={idx}
                    className="w-full flex flex-col sm:flex-row sm:items-center justify-between py-2.5 gap-3"
                  >
                    {/* Product Name */}
                    <div
                      className={`text-[13px] font-semibold leading-[17px] sm:w-[320px] truncate ${
                        isLight ? "text-[#222222]" : "text-[#F4F4F5]"
                      }`}
                      style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                    >
                      {isThai ? item.nameTh : item.nameEn}
                    </div>

                    {/* Progress Bar & Percentage Frame */}
                    <div className="flex flex-row items-center gap-2 sm:w-[240px]">
                      <div
                        className={`flex-1 h-2 rounded-sm overflow-hidden flex flex-row items-start ${
                          isLight ? "bg-slate-200" : "bg-[#2C2C2C]"
                        }`}
                      >
                        <div
                          className="h-full rounded-sm transition-all duration-500"
                          style={{
                            width: `${item.percentage}%`,
                            backgroundColor: item.statusColor,
                          }}
                        />
                      </div>
                      <span
                        className={`w-12 text-[12px] font-normal leading-[16px] text-right font-mono ${
                          isLight ? "text-slate-600" : "text-[#E4E4E7]"
                        }`}
                      >
                        {item.percentage}%
                      </span>
                    </div>

                    {/* Units Count */}
                    <div
                      className={`text-[13px] font-normal leading-[17px] sm:w-[120px] font-mono ${
                        isLight ? "text-slate-700" : "text-[#F4F4F5]"
                      }`}
                      style={{ fontFamily: "'Geist', var(--font-geist-sans), sans-serif" }}
                    >
                      {item.currentUnits} / {item.maxUnits} {isThai ? "หน่วย" : "Units"}
                    </div>

                    {/* Item Status */}
                    <div
                      className="text-[13px] font-medium leading-[17px] sm:w-[160px] text-left sm:text-right"
                      style={{
                        color: item.statusColor,
                        fontFamily: "'Geist', var(--font-geist-sans), sans-serif",
                      }}
                    >
                      {isThai ? item.statusTh : item.statusEn}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </WarehousePageTemplate>
  );
}

