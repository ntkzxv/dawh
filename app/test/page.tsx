"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage, setAppLanguage } from "@/utils/language";
import {
  DynamicWorkspaceLayout,
  WorkspacePlanType,
  PrimaryModuleId,
  ALL_AVAILABLE_MODULES,
} from "@/components/users";
import { Check, ExternalLink, Save, RotateCcw } from "lucide-react";

type TabKey = "workspace";

interface LayoutConfig {
  plan: WorkspacePlanType;
  selectedModules: PrimaryModuleId[];
}

const STORAGE_KEY = "dawh_workspace_layout_config";

export default function TestPage() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const currentLang = useAppLanguage();
  const isThai = currentLang === "TH";

  const [activeTab, setActiveTab] = useState<TabKey>("workspace");

  // Layout Builder State
  const [selectedPlan, setSelectedPlan] = useState<WorkspacePlanType>("plan2");
  const [selectedModules, setSelectedModules] = useState<PrimaryModuleId[]>([
    "warehouse",
    "datacenter",
  ]);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load existing configuration from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: LayoutConfig = JSON.parse(saved);
        if (parsed.plan) setSelectedPlan(parsed.plan);
        if (Array.isArray(parsed.selectedModules) && parsed.selectedModules.length > 0) {
          setSelectedModules(parsed.selectedModules);
        }
      }
    } catch (e) {
      console.error("Failed to read layout configuration", e);
    }
  }, []);

  const toggleLanguage = () => {
    setAppLanguage(currentLang === "TH" ? "EN" : "TH");
  };

  const tabs: { key: TabKey; labelTh: string; labelEn: string }[] = [
    {
      key: "workspace",
      labelTh: "พื้นที่ทำงาน",
      labelEn: "Workspace",
    },
  ];

  // Primary available module choices (Reports & Auditing is fixed for all layouts)
  const availablePrimaryModules: {
    id: PrimaryModuleId;
    labelTh: string;
    labelEn: string;
    descTh: string;
    descEn: string;
  }[] = [
    {
      id: "warehouse",
      labelTh: "Warehouse ERP",
      labelEn: "Warehouse ERP",
      descTh: "จัดการคลังสินค้า สต็อก SKU และการกระจายสินค้า",
      descEn: "Inventory management, SKU movement, and dispatch.",
    },
    {
      id: "datacenter",
      labelTh: "HP Datacenter",
      labelEn: "HP Datacenter",
      descTh: "สัญญาเช่าซื้อ บัญชีลูกหนี้ และประวัติลูกค้า",
      descEn: "Hire-purchase contracts, ledgers, and debtor tracking.",
    },
    {
      id: "employee",
      labelTh: "Employee Management",
      labelEn: "Employee Management",
      descTh: "บริหารจัดการพนักงาน โครงสร้างเงินเดือน และกะงาน",
      descEn: "HR profiles, directory, and scheduling structures.",
    },
  ];

  const getMaxModulesForPlan = (plan: WorkspacePlanType): number => {
    if (plan === "plan1") return 1;
    if (plan === "plan2") return 2;
    return 3;
  };

  const handlePlanChange = (newPlan: WorkspacePlanType) => {
    setSelectedPlan(newPlan);
    const max = getMaxModulesForPlan(newPlan);
    if (selectedModules.length > max) {
      setSelectedModules(selectedModules.slice(0, max));
    } else if (newPlan === "plan2" && selectedModules.length < 2) {
      const allChoices: PrimaryModuleId[] = ["warehouse", "datacenter", "employee"];
      const missing = allChoices.filter((m) => !selectedModules.includes(m));
      setSelectedModules([...selectedModules, ...missing].slice(0, 2));
    } else if (newPlan === "plan3" && selectedModules.length < 3) {
      const allChoices: PrimaryModuleId[] = ["warehouse", "datacenter", "employee"];
      setSelectedModules(allChoices);
    }
  };

  const handleModuleToggle = (id: PrimaryModuleId) => {
    const max = getMaxModulesForPlan(selectedPlan);
    setSelectedModules((prev) => {
      if (prev.includes(id)) {
        // Prevent deselecting if it leaves 0 modules
        if (prev.length <= 1) return prev;
        return prev.filter((m) => m !== id);
      } else {
        // Enforce maximum selection rule strictly per Plan
        if (prev.length >= max) {
          if (max === 1) {
            // Plan 1: switch directly to clicked module
            return [id];
          }
          if (max === 2) {
            // Plan 2: strictly max 2 modules, replace the 2nd module
            return [prev[0], id];
          }
          // Plan 3: replace the 3rd module
          return [prev[0], prev[1], id];
        }
        return [...prev, id];
      }
    });
  };

  // Preset Handlers
  const applyPreset = (plan: WorkspacePlanType, modules: PrimaryModuleId[]) => {
    setSelectedPlan(plan);
    const max = getMaxModulesForPlan(plan);
    setSelectedModules(modules.slice(0, max));
  };

  // Save to localStorage for actual Workspace page
  const handleSaveConfig = () => {
    const config: LayoutConfig = {
      plan: selectedPlan,
      selectedModules,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      setSaveMessage(
        isThai
          ? "บันทึกการตั้งค่าไปยังหน้า Workspace เรียบร้อยแล้ว"
          : "Saved configuration to Workspace successfully"
      );
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  const handleReset = () => {
    setSelectedPlan("plan2");
    setSelectedModules(["warehouse", "datacenter"]);
    localStorage.removeItem(STORAGE_KEY);
    setSaveMessage(isThai ? "รีเซ็ตเป็นค่าเริ่มต้นแล้ว" : "Reset to default configuration");
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div
      className={`min-h-screen flex transition-colors duration-200 ${
        isLight ? "bg-[#F8FAFC] text-slate-900" : "bg-[#1E1E1E] text-white"
      }`}
    >
      {/* Sidebar: เรียบง่าย เน้นใช้งาน ไม่มี icon และวงเล็บ */}
      <aside
        className={`w-60 flex flex-col justify-between border-r shrink-0 transition-colors duration-200 ${
          isLight
            ? "bg-white border-slate-200"
            : "bg-[#252525] border-[#383838]"
        }`}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div
            className={`p-4 border-b ${
              isLight ? "border-slate-100" : "border-[#333333]"
            }`}
          >
            <h1 className="text-base font-semibold tracking-tight">
              {isThai ? "ศูนย์ทดสอบระบบ" : "API Test Bench"}
            </h1>
            <p
              className={`text-xs mt-0.5 ${
                isLight ? "text-slate-500" : "text-neutral-400"
              }`}
            >
              {isThai ? "เครื่องมือทดสอบ API" : "System Diagnostics"}
            </p>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-1">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? isLight
                        ? "bg-slate-900 text-white"
                        : "bg-white text-slate-950"
                      : isLight
                      ? "text-slate-700 hover:bg-slate-100"
                      : "text-neutral-300 hover:bg-[#333333]"
                  }`}
                >
                  {isThai ? tab.labelTh : tab.labelEn}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Settings: Theme & Language Toggle */}
        <div
          className={`p-3 border-t space-y-2 ${
            isLight ? "border-slate-100" : "border-[#333333]"
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex-1 py-1.5 px-2 rounded text-xs font-medium border text-center transition-colors ${
                isLight
                  ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                  : "bg-[#333333] hover:bg-[#3E3E3E] border-[#444444] text-neutral-200"
              }`}
            >
              {isThai
                ? isLight
                  ? "เปลี่ยนเป็นโหมดมืด"
                  : "เปลี่ยนเป็นโหมดสว่าง"
                : isLight
                ? "Switch to Dark"
                : "Switch to Light"}
            </button>

            <button
              type="button"
              onClick={toggleLanguage}
              className={`py-1.5 px-3 rounded text-xs font-medium border text-center transition-colors ${
                isLight
                  ? "bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-800"
                  : "bg-[#333333] hover:bg-[#3E3E3E] border-[#444444] text-neutral-200"
              }`}
            >
              {currentLang}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 p-6 sm:p-10 overflow-y-auto max-h-screen">
        {activeTab === "workspace" && (
          <div className="max-w-6xl w-full flex flex-col gap-8 pb-16">
            {/* Header & Page Description */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold tracking-tight">
                  {isThai ? "ทดสอบการจัด Layout การ์ดหน้า Workspace" : "Workspace Layout Card Test Bench"}
                </h2>
                <p
                  className={`text-sm mt-1 ${
                    isLight ? "text-slate-500" : "text-neutral-400"
                  }`}
                >
                  {isThai
                    ? "เลือก Plan และโมดูลที่ต้องการให้แสดงผล พร้อมดูตัวอย่างแบบเรียลไทม์ และบันทึกไปใช้งานในหน้า Workspace จริง"
                    : "Select layout plans and active modules, preview them live, and apply changes to the actual Workspace."}
                </p>
              </div>

              {/* View Real Workspace Link */}
              <Link
                href="/workspace"
                target="_blank"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                  isLight
                    ? "bg-slate-900 text-white hover:bg-slate-800 border-slate-900"
                    : "bg-white text-slate-900 hover:bg-neutral-200 border-white"
                }`}
              >
                <span>{isThai ? "เปิดหน้า Workspace จริง" : "Open Live Workspace"}</span>
                <ExternalLink size={13} />
              </Link>
            </div>

            {/* Notification message */}
            {saveMessage && (
              <div className={`px-4 py-3 rounded-lg text-sm border flex items-center gap-2 ${
                isLight
                  ? "bg-zinc-100 border-zinc-300 text-zinc-900"
                  : "bg-white/10 border-white/20 text-white"
              }`}>
                <Check size={16} />
                <span>{saveMessage}</span>
              </div>
            )}

            {/* CONTROL PANEL SECTION */}
            <div
              className={`p-6 rounded-2xl border transition-colors flex flex-col gap-6 ${
                isLight ? "bg-white border-zinc-200 shadow-sm" : "bg-[#252525] border-[#383838]"
              }`}
            >
              {/* 1. PLAN SELECTOR */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                    {isThai ? "1. เลือก Layout Plan (ขาว/ดำ)" : "1. Select Layout Plan (B&W)"}
                  </label>
                  <span className={`text-xs ${isLight ? "text-zinc-500" : "text-neutral-400"}`}>
                    {isThai ? "Report & Auditing จะอยู่ทุก Plan เสมอ" : "Report & Auditing is fixed in all plans"}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {/* Plan 1 Card */}
                  <button
                    type="button"
                    onClick={() => handlePlanChange("plan1")}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-3 ${
                      selectedPlan === "plan1"
                        ? isLight
                          ? "border-zinc-900 bg-zinc-100/80 shadow-sm"
                          : "border-white bg-white/10 shadow-sm"
                        : isLight
                        ? "border-zinc-200 hover:border-zinc-400 bg-zinc-50/50"
                        : "border-[#3A3A3A] hover:border-white/30 bg-[#1E1E1E]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">Plan 1</span>
                      {selectedPlan === "plan1" && (
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isLight ? "bg-zinc-900 text-white" : "bg-white text-zinc-950"
                        }`}>
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    {/* Wireframe Diagram */}
                    <div className="w-full flex flex-col gap-1.5 py-1">
                      <div className={`w-full h-10 rounded border-2 flex items-center justify-center text-[10px] font-semibold ${
                        isLight
                          ? "border-zinc-800 bg-zinc-200 text-zinc-900"
                          : "border-white/60 bg-white/15 text-white"
                      }`}>
                        {isThai ? "1 กรอบใหญ่ (390px)" : "1 Large Hero (390px)"}
                      </div>
                      <div className={`w-full h-4 rounded border flex items-center justify-center text-[9px] ${
                        isLight
                          ? "border-zinc-400 bg-zinc-100 text-zinc-700"
                          : "border-white/30 bg-white/5 text-zinc-300"
                      }`}>
                        Report & Auditing (100px)
                      </div>
                    </div>
                    <p className={`text-xs leading-relaxed ${isLight ? "text-zinc-600" : "text-neutral-400"}`}>
                      {isThai
                        ? "กรอบสี่เหลี่ยมผืนผ้าขนาดใหญ่ 1 กรอบ วางอยู่เหนือกรอบแนวนอนบางๆ (สูงรวม 510px)"
                        : "1 large rectangular card on top + 1 thin horizontal card below (Total 510px)."}
                    </p>
                  </button>

                  {/* Plan 2 Card */}
                  <button
                    type="button"
                    onClick={() => handlePlanChange("plan2")}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-3 ${
                      selectedPlan === "plan2"
                        ? isLight
                          ? "border-zinc-900 bg-zinc-100/80 shadow-sm"
                          : "border-white bg-white/10 shadow-sm"
                        : isLight
                        ? "border-zinc-200 hover:border-zinc-400 bg-zinc-50/50"
                        : "border-[#3A3A3A] hover:border-white/30 bg-[#1E1E1E]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">Plan 2</span>
                      {selectedPlan === "plan2" && (
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isLight ? "bg-zinc-900 text-white" : "bg-white text-zinc-950"
                        }`}>
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    {/* Wireframe Diagram */}
                    <div className="w-full flex flex-col gap-1.5 py-1">
                      <div className="grid grid-cols-2 gap-1.5">
                        <div className={`h-10 rounded border-2 flex items-center justify-center text-[10px] font-semibold ${
                          isLight
                            ? "border-zinc-800 bg-zinc-200 text-zinc-900"
                            : "border-white/60 bg-white/15 text-white"
                        }`}>
                          Col 1 (390px)
                        </div>
                        <div className={`h-10 rounded border-2 flex items-center justify-center text-[10px] font-semibold ${
                          isLight
                            ? "border-zinc-800 bg-zinc-200 text-zinc-900"
                            : "border-white/60 bg-white/15 text-white"
                        }`}>
                          Col 2 (390px)
                        </div>
                      </div>
                      <div className={`w-full h-4 rounded border flex items-center justify-center text-[9px] ${
                        isLight
                          ? "border-zinc-400 bg-zinc-100 text-zinc-700"
                          : "border-white/30 bg-white/5 text-zinc-300"
                      }`}>
                        Report & Auditing (100px)
                      </div>
                    </div>
                    <p className={`text-xs leading-relaxed ${isLight ? "text-zinc-600" : "text-neutral-400"}`}>
                      {isThai
                        ? "กรอบขนาดใหญ่เท่ากัน 2 กรอบ (ความสูง 390px เท่า Plan 1 & 3) อยู่เหนือกรอบแนวนอนยาว"
                        : "2 larger equal-sized cards (height 390px matching Plan 1 & 3) on top + horizontal below."}
                    </p>
                  </button>

                  {/* Plan 3 Card */}
                  <button
                    type="button"
                    onClick={() => handlePlanChange("plan3")}
                    className={`p-4 rounded-xl border-2 text-left transition-all flex flex-col justify-between gap-3 ${
                      selectedPlan === "plan3"
                        ? isLight
                          ? "border-zinc-900 bg-zinc-100/80 shadow-sm"
                          : "border-white bg-white/10 shadow-sm"
                        : isLight
                        ? "border-zinc-200 hover:border-zinc-400 bg-zinc-50/50"
                        : "border-[#3A3A3A] hover:border-white/30 bg-[#1E1E1E]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm">Plan 3</span>
                      {selectedPlan === "plan3" && (
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center ${
                          isLight ? "bg-zinc-900 text-white" : "bg-white text-zinc-950"
                        }`}>
                          <Check size={12} strokeWidth={3} />
                        </span>
                      )}
                    </div>
                    {/* Wireframe Diagram */}
                    <div className="w-full flex flex-col gap-1.5 py-1">
                      <div className="grid grid-cols-12 gap-1.5">
                        <div className={`col-span-7 h-10 rounded border-2 flex items-center justify-center text-[9px] font-semibold ${
                          isLight
                            ? "border-zinc-800 bg-zinc-200 text-zinc-900"
                            : "border-white/60 bg-white/15 text-white"
                        }`}>
                          {isThai ? "ใหญ่ (390px)" : "Hero (390px)"}
                        </div>
                        <div className="col-span-5 flex flex-col gap-1">
                          <div className={`h-[18px] rounded border flex items-center justify-center text-[8px] ${
                            isLight
                              ? "border-zinc-600 bg-zinc-200 text-zinc-800"
                              : "border-white/40 bg-white/10 text-white"
                          }`}>
                            185px
                          </div>
                          <div className={`h-[18px] rounded border flex items-center justify-center text-[8px] ${
                            isLight
                              ? "border-zinc-600 bg-zinc-200 text-zinc-800"
                              : "border-white/40 bg-white/10 text-white"
                          }`}>
                            185px
                          </div>
                        </div>
                      </div>
                      <div className={`w-full h-4 rounded border flex items-center justify-center text-[9px] ${
                        isLight
                          ? "border-zinc-400 bg-zinc-100 text-zinc-700"
                          : "border-white/30 bg-white/5 text-zinc-300"
                      }`}>
                        Report & Auditing (100px)
                      </div>
                    </div>
                    <p className={`text-xs leading-relaxed ${isLight ? "text-zinc-600" : "text-neutral-400"}`}>
                      {isThai
                        ? "กรอบใหญ่ด้านซ้าย เคียงข้าง 2 กรอบเล็กซ้อนกัน (สูงรวม 390px) อยู่เหนือกรอบแนวนอนยาว"
                        : "1 large left card + 2 stacked cards (total 390px) on top + horizontal below."}
                    </p>
                  </button>
                </div>
              </div>

              {/* 2. MODULE SELECTION CHECKLIST */}
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-bold uppercase tracking-wider text-zinc-900 dark:text-white">
                      {isThai ? "2. เลือกโมดูลที่ต้องการแสดง" : "2. Select Modules to Display"}
                    </label>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-zinc-200 dark:bg-white/10 text-zinc-800 dark:text-white">
                      {selectedPlan === "plan1"
                        ? isThai ? "จำกัด 1 โมดูล" : "Max 1 Module"
                        : selectedPlan === "plan2"
                        ? isThai ? "จำกัด 2 โมดูล" : "Max 2 Modules"
                        : isThai ? "เลือกได้สูงสุด 3 โมดูล" : "Up to 3 Modules"}
                    </span>
                  </div>

                  <span className={`text-xs ${isLight ? "text-zinc-500" : "text-neutral-400"}`}>
                    {isThai
                      ? `เลือกอยู่ ${selectedModules.length} จาก ${getMaxModulesForPlan(selectedPlan)} โมดูล`
                      : `Selected ${selectedModules.length} of ${getMaxModulesForPlan(selectedPlan)} modules`}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {availablePrimaryModules.map((mod) => {
                    const isChecked = selectedModules.includes(mod.id);
                    const positionIndex = selectedModules.indexOf(mod.id);

                    // Descriptive slot names per plan
                    let slotName = "";
                    if (isChecked) {
                      if (selectedPlan === "plan1") {
                        slotName = isThai ? "กล่องหลัก" : "Hero Slot";
                      } else if (selectedPlan === "plan2") {
                        slotName = isThai ? `คอลัมน์ที่ ${positionIndex + 1}` : `Column ${positionIndex + 1}`;
                      } else {
                        slotName =
                          positionIndex === 0
                            ? isThai ? "ใหญ่ฝั่งซ้าย" : "Left Hero"
                            : positionIndex === 1
                            ? isThai ? "ฝั่งขวา (บน)" : "Right Top"
                            : isThai ? "ฝั่งขวา (ล่าง)" : "Right Bottom";
                      }
                    }

                    return (
                      <div
                        key={mod.id}
                        onClick={() => handleModuleToggle(mod.id)}
                        className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 select-none ${
                          isChecked
                            ? isLight
                              ? "bg-zinc-100 border-zinc-900 text-zinc-950 shadow-sm"
                              : "bg-[#2A2A2A] border-white text-white shadow-sm"
                            : isLight
                            ? "bg-zinc-50 border-zinc-200 text-zinc-500 hover:border-zinc-300"
                            : "bg-[#1E1E1E] border-[#333333] text-neutral-400 hover:border-[#444444]"
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center mt-0.5 border shrink-0 transition-colors ${
                            isChecked
                              ? isLight
                                ? "bg-zinc-900 border-zinc-900 text-white"
                                : "bg-white border-white text-zinc-950"
                              : isLight
                              ? "border-zinc-300 bg-white"
                              : "border-[#444444] bg-[#222222]"
                          }`}
                        >
                          {isChecked && <Check size={13} strokeWidth={3} />}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold">
                              {isThai ? mod.labelTh : mod.labelEn}
                            </span>
                            {isChecked && (
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                                isLight
                                  ? "bg-zinc-200 text-zinc-800"
                                  : "bg-white/20 text-white"
                              }`}>
                                {slotName}
                              </span>
                            )}
                          </div>
                          <p className={`text-xs mt-1 leading-snug line-clamp-2 ${isLight ? "text-zinc-500" : "text-neutral-400"}`}>
                            {isThai ? mod.descTh : mod.descEn}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Persistent Module Banner */}
                <div
                  className={`p-3 rounded-xl border flex items-center justify-between ${
                    isLight ? "bg-zinc-100/70 border-zinc-200" : "bg-[#222222] border-white/10"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2 h-2 rounded-full ${isLight ? "bg-zinc-900" : "bg-white"}`} />
                    <span className={`text-xs font-semibold ${isLight ? "text-zinc-900" : "text-white"}`}>
                      Reports & Auditing
                    </span>
                    <span className={`text-xs ${isLight ? "text-zinc-500" : "text-neutral-400"}`}>
                      {isThai
                        ? "(ระบบพื้นฐาน - แสดงเป็นแถบแนวนอนด้านล่างในทุก Layout อัตโนมัติ)"
                        : "(System Default - automatically pinned as bottom horizontal card in all layouts)"}
                    </span>
                  </div>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    isLight
                      ? "text-zinc-800 bg-zinc-200"
                      : "text-zinc-200 bg-white/10"
                  }`}>
                    {isThai ? "ล็อคเปิดใช้งานเสมอ" : "Always Pinned"}
                  </span>
                </div>
              </div>

              {/* 3. QUICK PRESETS & ACTIONS */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-dashed border-zinc-200 dark:border-[#383838]">
                {/* Presets */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`text-xs font-medium ${isLight ? "text-zinc-500" : "text-neutral-400"}`}>
                    {isThai ? "ตัวอย่างด่วน:" : "Quick Presets:"}
                  </span>
                  <button
                    type="button"
                    onClick={() => applyPreset("plan2", ["warehouse", "datacenter"])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selectedPlan === "plan2" &&
                      selectedModules.length === 2 &&
                      selectedModules.includes("warehouse") &&
                      selectedModules.includes("datacenter")
                        ? isLight
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-white text-zinc-950 border-white"
                        : isLight
                        ? "bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-800"
                        : "bg-[#333333] hover:bg-[#3D3D3D] border-[#444444] text-neutral-200"
                    }`}
                  >
                    Plan 2: Warehouse + Datacenter
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("plan1", ["warehouse"])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selectedPlan === "plan1" && selectedModules[0] === "warehouse"
                        ? isLight
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-white text-zinc-950 border-white"
                        : isLight
                        ? "bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-800"
                        : "bg-[#333333] hover:bg-[#3D3D3D] border-[#444444] text-neutral-200"
                    }`}
                  >
                    Plan 1: Warehouse
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset("plan3", ["warehouse", "datacenter", "employee"])}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      selectedPlan === "plan3" && selectedModules.length === 3
                        ? isLight
                          ? "bg-zinc-900 text-white border-zinc-900"
                          : "bg-white text-zinc-950 border-white"
                        : isLight
                        ? "bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-800"
                        : "bg-[#333333] hover:bg-[#3D3D3D] border-[#444444] text-neutral-200"
                    }`}
                  >
                    Plan 3: All 3 Modules
                  </button>
                </div>

                {/* Save & Reset Buttons */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleReset}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                      isLight
                        ? "bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700"
                        : "bg-[#333333] hover:bg-[#3E3E3E] border-[#444444] text-neutral-300"
                    }`}
                  >
                    <RotateCcw size={13} />
                    <span>{isThai ? "รีเซ็ต" : "Reset"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveConfig}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                      isLight
                        ? "bg-zinc-900 hover:bg-black text-white"
                        : "bg-white hover:bg-zinc-200 text-zinc-950"
                    }`}
                  >
                    <Save size={14} />
                    <span>{isThai ? "บันทึกและใช้กับ Workspace จริง" : "Save & Apply to Workspace"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* LIVE PREVIEW SECTION */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold tracking-tight">
                    {isThai ? "ตัวอย่างหน้าจอจริง (Live Interactive Preview)" : "Live Interactive Preview"}
                  </h3>
                  <p className={`text-xs ${isLight ? "text-zinc-500" : "text-neutral-400"}`}>
                    {isThai
                      ? "การ์ดขาว/ดำ จะแสดงผลตามโครงสร้างจริงของหน้า Workspace ที่ผู้ใช้จะเห็น"
                      : "Black & White cards previewed exactly as rendered in the real Workspace."}
                  </p>
                </div>

                <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${
                  isLight
                    ? "border-zinc-300 text-zinc-900 bg-zinc-100"
                    : "border-white/20 text-white bg-white/10"
                }`}>
                  {selectedPlan.toUpperCase()}
                </span>
              </div>

              {/* Layout Container */}
              <div
                className={`p-6 sm:p-8 rounded-2xl border transition-colors ${
                  isLight
                    ? "bg-[#F8FAFC] border-zinc-200 shadow-inner"
                    : "bg-[#1B1B1B] border-[#2F2F2F] shadow-inner"
                }`}
              >
                <DynamicWorkspaceLayout
                  plan={selectedPlan}
                  selectedModules={selectedModules}
                  onNavigate={(route) => {
                    alert(
                      isThai
                        ? `คลิกเข้าสู่โมดูล: ${route}`
                        : `Navigating to module: ${route}`
                    );
                  }}
                  isLight={isLight}
                  isThai={isThai}
                />
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

