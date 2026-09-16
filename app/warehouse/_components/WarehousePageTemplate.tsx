"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import {
  Box,
  CheckCircle2,
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
  AlertCircle,
  Activity,
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
}

export default function WarehousePageTemplate({
  titleEn,
  titleTh,
  routePath,
  iconName,
  icon,
  metrics,
  children,
}: WarehousePageTemplateProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";
  const displayTitle = isThai ? (titleTh || titleEn) : (titleEn || titleTh);

  return (
    <div className="w-full flex-1 flex flex-col">
      {/* Top Bar Header / Navbar */}
      <header
        className={`h-[72px] px-6 sm:px-10 flex items-center border-b shrink-0 transition-colors ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#222222] border-[#444444]"
        }`}
      >
        <h1
          className={`text-[14px] font-bold tracking-tight ${
            isLight ? "text-[#222222]" : "text-[#FFFFFF]"
          }`}
          style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
        >
          {displayTitle}
        </h1>
      </header>

      {/* Page Content Body */}
      <div className="p-6 sm:p-10 space-y-8 max-w-7xl w-full mx-auto flex-1">
        {/* Section Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-[28px] sm:text-[32px] font-bold tracking-tight">
              {titleEn}
            </h1>
            <p className="text-[14px] text-[#999999] mt-1">
              {titleTh} • Real-time Stock Topology & Supply Chain
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`px-3 py-1.5 rounded-xl border text-[12px] font-semibold ${
                isLight
                  ? "bg-white border-slate-200 text-slate-700"
                  : "bg-[#383838] border-[#444444] text-[#E4E4E7]"
              }`}
            >
              Route: {routePath}
            </span>
          </div>
        </div>

        {/* Metrics Grid (if provided) */}
        {metrics && metrics.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {metrics.map((metric, idx) => {
              return (
                <div
                  key={idx}
                  className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all duration-300 ${
                    isLight
                      ? "bg-white border-[#E4E4E7] shadow-sm hover:shadow-md"
                      : "bg-[#383838] border-[#444444] hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-medium text-[#999999]">
                      {metric.title}
                    </span>
                    <div
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{
                        backgroundColor: `${metric.color}20`,
                        color: metric.color,
                      }}
                    >
                      {metric.icon
                        ? (React.isValidElement(metric.icon)
                            ? metric.icon
                            : React.createElement(metric.icon as React.ComponentType<{ size?: number }>, { size: 16 }))
                        : renderWarehouseIconByName(metric.iconName, 16)}
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[26px] font-bold leading-none">
                      {metric.value}
                    </h3>
                    <p className="text-[11.5px] text-[#999999] mt-2">
                      {metric.sub}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Custom Content */}
        {children ? (
          children
        ) : (
          <div
            className={`rounded-2xl border p-6 sm:p-8 transition-all ${
              isLight
                ? "bg-white border-[#E4E4E7] shadow-sm"
                : "bg-[#383838] border-[#444444]"
            }`}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-[#2EC4B6]">
                  {renderWarehouseIconByName(iconName, 20)}
                </div>
                <div>
                  <h3 className="text-[18px] font-bold">
                    Stock Dispatch & Receiving: {titleEn}
                  </h3>
                  <p className="text-[13px] text-[#999999]">
                    Connected to Central Warehouse Master DB
                  </p>
                </div>
              </div>

              <span className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                <CheckCircle2 size={13} />
                Live Feed Active
              </span>
            </div>

            <div
              className={`rounded-xl border p-4 text-[13px] font-mono leading-relaxed overflow-x-auto ${
                isLight
                  ? "bg-slate-50 border-slate-200 text-slate-800"
                  : "bg-[#202020] border-[#383838] text-[#E4E4E7]"
              }`}
            >
              <div>[WAREHOUSE-ZONE-A] Temperature 24.5°C | Humidity 48% | Status: OPTIMAL</div>
              <div>[BARCODE-SCANNER] Engine Ready (EAN-13, QR, Code128)</div>
              <div>[DISPATCH-LOG] Real-time item verification active on route {routePath}</div>
              <div>[SUPABASE-STORAGE] CDN Image Cache Synced</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
