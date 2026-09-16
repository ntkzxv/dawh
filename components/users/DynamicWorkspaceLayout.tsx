"use client";

import React, { useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage, setAppLanguage } from "@/utils/language";
import {
  Box,
  Database,
  Users,
  FileText,
  ArrowRight,
  Sparkles,
  Check,
  Layers,
  LayoutGrid,
} from "lucide-react";

export type WorkspacePlanType = "plan1" | "plan2" | "plan3";
export type PrimaryModuleId = "warehouse" | "datacenter" | "employee";

interface ModuleConfig {
  id: string;
  title: string;
  titleTh: string;
  description: string;
  descriptionTh: string;
  icon: React.ElementType;
  route: string;
  statusText: string;
  statusTextTh: string;
  statusColor: string;
}

export const ALL_AVAILABLE_MODULES: Record<string, ModuleConfig> = {
  warehouse: {
    id: "warehouse",
    title: "Warehouse ERP",
    titleTh: "Warehouse ERP",
    description: "Real-time stock movement, inventory allocations, SKU tracking, and warehouse dispatch.",
    descriptionTh: "จัดการคลังสินค้าแบบเรียลไทม์, ตรวจสอบสต็อก SKU, จัดสรรพื้นที่ และระบบกระจายสินค้า",
    icon: Box,
    route: "/warehouse",
    statusText: "Active",
    statusTextTh: "เปิดใช้งาน",
    statusColor: "#2EC4B6",
  },
  datacenter: {
    id: "datacenter",
    title: "HP Datacenter",
    titleTh: "HP Datacenter",
    description: "Manage Hire-Purchase contracts, ledger controls, overdue recoveries, and customer profiles.",
    descriptionTh: "จัดการสัญญาเช่าซื้อ, บัญชีแยกประเภท, ติดตามหนี้ค้างชำระ และข้อมูลประวัติลูกค้า",
    icon: Database,
    route: "/datacenter",
    statusText: "Active",
    statusTextTh: "เปิดใช้งาน",
    statusColor: "#2EC4B6",
  },
  employee: {
    id: "employee",
    title: "Employee Management",
    titleTh: "ระบบจัดการพนักงาน",
    description: "Personnel directory, payroll structures, shift scheduling, and department structures.",
    descriptionTh: "ทะเบียนประวัติพนักงาน, โครงสร้างเงินเดือน, จัดตารางกะ และบริหารแผนกองค์กร",
    icon: Users,
    route: "/account",
    statusText: "Active",
    statusTextTh: "เปิดใช้งาน",
    statusColor: "#2EC4B6",
  },
  reports: {
    id: "reports",
    title: "Reports & Auditing",
    titleTh: "Reports & Auditing",
    description: "Generate monthly statements, performance statistics, system audit logs, and compliance records.",
    descriptionTh: "สร้างใบแจ้งยอดรายเดือน, สถิติประสิทธิภาพ, บันทึกการตรวจสอบระบบ และรายงานความเสี่ยง",
    icon: FileText,
    route: "/reports",
    statusText: "System Default",
    statusTextTh: "ระบบพื้นฐาน",
    statusColor: "#FF9F1C",
  },
};

export interface DynamicWorkspaceLayoutProps {
  plan: WorkspacePlanType;
  selectedModules: PrimaryModuleId[];
  onNavigate?: (route: string) => void;
  isLight: boolean;
  isThai: boolean;
}

