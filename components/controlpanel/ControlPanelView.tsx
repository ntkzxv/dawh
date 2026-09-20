"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage, setAppLanguage } from "@/utils/language";
import {
  DynamicWorkspaceLayout,
  WorkspacePlanType,
  PrimaryModuleId,
  ModuleStatus,
  ALL_AVAILABLE_MODULES,
} from "@/components/users";
import { CustomDropdown } from "@/components/common";
import {
  Check,
  ExternalLink,
  Save,
  RotateCcw,
  Lock,
  Wrench,
  Clock,
  Search,
  Building2,
  ChevronDown,
  Calendar,
  AlertCircle,
  Megaphone,
  Layers,
  Activity,
  Sliders,
} from "lucide-react";

type TabKey = "workspace" | "status_card";

interface LayoutConfig {
  plan: WorkspacePlanType;
  selectedModules: PrimaryModuleId[];
}

interface MaintenanceSchedule {
  enabled: boolean;
  startTime: string;
  endTime: string;
  secondsRemaining: number;
}

interface CompanyItem {
  id: string;
  name: string;
  code: string;
  isCurrent: boolean;
  modulesCount: number;
}

const STORAGE_KEY = "dawh_workspace_layout_config";
const STATUS_STORAGE_KEY = "dawh_module_statuses";
const RECENT_STORAGE_KEY = "dawh_recent_module";
const SCHEDULE_STORAGE_KEY = "dawh_maintenance_schedule";

const MOCK_COMPANIES: CompanyItem[] = [
  { id: "horizon", name: "Horizon Logistics", code: "HZ-LOG", isCurrent: true, modulesCount: 4 },
  { id: "apex", name: "Apex Freight Co., Ltd.", code: "APX-01", isCurrent: false, modulesCount: 3 },
  { id: "nexus", name: "Nexus Supply Chain Ltd.", code: "NEX-99", isCurrent: false, modulesCount: 4 },
  { id: "titan", name: "Titan Global Express", code: "TTN-GL", isCurrent: false, modulesCount: 2 },
  { id: "siam", name: "Siam Logistics & Distribution", code: "SLD-TH", isCurrent: false, modulesCount: 4 },
];

