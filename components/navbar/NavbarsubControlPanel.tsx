"use client";

import React from "react";
import {
  Users,
  Shield,
  Building2,
  Building,
  Package,
  Activity,
  ShieldAlert,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import type { AdminTabKey } from "@/components/controlpanel/types";

export interface NavbarsubControlPanelProps {
  activeTab?: AdminTabKey;
  onTabChange?: (tab: AdminTabKey) => void;
  isMinimized?: boolean;
  lang?: "th" | "en";
  counts?: Partial<Record<AdminTabKey, number>>;
}

interface ControlPanelMenuItem {
  id: AdminTabKey;
  titleTh: string;
  titleEn: string;
  icon: React.ElementType;
}

const CONTROL_PANEL_ITEMS: ControlPanelMenuItem[] = [
  {
    id: "users",
    titleTh: "การจัดการผู้ใช้",
    titleEn: "User Management",
    icon: Users,
  },
  {
    id: "roles",
    titleTh: "บทบาทและสิทธิ์",
    titleEn: "Role Management",
    icon: Shield,
  },
  {
    id: "scopes",
    titleTh: "ขอบเขตสาขา",
    titleEn: "Facility Scope",
    icon: Building2,
  },
  {
    id: "organization",
    titleTh: "สาขาและผังคลัง",
    titleEn: "Organization & Facilities",
    icon: Building,
  },
  {
    id: "products",
    titleTh: "ข้อมูลสินค้าหลัก",
    titleEn: "Product Master",
    icon: Package,
  },
  {
    id: "stock",
    titleTh: "ติดตามสต็อก",
    titleEn: "Stock Monitoring",
    icon: Activity,
  },
  {
    id: "safety_stock",
    titleTh: "เกณฑ์สต็อกปลอดภัย",
    titleEn: "Safety Stock Rules",
    icon: ShieldAlert,
  },
];

export default function NavbarsubControlPanel({
  activeTab = "users",
  onTabChange,
  isMinimized = false,
  lang: propLang,
  counts = {},
}: NavbarsubControlPanelProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const normalizedLang = (propLang ?? (appLang?.toLowerCase() === "en" ? "en" : "th")) as "en" | "th";
  const isThai = normalizedLang === "th";

  return (
    <nav className="w-full space-y-1.5 py-2 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]">
      {CONTROL_PANEL_ITEMS.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        const title = isThai ? item.titleTh : item.titleEn;
        const count = counts[item.id];

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange?.(item.id)}
            className={`group relative rounded-xl border transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center overflow-hidden cursor-pointer outline-none focus:outline-none select-none ${
              isMinimized
                ? "w-12 h-12 justify-center mx-auto px-0"
                : "w-full px-3.5 py-2.5 gap-3"
            } ${
              isActive
                ? isLight
                  ? "bg-slate-100 text-slate-950 border-slate-200"
                  : "bg-[#383838]/80 text-[#FFFFFF] border-[#444444]/60"
                : isLight
                ? "border-transparent text-slate-700 hover:bg-[#F4F4F5] hover:text-slate-950"
                : "border-transparent text-[#F4F4F5] hover:bg-[#383838]/60 hover:text-[#FFFFFF]"
            }`}
            title={isMinimized ? title : undefined}
          >
            <Icon
              size={18}
              className={`${
                isActive
                  ? isLight
                    ? "text-slate-950"
                    : "text-[#FFFFFF]"
                  : isLight
                  ? "text-slate-700 group-hover:text-slate-950"
                  : "text-[#E4E4E7] group-hover:text-[#FFFFFF]"
              } shrink-0 transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
            />

            <span
              className={`text-[13.5px] font-medium leading-tight text-left whitespace-nowrap overflow-hidden transition-all ease-out ${
                isActive
                  ? isLight
                    ? "text-slate-950 font-semibold"
                    : "text-[#FFFFFF] font-semibold"
                  : isLight
                  ? "text-slate-800"
                  : "text-[#E4E4E7] group-hover:text-[#FFFFFF]"
              } ${
                isMinimized
                  ? "max-w-0 opacity-0 -translate-x-3 duration-200 pointer-events-none"
                  : "max-w-[170px] opacity-100 translate-x-0 duration-350 delay-100"
              }`}
            >
              {title}
            </span>

            {count !== undefined && count !== null && !isMinimized && (
              <span
                className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full ${
                  isLight
                    ? "bg-slate-200 text-slate-900"
                    : "bg-[#282828] text-[#E4E4E7] border border-[#444444]"
                }`}
              >
                {count}
              </span>
            )}

            {/* Side line indicator when currently active (expanded) */}
            {!isMinimized && (
              <div
                className={`flex items-center justify-center w-4 shrink-0 ${
                  count !== undefined ? "ml-1 mr-[-3px]" : "ml-auto mr-[-3px]"
                }`}
              >
                <span
                  className={`w-[2.5px] h-[13px] rounded-full shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isLight ? "bg-slate-900" : "bg-white"
                  } ${
                    isActive
                      ? "opacity-100 scale-y-100"
                      : "opacity-0 scale-y-50 pointer-events-none"
                  }`}
                />
              </div>
            )}

            {/* Bottom dot/pill indicator when minimized */}
            {isMinimized && (
              <span
                className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-[2.5px] rounded-full shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isLight ? "bg-slate-900" : "bg-white"
                } ${
                  isActive
                    ? "opacity-100 scale-x-100"
                    : "opacity-0 scale-x-50 pointer-events-none"
                }`}
              />
            )}
          </button>
        );
      })}
    </nav>
  );
}
