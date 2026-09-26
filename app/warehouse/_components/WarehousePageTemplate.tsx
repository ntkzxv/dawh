"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import { motion, AnimatePresence } from "framer-motion";
import {
  Box,
  Package,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  History,
  Building2,
  Users,
  ArrowLeftRight,
  Sparkles,
  AlertTriangle,
  Activity,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export type WarehouseIconType =
  | "package"
  | "layers"
  | "inbound"
  | "outbound"
  | "history"
  | "branches"
  | "suppliers"
  | "transfer"
  | "ai"
  | "alert"
  | "box";

function renderWarehouseIconByName(name?: string, size = 20) {
  switch (name) {
    case "package":
      return <Package size={size} />;
    case "layers":
      return <Layers size={size} />;
    case "inbound":
      return <ArrowDownLeft size={size} />;
    case "outbound":
      return <ArrowUpRight size={size} />;
    case "history":
      return <History size={size} />;
    case "branches":
      return <Building2 size={size} />;
    case "suppliers":
      return <Users size={size} />;
    case "transfer":
      return <ArrowLeftRight size={size} />;
    case "ai":
      return <Sparkles size={size} />;
    case "alert":
      return <AlertTriangle size={size} />;
    case "box":
      return <Box size={size} />;
    default:
      return <Activity size={size} />;
  }
}

export interface WarehouseMetricItem {
  title: string;
  value: string;
  sub: string;
  iconName?: WarehouseIconType;
  icon?: React.ReactNode | React.ElementType;
  color: string;
}

export interface WarehousePageTemplateProps {
  titleEn: string;
  titleTh: string;
  routePath: string;
  iconName?: WarehouseIconType;
  icon?: React.ReactNode | React.ElementType;
  metrics?: WarehouseMetricItem[];
  children?: React.ReactNode;
  fullBleed?: boolean;
  headerActions?: React.ReactNode;
}

// Keep track of whether user has already entered warehouse module in current session
let hasEnteredWarehouseModule = false;

export default function WarehousePageTemplate({
  titleEn,
  titleTh,
  metrics,
  children,
  fullBleed = false,
  headerActions,
}: WarehousePageTemplateProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";
  const displayTitle = isThai ? (titleTh || titleEn) : (titleEn || titleTh);

  // ตั้งค่าเริ่มต้นให้ซ่อนภาพรวมไว้เป็น Default
  const [isMetricsVisible, setIsMetricsVisible] = React.useState(false);

  // Animate topbar slide-in only on the first page load from outside warehouse
  const [shouldAnimateTopbar] = React.useState(() => {
    if (typeof window === "undefined") return true;
    if (!hasEnteredWarehouseModule) {
      hasEnteredWarehouseModule = true;
      return true;
    }
    return false;
  });

  return (
    <div className="w-full flex-1 flex flex-col h-full min-h-0 overflow-hidden">
      {/* Top Bar Header / Navbar - Slide in from Left to Right ONLY on initial entry */}
      <motion.header
        initial={shouldAnimateTopbar ? { x: -40, opacity: 0 } : false}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className={`h-[72px] px-6 sm:px-10 flex items-center justify-between border-b shrink-0 transition-colors z-10 ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#222222] border-[#444444]"
        }`}
      >
        <h1
          className={`text-[18px] sm:text-[19px] font-bold tracking-tight ${
            isLight ? "text-[#222222]" : "text-[#FFFFFF]"
          }`}
          style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
        >
          {displayTitle}
        </h1>

        {headerActions && (
          <div className="flex items-center gap-3">
            {headerActions}
          </div>
        )}
      </motion.header>

      {/* Page Content Body (Scrollable below Navbar - Scrollbar hugs right edge of screen) */}
      <div id="warehouse-page-scroll-container" className="flex-1 overflow-y-auto min-h-0 w-full">
        <div
          className={
            fullBleed
              ? "w-full h-full flex flex-col p-0"
              : "p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto"
          }
        >


        {/* Metrics Bar with Dividers (Collapsible) */}
        {metrics && metrics.length > 0 && (
          <div className={`w-full space-y-2 ${fullBleed ? "px-4 sm:px-6 lg:px-8 pt-4 sm:pt-6" : ""}`}>
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => setIsMetricsVisible(!isMetricsVisible)}
                className={`flex items-center gap-1 text-[12px] font-medium transition-colors cursor-pointer select-none px-2 py-1 rounded-md ${
                  isLight
                    ? "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                    : "text-zinc-400 hover:text-zinc-200 hover:bg-white/5"
                }`}
              >
                <span>
                  {isMetricsVisible
                    ? isThai
                      ? "ซ่อนภาพรวม"
                      : "Hide Summary"
                    : isThai
                    ? "แสดงภาพรวม"
                    : "Show Summary"}
                </span>
                {isMetricsVisible ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
            </div>

            <AnimatePresence initial={false}>
              {isMetricsVisible && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="overflow-hidden"
                >
                  <div
                    className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x ${
                      isLight ? "divide-[#E4E4E7]" : "divide-[#383838]"
                    }`}
                  >
                    {metrics.map((metric, idx) => {
                      return (
                        <div
                          key={idx}
                          className="py-1.5 px-5 sm:px-6 flex flex-col justify-between gap-3 first:pl-0 last:pr-0"
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-[14px] font-semibold tracking-tight ${
                                isLight ? "text-slate-700" : "text-zinc-200"
                              }`}
                            >
                              {metric.title}
                            </span>
                            <div
                              className={`flex items-center justify-center select-none ${
                                isLight ? "text-slate-900" : "text-white"
                              }`}
                            >
                              {metric.icon
                                ? (React.isValidElement(metric.icon)
                                    ? metric.icon
                                    : React.createElement(metric.icon as React.ComponentType<{ size?: number }>, { size: 18 }))
                                : renderWarehouseIconByName(metric.iconName, 18)}
                            </div>
                          </div>
                          <div>
                            <h3 className={`text-[25px] font-bold leading-none ${
                              isLight ? "text-slate-900" : "text-white"
                            }`}>
                              {metric.value}
                            </h3>
                            <p className={`text-[11.5px] mt-2 truncate ${
                              isLight ? "text-slate-500" : "text-[#999999]"
                            }`}>
                              {metric.sub}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {children}
        </div>
      </div>
    </div>
  );
}
