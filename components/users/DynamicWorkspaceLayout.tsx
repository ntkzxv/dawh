"use client";

import React from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Database,
  Users,
  FileText,
  ArrowRight,
  Lock,
  Wrench,
  Clock,
} from "lucide-react";
import { useNotification } from "@/context/NotificationContext";

export type WorkspacePlanType = "plan1" | "plan2" | "plan3";
export type PrimaryModuleId = "warehouse" | "datacenter" | "employee";
export type ModuleStatus = "active" | "maintenance" | "disabled";

interface ModuleConfig {
  id: string;
  title: string;
  titleTh: string;
  description: string;
  descriptionTh: string;
  icon: React.ElementType;
  route: string;
}

export const ALL_AVAILABLE_MODULES: Record<string, ModuleConfig> = {
  warehouse: {
    id: "warehouse",
    title: "Warehouse ERP",
    titleTh: "จัดการคลังสินค้า",
    description: "Real-time stock movement, inventory allocations, SKU tracking, and warehouse dispatch.",
    descriptionTh: "จัดการคลังสินค้าแบบเรียลไทม์, ตรวจสอบสต็อก SKU, จัดสรรพื้นที่ และระบบกระจายสินค้า",
    icon: Box,
    route: "/warehouse",
  },
  datacenter: {
    id: "datacenter",
    title: "HP Datacenter",
    titleTh: "สัญญาเช่าซื้อ",
    description: "Manage Hire-Purchase contracts, ledger controls, overdue recoveries, and customer profiles.",
    descriptionTh: "จัดการสัญญาเช่าซื้อ, บัญชีแยกประเภท, ติดตามหนี้ค้างชำระ และข้อมูลประวัติลูกค้า",
    icon: Database,
    route: "/datacenter",
  },
  employee: {
    id: "employee",
    title: "Employee Management",
    titleTh: "จัดการพนักงาน",
    description: "Personnel directory, payroll structures, shift scheduling, and department structures.",
    descriptionTh: "ทะเบียนประวัติพนักงาน, โครงสร้างเงินเดือน, จัดตารางกะ และบริหารแผนกองค์กร",
    icon: Users,
    route: "/account",
  },
  reports: {
    id: "reports",
    title: "Reports & Auditing",
    titleTh: "รายงานและตรวจสอบ",
    description: "Generate monthly statements, performance statistics, system audit logs, and compliance records.",
    descriptionTh: "สร้างใบแจ้งยอดรายเดือน, สถิติประสิทธิภาพ, บันทึกการตรวจสอบระบบ และรายงานความเสี่ยง",
    icon: FileText,
    route: "/reports",
  },
};

export interface DynamicWorkspaceLayoutProps {
  plan: WorkspacePlanType;
  selectedModules: PrimaryModuleId[];
  moduleStatuses?: Record<string, ModuleStatus>;
  recentModuleId?: string | null;
  onNavigate?: (route: string) => void;
  isLight: boolean;
  isThai: boolean;
}

