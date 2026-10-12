"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";

// =========================================================================
// 1. ATOMIC SKELETON PRIMITIVES
// =========================================================================

export interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function SkeletonBox({ className = "", style }: SkeletonProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      style={style}
      className={`animate-pulse rounded-xl transition-colors duration-200 ${
        isLight ? "bg-slate-200/80" : "bg-white/[0.08]"
      } ${className}`}
    />
  );
}

export function SkeletonText({
  lines = 1,
  className = "",
}: {
  lines?: number;
  className?: string;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className={`space-y-2 w-full ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`h-3.5 rounded-md animate-pulse ${
            i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"
          } ${isLight ? "bg-slate-200" : "bg-white/[0.07]"}`}
        />
      ))}
    </div>
  );
}

// =========================================================================
// 2. MOLECULAR SKELETON CARDS & GRIDS
// =========================================================================

export function SkeletonStatCard() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className={`rounded-2xl p-5 border flex flex-col justify-between gap-4 ${
        isLight
          ? "bg-white border-[#E4E4E7] shadow-xs"
          : "bg-[#282828] border-[#444444]"
      }`}
    >
      <div className="flex items-center justify-between">
        <SkeletonBox className="h-4 w-28 rounded-md" />
        <SkeletonBox className="h-8 w-8 rounded-xl" />
      </div>
      <div className="space-y-2">
        <SkeletonBox className="h-7 w-36 rounded-lg" />
        <SkeletonBox className="h-3 w-20 rounded-md" />
      </div>
    </div>
  );
}

export function SkeletonStatGrid({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonStatCard key={i} />
      ))}
    </div>
  );
}

export function SkeletonDataTable({
  rows = 6,
  columns = 5,
  showToolbar = true,
  minWidth = "760px",
  ariaLabel = "Loading table",
}: {
  rows?: number;
  columns?: number;
  showToolbar?: boolean;
  minWidth?: string;
  ariaLabel?: string;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div role="status" aria-label={ariaLabel} className="w-full space-y-4">
      {showToolbar && (
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-9 w-48 rounded-md" />
            <SkeletonBox className="h-[33px] w-[104px] rounded-md" />
          </div>
          <div className="flex items-center gap-2">
            <SkeletonBox className="h-9 w-24 rounded-xl" />
            <SkeletonBox className="h-9 w-28 rounded-xl" />
          </div>
        </div>
      )}

      <div className={"w-full overflow-hidden rounded-xl border " + (isLight ? "border-[#D4D4D8] bg-white" : "border-[#555555] bg-[#383838]")}>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 border-0 bg-transparent text-left text-[13px]" style={{ minWidth }} aria-hidden="true">
            <thead>
              <tr className={"h-[36px] " + (isLight ? "bg-[#F4F4F5]" : "bg-[#2C2C2C]")}>
                {Array.from({ length: columns }).map((_, index) => (
                  <th key={index} className="px-3 py-2">
                    <SkeletonBox className="h-3 w-2/3" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className={"divide-y " + (isLight ? "divide-[#E4E4E7]" : "divide-[#444444]")}>
              {Array.from({ length: rows }).map((_, row) => (
                <tr key={row} className="h-[56px]">
                  {Array.from({ length: columns }).map((_, column) => (
                    <td key={column} className="px-3 py-3">
                      <SkeletonBox className={column === 0 ? "h-3.5 w-3/4" : column === columns - 1 ? "ml-auto size-8 rounded-[6px]" : column === columns - 2 ? "h-5 w-14 rounded-full" : "h-3.5 w-20"} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export function SkeletonChartCard() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className={`rounded-2xl border p-6 space-y-4 ${
        isLight
          ? "bg-white border-[#E4E4E7] shadow-xs"
          : "bg-[#282828] border-[#444444]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1.5">
          <SkeletonBox className="h-5 w-44 rounded-md" />
          <SkeletonBox className="h-3 w-28 rounded-md" />
        </div>
        <SkeletonBox className="h-8 w-24 rounded-xl" />
      </div>
      <SkeletonBox className="h-56 w-full rounded-xl" />
    </div>
  );
}

// =========================================================================
// 3. FULL PAGE SKELETON TEMPLATES (WAREHOUSE & DATACENTER)
// =========================================================================

export function SkeletonWarehousePage() {
  return (
    <div className="w-full space-y-6 animate-in fade-in-50 duration-300">
      {/* Top Breadcrumb & Action Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <SkeletonBox className="h-7 w-56 rounded-lg" />
          <SkeletonBox className="h-3.5 w-72 rounded-md" />
        </div>
        <div className="flex items-center gap-2.5">
          <SkeletonBox className="h-9 w-28 rounded-xl" />
          <SkeletonBox className="h-9 w-36 rounded-xl" />
        </div>
      </div>

      {/* Stat KPI Counters */}
      <SkeletonStatGrid count={4} />

      {/* Main Content Layout (Table + Side Widget) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonDataTable rows={5} columns={5} />
        </div>
        <div className="space-y-6">
          <SkeletonChartCard />
        </div>
      </div>
    </div>
  );
}

export function SkeletonDatacenterPage() {
  return (
    <div className="w-full space-y-6 animate-in fade-in-50 duration-300">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <SkeletonBox className="h-7 w-64 rounded-lg" />
          <SkeletonBox className="h-3.5 w-80 rounded-md" />
        </div>
        <div className="flex items-center gap-2.5">
          <SkeletonBox className="h-9 w-32 rounded-xl" />
          <SkeletonBox className="h-9 w-40 rounded-xl" />
        </div>
      </div>

      {/* 4 Financial / Contract KPI Cards */}
      <SkeletonStatGrid count={4} />

      {/* 2-Column Split: Performance Chart & Recent Contracts Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChartCard />
        <SkeletonChartCard />
      </div>

      {/* Contracts / CRM Data Table */}
      <SkeletonDataTable rows={6} columns={5} />
    </div>
  );
}

// =========================================================================
// 4. CONDITIONAL SKELETON WRAPPER
// =========================================================================

export interface SkeletonWrapperProps {
  isLoading: boolean;
  children: React.ReactNode;
  variant?: "warehouse" | "datacenter" | "table" | "stat";
  fallback?: React.ReactNode;
}

export function SkeletonWrapper({
  isLoading,
  children,
  variant = "warehouse",
  fallback,
}: SkeletonWrapperProps) {
  if (isLoading) {
    if (fallback) return <>{fallback}</>;
    if (variant === "warehouse") return <SkeletonWarehousePage />;
    if (variant === "datacenter") return <SkeletonDatacenterPage />;
    if (variant === "table") return <SkeletonDataTable />;
    if (variant === "stat") return <SkeletonStatGrid />;
  }

  return <>{children}</>;
}