export default function ControlPanelView() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const currentLang = useAppLanguage();
  const isThai = currentLang === "TH";

  // Sidebar Tab State (workspace: การจัดวางพื้นที่ทำงาน | status_card: สถานะการ์ดโมดูล)
  const [activeTab, setActiveTab] = useState<TabKey>("workspace");

  // Layout Builder State
  const [selectedPlan, setSelectedPlan] = useState<WorkspacePlanType>("plan2");
  const [selectedModules, setSelectedModules] = useState<PrimaryModuleId[]>([
    "warehouse",
    "datacenter",
  ]);

  // Card Status State (Active [Green] / Maintenance [Yellow] / Disabled [Red])
  const [moduleStatuses, setModuleStatuses] = useState<Record<string, ModuleStatus>>({
    warehouse: "active",
    datacenter: "active",
    employee: "active",
    reports: "active",
  });

  // Recent Module State
  const [recentModuleId, setRecentModuleId] = useState<string>("warehouse");

  // Searchable Company Dropdown State
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem>(MOCK_COMPANIES[0]);
  const [companySearchQuery, setCompanySearchQuery] = useState("");
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const companyDropdownRef = useRef<HTMLDivElement>(null);

  // Scheduled Maintenance State
  const [maintenanceConfig, setMaintenanceConfig] = useState<MaintenanceSchedule>({
    enabled: false,
    startTime: "02:00 AM",
    endTime: "06:00 AM",
    secondsRemaining: 2 * 3600 + 45 * 60 + 18,
  });

  // Time Dropdown Options
  const HOURS_OPTIONS = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
  const MINUTES_OPTIONS = ["00", "05", "10", "15", "20", "25", "30", "35", "40", "45", "50", "55"];

  const hourDropdownOptions = useMemo(
    () => HOURS_OPTIONS.map((h) => ({ value: h, label: h })),
    []
  );
  const minuteDropdownOptions = useMemo(
    () => MINUTES_OPTIONS.map((m) => ({ value: m, label: m })),
    []
  );
  const periodDropdownOptions = useMemo(
    () => [
      { value: "AM", label: "AM" },
      { value: "PM", label: "PM" },
    ],
    []
  );

  const parseTimeString = (timeStr: string) => {
    const parts = timeStr.trim().split(/[:\s]+/);
    const hour = parts[0] ? parts[0].padStart(2, "0") : "02";
    const minute = parts[1] ? parts[1].padStart(2, "0") : "00";
    const period = parts[2] ? parts[2].toUpperCase() : "AM";
    return { hour, minute, period: period === "PM" ? "PM" : "AM" };
  };

  const startTimeParts = parseTimeString(maintenanceConfig.startTime);
  const endTimeParts = parseTimeString(maintenanceConfig.endTime);

  const updateStartTime = (h: string, m: string, p: string) => {
    setMaintenanceConfig((prev) => ({
      ...prev,
      startTime: `${h}:${m} ${p}`,
    }));
  };

  const updateEndTime = (h: string, m: string, p: string) => {
    setMaintenanceConfig((prev) => ({
      ...prev,
      endTime: `${h}:${m} ${p}`,
    }));
  };

  // Custom countdown state
  const [isCustomCountdown, setIsCustomCountdown] = useState(false);
  const [customHours, setCustomHours] = useState(2);
  const [customMinutes, setCustomMinutes] = useState(45);

  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load existing configurations from localStorage on mount
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

      const savedStatuses = localStorage.getItem(STATUS_STORAGE_KEY);
      if (savedStatuses) {
        setModuleStatuses(JSON.parse(savedStatuses));
      }

      const savedRecent = localStorage.getItem(RECENT_STORAGE_KEY);
      if (savedRecent) {
        setRecentModuleId(savedRecent);
      }

      const savedSchedule = localStorage.getItem(SCHEDULE_STORAGE_KEY);
      if (savedSchedule) {
        setMaintenanceConfig(JSON.parse(savedSchedule));
      }
    } catch (e) {
      console.error("Failed to read configuration in control panel", e);
    }
  }, []);

  // Close company dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (companyDropdownRef.current && !companyDropdownRef.current.contains(event.target as Node)) {
        setIsCompanyDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    setAppLanguage(currentLang === "TH" ? "EN" : "TH");
  };

  const tabs: { key: TabKey; labelTh: string; labelEn: string; icon: React.ElementType }[] = [
    {
      key: "workspace",
      labelTh: "การจัดวางพื้นที่ทำงาน",
      labelEn: "Workspace Layout",
      icon: Layers,
    },
    {
      key: "status_card",
      labelTh: "สถานะการ์ดและระบบ",
      labelEn: "Status Card & Maintenance",
      icon: Activity,
    },
  ];

  // Primary available module choices
  const allModulesList: {
    id: string;
    labelTh: string;
    labelEn: string;
    descTh: string;
    descEn: string;
    isPrimary: boolean;
  }[] = [
    {
      id: "warehouse",
      labelTh: "จัดการคลังสินค้า",
      labelEn: "Warehouse ERP",
      descTh: "จัดการคลังสินค้า สต็อก SKU และการกระจายสินค้า",
      descEn: "Inventory management, SKU movement, and dispatch.",
      isPrimary: true,
    },
    {
      id: "datacenter",
      labelTh: "สัญญาเช่าซื้อ",
      labelEn: "HP Datacenter",
      descTh: "สัญญาเช่าซื้อ บัญชีลูกหนี้ และประวัติลูกค้า",
      descEn: "Hire-purchase contracts, ledgers, and debtor tracking.",
      isPrimary: true,
    },
    {
      id: "employee",
      labelTh: "จัดการพนักงาน",
      labelEn: "Employee Management",
      descTh: "บริหารจัดการพนักงาน โครงสร้างเงินเดือน และกะงาน",
      descEn: "HR profiles, directory, and scheduling structures.",
      isPrimary: true,
    },
    {
      id: "reports",
      labelTh: "รายงานและตรวจสอบ",
      labelEn: "Reports & Auditing",
      descTh: "ใบแจ้งยอด สถิติ รายงานการตรวจสอบ และการกำกับดูแล",
      descEn: "Audit logs, financial statements, and compliance.",
      isPrimary: false,
    },
  ];

  const availablePrimaryModules = allModulesList.filter((m) => m.isPrimary) as {
    id: PrimaryModuleId;
    labelTh: string;
    labelEn: string;
    descTh: string;
    descEn: string;
    isPrimary: boolean;
  }[];

  const filteredCompanies = useMemo(() => {
    if (!companySearchQuery.trim()) return MOCK_COMPANIES;
    const q = companySearchQuery.toLowerCase();
    return MOCK_COMPANIES.filter(
      (c) => c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q)
    );
  }, [companySearchQuery]);

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
        if (prev.length <= 1) return prev;
        return prev.filter((m) => m !== id);
      } else {
        if (prev.length >= max) {
          if (max === 1) return [id];
          if (max === 2) return [prev[0], id];
          return [prev[0], prev[1], id];
        }
        return [...prev, id];
      }
    });
  };

  const handleStatusChange = (moduleId: string, newStatus: ModuleStatus) => {
    setModuleStatuses((prev) => ({
      ...prev,
      [moduleId]: newStatus,
    }));
  };

  // Preset Handlers
  const applyPreset = (plan: WorkspacePlanType, modules: PrimaryModuleId[]) => {
    setSelectedPlan(plan);
    const max = getMaxModulesForPlan(plan);
    setSelectedModules(modules.slice(0, max));
  };

  // Save all settings to localStorage
  const handleSaveAll = () => {
    const config: LayoutConfig = {
      plan: selectedPlan,
      selectedModules,
    };
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(moduleStatuses));
      localStorage.setItem(RECENT_STORAGE_KEY, recentModuleId);
      localStorage.setItem(SCHEDULE_STORAGE_KEY, JSON.stringify(maintenanceConfig));

      setSaveMessage(
        isThai
          ? "บันทึกการตั้งค่าทั้งหมด (Layout, สถานะการ์ด, เวลาปิดปรับปรุง) ไปยัง Workspace เรียบร้อยแล้ว"
          : "Saved all configuration (Layout, Card Statuses, Maintenance Schedule) to Workspace successfully"
      );
      setTimeout(() => setSaveMessage(null), 3500);
    } catch (e) {
      console.error("Save error:", e);
    }
  };

  const handleReset = () => {
    setSelectedPlan("plan2");
    setSelectedModules(["warehouse", "datacenter"]);
    const defaultStatuses: Record<string, ModuleStatus> = {
      warehouse: "active",
      datacenter: "active",
      employee: "active",
      reports: "active",
    };
    setModuleStatuses(defaultStatuses);
    setRecentModuleId("warehouse");
    setSelectedCompany(MOCK_COMPANIES[0]);

    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STATUS_STORAGE_KEY);
    localStorage.removeItem(RECENT_STORAGE_KEY);
    localStorage.removeItem(SCHEDULE_STORAGE_KEY);

    setSaveMessage(isThai ? "รีเซ็ตเป็นค่าเริ่มต้นแล้ว" : "Reset to default configuration");
    setTimeout(() => setSaveMessage(null), 3000);
  };

  return (
    <div
      className={`min-h-screen flex transition-colors duration-200 ${
        isLight ? "bg-[#F8FAFC] text-zinc-900" : "bg-[#1C1C1C] text-zinc-100"
      }`}
    >
      {/* ========================================================================= */}
      {/* 1. SIDEBAR NAVIGATION                                                    */}
      {/* ========================================================================= */}
      <aside
        className={`w-64 flex flex-col justify-between border-r shrink-0 transition-colors duration-200 ${
          isLight
            ? "bg-white border-zinc-200"
            : "bg-[#242424] border-[#383838]"
        }`}
      >
        <div className="flex flex-col">
          {/* Header */}
          <div
            className={`p-4 sm:p-5 border-b ${
              isLight ? "border-zinc-200" : "border-[#333333]"
            }`}
          >
            <div className="flex items-center gap-2">
              <span className={`p-1.5 rounded-lg border ${
                isLight ? "bg-zinc-100 border-zinc-300 text-zinc-900" : "bg-[#333333] border-[#444444] text-white"
              }`}>
                <Sliders size={15} />
              </span>
              <div>
                <h1 className={`text-sm font-bold tracking-tight ${isLight ? "text-zinc-900" : "text-white"}`}>
                  {isThai ? "แผงควบคุมระบบ" : "Control Panel"}
                </h1>
                <p className={`text-[11px] ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                  {isThai ? "DAWH Management Hub" : "DAWH Management Hub"}
                </p>
              </div>
            </div>
          </div>

          {/* Navigation Items (Separate Tabs) */}
          <nav className="p-3 space-y-1.5">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key;
              const TabIcon = tab.icon;

              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all text-left ${
                    isActive
                      ? isLight
                        ? "bg-zinc-900 text-white shadow-sm"
                        : "bg-white text-zinc-950 shadow-sm"
                      : isLight
                      ? "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950"
                      : "text-zinc-300 hover:bg-[#333333] hover:text-white"
                  }`}
                >
                  <TabIcon size={16} className="shrink-0" />
                  <span className="truncate">{isThai ? tab.labelTh : tab.labelEn}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Footer Settings: Theme & Language Toggle */}
        <div
          className={`p-3.5 border-t space-y-2.5 ${
            isLight ? "border-zinc-200" : "border-[#333333]"
          }`}
        >
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-medium border text-center transition-colors ${
                isLight
                  ? "bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800"
                  : "bg-[#333333] hover:bg-[#3E3E3E] border-[#444444] text-zinc-200"
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
              className={`py-1.5 px-3 rounded-lg text-xs font-bold border text-center transition-colors ${
                isLight
                  ? "bg-zinc-100 hover:bg-zinc-200 border-zinc-300 text-zinc-800"
                  : "bg-[#333333] hover:bg-[#3E3E3E] border-[#444444] text-zinc-200"
              }`}
            >
              {currentLang}
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA                                                     */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col min-w-0 p-6 sm:p-10 overflow-y-auto max-h-screen">
        <div className="max-w-6xl w-full flex flex-col gap-7 pb-16">
          {/* Top Header & Links */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className={`text-[10.5px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                  isLight
                    ? "bg-zinc-200/80 border-zinc-300 text-zinc-800"
                    : "bg-white/10 border-white/20 text-zinc-200"
                }`}>
                  {activeTab === "workspace"
                    ? isThai ? "LAYOUT BUILDER" : "LAYOUT BUILDER"
                    : isThai ? "CARD STATUS & MAINTENANCE" : "CARD STATUS & MAINTENANCE"}
                </span>
              </div>
              <h2 className={`text-2xl font-bold tracking-tight mt-1 ${isLight ? "text-zinc-900" : "text-white"}`}>
                {activeTab === "workspace"
                  ? isThai ? "จัดการการ์ดและโครงสร้าง Layout" : "Workspace Layout & Card Architecture"
                  : isThai ? "จัดการสถานะการ์ดและเวลาปิดปรับปรุง" : "Card Status Modes & Scheduled Maintenance"}
              </h2>
              <p className={`text-xs mt-1 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                {activeTab === "workspace"
                  ? isThai
                    ? "เลือก Plan และโมดูลที่ต้องการแสดง พร้อมดูตัวอย่างแบบเรียลไทม์ และบันทึกไปใช้งานในหน้า Workspace จริง"
                    : "Configure layout plans, active modules, preview them live, and apply changes to Workspace."
                  : isThai
                    ? "จัดการ 3 โหมดสถานะ (เขียว/เหลือง/แดง), ตั้งเวลาปิดปรับปรุงระบบ และเลือกบริษัทที่ต้องการจัดการ"
                    : "Manage 3 status modes (Green/Yellow/Red), schedule maintenance timers, and manage tenant cards."}
              </p>
            </div>

            {/* Quick Links */}
            <div className="flex items-center gap-2.5 flex-wrap">
              <Link
                href="/maintenance"
                target="_blank"
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                  isLight
                    ? "bg-amber-500/10 text-amber-700 border-amber-300 hover:bg-amber-500 hover:text-white"
                    : "bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500 hover:text-white"
                }`}
              >
                <Wrench size={13} />
                <span>{isThai ? "ดูหน้า Maintenance (Figma)" : "Preview Maintenance Screen"}</span>
              </Link>

              <Link
                href="/workspace"
                target="_blank"
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold border transition-all shrink-0 ${
                  isLight
                    ? "bg-zinc-900 text-white hover:bg-black border-zinc-900 shadow-sm"
                    : "bg-white text-zinc-900 hover:bg-zinc-200 border-white shadow-sm"
                }`}
              >
                <span>{isThai ? "เปิดหน้า Workspace จริง" : "Open Live Workspace"}</span>
                <ExternalLink size={13} />
              </Link>
            </div>
          </div>

          {/* Notification message */}
          {saveMessage && (
            <div className={`px-4 py-3 rounded-lg text-sm border flex items-center gap-2 ${
              isLight
                ? "bg-emerald-50 border-emerald-300 text-emerald-900"
                : "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
            }`}>
              <Check size={16} />
              <span className="font-medium">{saveMessage}</span>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 1: WORKSPACE LAYOUT BUILDER                                           */}
          {/* ========================================================================= */}
          {activeTab === "workspace" && (
            <div className="flex flex-col gap-7">
              {/* CONTROL PANEL CARD */}
              <div
                className={`p-6 rounded-2xl border transition-colors flex flex-col gap-7 ${
                  isLight ? "bg-white border-zinc-200 shadow-sm" : "bg-[#252525] border-[#383838]"
                }`}
              >
                {/* 1. PLAN SELECTOR */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className={`text-sm font-bold uppercase tracking-wider ${
                      isLight ? "text-zinc-900" : "text-white"
                    }`}>
                      {isThai ? "1. เลือก Layout Plan (ขาว/ดำ)" : "1. Select Layout Plan (B&W)"}
                    </label>
                    <span className={`text-xs ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
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
                        <span className={`font-bold text-sm ${isLight ? "text-zinc-900" : "text-white"}`}>
                          Plan 1
                        </span>
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
                      <p className={`text-xs leading-relaxed ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
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
                        <span className={`font-bold text-sm ${isLight ? "text-zinc-900" : "text-white"}`}>
                          Plan 2
                        </span>
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
                          <div className={`h-10 rounded border-2 flex items-center justify-center text-[9px] font-bold ${
                            isLight
                              ? "border-zinc-900 bg-zinc-300 text-zinc-950"
                              : "border-white bg-white/30 text-white"
                          }`}>
                            {isThai ? "เข้าล่าสุด" : "Recent"}
                          </div>
                          <div className={`h-10 rounded border flex items-center justify-center text-[10px] font-medium ${
                            isLight
                              ? "border-zinc-300 bg-zinc-100 text-zinc-700"
                              : "border-white/30 bg-white/10 text-zinc-300"
                          }`}>
                            390px
                          </div>
                        </div>
                        <div className={`w-full h-4 rounded border flex items-center justify-center text-[9px] ${
                          isLight
                            ? "border-zinc-400 bg-zinc-100 text-zinc-700"
                            : "border-white/30 bg-white/5 text-zinc-300"
                        }`}>
                          {isThai ? "รายงานและตรวจสอบ" : "Report & Auditing"}
                        </div>
                      </div>
                      <p className={`text-xs leading-relaxed ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                        {isThai
                          ? "2 กรอบขนาดเท่ากัน โดยการ์ดซ้ายเป็นการ์ดเข้าล่าสุด เหนือกรอบแนวนอนยาว"
                          : "2 equal cards with left being Recent card on top + horizontal below."}
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
                        <span className={`font-bold text-sm ${isLight ? "text-zinc-900" : "text-white"}`}>
                          Plan 3
                        </span>
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
                          <div className={`col-span-7 h-10 rounded border-2 flex items-center justify-center text-[8.5px] font-bold ${
                            isLight
                              ? "border-zinc-900 bg-zinc-300 text-zinc-950"
                              : "border-white bg-white/30 text-white"
                          }`}>
                            {isThai ? "เข้าล่าสุด" : "Recent"}
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
                      <p className={`text-xs leading-relaxed ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                        {isThai
                          ? "กรอบใหญ่ด้านซ้ายเป็นการ์ดเข้าล่าสุด (Recent) เคียงข้าง 2 กรอบเล็กซ้อนกัน"
                          : "Large left Recent card alongside 2 stacked cards on right + horizontal below."}
                      </p>
                    </button>
                  </div>
                </div>

                {/* 2. MODULE SELECTION CHECKLIST */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <label className={`text-sm font-bold uppercase tracking-wider ${
                        isLight ? "text-zinc-900" : "text-white"
                      }`}>
                        {isThai ? "2. เลือกโมดูลที่ต้องการแสดง" : "2. Select Modules to Display"}
                      </label>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                        isLight ? "bg-zinc-200 text-zinc-800" : "bg-white/10 text-white"
                      }`}>
                        {selectedPlan === "plan1"
                          ? isThai ? "จำกัด 1 โมดูล" : "Max 1 Module"
                          : selectedPlan === "plan2"
                          ? isThai ? "จำกัด 2 โมดูล" : "Max 2 Modules"
                          : isThai ? "เลือกได้สูงสุด 3 โมดูล" : "Up to 3 Modules"}
                      </span>
                    </div>

                    <span className={`text-xs ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                      {isThai
                        ? `เลือกอยู่ ${selectedModules.length} จาก ${getMaxModulesForPlan(selectedPlan)} โมดูล`
                        : `Selected ${selectedModules.length} of ${getMaxModulesForPlan(selectedPlan)} modules`}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {availablePrimaryModules.map((mod) => {
                      const isChecked = selectedModules.includes(mod.id);
                      const positionIndex = selectedModules.indexOf(mod.id);

                      let slotName = "";
                      if (isChecked) {
                        if (selectedPlan === "plan1") {
                          slotName = isThai ? "กล่องหลัก" : "Hero Slot";
                        } else if (selectedPlan === "plan2") {
                          slotName = isThai ? `ช่อง ${positionIndex + 1}` : `Slot ${positionIndex + 1}`;
                        } else {
                          slotName =
                            positionIndex === 0
                              ? isThai ? "ฝั่งซ้าย" : "Left Hero"
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
                              ? "bg-zinc-50 border-zinc-200 text-zinc-600 hover:border-zinc-300"
                              : "bg-[#1E1E1E] border-[#333333] text-zinc-400 hover:border-[#444444]"
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
                              <span className={`text-sm font-semibold ${isLight ? "text-zinc-900" : "text-white"}`}>
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
                            <p className={`text-xs mt-1 leading-snug line-clamp-2 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
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
                      <span className={`text-xs ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
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

                {/* 3. RECENT MODULE SIMULATOR */}
                <div className="flex flex-col gap-3 pt-4 border-t border-dashed border-zinc-200 dark:border-[#383838]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <label className={`text-sm font-bold uppercase tracking-wider ${
                      isLight ? "text-zinc-900" : "text-white"
                    }`}>
                      {isThai ? "3. จำลองโมดูลที่เข้าล่าสุด (Recent Card)" : "3. Recent Module Simulator"}
                    </label>
                    <span className={`text-xs ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                      {isThai
                        ? "ใน Plan 2 และ Plan 3 โมดูลนี้จะแสดงที่การ์ดฝั่งซ้ายพร้อมป้าย 'เข้าล่าสุด / Recent'"
                        : "In Plan 2 & Plan 3, this module is pinned as the left card with a 'Recent' badge"}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    {availablePrimaryModules.map((mod) => {
                      const isRecent = recentModuleId === mod.id;
                      return (
                        <button
                          key={mod.id}
                          type="button"
                          onClick={() => setRecentModuleId(mod.id)}
                          className={`p-3 rounded-xl border text-left transition-all flex items-center justify-between ${
                            isRecent
                              ? isLight
                                ? "bg-zinc-900 text-white border-zinc-900 shadow-sm"
                                : "bg-white text-zinc-950 border-white shadow-sm"
                              : isLight
                              ? "bg-zinc-50 hover:bg-zinc-100 border-zinc-200 text-zinc-800"
                              : "bg-[#1F1F1F] hover:bg-[#282828] border-[#333333] text-zinc-300"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <Clock size={14} className={isRecent ? (isLight ? "text-white" : "text-zinc-950") : "text-zinc-500"} />
                            <span className="text-xs font-bold">{isThai ? mod.labelTh : mod.labelEn}</span>
                          </div>
                          {isRecent && (
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              isLight ? "bg-white/20 text-white" : "bg-black/15 text-zinc-950"
                            }`}>
                              {isThai ? "เข้าล่าสุด" : "Recent"}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 4. PRESETS & ACTIONS */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-zinc-200 dark:border-[#383838]">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-medium ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
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
                          : "bg-[#333333] hover:bg-[#3D3D3D] border-[#444444] text-zinc-200"
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
                          : "bg-[#333333] hover:bg-[#3D3D3D] border-[#444444] text-zinc-200"
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
                          : "bg-[#333333] hover:bg-[#3D3D3D] border-[#444444] text-zinc-200"
                      }`}
                    >
                      Plan 3: All 3 Modules
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleReset}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        isLight
                          ? "bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-700"
                          : "bg-[#333333] hover:bg-[#3E3E3E] border-[#444444] text-zinc-300"
                      }`}
                    >
                      <RotateCcw size={13} />
                      <span>{isThai ? "รีเซ็ต" : "Reset"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSaveAll}
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
                    <h3 className={`text-lg font-bold tracking-tight ${isLight ? "text-zinc-900" : "text-white"}`}>
                      {isThai ? "ตัวอย่างหน้าจอจริง (Live Interactive Preview)" : "Live Interactive Preview"}
                    </h3>
                    <p className={`text-xs ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                      {isThai
                        ? "การ์ดขาว/ดำ ปรับเปลี่ยนตามสถานะ และการ์ดซ้ายแสดงโมดูลเข้าล่าสุด"
                        : "Interactive preview matching the exact layout and recent card order."}
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
                    moduleStatuses={moduleStatuses}
                    recentModuleId={recentModuleId}
                    onNavigate={(route) => {
                      if (route.startsWith("/maintenance")) {
                        window.open(route, "_blank");
                      } else {
                        alert(isThai ? `คลิกเข้าสู่โมดูล: ${route}` : `Navigating to: ${route}`);
                      }
                    }}
                    isLight={isLight}
                    isThai={isThai}
                  />
                </div>
              </div>
            </div>
          )}

          {/* ========================================================================= */}
          {/* TAB 2: STATUS CARD & SCHEDULED MAINTENANCE                                */}
          {/* ========================================================================= */}
          {activeTab === "status_card" && (
            <div className="flex flex-col gap-7">
              {/* SECTION A: SEARCHABLE COMPANY SELECTOR */}
              <div
                className={`p-6 rounded-2xl border transition-colors flex flex-col gap-4 ${
                  isLight ? "bg-white border-zinc-200 shadow-sm" : "bg-[#252525] border-[#383838]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                      isLight ? "text-zinc-900" : "text-white"
                    }`}>
                      <Building2 size={16} />
                      <span>{isThai ? "เลือกบริษัทที่ต้องการจัดการการ์ด" : "Select Company to Manage Cards"}</span>
                    </label>
                    <p className={`text-xs mt-0.5 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                      {isThai
                        ? "(ระบบจำลองการจัดการแบบ Multi-tenant - กำลังจัดการข้อมูลของ Horizon Logistics)"
                        : "(Multi-tenant Simulator - currently configuring Horizon Logistics)"}
                    </p>
                  </div>

                  <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full border self-start sm:self-auto ${
                    isLight
                      ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                      : "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                  }`}>
                    {selectedCompany.name} ({selectedCompany.code})
                  </span>
                </div>

                {/* Searchable Dropdown Anchor */}
                <div className="relative w-full max-w-lg" ref={companyDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                    className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                      isLight
                        ? "bg-zinc-50 hover:bg-zinc-100 border-zinc-300 text-zinc-900"
                        : "bg-[#1E1E1E] hover:bg-[#282828] border-[#444444] text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Building2 size={15} className="text-zinc-500 shrink-0" />
                      <span className="truncate">{selectedCompany.name}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                        isLight ? "bg-zinc-200 text-zinc-700" : "bg-white/10 text-zinc-300"
                      }`}>
                        {selectedCompany.code}
                      </span>
                    </div>
                    <ChevronDown
                      size={16}
                      className={`text-zinc-500 transition-transform ${
                        isCompanyDropdownOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu Panel with Live Search */}
                  {isCompanyDropdownOpen && (
                    <div
                      className={`absolute top-full left-0 mt-1.5 w-full rounded-xl border shadow-xl z-50 overflow-hidden ${
                        isLight
                          ? "bg-white border-zinc-300"
                          : "bg-[#202020] border-[#444444]"
                      }`}
                    >
                      {/* Search Input */}
                      <div className={`p-2.5 border-b flex items-center gap-2 ${
                        isLight ? "border-zinc-200 bg-zinc-50" : "border-[#333333] bg-[#181818]"
                      }`}>
                        <Search size={14} className="text-zinc-500 shrink-0" />
                        <input
                          type="text"
                          value={companySearchQuery}
                          onChange={(e) => setCompanySearchQuery(e.target.value)}
                          placeholder={isThai ? "ค้นหาชื่อหรือรหัสบริษัท..." : "Search company name or code..."}
                          className={`w-full text-xs bg-transparent border-none outline-none focus:ring-0 ${
                            isLight ? "text-zinc-900 placeholder:text-zinc-400" : "text-white placeholder:text-zinc-500"
                          }`}
                          autoFocus
                        />
                      </div>

                      {/* Company List */}
                      <div className="max-h-56 overflow-y-auto p-1 space-y-0.5">
                        {filteredCompanies.length === 0 ? (
                          <div className={`p-4 text-center text-xs ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                            {isThai ? "ไม่พบข้อมูลบริษัทที่ค้นหา" : "No companies found"}
                          </div>
                        ) : (
                          filteredCompanies.map((comp) => {
                            const isSelected = selectedCompany.id === comp.id;
                            return (
                              <button
                                key={comp.id}
                                type="button"
                                onClick={() => {
                                  setSelectedCompany(comp);
                                  setIsCompanyDropdownOpen(false);
                                }}
                                className={`w-full flex items-center justify-between p-2.5 rounded-lg text-xs font-medium text-left transition-colors ${
                                  isSelected
                                    ? isLight
                                      ? "bg-zinc-100 text-zinc-950 font-bold"
                                      : "bg-white/10 text-white font-bold"
                                    : isLight
                                    ? "hover:bg-zinc-50 text-zinc-800"
                                    : "hover:bg-[#2A2A2A] text-zinc-300"
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className={`w-2 h-2 rounded-full ${comp.isCurrent ? "bg-emerald-500" : "bg-zinc-400"}`} />
                                  <span className="truncate">{comp.name}</span>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                    isLight ? "bg-zinc-100 text-zinc-600" : "bg-white/10 text-zinc-400"
                                  }`}>
                                    {comp.code}
                                  </span>
                                  {comp.isCurrent && (
                                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                                      {isThai ? "(ปัจจุบัน)" : "(Current)"}
                                    </span>
                                  )}
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* SECTION B: 3-MODE CARD STATUS CONTROLS */}
              <div
                className={`p-6 rounded-2xl border transition-colors flex flex-col gap-5 ${
                  isLight ? "bg-white border-zinc-200 shadow-sm" : "bg-[#252525] border-[#383838]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <label className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                      isLight ? "text-zinc-900" : "text-white"
                    }`}>
                      <Activity size={16} />
                      <span>{isThai ? "จัดการสถานะการ์ด (3 โหมด: เขียว / เหลือง / แดง)" : "Card Status Modes (Green / Yellow / Red)"}</span>
                    </label>
                    <p className={`text-xs mt-0.5 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                      {isThai
                        ? "ปิดปรับปรุง: ปรับกรอบเป็นสีเหลืองและกดจะไปหน้า Maintenance | ปิดใช้งาน: ล็อคและไม่โปร่งแสง เน้นขาวดำ"
                        : "Maintenance: yellow border, routes to maintenance | Disabled: solid 100% opacity, Lock icon, B&W"}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {allModulesList.map((mod) => {
                    const currentStatus = moduleStatuses[mod.id] || "active";

                    return (
                      <div
                        key={mod.id}
                        className={`p-4 rounded-xl border flex flex-col gap-3.5 ${
                          isLight ? "bg-zinc-50/80 border-zinc-200" : "bg-[#1F1F1F] border-[#333333]"
                        }`}
                      >
                        {/* Module Info & Current Status Pill */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span
                              className="w-3 h-3 rounded-full shrink-0 shadow-xs"
                              style={{
                                backgroundColor:
                                  currentStatus === "active"
                                    ? "#10B981"
                                    : currentStatus === "maintenance"
                                    ? "#F59E0B"
                                    : "#EF4444",
                              }}
                            />
                            <div>
                              <span className={`text-xs font-bold block ${isLight ? "text-zinc-900" : "text-white"}`}>
                                {isThai ? mod.labelTh : mod.labelEn}
                              </span>
                              <span className={`text-[11px] ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                                {mod.descEn}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                              currentStatus === "active"
                                ? isLight
                                  ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                                  : "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                                : currentStatus === "maintenance"
                                ? isLight
                                  ? "bg-amber-50 text-amber-800 border-amber-200"
                                  : "bg-amber-500/10 text-amber-300 border-amber-500/30"
                                : isLight
                                ? "bg-red-50 text-red-800 border-red-200"
                                : "bg-red-500/10 text-red-300 border-red-500/30"
                            }`}
                          >
                            {currentStatus.toUpperCase()}
                          </span>
                        </div>

                        {/* 3 Status Buttons */}
                        <div className={`grid grid-cols-3 gap-1.5 p-1 rounded-lg border ${
                          isLight ? "bg-zinc-200/60 border-zinc-300" : "bg-[#161616] border-[#333333]"
                        }`}>
                          {/* Active Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(mod.id, "active")}
                            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                              currentStatus === "active"
                                ? "bg-emerald-600 text-white shadow-sm"
                                : isLight
                                ? "text-zinc-700 hover:text-zinc-950 hover:bg-zinc-300/50"
                                : "text-zinc-400 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                            <span>{isThai ? "เปิดใช้งาน" : "Active"}</span>
                          </button>

                          {/* Maintenance Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(mod.id, "maintenance")}
                            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                              currentStatus === "maintenance"
                                ? "bg-amber-500 text-white shadow-sm"
                                : isLight
                                ? "text-zinc-700 hover:text-zinc-950 hover:bg-zinc-300/50"
                                : "text-zinc-400 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <Wrench size={12} />
                            <span>{isThai ? "ปรับปรุง" : "Maint."}</span>
                          </button>

                          {/* Disabled Button */}
                          <button
                            type="button"
                            onClick={() => handleStatusChange(mod.id, "disabled")}
                            className={`flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-bold transition-all ${
                              currentStatus === "disabled"
                                ? "bg-red-600 text-white shadow-sm"
                                : isLight
                                ? "text-zinc-700 hover:text-zinc-950 hover:bg-zinc-300/50"
                                : "text-zinc-400 hover:text-white hover:bg-white/5"
                            }`}
                          >
                            <Lock size={12} />
                            <span>{isThai ? "ปิดใช้งาน" : "Disable"}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SECTION C: SCHEDULED MAINTENANCE & COUNTDOWN TIMER */}
              <div
                className={`p-6 rounded-2xl border transition-colors flex flex-col gap-5 ${
                  isLight ? "bg-white border-zinc-200 shadow-sm" : "bg-[#252525] border-[#383838]"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className={`text-sm font-bold uppercase tracking-wider flex items-center gap-2 ${
                      isLight ? "text-zinc-900" : "text-white"
                    }`}>
                      <Calendar size={16} />
                      <span>{isThai ? "ตั้งเวลาปิดปรับปรุงระบบ" : "Scheduled Maintenance Settings"}</span>
                    </label>
                    <p className={`text-xs mt-0.5 ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                      {isThai
                        ? "กำหนดเวลาเริ่มต้น-สิ้นสุด และเวลานับถอยหลังที่จะแสดงในหน้า System Maintenance"
                        : "Configure countdown timer, start/end labels shown on Figma maintenance screen."}
                    </p>
                  </div>
                </div>

                {/* Start Time & End Time Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {/* Start Time Dropdown Selector */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isLight ? "text-zinc-800" : "text-zinc-200"}`}>
                        {isThai ? "เวลาเริ่มต้น" : "Start Time"}
                      </span>
                      <span className="font-mono text-xs text-zinc-500 font-bold">
                        {maintenanceConfig.startTime}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Hour Dropdown */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-zinc-500">{isThai ? "ชั่วโมง" : "Hour"}</span>
                        <CustomDropdown
                          value={startTimeParts.hour}
                          onChange={(h) => updateStartTime(h, startTimeParts.minute, startTimeParts.period)}
                          options={hourDropdownOptions}
                          size="sm"
                          className="w-full"
                          triggerClassName="h-[36px] font-mono"
                        />
                      </div>

                      {/* Minute Dropdown */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-zinc-500">{isThai ? "นาที" : "Minute"}</span>
                        <CustomDropdown
                          value={startTimeParts.minute}
                          onChange={(m) => updateStartTime(startTimeParts.hour, m, startTimeParts.period)}
                          options={minuteDropdownOptions}
                          size="sm"
                          className="w-full"
                          triggerClassName="h-[36px] font-mono"
                        />
                      </div>

                      {/* AM/PM Dropdown */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-zinc-500">{isThai ? "ช่วงเวลา" : "Period"}</span>
                        <CustomDropdown
                          value={startTimeParts.period}
                          onChange={(p) => updateStartTime(startTimeParts.hour, startTimeParts.minute, p)}
                          options={periodDropdownOptions}
                          size="sm"
                          className="w-full"
                          triggerClassName="h-[36px] font-mono"
                        />
                      </div>
                    </div>
                  </div>

                  {/* End Time Dropdown Selector */}
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-semibold ${isLight ? "text-zinc-800" : "text-zinc-200"}`}>
                        {isThai ? "เวลาคาดการณ์เสร็จสิ้น" : "Estimated End Time"}
                      </span>
                      <span className="font-mono text-xs text-zinc-500 font-bold">
                        {maintenanceConfig.endTime}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {/* Hour Dropdown */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-zinc-500">{isThai ? "ชั่วโมง" : "Hour"}</span>
                        <CustomDropdown
                          value={endTimeParts.hour}
                          onChange={(h) => updateEndTime(h, endTimeParts.minute, endTimeParts.period)}
                          options={hourDropdownOptions}
                          size="sm"
                          className="w-full"
                          triggerClassName="h-[36px] font-mono"
                        />
                      </div>

                      {/* Minute Dropdown */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-zinc-500">{isThai ? "นาที" : "Minute"}</span>
                        <CustomDropdown
                          value={endTimeParts.minute}
                          onChange={(m) => updateEndTime(endTimeParts.hour, m, endTimeParts.period)}
                          options={minuteDropdownOptions}
                          size="sm"
                          className="w-full"
                          triggerClassName="h-[36px] font-mono"
                        />
                      </div>

                      {/* AM/PM Dropdown */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] text-zinc-500">{isThai ? "ช่วงเวลา" : "Period"}</span>
                        <CustomDropdown
                          value={endTimeParts.period}
                          onChange={(p) => updateEndTime(endTimeParts.hour, endTimeParts.minute, p)}
                          options={periodDropdownOptions}
                          size="sm"
                          className="w-full"
                          triggerClassName="h-[36px] font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Countdown Timer Presets & Custom Duration */}
                <div className="flex flex-col gap-3 pt-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold ${isLight ? "text-zinc-800" : "text-zinc-200"}`}>
                      {isThai ? "เวลานับถอยหลังเริ่มต้น" : "Countdown Timer Duration"}
                    </span>
                    <span className="font-mono text-xs text-zinc-500 font-bold">
                      {Math.floor(maintenanceConfig.secondsRemaining / 3600)}h {Math.floor((maintenanceConfig.secondsRemaining % 3600) / 60)}m {maintenanceConfig.secondsRemaining % 60}s
                    </span>
                  </div>

                  {/* Presets: 30นาที, 1ชม, 2ชม, 12ชม, 24ชม, กำหนดเอง */}
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { id: "30m", label: isThai ? "30 นาที" : "30 mins", seconds: 30 * 60 },
                      { id: "1h", label: isThai ? "1 ชม." : "1 hour", seconds: 3600 },
                      { id: "2h", label: isThai ? "2 ชม." : "2 hours", seconds: 2 * 3600 },
                      { id: "12h", label: isThai ? "12 ชม." : "12 hours", seconds: 12 * 3600 },
                      { id: "24h", label: isThai ? "24 ชม." : "24 hours", seconds: 24 * 3600 },
                      { id: "custom", label: isThai ? "กำหนดเอง" : "Custom", seconds: -1 },
                    ].map((preset) => {
                      const isSelected = isCustomCountdown
                        ? preset.id === "custom"
                        : maintenanceConfig.secondsRemaining === preset.seconds;

                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            if (preset.id === "custom") {
                              setIsCustomCountdown(true);
                              const s = customHours * 3600 + customMinutes * 60;
                              setMaintenanceConfig((prev) => ({ ...prev, secondsRemaining: Math.max(10, s) }));
                            } else {
                              setIsCustomCountdown(false);
                              setMaintenanceConfig((prev) => ({ ...prev, secondsRemaining: preset.seconds }));
                            }
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                            isSelected
                              ? isLight
                                ? "bg-zinc-900 text-white border-zinc-900 font-bold"
                                : "bg-white text-zinc-950 border-white font-bold"
                              : isLight
                              ? "bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-800"
                              : "bg-[#333333] hover:bg-[#3D3D3D] border-[#444444] text-zinc-200"
                          }`}
                        >
                          {preset.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Custom Duration Inputs if 'กำหนดเอง' is selected */}
                  {isCustomCountdown && (
                    <div className={`p-3.5 rounded-xl border flex flex-wrap items-center gap-4 ${
                      isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#1E1E1E] border-[#383838]"
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-medium">{isThai ? "ชั่วโมง:" : "Hours:"}</span>
                        <input
                          type="number"
                          min={0}
                          max={720}
                          value={customHours}
                          onChange={(e) => {
                            const val = Math.max(0, parseInt(e.target.value) || 0);
                            setCustomHours(val);
                            const total = val * 3600 + customMinutes * 60;
                            setMaintenanceConfig((prev) => ({ ...prev, secondsRemaining: Math.max(10, total) }));
                          }}
                          className={`w-20 px-3 py-1.5 rounded-lg border text-xs font-mono outline-none ${
                            isLight
                              ? "bg-white border-zinc-300 text-zinc-900 focus:border-zinc-900"
                              : "bg-[#141414] border-[#444444] text-white focus:border-white"
                          }`}
                        />
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500 font-medium">{isThai ? "นาที:" : "Minutes:"}</span>
                        <input
                          type="number"
                          min={0}
                          max={59}
                          value={customMinutes}
                          onChange={(e) => {
                            const val = Math.max(0, Math.min(59, parseInt(e.target.value) || 0));
                            setCustomMinutes(val);
                            const total = customHours * 3600 + val * 60;
                            setMaintenanceConfig((prev) => ({ ...prev, secondsRemaining: Math.max(10, total) }));
                          }}
                          className={`w-20 px-3 py-1.5 rounded-lg border text-xs font-mono outline-none ${
                            isLight
                              ? "bg-white border-zinc-300 text-zinc-900 focus:border-zinc-900"
                              : "bg-[#141414] border-[#444444] text-white focus:border-white"
                          }`}
                        />
                      </div>

                      <span className="text-[11px] text-zinc-400">
                        {isThai
                          ? `(รวมเป็นเวลา ${customHours} ชม. ${customMinutes} นาที)`
                          : `(Total: ${customHours}h ${customMinutes}m)`}
                      </span>
                    </div>
                  )}
                </div>



                {/* Save Button for Status Tab */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-[#383838]">
                  <button
                    type="button"
                    onClick={handleSaveAll}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all shadow-sm ${
                      isLight
                        ? "bg-zinc-900 hover:bg-black text-white"
                        : "bg-white hover:bg-zinc-200 text-zinc-950"
                    }`}
                  >
                    <Save size={14} />
                    <span>{isThai ? "บันทึกการตั้งค่าทั้งหมด" : "Save All Configurations"}</span>
                  </button>
                </div>
              </div>

              {/* SECTION D: LIVE STATUS PREVIEW */}
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className={`text-lg font-bold tracking-tight ${isLight ? "text-zinc-900" : "text-white"}`}>
                      {isThai ? "พรีวิวสถานะการ์ดจริง (Current Status Preview)" : "Current Status Preview"}
                    </h3>
                    <p className={`text-xs ${isLight ? "text-zinc-600" : "text-zinc-400"}`}>
                      {isThai
                        ? "ตรวจสอบการแสดงผลของการ์ดแต่ละโหมด (Active, Maintenance ขอบเหลือง, Disabled ขาวดำแม่กุญแจ)"
                        : "Preview how module cards appear in real time according to selected status modes."}
                    </p>
                  </div>
                </div>

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
                    moduleStatuses={moduleStatuses}
                    recentModuleId={recentModuleId}
                    onNavigate={(route) => {
                      if (route.startsWith("/maintenance")) {
                        window.open(route, "_blank");
                      } else {
                        alert(isThai ? `คลิกเข้าสู่โมดูล: ${route}` : `Navigating to: ${route}`);
                      }
                    }}
                    isLight={isLight}
                    isThai={isThai}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
