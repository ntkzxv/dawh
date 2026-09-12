"use client";

import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users,
  UserCircle,
  MapPin,
  History,
  Bell,
  LineChart,
  ShieldAlert,
  BarChart3,
  Activity,
  Box,
  Truck,
  ClipboardCheck,
  ChevronDown,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

export interface NavbarsubDatacenterProps {
  isMinimized?: boolean;
  lang?: "th" | "en";
  userRole?: string | null;
  onNavigate?: (path: string) => void;
}

interface SubMenuItem {
  label: string;
  path: string;
  badge?: string | number;
  isRestricted?: boolean;
}

interface MenuGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  path?: string; // If single item
  badge?: string | number;
  children?: SubMenuItem[];
  isRestricted?: boolean;
}

export default function NavbarsubDatacenter({
  isMinimized = false,
  lang: propLang,
  userRole: propUserRole,
  onNavigate,
}: NavbarsubDatacenterProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [localLang, setLocalLang] = useState<"th" | "en">("th");
  const [localRole, setLocalRole] = useState<string | null>(null);

  // State to track which sub-menu groups are expanded
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    hr: false,
    crm: false,
    intel: false,
    whControl: false,
  });

  const activeLang = propLang ?? localLang;
  const activeRole = propUserRole !== undefined ? propUserRole : localRole;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("app_lang") as "th" | "en";
      if (savedLang) setLocalLang(savedLang);

      const savedRole = localStorage.getItem("current_user_role");
      if (savedRole) setLocalRole(savedRole.toLowerCase());
    }
  }, []);

  // Auto-expand group containing active route
  useEffect(() => {
    menuGroups.forEach((group) => {
      if (group.children?.some((child) => child.path === pathname)) {
        setExpandedGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [pathname]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const translations = {
    en: {
      dashboard: "Analytics Core",
      hr: "Human Resources",
      crm: "Client Relation",
      intel: "Data Intelligence",
      whControl: "Central Warehouse",
      empList: "Staff Directory",
      empAdd: "Recruit Staff",
      timeAtt: "Time Attendance",
      payroll: "Salary Matrix",
      clientList: "Corporate Ledger",
      clientAudit: "Credit Review",
      kyc: "KYC Clearance",
      analytics: "Yield Analytics",
      risk: "Risk Defense",
      liveFeed: "Live Stream Feed",
      aiMetrics: "Neural Forecast",
      whOverview: "Stock Topology",
      whShipment: "Logistics Radar",
      whQuality: "Quality Control",
    },
    th: {
      dashboard: "ภาพรวมดาต้าเซ็นเตอร์",
      hr: "ฝ่ายบุคคล (HR)",
      crm: "ลูกค้าสัมพันธ์ (CRM)",
      intel: "ระบบข่าวกรองข้อมูล",
      whControl: "ศูนย์คลังสินค้ากลาง",
      empList: "รายชื่อพนักงาน",
      empAdd: "เพิ่มพนักงานใหม่",
      timeAtt: "บันทึกเวลาเข้าออก",
      payroll: "เงินเดือนและค่าตอบแทน",
      clientList: "ทะเบียนลูกค้าองค์กร",
      clientAudit: "ประวัติเครดิต/เช่าซื้อ",
      kyc: "ยืนยันตัวตน (KYC)",
      analytics: "ผลวิเคราะห์สถิติรวม",
      risk: "ระบบตรวจจับความเสี่ยง",
      liveFeed: "สถานะระบบสด",
      aiMetrics: "คาดการณ์ด้วย AI",
      whOverview: "ภาพรวมสินค้าคงคลัง",
      whShipment: "ติดตามการขนส่ง",
      whQuality: "ตรวจสอบคุณภาพ",
    },
  };

  const normalizedLang = (activeLang?.toLowerCase() === "en" ? "en" : "th") as "en" | "th";
  const t = translations[normalizedLang] || translations.th;

  const menuGroups: MenuGroup[] = [
    {
      id: "dashboard",
      title: t.dashboard,
      icon: LayoutDashboard,
      path: "/datacenter",
    },
    {
      id: "hr",
      title: t.hr,
      icon: Users,
      children: [
        {
          label: t.empList,
          path: "/datacenter/employees",
        },
        {
          label: t.empAdd,
          path: "/datacenter/employees/add",
        },
        {
          label: t.timeAtt,
          path: "/datacenter/attendance",
        },
        {
          label: t.payroll,
          path: "/datacenter/payroll",
          isRestricted: true,
        },
      ],
    },
    {
      id: "crm",
      title: t.crm,
      icon: UserCircle,
      children: [
        {
          label: t.clientList,
          path: "/datacenter/crm/clients",
        },
        {
          label: t.clientAudit,
          path: "/datacenter/crm/audit",
        },
        {
          label: t.kyc,
          path: "/datacenter/crm/kyc",
          badge: 3,
        },
      ],
    },
    {
      id: "whControl",
      title: t.whControl,
      icon: Box,
      children: [
        {
          label: t.whOverview,
          path: "/datacenter/warehouse/overview",
        },
        {
          label: t.whShipment,
          path: "/datacenter/warehouse/shipments",
        },
        {
          label: t.whQuality,
          path: "/datacenter/warehouse/qc",
        },
      ],
    },
    {
      id: "intel",
      title: t.intel,
      icon: LineChart,
      children: [
        {
          label: t.analytics,
          path: "/datacenter/analytics",
        },
        {
          label: t.risk,
          path: "/datacenter/risk",
        },
        {
          label: t.liveFeed,
          path: "/datacenter/live",
          badge: "Live",
        },
        {
          label: t.aiMetrics,
          path: "/datacenter/ai",
        },
      ],
    },
  ];

  const handleItemClick = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  };

  return (
    <nav className="w-full space-y-1.5 py-2 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
      {menuGroups.map((group) => {
        const Icon = group.icon;
        const hasChildren = group.children && group.children.length > 0;
        const isExpanded = expandedGroups[group.id] ?? false;

        const isChildActive = group.children?.some(
          (child) => child.path === pathname
        );
        const isSelfActive = group.path === pathname;

        // Case 1: Single item without children
        if (!hasChildren && group.path) {
          return (
            <button
              key={group.id}
              type="button"
              onClick={() => handleItemClick(group.path!)}
              className={`group relative rounded-xl transition-all duration-300 flex items-center overflow-hidden ${
                isMinimized
                  ? "w-12 h-12 justify-center mx-auto px-0"
                  : "w-full px-3.5 py-2.5 gap-3"
              } ${
                isSelfActive
                  ? isLight
                    ? "bg-slate-900 text-[#FFFFFF] font-semibold shadow-sm"
                    : "bg-[#383838] text-[#FFFFFF] shadow-md font-semibold border border-[#444444]"
                  : isLight
                  ? "text-slate-700 hover:bg-[#F4F4F5] hover:text-slate-950 font-medium"
                  : "text-[#F4F4F5] hover:bg-[#383838]/60 hover:text-[#FFFFFF]"
              }`}
              title={isMinimized ? group.title : undefined}
            >
              <Icon
                size={20}
                className={`${
                  isSelfActive
                    ? "text-[#FFFFFF]"
                    : isLight
                    ? "text-slate-700 group-hover:text-slate-950"
                    : "text-[#E4E4E7] group-hover:text-[#FFFFFF]"
                } shrink-0 transition-colors duration-300`}
              />

              <span
                className={`text-[13.5px] leading-tight text-left whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isSelfActive
                    ? "font-semibold text-[#FFFFFF]"
                    : isLight
                    ? "font-medium text-slate-800"
                    : "font-normal text-[#F4F4F5] group-hover:text-[#FFFFFF]"
                } ${
                  isMinimized
                    ? "max-w-0 opacity-0 -translate-x-2 pointer-events-none"
                    : "max-w-[170px] opacity-100 translate-x-0"
                }`}
              >
                {group.title}
              </span>

              {group.badge && !isMinimized && (
                <span
                  className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    isLight
                      ? "bg-slate-200 text-slate-900"
                      : "bg-[#282828] text-[#E4E4E7] border border-[#444444]"
                  }`}
                >
                  {group.badge}
                </span>
              )}
            </button>
          );
        }

        // Case 2: Collapsible parent with children (Tree Accordion)
        return (
          <div key={group.id} className="w-full flex flex-col">
            {/* Parent Header Button */}
            <button
              type="button"
              onClick={() => toggleGroup(group.id)}
              className={`group relative rounded-xl transition-all duration-300 flex items-center justify-between overflow-hidden ${
                isMinimized
                  ? "w-12 h-12 justify-center mx-auto px-0"
                  : "w-full px-3.5 py-2.5 gap-3"
              } ${
                isChildActive && !isExpanded
                  ? isLight
                    ? "bg-slate-100 text-slate-950 font-semibold"
                    : "bg-[#383838]/60 text-[#FFFFFF] font-semibold"
                  : isLight
                  ? "text-slate-700 hover:bg-[#F4F4F5] hover:text-slate-950 font-medium"
                  : "text-[#F4F4F5] hover:bg-[#383838]/60 hover:text-[#FFFFFF]"
              }`}
              title={isMinimized ? group.title : undefined}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  size={20}
                  className={`${
                    isChildActive
                      ? "text-[#FFFFFF]"
                      : isLight
                      ? "text-slate-700 group-hover:text-slate-950"
                      : "text-[#E4E4E7] group-hover:text-[#FFFFFF]"
                  } shrink-0 transition-colors duration-300`}
                />

                <span
                  className={`text-[13.5px] leading-tight text-left whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isChildActive
                      ? "font-semibold text-[#FFFFFF]"
                      : isLight
                      ? "font-medium text-slate-800"
                      : "font-normal text-[#F4F4F5] group-hover:text-[#FFFFFF]"
                  } ${
                    isMinimized
                      ? "max-w-0 opacity-0 -translate-x-2 pointer-events-none"
                      : "max-w-[150px] opacity-100 translate-x-0"
                  }`}
                >
                  {group.title}
                </span>
              </div>

              {/* Chevron Arrow Indicator */}
              {!isMinimized && (
                <ChevronDown
                  size={16}
                  className={`shrink-0 transition-transform duration-300 ${
                    isLight ? "text-slate-600" : "text-[#E4E4E7]"
                  } ${isExpanded ? "rotate-180" : "rotate-0"}`}
                />
              )}
            </button>

            {/* Sub-menu Items with Tree Guide Line (Smooth Grid Transition) */}
            {!isMinimized && (
              <div
                className={`grid transition-all duration-300 ease-in-out ${
                  isExpanded
                    ? "grid-rows-[1fr] opacity-100 mt-1 mb-1"
                    : "grid-rows-[0fr] opacity-0 mt-0 mb-0"
                }`}
              >
                <div className="overflow-hidden">
                  {/* Left Vertical Tree Line */}
                  <div
                    className={`ml-5 pl-3.5 border-l space-y-1 py-1 transition-colors ${
                      isLight ? "border-slate-300" : "border-[#444444]"
                    }`}
                  >
                    {group.children?.map((child) => {
                      const isActive = pathname === child.path;

                      return (
                        <button
                          key={child.label}
                          type="button"
                          onClick={() => handleItemClick(child.path)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-200 ${
                            isActive
                              ? isLight
                                ? "bg-slate-900 text-[#FFFFFF] font-semibold shadow-sm"
                                : "bg-[#383838] text-[#FFFFFF] font-semibold shadow-sm border border-[#555555]"
                              : isLight
                              ? "text-slate-600 hover:text-slate-950 hover:bg-slate-100 font-normal"
                              : "text-[#E4E4E7] hover:text-[#FFFFFF] hover:bg-white/5 font-normal"
                          }`}
                        >
                          <span className="text-[13px] leading-tight truncate">
                            {child.label}
                          </span>

                          {child.badge && (
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                                typeof child.badge === "string" &&
                                child.badge.toLowerCase() === "live"
                                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse"
                                  : isLight
                                  ? "bg-slate-200 text-slate-900"
                                  : "bg-[#282828] text-[#FFFFFF] border border-[#555555]"
                              }`}
                            >
                              {child.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}