export function DynamicWorkspaceLayout({
  plan,
  selectedModules,
  onNavigate,
  isLight,
  isThai,
}: DynamicWorkspaceLayoutProps) {
  // Always include reports as the persistent horizontal footer
  const reportsModule = ALL_AVAILABLE_MODULES.reports;

  const handleCardClick = (route: string) => {
    if (onNavigate) {
      onNavigate(route);
    } else {
      window.location.href = route;
    }
  };

  /**
   * Reusable Modern Card Component with clean Black & White Theme
   * Uniform sizing across all plans:
   * - Top sections: 390px (Plan 1 Hero: 390px, Plan 2 Standard cols: 390px, Plan 3 Left: 390px, Plan 3 Right: 2 x 185px + 20px gap = 390px)
   * - Bottom section (Reports & Auditing): 100px across all plans
   * Total Height: 390px + 20px (gap-5) + 100px = 510px across ALL plans!
   */
  const renderCardBox = (
    module: ModuleConfig,
    variant: "hero-large" | "standard-col" | "stacked-compact" | "horizontal-wide" = "standard-col"
  ) => {
    const Icon = module.icon;
    const isHorizontalWide = variant === "horizontal-wide";
    const isStackedCompact = variant === "stacked-compact";
    const isHeroLarge = variant === "hero-large";
    const isStandardCol = variant === "standard-col";

    return (
      <div
        key={module.id}
        onClick={() => handleCardClick(module.route)}
        className={`group relative flex rounded-[16px] border transition-all duration-200 cursor-pointer select-none ${
          isLight
            ? "bg-white border-zinc-200 hover:border-black shadow-[0px_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0px_8px_24px_rgba(0,0,0,0.12)]"
            : "bg-[#282828] border-[#444444] hover:border-white shadow-[0px_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0px_8px_24px_rgba(0,0,0,0.5)]"
        } ${
          isHorizontalWide
            ? "w-full p-5 sm:px-7 h-[100px] min-h-[100px] items-center flex"
            : isStackedCompact
            ? "w-full p-5 sm:px-6 sm:py-4 h-[185px] min-h-[185px] flex flex-col justify-between"
            : isHeroLarge
            ? "w-full p-8 sm:p-9 h-[390px] min-h-[390px] flex flex-col justify-between"
            : "w-full p-8 sm:p-9 h-[390px] min-h-[390px] flex flex-col justify-between"
        }`}
      >
        {isHorizontalWide ? (
          // Sleek horizontal banner layout (Report & Audit: exactly 100px height on all plans)
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
            <div className="flex items-center gap-4 min-w-0 flex-1">
              <div
                className={`flex items-center justify-center rounded-[12px] border transition-colors shrink-0 ${
                  isLight
                    ? "bg-zinc-100 border-zinc-200 text-zinc-900 group-hover:bg-black group-hover:text-white group-hover:border-black"
                    : "bg-[#222222] border-[#444444] text-white group-hover:bg-white group-hover:text-black group-hover:border-white"
                } w-11 h-11`}
              >
                <Icon size={22} strokeWidth={2} />
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h3
                    className={`font-bold text-[18px] sm:text-[20px] tracking-tight truncate ${
                      isLight ? "text-zinc-900" : "text-white"
                    }`}
                    style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                  >
                    {isThai ? module.titleTh : module.title}
                  </h3>

                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold shrink-0 ${
                      isLight
                        ? "border-zinc-200 text-zinc-700 bg-zinc-50"
                        : "border-[#444444] text-zinc-300 bg-[#222222]"
                    }`}
                  >
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: isLight ? "#0F172A" : "#FFFFFF" }}
                    />
                    <span>{isThai ? module.statusTextTh : module.statusText}</span>
                  </div>
                </div>

                <p
                  className={`text-[13px] line-clamp-1 mt-0.5 ${
                    isLight ? "text-zinc-600" : "text-zinc-400"
                  }`}
                >
                  {isThai ? module.descriptionTh : module.description}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <button
                type="button"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${
                  isLight
                    ? "bg-zinc-900 hover:bg-black text-white border-zinc-900 shadow-sm"
                    : "bg-white hover:bg-zinc-200 text-zinc-950 border-white shadow-sm"
                }`}
              >
                <span>{isThai ? "เข้าสู่พื้นที่ทำงาน" : "Enter Workspace"}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        ) : (
          // Standard (Plan 2) / Hero (Plan 1 & 3) / Stacked (Plan 3 Right) Box Layout
          <>
            {/* Top Header Row */}
            <div className="flex items-center justify-between gap-3 w-full">
              <div className="flex items-center gap-3.5 min-w-0 flex-1">
                {/* Icon Wrapper */}
                <div
                  className={`flex items-center justify-center rounded-[12px] border transition-colors shrink-0 ${
                    isLight
                      ? "bg-zinc-100 border-zinc-200 text-zinc-900 group-hover:bg-black group-hover:text-white group-hover:border-black"
                      : "bg-[#222222] border-[#444444] text-white group-hover:bg-white group-hover:text-black group-hover:border-white"
                  } ${isStackedCompact ? "w-10 h-10" : "w-12 h-12"}`}
                >
                  <Icon size={isStackedCompact ? 20 : 23} strokeWidth={2} />
                </div>

                {/* Title */}
                <div className="min-w-0 flex-1">
                  <h3
                    className={`font-bold tracking-tight truncate ${
                      isLight ? "text-zinc-900" : "text-white"
                    }`}
                    style={{
                      fontSize: isStackedCompact ? "17px" : "21px",
                      lineHeight: isStackedCompact ? "22px" : "28px",
                      fontFamily: "var(--font-outfit), sans-serif",
                    }}
                  >
                    {isThai ? module.titleTh : module.title}
                  </h3>
                </div>
              </div>

              {/* Status Badge */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold shrink-0 ${
                  isLight
                    ? "border-zinc-200 text-zinc-700 bg-zinc-50"
                    : "border-[#444444] text-zinc-300 bg-[#222222]"
                }`}
              >
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: isLight ? "#0F172A" : "#FFFFFF" }}
                />
                <span>{isThai ? module.statusTextTh : module.statusText}</span>
              </div>
            </div>

            {/* Middle Description */}
            <div className="my-auto py-2 flex flex-col justify-center">
              <p
                className={`leading-[160%] ${
                  isLight ? "text-zinc-600" : "text-zinc-400"
                } ${
                  isStackedCompact
                    ? "text-[12px] line-clamp-2"
                    : "text-[14px] sm:text-[14.5px]"
                }`}
              >
                {isThai ? module.descriptionTh : module.description}
              </p>
            </div>

            {/* Bottom Right Enter Button */}
            <div className="w-full flex justify-end items-center mt-auto pt-2">
              <button
                type="button"
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${
                  isLight
                    ? "bg-zinc-100 group-hover:bg-black group-hover:border-black group-hover:text-white border-zinc-200 text-zinc-800"
                    : "bg-[#333333] group-hover:bg-white group-hover:border-white group-hover:text-black border-[#444444] text-neutral-200"
                }`}
              >
                <span>{isThai ? "เข้าสู่พื้นที่ทำงาน" : "Enter Workspace"}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Get active modules chosen by user
  const activeModules = selectedModules.map((id) => ALL_AVAILABLE_MODULES[id]).filter(Boolean);

  return (
    <div className="w-full flex flex-col gap-5">
      {/* PLAN 1: Large Rectangle on Top + Thin Wide Rectangle Below */}
      {plan === "plan1" && (
        <div className="w-full flex flex-col gap-5">
          {activeModules[0] ? (
            renderCardBox(activeModules[0], "hero-large")
          ) : (
            <div className="p-8 border-2 border-dashed border-zinc-300 dark:border-white/20 rounded-[16px] text-center text-sm text-zinc-400 dark:text-zinc-500 h-[390px] flex items-center justify-center">
              {isThai ? "กรุณาเลือกโมดูลหลักอย่างน้อย 1 โมดูล" : "Please select at least 1 primary module"}
            </div>
          )}
          {renderCardBox(reportsModule, "horizontal-wide")}
        </div>
      )}

      {/* PLAN 2: 2 Equal Smaller Columns on Top + Full Width Horizontal Below */}
      {plan === "plan2" && (
        <div className="w-full flex flex-col gap-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
            {activeModules.slice(0, 2).map((mod) => renderCardBox(mod, "standard-col"))}
            {activeModules.length < 2 && (
              <div className="p-8 border-2 border-dashed border-zinc-300 dark:border-white/20 rounded-[16px] text-center text-sm text-zinc-400 dark:text-zinc-500 h-[390px] flex items-center justify-center">
                {isThai ? "กรุณาเลือกโมดูลที่ 2" : "Please select a 2nd module"}
              </div>
            )}
          </div>
          {renderCardBox(reportsModule, "horizontal-wide")}
        </div>
      )}

      {/* PLAN 3: Left Large Rectangle + Right Column with 2 Stacked Rectangles + Full Width Below */}
      {plan === "plan3" && (
        <div className="w-full flex flex-col gap-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-stretch">
            {/* Left Col (span 7) */}
            <div className="lg:col-span-7 flex flex-col">
              {activeModules[0] ? (
                renderCardBox(activeModules[0], "hero-large")
              ) : (
                <div className="p-8 border-2 border-dashed border-zinc-300 dark:border-white/20 rounded-[16px] text-center text-sm text-zinc-400 dark:text-zinc-500 w-full h-[390px] flex items-center justify-center">
                  {isThai ? "ไม่มีโมดูลซ้าย" : "No left module"}
                </div>
              )}
            </div>

            {/* Right Col: 2 Stacked (span 5) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-5 lg:h-[390px]">
              {activeModules.slice(1, 3).map((mod) => renderCardBox(mod, "stacked-compact"))}
              {activeModules.length < 2 && (
                <div className="flex-1 p-6 border-2 border-dashed border-zinc-300 dark:border-white/20 rounded-[16px] text-center text-xs text-zinc-400 dark:text-zinc-500 flex items-center justify-center min-h-[185px]">
                  {isThai ? "เลือกเพิ่มอีก 1-2 โมดูลเพื่อแสดงฝั่งขวา" : "Select 1-2 more modules for right column"}
                </div>
              )}
              {activeModules.length === 2 && (
                <div className="flex-1 p-6 border-2 border-dashed border-zinc-300 dark:border-white/20 rounded-[16px] text-center text-xs text-zinc-400 dark:text-zinc-500 flex items-center justify-center min-h-[185px]">
                  {isThai ? "เลือกเพิ่มอีก 1 โมดูลสำหรับช่องล่างขวา" : "Select 1 more module for bottom right"}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Full-Width Horizontal */}
          {renderCardBox(reportsModule, "horizontal-wide")}
        </div>
      )}
    </div>
  );
}
