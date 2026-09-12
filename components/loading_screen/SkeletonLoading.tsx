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
}: {
  rows?: number;
  columns?: number;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className={`w-full rounded-2xl border p-5 space-y-4 ${
        isLight
          ? "bg-white border-[#E4E4E7] shadow-xs"
          : "bg-[#282828] border-[#444444]"
      }`}
    >
      {/* Table Header Filter Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-white/10">
        <div className="flex items-center gap-3">
          <SkeletonBox className="h-9 w-48 rounded-xl" />
          <SkeletonBox className="h-9 w-28 rounded-xl" />
        </div>
        <div className="flex items-center gap-2">
          <SkeletonBox className="h-9 w-24 rounded-xl" />
          <SkeletonBox className="h-9 w-28 rounded-xl" />
        </div>
      </div>

      {/* Table Head */}
      <div className="grid grid-cols-5 gap-4 py-2 px-3">
        {Array.from({ length: columns }).map((_, i) => (
          <SkeletonBox key={i} className="h-4 rounded-md" />
        ))}
      </div>

      {/* Table Rows */}
      <div className="space-y-2.5">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className={`grid grid-cols-5 gap-4 items-center p-3 rounded-xl ${
              isLight ? "bg-slate-50/70" : "bg-white/[0.03]"
            }`}
          >
            <div className="flex items-center gap-2.5">
              <SkeletonBox className="h-8 w-8 rounded-lg shrink-0" />
              <div className="space-y-1 w-full">
                <SkeletonBox className="h-3.5 w-3/4 rounded-md" />
                <SkeletonBox className="h-2.5 w-1/2 rounded-md" />
              </div>
            </div>
            <SkeletonBox className="h-3.5 w-2/3 rounded-md" />
            <SkeletonBox className="h-3.5 w-3/4 rounded-md" />
            <SkeletonBox className="h-5 w-20 rounded-full" />
            <div className="flex justify-end gap-2">
              <SkeletonBox className="h-7 w-16 rounded-lg" />
            </div>
          </div>
        ))}
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
