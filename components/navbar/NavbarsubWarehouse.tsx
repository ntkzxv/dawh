"use client";

import React, { useEffect, useState } from "react";
import {
  LayoutDashboard,
  MapPin,
  History,
  Activity,
  Box,
  Truck,
  Package,
  ArrowLeftRight,
  Factory,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";

export interface NavbarsubWarehouseProps {
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
  path?: string;
  badge?: string | number;
  children?: SubMenuItem[];
}

export default function NavbarsubWarehouse({
  isMinimized = false,
  lang: propLang,
  userRole: propUserRole,
  onNavigate,
}: NavbarsubWarehouseProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [localLang, setLocalLang] = useState<"th" | "en">("th");
  const [localRole, setLocalRole] = useState<string | null>(null);

  // State to track expanded sub-menu groups
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    logistics: false,
    intel: false,
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
    menuItems.forEach((item) => {
      if (item.children?.some((child) => child.path === pathname)) {
        setExpandedGroups((prev) => ({ ...prev, [item.id]: true }));
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
      dashboard: "Dashboard",
      logistics: "Logistics & Stock",
      intelSystem: "Intelligence",
      wallets: "Wallets",
      p_master: "Product Master",
      stock: "Inventory Stock",
      receiving: "Goods Receiving",
      m_log: "Movement Log",
      b_warehouse: "Branch Warehouse",
      supplier: "Suppliers",
      transfer: "Stock Transfer",
      ai_warehouse: "AI Analysis",
      alert: "Alert System",
    },
    th: {
      dashboard: "ภาพรวมคลังสินค้า",
      logistics: "คลังสินค้าและโลจิสติกส์",
      intelSystem: "ระบบวิเคราะห์อัจฉริยะ",
      wallets: "กระเป๋าบัญชี",
      p_master: "ข้อมูลสินค้าหลัก",
      stock: "สต็อกคงเหลือ",
      receiving: "รับสินค้าเข้า",
      m_log: "ประวัติเคลื่อนไหว",
      b_warehouse: "คลังแยกสาขา",
      supplier: "ผู้ผลิต/คู่ค้า",
      transfer: "โอนย้ายสินค้า",
      ai_warehouse: "AI วิเคราะห์คลัง",
      alert: "ระบบแจ้งเตือน",
    },
  };

  const normalizedLang = (activeLang?.toLowerCase() === "en" ? "en" : "th") as "en" | "th";
  const t = translations[normalizedLang] || translations.th;

  const menuItems: MenuGroup[] = [
    {
      id: "dashboard",
      title: t.dashboard,
      icon: LayoutDashboard,
      path: "/warehouse",
    },
    {
      id: "logistics",
      title: t.logistics,
      icon: Package,
      children: [
        {
          label: t.p_master,
          path: "/warehouse/inventory",
        },
        {
          label: t.stock,
          path: "/warehouse/stock",
        },
        {
          label: t.receiving,
          path: "/warehouse/receive",
        },
        {
          label: t.m_log,
          path: "/warehouse/movements",
        },
        {
          label: t.b_warehouse,
          path: "/warehouse/branches",
        },
        {
          label: t.supplier,
          path: "/warehouse/suppliers",
        },
        {
          label: t.transfer,
          path: "/warehouse/transfer",
        },
      ],
    },
    {
      id: "intel",
      title: t.intelSystem,
      icon: Activity,
      children: [
        {
          label: t.ai_warehouse,
          path: "/warehouse/analysis",
        },
        {
          label: t.alert,
          path: "/warehouse/alerts",
          badge: 2,
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
      {menuItems.map((item) => {
        const Icon = item.icon;
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedGroups[item.id] ?? false;

        const isChildActive = item.children?.some((child) => child.path === pathname);
        const isSelfActive = item.path === pathname;

        // Case 1: Single item without children
        if (!hasChildren && item.path) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => handleItemClick(item.path!)}
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
              title={isMinimized ? item.title : undefined}
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
                {item.title}
              </span>

              {item.badge && !isMinimized && (
                <span
                  className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    isLight
                      ? "bg-slate-200 text-slate-900"
                      : "bg-[#282828] text-[#E4E4E7] border border-[#444444]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        }

        // Case 2: Collapsible parent with children (Tree Accordion)
        return (
          <div key={item.id} className="w-full flex flex-col">
            {/* Parent Header Button */}
            <button
              type="button"
              onClick={() => toggleGroup(item.id)}
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
              title={isMinimized ? item.title : undefined}
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
                    isChildActive ? "font-semibold text-[#FFFFFF]" : "font-normal"
                  } ${
                    isMinimized
                      ? "max-w-0 opacity-0 -translate-x-2 pointer-events-none"
                      : "max-w-[150px] opacity-100 translate-x-0"
                  }`}
                >
                  {item.title}
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
                    {item.children?.map((child) => {
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
                                isLight
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