export function DynamicWorkspaceLayout({
  plan,
  selectedModules,
  moduleStatuses = {},
  recentModuleId,
  onNavigate,
  isLight,
  isThai,
}: DynamicWorkspaceLayoutProps) {
  const router = useRouter();
  const { notify } = useNotification();
  // Always include reports as the persistent horizontal footer
  const reportsModule = ALL_AVAILABLE_MODULES.reports;

  const getStatus = (moduleId: string): ModuleStatus => {
    return moduleStatuses[moduleId] || "active";
  };

  const handleModuleClick = (module: ModuleConfig) => {
    const status = getStatus(module.id);
    const moduleName = isThai ? module.titleTh : module.title;

    if (status === "disabled") {
      // Disabled module notification per user request
      notify.error(
        isThai ? "ช่องทางนี้ถูกปิดใช้งาน" : "Module Disabled",
        {
          message: isThai
            ? "หากมีข้อสงสัย ติดต่อทางเราได้เลย dawh_support@dawh.co.th"
            : "This module has been disabled. For any inquiries, please contact dawh_support@dawh.co.th",
          duration: 5000,
        }
      );
      return;
    }

    const pureThaiName = module.titleTh.split(" (")[0];

    if (status === "maintenance") {
      notify.warning(
        isThai ? "ระบบปิดปรับปรุงชั่วคราว" : "Scheduled Maintenance",
        {
          message: isThai
            ? `${pureThaiName} อยู่ระหว่างปิดปรับปรุงชั่วคราวเพื่ออัปเกรดระบบ`
            : `${module.title} is currently under maintenance.`,
          duration: 4000,
        }
      );
      const target = `/maintenance?module=${module.id}`;
      if (onNavigate) {
        onNavigate(target);
      } else {
        router.push(target);
      }
      return;
    }

    // Active - remember as most recent module and navigate directly without notice
    try {
      localStorage.setItem("dawh_recent_module", module.id);
    } catch {
      // ignore
    }

    if (onNavigate) {
      onNavigate(module.route);
    } else {
      router.push(module.route);
    }
  };

  /**
   * Reusable Modern Card Component with clean Black & White Theme
   * Supports Active (Green), Maintenance (Yellow), Disabled (Red)
   * Disabled card has 100% opacity, Lock icon, and muted non-clickable B&W styling
   * Supports Recent card badge on left column in Plan 2 & Plan 3
   */
  const renderCardBox = (
    module: ModuleConfig,
    variant: "hero-large" | "standard-col" | "stacked-compact" | "horizontal-wide" = "standard-col",
    isRecentCard: boolean = false
  ) => {
    const status = getStatus(module.id);
    const isDisabled = status === "disabled";
    const isMaintenance = status === "maintenance";
    const isActive = status === "active";

    // Icon: if disabled, replace with Lock icon!
    const Icon = isDisabled ? Lock : module.icon;
    const isHorizontalWide = variant === "horizontal-wide";
    const isStackedCompact = variant === "stacked-compact";
    const isHeroLarge = variant === "hero-large";

    // Status dot color (เขียว, เหลือง, แดง)
    const statusDotColor = isActive
      ? "#10B981" // เขียว (Green)
      : isMaintenance
      ? "#F59E0B" // เหลือง (Yellow)
      : "#EF4444"; // แดง (Red)

    // Status badge text
    const statusBadgeText = isActive
      ? isThai ? "เปิดใช้งาน" : "Active"
      : isMaintenance
      ? isThai ? "ปิดปรับปรุง" : "Maintenance"
      : isThai ? "ปิดใช้งาน" : "Disabled";

    return (
      <div
        key={module.id}
        onClick={() => handleModuleClick(module)}
        className={`group relative flex rounded-[16px] border transition-all duration-200 select-none opacity-100 ${
          isDisabled
            ? isLight
              ? "bg-[#F4F4F5] border-zinc-300 text-zinc-400 cursor-not-allowed shadow-none"
              : "bg-[#242424] border-[#383838] text-zinc-500 cursor-not-allowed shadow-none"
            : isLight
            ? "bg-white border-zinc-200 hover:border-black shadow-[0px_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0px_8px_24px_rgba(0,0,0,0.12)] cursor-pointer"
            : "bg-[#282828] border-[#444444] hover:border-white shadow-[0px_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0px_8px_24px_rgba(0,0,0,0.5)] cursor-pointer"
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
                  isDisabled
                    ? isLight
                      ? "bg-zinc-200 border-zinc-300 text-zinc-500"
                      : "bg-[#1E1E1E] border-zinc-700 text-zinc-600"
                    : isLight
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
                      isDisabled
                        ? isLight ? "text-zinc-400" : "text-zinc-500"
                        : isLight ? "text-zinc-900" : "text-white"
                    }`}
                    style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                  >
                    {isThai ? module.titleTh : module.title}
                  </h3>

                  {/* Status Badge with Green / Yellow / Red dot */}
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold shrink-0 ${
                      isLight
                        ? "border-zinc-200 text-zinc-700 bg-zinc-50"
                        : "border-[#444444] text-zinc-300 bg-[#222222]"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: statusDotColor }}
                    />
                    <span>{statusBadgeText}</span>
                  </div>
                </div>

                <p
                  className={`text-[13px] line-clamp-1 mt-0.5 ${
                    isDisabled
                      ? isLight ? "text-zinc-400" : "text-zinc-500"
                      : isLight ? "text-zinc-600" : "text-zinc-400"
                  }`}
                >
                  {isThai ? module.descriptionTh : module.description}
                </p>
              </div>
            </div>

            <div className="shrink-0 self-end sm:self-center">
              <button
                type="button"
                disabled={isDisabled}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${
                  isDisabled
                    ? isLight
                      ? "cursor-not-allowed bg-zinc-200 hover:bg-zinc-200 text-zinc-500 border-zinc-300 shadow-none"
                      : "cursor-not-allowed bg-[#1E1E1E] hover:bg-[#1E1E1E] text-zinc-600 border-zinc-700 shadow-none"
                    : isMaintenance
                    ? isLight
                      ? "bg-zinc-100 group-hover:bg-black group-hover:border-black group-hover:text-white border-amber-500 text-zinc-800 shadow-xs"
                      : "bg-[#333333] group-hover:bg-white group-hover:border-white group-hover:text-black border-amber-400 text-neutral-200 shadow-xs"
                    : isLight
                    ? "bg-zinc-100 group-hover:bg-black group-hover:border-black group-hover:text-white border-zinc-300 text-zinc-800 shadow-sm"
                    : "bg-[#333333] group-hover:bg-white group-hover:border-white group-hover:text-black border-white text-neutral-200 shadow-sm"
                }`}
              >
                <span>
                  {isDisabled
                    ? isThai ? "ปิดใช้งาน" : "Disabled"
                    : isMaintenance
                    ? isThai ? "ปิดปรับปรุง" : "Maintenance"
                    : isThai ? "เข้าสู่พื้นที่ทำงาน" : "Enter Workspace"}
                </span>
                {isDisabled ? (
                  <Lock size={13} />
                ) : isMaintenance ? (
                  <Wrench size={13} />
                ) : (
                  <ArrowRight size={14} />
                )}
              </button>
            </div>
          </div>
        ) : (
          // Standard (Plan 2) / Hero (Plan 1 & 3) / Stacked (Plan 3 Right) Box Layout
          <>
            {/* Top Header Row - aligned to top edge of icon box */}
            <div className="flex items-start justify-between gap-3 w-full">
              <div className="flex items-start gap-3.5 min-w-0 flex-1">
                {/* Icon Wrapper */}
                <div
                  className={`flex items-center justify-center rounded-[12px] border transition-colors shrink-0 ${
                    isDisabled
                      ? isLight
                        ? "bg-zinc-200 border-zinc-300 text-zinc-500"
                        : "bg-[#1E1E1E] border-zinc-700 text-zinc-600"
                      : isLight
                      ? "bg-zinc-100 border-zinc-200 text-zinc-900 group-hover:bg-black group-hover:text-white group-hover:border-black"
                      : "bg-[#222222] border-[#444444] text-white group-hover:bg-white group-hover:text-black group-hover:border-white"
                  } ${isStackedCompact ? "w-10 h-10" : "w-12 h-12"}`}
                >
                  <Icon size={isStackedCompact ? 20 : 23} strokeWidth={2} />
                </div>

                {/* Title & Recent Badge */}
                <div className="min-w-0 flex-1 pt-0.5 sm:pt-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3
                      className={`font-bold tracking-tight truncate ${
                        isDisabled
                          ? isLight ? "text-zinc-400" : "text-zinc-500"
                          : isLight ? "text-zinc-900" : "text-white"
                      }`}
                      style={{
                        fontSize: isStackedCompact ? "17px" : "21px",
                        lineHeight: isStackedCompact ? "22px" : "28px",
                        fontFamily: "var(--font-outfit), sans-serif",
                      }}
                    >
                      {isThai ? module.titleTh : module.title}
                    </h3>

                    {/* Recent Badge for Left Card in Plan 2 & Plan 3 */}
                    {isRecentCard && (
                      <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-zinc-300 dark:border-white/20 bg-zinc-100 dark:bg-white/10 text-[10.5px] font-semibold text-zinc-800 dark:text-zinc-200 shrink-0">
                        <Clock size={11} className="text-zinc-600 dark:text-zinc-300" />
                        <span>{isThai ? "เข้าล่าสุด" : "Recent"}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Badge with Green / Yellow / Red dot (Aligned with top edge of icon box) */}
              <div
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-semibold shrink-0 ${
                  isLight
                    ? "border-zinc-200 text-zinc-700 bg-zinc-50"
                    : "border-[#444444] text-zinc-300 bg-[#222222]"
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: statusDotColor }}
                />
                <span>{statusBadgeText}</span>
              </div>
            </div>

            {/* Middle Description */}
            <div className="my-auto py-2 flex flex-col justify-center">
              <p
                className={`leading-[160%] ${
                  isDisabled
                    ? isLight ? "text-zinc-400" : "text-zinc-500"
                    : isLight ? "text-zinc-600" : "text-zinc-400"
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
                disabled={isDisabled}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-xs font-semibold transition-all ${
                  isDisabled
                    ? isLight
                      ? "cursor-not-allowed bg-zinc-200 hover:bg-zinc-200 text-zinc-500 border-zinc-300 shadow-none"
                      : "cursor-not-allowed bg-[#1E1E1E] hover:bg-[#1E1E1E] text-zinc-600 border-zinc-700 shadow-none"
                    : isMaintenance
                    ? isLight
                      ? "bg-zinc-100 group-hover:bg-black group-hover:border-black group-hover:text-white border-amber-500 text-zinc-800 shadow-xs"
                      : "bg-[#333333] group-hover:bg-white group-hover:border-white group-hover:text-black border-amber-400 text-neutral-200 shadow-xs"
                    : isLight
                    ? "bg-zinc-100 group-hover:bg-black group-hover:border-black group-hover:text-white border-zinc-200 text-zinc-800"
                    : "bg-[#333333] group-hover:bg-white group-hover:border-white group-hover:text-black border-[#444444] text-neutral-200"
                }`}
              >
                <span>
                  {isDisabled
                    ? isThai ? "ปิดใช้งาน" : "Disabled"
                    : isMaintenance
                    ? isThai ? "ปิดปรับปรุง" : "Maintenance"
                    : isThai ? "เข้าสู่พื้นที่ทำงาน" : "Enter Workspace"}
                </span>
                {isDisabled ? (
                  <Lock size={13} />
                ) : isMaintenance ? (
                  <Wrench size={13} />
                ) : (
                  <ArrowRight size={14} />
                )}
              </button>
            </div>
          </>
        )}
      </div>
    );
  };

  // Get active modules chosen by user
  let activeModules = selectedModules.map((id) => ALL_AVAILABLE_MODULES[id]).filter(Boolean);

  // In Plan 2 and Plan 3: The left card is the Recent card (เข้าล่าสุด)
  if (plan === "plan2" || plan === "plan3") {
    if (recentModuleId) {
      const recentIndex = activeModules.findIndex((m) => m.id === recentModuleId);
      if (recentIndex > 0) {
        const [recentMod] = activeModules.splice(recentIndex, 1);
        activeModules.unshift(recentMod);
      }
    }
  }

  return (
    <div className="w-full flex flex-col gap-5">
      {/* PLAN 1: Large Rectangle on Top + Thin Wide Rectangle Below */}
      {plan === "plan1" && (
        <div className="w-full flex flex-col gap-5">
          {activeModules[0] ? (
            renderCardBox(activeModules[0], "hero-large", false)
          ) : (
            <div className="p-8 border-2 border-dashed border-zinc-300 dark:border-white/20 rounded-[16px] text-center text-sm text-zinc-400 dark:text-zinc-500 h-[390px] flex items-center justify-center">
              {isThai ? "กรุณาเลือกโมดูลหลักอย่างน้อย 1 โมดูล" : "Please select at least 1 primary module"}
            </div>
          )}
          {renderCardBox(reportsModule, "horizontal-wide")}
        </div>
      )}

      {/* PLAN 2: 2 Equal Smaller Columns on Top + Full Width Horizontal Below */}
      {/* Left card is Recent card */}
      {plan === "plan2" && (
        <div className="w-full flex flex-col gap-5">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 w-full">
            {activeModules.slice(0, 2).map((mod, idx) =>
              renderCardBox(mod, "standard-col", idx === 0)
            )}
            {activeModules.length < 2 && (
              <div className="p-8 border-2 border-dashed border-zinc-300 dark:border-white/20 rounded-[16px] text-center text-sm text-zinc-400 dark:text-zinc-500 h-[390px] flex items-center justify-center">
                {isThai ? "กรุณาเลือกโมดูลที่ 2" : "Please select a 2nd module"}
              </div>
            )}
          </div>
          {renderCardBox(reportsModule, "horizontal-wide")}
        </div>
      )}

      {/* PLAN 3: Left Large Rectangle (Recent) + Right Column with 2 Stacked Rectangles + Full Width Below */}
      {plan === "plan3" && (
        <div className="w-full flex flex-col gap-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 w-full items-stretch">
            {/* Left Col (span 7) - Recent Card */}
            <div className="lg:col-span-7 flex flex-col">
              {activeModules[0] ? (
                renderCardBox(activeModules[0], "hero-large", true)
              ) : (
                <div className="p-8 border-2 border-dashed border-zinc-300 dark:border-white/20 rounded-[16px] text-center text-sm text-zinc-400 dark:text-zinc-500 w-full h-[390px] flex items-center justify-center">
                  {isThai ? "ไม่มีโมดูลซ้าย" : "No left module"}
                </div>
              )}
            </div>

            {/* Right Col: 2 Stacked (span 5) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-5 lg:h-[390px]">
              {activeModules.slice(1, 3).map((mod) =>
                renderCardBox(mod, "stacked-compact", false)
              )}
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
