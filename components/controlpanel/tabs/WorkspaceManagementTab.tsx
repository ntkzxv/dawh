"use client";

import React, { useState, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import { useNotification } from "@/context/NotificationContext";
import {
  LayoutGrid,
  Box,
  Database,
  Users,
  FileText,
  Save,
  RotateCcw,
  CheckCircle,
  AlertTriangle,
  Lock,
  ExternalLink,
  Layers,
  Sparkles,
  Sliders,
  ShieldCheck,
} from "lucide-react";
import {
  ALL_AVAILABLE_MODULES,
  type WorkspacePlanType,
  type PrimaryModuleId,
  type ModuleStatus,
} from "@/components/users/DynamicWorkspaceLayout";
import {
  DEFAULT_WORKSPACE_CONFIG,
  type WorkspaceLayoutConfig,
} from "@/components/users/workspace";

interface WorkspaceManagementTabProps {
  isThai: boolean;
}

export default function WorkspaceManagementTab({ isThai }: WorkspaceManagementTabProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { notify } = useNotification();

  // Workspace configuration state
  const [layoutConfig, setLayoutConfig] = useState<WorkspaceLayoutConfig>(DEFAULT_WORKSPACE_CONFIG);
  const [moduleStatuses, setModuleStatuses] = useState<Record<string, ModuleStatus>>({
    warehouse: "active",
    datacenter: "active",
    employee: "active",
    reports: "active",
  });
  const [hasChanges, setHasChanges] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const savedConfig = localStorage.getItem("dawh_workspace_layout_config");
      if (savedConfig) {
        const parsed = JSON.parse(savedConfig);
        if (parsed.plan && Array.isArray(parsed.selectedModules)) {
          setLayoutConfig(parsed);
        }
      }
      const savedStatuses = localStorage.getItem("dawh_module_statuses");
      if (savedStatuses) {
        setModuleStatuses(JSON.parse(savedStatuses));
      }
    } catch {
      // Non-blocking fallback
    }
  }, []);

  const handlePlanChange = (plan: WorkspacePlanType) => {
    let newModules = [...layoutConfig.selectedModules];
    if (plan === "plan1") {
      newModules = [newModules[0] || "warehouse"];
    } else if (plan === "plan2") {
      if (newModules.length < 2) {
        newModules = ["warehouse", "datacenter"];
      } else {
        newModules = newModules.slice(0, 2);
      }
    } else if (plan === "plan3") {
      newModules = ["warehouse", "datacenter", "employee"];
    }
    setLayoutConfig({ plan, selectedModules: newModules });
    setHasChanges(true);
  };

  const handleToggleModuleSelection = (modId: PrimaryModuleId) => {
    const isSelected = layoutConfig.selectedModules.includes(modId);
    let updated: PrimaryModuleId[];

    if (layoutConfig.plan === "plan1") {
      updated = [modId];
    } else if (layoutConfig.plan === "plan2") {
      if (isSelected) {
        if (layoutConfig.selectedModules.length <= 1) {
          notify.warning(
            isThai ? "ต้องเลือกอย่างน้อย 1 โมดูล" : "At least 1 module required",
            { message: isThai ? "แผน Plan 2 ต้องมีโมดูลหลักแสดงผลอย่างน้อย 1 โมดูล" : "Plan 2 requires at least one visible module." }
          );
          return;
        }
        updated = layoutConfig.selectedModules.filter((id) => id !== modId);
      } else {
        if (layoutConfig.selectedModules.length >= 2) {
          // Replace second module
          updated = [layoutConfig.selectedModules[0], modId];
        } else {
          updated = [...layoutConfig.selectedModules, modId];
        }
      }
    } else {
      // plan3 shows all 3 primary modules
      return;
    }

    setLayoutConfig({ ...layoutConfig, selectedModules: updated });
    setHasChanges(true);
  };

  const handleStatusChange = (moduleId: string, status: ModuleStatus) => {
    setModuleStatuses((prev) => ({
      ...prev,
      [moduleId]: status,
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    try {
      localStorage.setItem("dawh_workspace_layout_config", JSON.stringify(layoutConfig));
      localStorage.setItem("dawh_module_statuses", JSON.stringify(moduleStatuses));
      setHasChanges(false);
      notify.success(
        isThai ? "บันทึกการตั้งค่าเวิร์กสเปซสำเร็จ" : "Workspace Settings Saved",
        {
          message: isThai
            ? "การเปลี่ยนแปลงเลย์เอาต์และสถานะโมดูลมีผลทันทีกับหน้า Workspace Hub"
            : "Layout plan and module operational states have been successfully updated.",
        }
      );
    } catch {
      notify.error(isThai ? "บันทึกไม่สำเร็จ" : "Failed to Save", {
        message: isThai ? "เกิดข้อผิดพลาดในการบันทึกข้อมูลลงในระบบ" : "Could not persist workspace settings.",
      });
    }
  };

  const handleResetToDefault = () => {
    setLayoutConfig(DEFAULT_WORKSPACE_CONFIG);
    setModuleStatuses({
      warehouse: "active",
      datacenter: "active",
      employee: "active",
      reports: "active",
    });
    setHasChanges(true);
  };

  const moduleList = Object.values(ALL_AVAILABLE_MODULES);

  return (
    <div className="flex flex-col gap-5 w-full">
      {/* Top Banner Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-2 px-1">
        <div>
          <h2 className="font-bold text-[18px] leading-tight">
            {isThai ? "ตั้งค่าเวิร์กสเปซและโมดูลระบบ" : "Workspace Setting"}
          </h2>
          <p className={`text-[12px] mt-0.5 ${isLight ? "text-zinc-500" : "text-[#E4E4E7]"}`}>
            {isThai
              ? "ปรับแต่งเลย์เอาต์หน้าจอหลัก จัดการการแสดงผล และควบคุมสถานะความพร้อมใช้งานของโมดูล (Active, Maintenance, Disabled)"
              : "Configure workspace layout grids, display prioritisation, and runtime module operational states"}
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {hasChanges && (
            <button
              type="button"
              onClick={handleResetToDefault}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isLight
                  ? "bg-zinc-100 border-zinc-200 text-zinc-700 hover:bg-zinc-200"
                  : "bg-[#2C2C2C] border-[#444444] text-zinc-300 hover:bg-[#333333]"
              }`}
            >
              <RotateCcw size={13} />
              <span>{isThai ? "คืนค่าเริ่มต้น" : "Reset Default"}</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleSave}
            disabled={!hasChanges}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer ${
              hasChanges
                ? isLight
                  ? "bg-zinc-900 hover:bg-black text-white active:scale-95"
                  : "bg-white hover:bg-zinc-200 text-zinc-900 active:scale-95"
                : "opacity-40 cursor-not-allowed bg-zinc-300 dark:bg-zinc-700 text-zinc-500"
            }`}
          >
            <Save size={14} />
            <span>{isThai ? "บันทึกการเปลี่ยนแปลง" : "Save Changes"}</span>
          </button>
        </div>
      </div>

      {/* 1. Layout Plan Architecture Selection */}
      <div
        className={`p-5 rounded-2xl border transition-colors shadow-sm ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        <div className="mb-4">
          <h3 className="font-bold text-sm tracking-tight">
            {isThai ? "1. เลือกโครงสร้างเลย์เอาต์หน้าจอหลัก (Workspace Layout Plan)" : "1. Select Workspace Layout Plan"}
          </h3>
          <p className={`text-xs mt-0.5 ${isLight ? "text-zinc-500" : "text-[#E4E4E7]"}`}>
            {isThai
              ? "กำหนดรูปแบบการจัดวางการ์ดโมดูลบนหน้าเวิร์กสเปซตามความเหมาะสมของอุปกรณ์และบริบทการทำงาน"
              : "Choose the visual card grid layout displayed to staff upon entering the operations portal"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Plan 1 */}
          <div
            onClick={() => handlePlanChange("plan1")}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3.5 ${
              layoutConfig.plan === "plan1"
                ? isLight
                  ? "border-zinc-900 bg-zinc-50/80 shadow-md"
                  : "border-white bg-[#2A2A2A] shadow-lg"
                : isLight
                ? "border-zinc-200 hover:border-zinc-400 bg-white"
                : "border-[#444444] hover:border-[#666666] bg-[#2E2E2E]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs">Plan 1: Hero Featured</span>
                {layoutConfig.plan === "plan1" && (
                  <CheckCircle size={15} className={isLight ? "text-zinc-900" : "text-white"} />
                )}
              </div>
              <p className={`text-[11px] leading-relaxed ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                {isThai
                  ? "การ์ดโมดูลหลักขนาดใหญ่เต็มพื้นที่ 1 โมดูลเด่น พร้อมแถบรายงานแนวนอนด้านล่าง"
                  : "Single ultra-wide hero banner card with persistent lower report section"}
              </p>
            </div>

            {/* Wireframe Preview */}
            <div className={`p-2.5 rounded-lg border flex flex-col gap-1.5 ${isLight ? "bg-zinc-100 border-zinc-200" : "bg-[#222222] border-[#383838]"}`}>
              <div className={`h-12 rounded-md border flex items-center justify-center text-[10px] font-bold ${layoutConfig.plan === "plan1" ? (isLight ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-900 border-white") : "opacity-40 border-dashed border-zinc-400"}`}>
                Primary Hero (100%)
              </div>
              <div className={`h-6 rounded-md border flex items-center justify-center text-[9px] opacity-60 ${isLight ? "bg-zinc-200 border-zinc-300" : "bg-[#333333] border-[#444444]"}`}>
                Reports & Audit (100px)
              </div>
            </div>
          </div>

          {/* Plan 2 */}
          <div
            onClick={() => handlePlanChange("plan2")}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3.5 ${
              layoutConfig.plan === "plan2"
                ? isLight
                  ? "border-zinc-900 bg-zinc-50/80 shadow-md"
                  : "border-white bg-[#2A2A2A] shadow-lg"
                : isLight
                ? "border-zinc-200 hover:border-zinc-400 bg-white"
                : "border-[#444444] hover:border-[#666666] bg-[#2E2E2E]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs">Plan 2: Dual Split (Default)</span>
                {layoutConfig.plan === "plan2" && (
                  <CheckCircle size={15} className={isLight ? "text-zinc-900" : "text-white"} />
                )}
              </div>
              <p className={`text-[11px] leading-relaxed ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                {isThai
                  ? "แบ่งสัดส่วนครึ่งต่อครึ่ง (50/50) ระหว่าง 2 โมดูลหลักยอดนิยม (Warehouse & Datacenter)"
                  : "Balanced 50/50 two-card split for primary operational modules"}
              </p>
            </div>

            {/* Wireframe Preview */}
            <div className={`p-2.5 rounded-lg border flex flex-col gap-1.5 ${isLight ? "bg-zinc-100 border-zinc-200" : "bg-[#222222] border-[#383838]"}`}>
              <div className="grid grid-cols-2 gap-1.5 h-12">
                <div className={`rounded-md border flex items-center justify-center text-[9px] font-bold ${layoutConfig.plan === "plan2" ? (isLight ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-900 border-white") : "opacity-40 border-dashed border-zinc-400"}`}>
                  Module A (50%)
                </div>
                <div className={`rounded-md border flex items-center justify-center text-[9px] font-bold ${layoutConfig.plan === "plan2" ? (isLight ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-900 border-white") : "opacity-40 border-dashed border-zinc-400"}`}>
                  Module B (50%)
                </div>
              </div>
              <div className={`h-6 rounded-md border flex items-center justify-center text-[9px] opacity-60 ${isLight ? "bg-zinc-200 border-zinc-300" : "bg-[#333333] border-[#444444]"}`}>
                Reports & Audit (100px)
              </div>
            </div>
          </div>

          {/* Plan 3 */}
          <div
            onClick={() => handlePlanChange("plan3")}
            className={`p-4 rounded-xl border-2 transition-all cursor-pointer flex flex-col justify-between gap-3.5 ${
              layoutConfig.plan === "plan3"
                ? isLight
                  ? "border-zinc-900 bg-zinc-50/80 shadow-md"
                  : "border-white bg-[#2A2A2A] shadow-lg"
                : isLight
                ? "border-zinc-200 hover:border-zinc-400 bg-white"
                : "border-[#444444] hover:border-[#666666] bg-[#2E2E2E]"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-bold text-xs">Plan 3: Hero & Stacked</span>
                {layoutConfig.plan === "plan3" && (
                  <CheckCircle size={15} className={isLight ? "text-zinc-900" : "text-white"} />
                )}
              </div>
              <p className={`text-[11px] leading-relaxed ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                {isThai
                  ? "การ์ดหลักฝั่งซ้าย (60%) คู่กับการ์ดรองสองใบซ้อนฝั่งขวา (40%) ครบทั้ง 3 โมดูล"
                  : "Asymmetric layout: One prominent hero card + two compact stacked modules"}
              </p>
            </div>

            {/* Wireframe Preview */}
            <div className={`p-2.5 rounded-lg border flex flex-col gap-1.5 ${isLight ? "bg-zinc-100 border-zinc-200" : "bg-[#222222] border-[#383838]"}`}>
              <div className="grid grid-cols-5 gap-1.5 h-12">
                <div className={`col-span-3 rounded-md border flex items-center justify-center text-[9px] font-bold ${layoutConfig.plan === "plan3" ? (isLight ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-900 border-white") : "opacity-40 border-dashed border-zinc-400"}`}>
                  Hero (60%)
                </div>
                <div className="col-span-2 flex flex-col gap-1">
                  <div className={`flex-1 rounded-sm border flex items-center justify-center text-[8px] font-bold ${layoutConfig.plan === "plan3" ? (isLight ? "bg-zinc-800 text-white" : "bg-zinc-200 text-zinc-900") : "opacity-40"}`}>
                    Sub 1
                  </div>
                  <div className={`flex-1 rounded-sm border flex items-center justify-center text-[8px] font-bold ${layoutConfig.plan === "plan3" ? (isLight ? "bg-zinc-800 text-white" : "bg-zinc-200 text-zinc-900") : "opacity-40"}`}>
                    Sub 2
                  </div>
                </div>
              </div>
              <div className={`h-6 rounded-md border flex items-center justify-center text-[9px] opacity-60 ${isLight ? "bg-zinc-200 border-zinc-300" : "bg-[#333333] border-[#444444]"}`}>
                Reports & Audit (100px)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Module Visibility Selection (For Plan 1 & Plan 2) */}
      {layoutConfig.plan !== "plan3" && (
        <div
          className={`p-5 rounded-2xl border transition-colors shadow-sm ${
            isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
          }`}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-sm tracking-tight">
                {isThai
                  ? `2. เลือกโมดูลที่ต้องการแสดงผล (เลือกได้ ${layoutConfig.plan === "plan1" ? "1 โมดูล" : "สูงสุด 2 โมดูล"})`
                  : `2. Selected Primary Modules (${layoutConfig.plan === "plan1" ? "Select 1" : "Up to 2"})`}
              </h3>
              <p className={`text-xs mt-0.5 ${isLight ? "text-zinc-500" : "text-[#E4E4E7]"}`}>
                {isThai
                  ? "กำหนดโมดูลหลักที่จะแสดงในการ์ดเด่นของหน้าหลัก"
                  : "Specify which module cards will occupy the primary layout slots"}
              </p>
            </div>
            <span className="text-xs font-semibold opacity-60 shrink-0">
              {layoutConfig.selectedModules.length} / {layoutConfig.plan === "plan1" ? "1" : "2"} {isThai ? "เลือกแล้ว" : "selected"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(["warehouse", "datacenter", "employee"] as PrimaryModuleId[]).map((modId) => {
              const mod = ALL_AVAILABLE_MODULES[modId];
              const isSelected = layoutConfig.selectedModules.includes(modId);
              const Icon = mod.icon;

              return (
                <div
                  key={modId}
                  onClick={() => handleToggleModuleSelection(modId)}
                  className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                    isSelected
                      ? isLight
                        ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                        : "bg-white text-zinc-900 border-white shadow-sm"
                      : isLight
                      ? "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-700"
                      : "bg-[#2C2C2C] hover:bg-[#333333] border-[#444444] text-zinc-300"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isSelected
                          ? isLight ? "bg-zinc-800 text-white" : "bg-zinc-200 text-zinc-900"
                          : isLight ? "bg-white border border-zinc-200 text-zinc-800" : "bg-[#222222] border border-[#444444] text-white"
                      }`}
                    >
                      <Icon size={16} />
                    </div>
                    <div className="min-w-0">
                      <div className="font-bold text-xs truncate">
                        {isThai ? mod.titleTh : mod.title}
                      </div>
                      <div className={`text-[10px] truncate ${isSelected ? (isLight ? "text-zinc-300" : "text-zinc-600") : "opacity-60"}`}>
                        {mod.route}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? isLight ? "bg-white text-zinc-900 border-white" : "bg-zinc-900 text-white border-zinc-900"
                        : "border-zinc-400 opacity-40"
                    }`}
                  >
                    {isSelected && <CheckCircle size={13} className="stroke-[2.5]" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. Runtime Module Operational States (Active, Maintenance, Disabled) */}
      <div
        className={`p-5 rounded-2xl border transition-colors shadow-sm ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        <div className="mb-4">
          <h3 className="font-bold text-sm tracking-tight">
            {isThai ? "3. สถานะการทำงานของแต่ละโมดูล (Module Operational Availability)" : "3. Module Runtime Status & Maintenance Controls"}
          </h3>
          <p className={`text-xs mt-0.5 ${isLight ? "text-zinc-500" : "text-[#E4E4E7]"}`}>
            {isThai
              ? "ควบคุมการเข้าใช้งานโมดูลในระบบ หากตั้งเป็น 'ปิดปรับปรุง' หรือ 'ปิดใช้งาน' ผู้ใช้ทั่วไปจะไม่สามารถคลิกเข้าสู่โมดูลนั้นได้"
              : "Set operational status per module. Maintenance or Disabled status safely blocks end-user access with alert guards"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {moduleList.map((mod) => {
            const currentStatus: ModuleStatus = moduleStatuses[mod.id] || "active";
            const Icon = mod.icon;

            return (
              <div
                key={mod.id}
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition-colors ${
                  isLight ? "bg-zinc-50/60 border-zinc-200" : "bg-[#2C2C2C] border-[#444444]"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                        isLight ? "bg-white border border-zinc-200 text-zinc-900 shadow-sm" : "bg-[#222222] border border-[#444444] text-white"
                      }`}
                    >
                      <Icon size={18} />
                    </div>
                    <div>
                      <div className="font-bold text-xs flex items-center gap-2">
                        <span>{isThai ? mod.titleTh : mod.title}</span>
                        <span className="font-mono text-[10px] opacity-50">{mod.route}</span>
                      </div>
                      <p className={`text-[11px] mt-0.5 line-clamp-1 ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                        {isThai ? mod.descriptionTh : mod.description}
                      </p>
                    </div>
                  </div>

                  {/* Current Status Pill */}
                  <div
                    className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                      currentStatus === "active"
                        ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                        : currentStatus === "maintenance"
                        ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                        : "bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        currentStatus === "active"
                          ? "bg-emerald-500"
                          : currentStatus === "maintenance"
                          ? "bg-amber-500"
                          : "bg-rose-500"
                      }`}
                    />
                    <span>
                      {currentStatus === "active"
                        ? isThai ? "เปิดใช้งาน" : "Active"
                        : currentStatus === "maintenance"
                        ? isThai ? "ปิดปรับปรุง" : "Maintenance"
                        : isThai ? "ปิดใช้งาน" : "Disabled"}
                    </span>
                  </div>
                </div>

                {/* Status Switcher Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-[#444444]/20 text-[11px] font-semibold">
                  <button
                    type="button"
                    onClick={() => handleStatusChange(mod.id, "active")}
                    className={`py-1.5 px-2 rounded-lg border transition-all cursor-pointer text-center ${
                      currentStatus === "active"
                        ? isLight
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-emerald-500 text-white border-emerald-500 shadow-sm"
                        : isLight
                        ? "bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700"
                        : "bg-[#222222] hover:bg-[#333333] border-[#444444] text-zinc-400"
                    }`}
                  >
                    {isThai ? "เปิดใช้งาน (Active)" : "Active"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(mod.id, "maintenance")}
                    className={`py-1.5 px-2 rounded-lg border transition-all cursor-pointer text-center ${
                      currentStatus === "maintenance"
                        ? isLight
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "bg-amber-500 text-white border-amber-500 shadow-sm"
                        : isLight
                        ? "bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700"
                        : "bg-[#222222] hover:bg-[#333333] border-[#444444] text-zinc-400"
                    }`}
                  >
                    {isThai ? "ปรับปรุง (Maint.)" : "Maintenance"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStatusChange(mod.id, "disabled")}
                    className={`py-1.5 px-2 rounded-lg border transition-all cursor-pointer text-center ${
                      currentStatus === "disabled"
                        ? isLight
                          ? "bg-rose-600 text-white border-rose-600 shadow-sm"
                          : "bg-rose-500 text-white border-rose-500 shadow-sm"
                        : isLight
                        ? "bg-white hover:bg-zinc-100 border-zinc-200 text-zinc-700"
                        : "bg-[#222222] hover:bg-[#333333] border-[#444444] text-zinc-400"
                    }`}
                  >
                    {isThai ? "ปิดใช้งาน (Off)" : "Disabled"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
