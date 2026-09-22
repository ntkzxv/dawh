"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";
import type { AdminTabKey, RoleSubTabKey, ProductSubTabKey } from "./types";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Reusable animated pulse box adhering to DAWH 3-tier white & dark palette.
 */
function PulseBox({ className = "", style }: SkeletonProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      style={style}
      className={`animate-pulse rounded-xl transition-colors duration-200 ${
        isLight ? "bg-zinc-200/80" : "bg-white/[0.08]"
      } ${className}`}
    />
  );
}

/**
 * Common Top Banner Skeleton for Control Panel Tabs
 */
function SkeletonTabBanner({ hasActionBtn = false }: { hasActionBtn?: boolean }) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
        isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
      }`}
    >
      <div className="flex items-center gap-3.5">
        <PulseBox className="w-11 h-11 rounded-xl shrink-0" />
        <div className="space-y-2">
          <PulseBox className="h-5 w-44 sm:w-56 rounded-lg" />
          <PulseBox className="h-3.5 w-64 sm:w-96 rounded-md" />
        </div>
      </div>
      <div className="flex items-center gap-2 self-start sm:self-auto">
        <PulseBox className="h-7 w-24 rounded-full" />
        {hasActionBtn && <PulseBox className="h-8 w-32 rounded-xl" />}
      </div>
    </div>
  );
}

/**
 * 4 KPI Metric Summary Cards
 */
function SkeletonKpiRow({ count = 4 }: { count?: number }) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className={`grid grid-cols-2 gap-3 w-full ${
        count === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4"
      }`}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`p-3.5 rounded-xl border flex items-center gap-3 transition-colors ${
            isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
          }`}
        >
          <PulseBox className="w-9 h-9 rounded-lg shrink-0" />
          <div className="space-y-1.5 flex-1 min-w-0">
            <PulseBox className="h-3 w-20 rounded-md" />
            <PulseBox className="h-5 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Filter & Search Bar Skeleton
 */
function SkeletonSearchBar({ dropdownCount = 1 }: { dropdownCount?: number }) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className={`p-4 rounded-xl border flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between transition-colors ${
        isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
      }`}
    >
      <PulseBox className="h-9 flex-1 min-w-[200px] rounded-lg" />
      <div className="flex items-center gap-2">
        {Array.from({ length: dropdownCount }).map((_, i) => (
          <PulseBox key={i} className="h-9 w-28 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

/**
 * User Management Tab Skeleton
 */
function SkeletonUsersTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="space-y-4 w-full animate-in fade-in-50 duration-200">
      <SkeletonTabBanner />
      <SkeletonSearchBar dropdownCount={2} />

      <div
        className={`rounded-2xl border overflow-hidden transition-colors ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        {/* Table Header */}
        <div
          className={`grid grid-cols-12 gap-3 p-3.5 border-b text-xs ${
            isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#303030] border-[#444444]"
          }`}
        >
          <PulseBox className="col-span-4 h-3.5 w-24 rounded-md" />
          <PulseBox className="col-span-3 h-3.5 w-28 rounded-md" />
          <PulseBox className="col-span-2 h-3.5 w-16 rounded-md" />
          <PulseBox className="col-span-2 h-3.5 w-20 rounded-md" />
          <PulseBox className="col-span-1 h-3.5 w-12 rounded-md ml-auto" />
        </div>

        {/* Table Rows */}
        <div className="divide-y divide-[#444444]/20">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`grid grid-cols-12 gap-3 items-center p-3.5 ${
                isLight ? "hover:bg-zinc-50/50" : "hover:bg-white/[0.02]"
              }`}
            >
              {/* User Avatar + Identity */}
              <div className="col-span-4 flex items-center gap-3">
                <PulseBox className="w-9 h-9 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <PulseBox className="h-3.5 w-3/4 rounded-md" />
                  <PulseBox className="h-2.5 w-1/2 rounded-md" />
                </div>
              </div>

              {/* Department & Facility */}
              <div className="col-span-3 space-y-1.5">
                <PulseBox className="h-3.5 w-28 rounded-md" />
                <PulseBox className="h-2.5 w-20 rounded-md" />
              </div>

              {/* Status */}
              <div className="col-span-2">
                <PulseBox className="h-5 w-16 rounded-full" />
              </div>

              {/* Roles Chips */}
              <div className="col-span-2 flex items-center gap-1.5">
                <PulseBox className="h-6 w-20 rounded-lg" />
                <PulseBox className="h-6 w-14 rounded-lg hidden sm:block" />
              </div>

              {/* Action Buttons */}
              <div className="col-span-1 flex justify-end gap-1.5">
                <PulseBox className="w-7 h-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Role Assignments Sub-tab Skeleton (4 KPI Cards + 3 Dropdowns + Table)
 */
function SkeletonRoleAssignmentsSubTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="space-y-4 w-full animate-in fade-in-50 duration-200">
      <SkeletonTabBanner hasActionBtn={true} />
      <SkeletonKpiRow count={4} />

      {/* Filter Bar with 3 dropdown slots */}
      <div
        className={`p-3.5 rounded-xl border flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between transition-colors ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        <PulseBox className="h-9 flex-1 min-w-[200px] rounded-lg" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          <PulseBox className="h-9 w-28 rounded-lg" />
          <PulseBox className="h-9 w-28 rounded-lg" />
          <PulseBox className="h-9 w-28 rounded-lg" />
        </div>
      </div>

      {/* Table Card */}
      <div
        className={`rounded-xl border overflow-hidden transition-colors ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        <div
          className={`grid grid-cols-12 gap-3 p-3.5 border-b text-xs ${
            isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#303030] border-[#444444]"
          }`}
        >
          <PulseBox className="col-span-4 h-3.5 w-28 rounded-md" />
          <PulseBox className="col-span-2 h-3.5 w-24 rounded-md" />
          <PulseBox className="col-span-2 h-3.5 w-16 rounded-md" />
          <PulseBox className="col-span-3 h-3.5 w-32 rounded-md" />
          <PulseBox className="col-span-1 h-3.5 w-12 rounded-md ml-auto" />
        </div>

        <div className="divide-y divide-[#444444]/20">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center p-3.5">
              <div className="col-span-4 flex items-center gap-3">
                <PulseBox className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <PulseBox className="h-3.5 w-3/4 rounded-md" />
                  <PulseBox className="h-2.5 w-1/2 rounded-md" />
                </div>
              </div>
              <div className="col-span-2 space-y-1">
                <PulseBox className="h-3.5 w-24 rounded-md" />
                <PulseBox className="h-2.5 w-16 rounded-md" />
              </div>
              <div className="col-span-2">
                <PulseBox className="h-5 w-16 rounded-full" />
              </div>
              <div className="col-span-3 flex items-center gap-1.5">
                <PulseBox className="h-6 w-24 rounded-lg" />
                <PulseBox className="h-6 w-16 rounded-lg" />
              </div>
              <div className="col-span-1 flex justify-end">
                <PulseBox className="h-7 w-16 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Canonical Roles Sub-tab Skeleton (Left List 9 items + Right Details Pane)
 */
function SkeletonRoleCanonicalSubTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="space-y-4 w-full animate-in fade-in-50 duration-200">
      <SkeletonTabBanner hasActionBtn={true} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left Column: 9 Role Cards */}
        <div className="space-y-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className={`p-3 rounded-xl border flex items-center justify-between gap-3 ${
                isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <PulseBox className="w-8 h-8 rounded-lg shrink-0" />
                <div className="space-y-1 min-w-0">
                  <PulseBox className="h-3.5 w-28 rounded-md" />
                  <PulseBox className="h-2.5 w-20 rounded-md" />
                </div>
              </div>
              <PulseBox className="h-5 w-12 rounded-full shrink-0" />
            </div>
          ))}
        </div>

        {/* Right Column: Role Details */}
        <div
          className={`lg:col-span-2 p-6 rounded-2xl border space-y-6 ${
            isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
          }`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-2">
              <PulseBox className="h-6 w-48 rounded-lg" />
              <PulseBox className="h-4 w-72 rounded-md" />
            </div>
            <PulseBox className="h-8 w-28 rounded-xl" />
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-white/10">
            <PulseBox className="h-4 w-32 rounded-md" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <PulseBox key={i} className="h-8 rounded-lg" />
              ))}
            </div>
          </div>

          <div className="space-y-2.5 pt-2 border-t border-slate-100 dark:border-white/10">
            <PulseBox className="h-4 w-40 rounded-md" />
            <div className="flex items-center gap-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <PulseBox key={i} className="w-8 h-8 rounded-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * RBAC Matrix Sub-tab Skeleton
 */
function SkeletonRoleMatrixSubTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="space-y-4 w-full animate-in fade-in-50 duration-200">
      <SkeletonTabBanner />
      <div
        className={`rounded-xl border overflow-hidden ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        <div className="p-4 border-b border-slate-100 dark:border-white/10">
          <PulseBox className="h-4 w-48 rounded-md" />
        </div>
        <div className="divide-y divide-[#444444]/20 p-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="grid grid-cols-8 gap-4 p-3 items-center">
              <PulseBox className="col-span-2 h-4 w-32 rounded-md" />
              {Array.from({ length: 6 }).map((_, j) => (
                <PulseBox key={j} className="h-5 w-5 rounded-md mx-auto" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Role History / Audit Sub-tab Skeleton
 */
function SkeletonRoleHistorySubTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="space-y-4 w-full animate-in fade-in-50 duration-200">
      <SkeletonTabBanner />
      <div
        className={`rounded-xl border overflow-hidden ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        <div
          className={`grid grid-cols-6 gap-3 p-3.5 border-b text-xs ${
            isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#303030] border-[#444444]"
          }`}
        >
          <PulseBox className="h-3.5 w-24 rounded-md" />
          <PulseBox className="h-3.5 w-16 rounded-md" />
          <PulseBox className="h-3.5 w-20 rounded-md" />
          <PulseBox className="h-3.5 w-20 rounded-md" />
          <PulseBox className="h-3.5 w-28 rounded-md" />
          <PulseBox className="h-3.5 w-24 rounded-md" />
        </div>
        <div className="divide-y divide-[#444444]/20">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-6 gap-3 items-center p-3.5">
              <PulseBox className="h-3.5 w-24 rounded-md" />
              <PulseBox className="h-5 w-16 rounded-full" />
              <PulseBox className="h-3.5 w-24 rounded-md" />
              <PulseBox className="h-5 w-20 rounded-lg" />
              <PulseBox className="h-3.5 w-32 rounded-md" />
              <PulseBox className="h-3.5 w-20 rounded-md" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Facility Scopes Tab Skeleton
 */
function SkeletonScopesTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="space-y-4 w-full animate-in fade-in-50 duration-200">
      <SkeletonTabBanner hasActionBtn={true} />
      <SkeletonSearchBar dropdownCount={2} />

      <div
        className={`rounded-2xl border overflow-hidden ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        <div
          className={`grid grid-cols-12 gap-3 p-3.5 border-b text-xs ${
            isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#303030] border-[#444444]"
          }`}
        >
          <PulseBox className="col-span-4 h-3.5 w-28 rounded-md" />
          <PulseBox className="col-span-3 h-3.5 w-32 rounded-md" />
          <PulseBox className="col-span-3 h-3.5 w-28 rounded-md" />
          <PulseBox className="col-span-2 h-3.5 w-16 rounded-md ml-auto" />
        </div>

        <div className="divide-y divide-[#444444]/20">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center p-3.5">
              <div className="col-span-4 flex items-center gap-3">
                <PulseBox className="w-8 h-8 rounded-full shrink-0" />
                <div className="space-y-1.5 flex-1 min-w-0">
                  <PulseBox className="h-3.5 w-36 rounded-md" />
                  <PulseBox className="h-2.5 w-24 rounded-md" />
                </div>
              </div>
              <div className="col-span-3">
                <PulseBox className="h-5 w-24 rounded-full" />
              </div>
              <div className="col-span-3 space-y-1">
                <PulseBox className="h-3.5 w-32 rounded-md" />
                <PulseBox className="h-2.5 w-20 rounded-md" />
              </div>
              <div className="col-span-2 flex justify-end gap-2">
                <PulseBox className="w-7 h-7 rounded-lg" />
                <PulseBox className="w-7 h-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Organization Tab Skeleton (Sub-nav pills + Grid of facility / branch cards)
 */
function SkeletonOrganizationTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="space-y-4 w-full animate-in fade-in-50 duration-200">
      <SkeletonTabBanner hasActionBtn={true} />

      {/* Sub-tab pills */}
      <div className="flex items-center gap-2">
        <PulseBox className="h-9 w-28 rounded-xl" />
        <PulseBox className="h-9 w-28 rounded-xl" />
        <PulseBox className="h-9 w-32 rounded-xl" />
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={`p-5 rounded-2xl border space-y-4 ${
              isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
            }`}
          >
            <div className="flex items-center justify-between">
              <PulseBox className="w-10 h-10 rounded-xl" />
              <PulseBox className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-1.5">
              <PulseBox className="h-4 w-36 rounded-md" />
              <PulseBox className="h-3 w-48 rounded-md" />
            </div>
            <div className="pt-2 border-t border-slate-100 dark:border-white/10 flex justify-between items-center">
              <PulseBox className="h-3 w-20 rounded-md" />
              <PulseBox className="h-7 w-16 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Product Master Catalog Tab Skeleton
 */
function SkeletonProductsTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="space-y-4 w-full animate-in fade-in-50 duration-200">
      <SkeletonTabBanner hasActionBtn={true} />

      {/* Sub-navigation Pills */}
      <div className="flex items-center gap-2">
        <PulseBox className="h-9 w-28 rounded-xl" />
        <PulseBox className="h-9 w-32 rounded-xl" />
        <PulseBox className="h-9 w-36 rounded-xl" />
        <PulseBox className="h-9 w-28 rounded-xl" />
      </div>

      <SkeletonSearchBar dropdownCount={2} />

      {/* Product Master Table */}
      <div
        className={`rounded-2xl border overflow-hidden ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        <div
          className={`grid grid-cols-12 gap-3 p-3.5 border-b text-xs ${
            isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#303030] border-[#444444]"
          }`}
        >
          <PulseBox className="col-span-2 h-3.5 w-16 rounded-md" />
          <PulseBox className="col-span-4 h-3.5 w-32 rounded-md" />
          <PulseBox className="col-span-2 h-3.5 w-20 rounded-md" />
          <PulseBox className="col-span-2 h-3.5 w-16 rounded-md" />
          <PulseBox className="col-span-2 h-3.5 w-16 rounded-md ml-auto" />
        </div>

        <div className="divide-y divide-[#444444]/20">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center p-3.5">
              <PulseBox className="col-span-2 h-4 w-20 rounded-md" />
              <div className="col-span-4 space-y-1">
                <PulseBox className="h-3.5 w-48 rounded-md" />
                <PulseBox className="h-2.5 w-28 rounded-md" />
              </div>
              <PulseBox className="col-span-2 h-5 w-20 rounded-full" />
              <PulseBox className="col-span-2 h-4 w-12 rounded-md" />
              <div className="col-span-2 flex justify-end gap-2">
                <PulseBox className="w-7 h-7 rounded-lg" />
                <PulseBox className="w-7 h-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Stock Monitoring Tab Skeleton (KPI row + Stock Table)
 */
function SkeletonStockTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="space-y-4 w-full animate-in fade-in-50 duration-200">
      <SkeletonTabBanner hasActionBtn={false} />
      <SkeletonKpiRow count={4} />
      <SkeletonSearchBar dropdownCount={2} />

      <div
        className={`rounded-2xl border overflow-hidden ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        <div
          className={`grid grid-cols-12 gap-3 p-3.5 border-b text-xs ${
            isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#303030] border-[#444444]"
          }`}
        >
          <PulseBox className="col-span-3 h-3.5 w-24 rounded-md" />
          <PulseBox className="col-span-3 h-3.5 w-28 rounded-md" />
          <PulseBox className="col-span-2 h-3.5 w-16 rounded-md text-right" />
          <PulseBox className="col-span-2 h-3.5 w-16 rounded-md text-right" />
          <PulseBox className="col-span-2 h-3.5 w-16 rounded-md text-right" />
        </div>

        <div className="divide-y divide-[#444444]/20">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center p-3.5">
              <div className="col-span-3 space-y-1">
                <PulseBox className="h-3.5 w-28 rounded-md" />
                <PulseBox className="h-2.5 w-16 rounded-md" />
              </div>
              <PulseBox className="col-span-3 h-3.5 w-36 rounded-md" />
              <PulseBox className="col-span-2 h-4 w-16 rounded-md ml-auto" />
              <PulseBox className="col-span-2 h-4 w-14 rounded-md ml-auto" />
              <PulseBox className="col-span-2 h-4 w-16 rounded-md ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Safety Stock Tab Skeleton
 */
function SkeletonSafetyStockTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="space-y-4 w-full animate-in fade-in-50 duration-200">
      <SkeletonTabBanner hasActionBtn={true} />
      <SkeletonKpiRow count={4} />
      <SkeletonSearchBar dropdownCount={1} />

      <div
        className={`rounded-2xl border overflow-hidden ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        <div
          className={`grid grid-cols-12 gap-3 p-3.5 border-b text-xs ${
            isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#303030] border-[#444444]"
          }`}
        >
          <PulseBox className="col-span-4 h-3.5 w-28 rounded-md" />
          <PulseBox className="col-span-3 h-3.5 w-24 rounded-md" />
          <PulseBox className="col-span-3 h-3.5 w-28 rounded-md" />
          <PulseBox className="col-span-2 h-3.5 w-16 rounded-md ml-auto" />
        </div>

        <div className="divide-y divide-[#444444]/20">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center p-3.5">
              <div className="col-span-4 space-y-1">
                <PulseBox className="h-3.5 w-40 rounded-md" />
                <PulseBox className="h-2.5 w-24 rounded-md" />
              </div>
              <PulseBox className="col-span-3 h-5 w-24 rounded-full" />
              <PulseBox className="col-span-3 h-4 w-28 rounded-md" />
              <div className="col-span-2 flex justify-end gap-2">
                <PulseBox className="w-7 h-7 rounded-lg" />
                <PulseBox className="w-7 h-7 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Audit Logs Tab Skeleton
 */
function SkeletonAuditLogsTab() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="space-y-4 w-full animate-in fade-in-50 duration-200">
      <SkeletonTabBanner hasActionBtn={true} />

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <PulseBox key={i} className="h-8 w-24 rounded-xl shrink-0" />
        ))}
      </div>

      <SkeletonSearchBar dropdownCount={1} />

      <div
        className={`rounded-2xl border overflow-hidden ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        <div
          className={`grid grid-cols-12 gap-3 p-3.5 border-b text-xs ${
            isLight ? "bg-zinc-50 border-zinc-200" : "bg-[#303030] border-[#444444]"
          }`}
        >
          <PulseBox className="col-span-3 h-3.5 w-28 rounded-md" />
          <PulseBox className="col-span-2 h-3.5 w-20 rounded-md" />
          <PulseBox className="col-span-3 h-3.5 w-32 rounded-md" />
          <PulseBox className="col-span-2 h-3.5 w-24 rounded-md" />
          <PulseBox className="col-span-2 h-3.5 w-16 rounded-md ml-auto" />
        </div>

        <div className="divide-y divide-[#444444]/20">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-12 gap-3 items-center p-3.5">
              <PulseBox className="col-span-3 h-3.5 w-36 rounded-md" />
              <PulseBox className="col-span-2 h-5 w-20 rounded-full" />
              <PulseBox className="col-span-3 h-3.5 w-40 rounded-md" />
              <PulseBox className="col-span-2 h-3.5 w-28 rounded-md" />
              <PulseBox className="col-span-2 h-7 w-16 rounded-lg ml-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Universal Tab-aware Control Panel Skeleton Component.
 * Dispatches to the corresponding skeleton layout based on active tab and subtab.
 */
export default function SkeletonControlPanelTab({
  activeTab,
  activeRoleSubTab = "assignments",
}: {
  activeTab: AdminTabKey;
  activeRoleSubTab?: RoleSubTabKey;
  activeProductSubTab?: ProductSubTabKey;
}) {
  switch (activeTab) {
    case "users":
      return <SkeletonUsersTab />;

    case "roles":
      if (activeRoleSubTab === "roles") {
        return <SkeletonRoleCanonicalSubTab />;
      }
      if (activeRoleSubTab === "matrix") {
        return <SkeletonRoleMatrixSubTab />;
      }
      if (activeRoleSubTab === "history") {
        return <SkeletonRoleHistorySubTab />;
      }
      return <SkeletonRoleAssignmentsSubTab />;

    case "scopes":
      return <SkeletonScopesTab />;

    case "organization":
      return <SkeletonOrganizationTab />;

    case "workspace":
      return <SkeletonOrganizationTab />;

    case "products":
      return <SkeletonProductsTab />;

    case "stock":
      return <SkeletonStockTab />;

    case "safety_stock":
      return <SkeletonSafetyStockTab />;

    case "audit_logs":
      return <SkeletonAuditLogsTab />;

    default:
      return <SkeletonUsersTab />;
  }
}
