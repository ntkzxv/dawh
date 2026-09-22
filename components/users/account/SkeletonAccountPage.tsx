"use client";

import React from "react";
import { useTheme } from "@/context/ThemeContext";

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

function PulseBox({ className = "", style }: SkeletonProps) {
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

export function SkeletonAccountPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div className="w-full flex flex-col items-start gap-6 animate-in fade-in-50 duration-200">
      {/* 1. TOP TABS SKELETON */}
      <div
        className={`w-full h-[42px] border-b flex items-center gap-4 pb-2 ${
          isLight ? "border-[#E4E4E7]" : "border-[#444444]"
        }`}
      >
        <PulseBox className="h-5 w-36 rounded-lg" />
        <PulseBox className="h-5 w-48 rounded-lg" />
        <PulseBox className="h-5 w-40 rounded-lg" />
      </div>

      {/* 2. SIDEBAR + MAIN CONTENT LAYOUT */}
      <div className="w-full flex flex-col lg:flex-row items-start gap-6">
        {/* LEFT COLUMN: ProfileSidebar Skeleton */}
        <div className="w-full lg:w-[360px] flex flex-col gap-4 shrink-0">
          <div
            className={`w-full p-8 flex flex-col items-center gap-6 rounded-[12px] border transition-colors ${
              isLight
                ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-sm"
                : "bg-[#383838] border-[#444444] shadow-lg"
            }`}
          >
            {/* Avatar Circle */}
            <PulseBox className="w-[110px] h-[110px] !rounded-full shrink-0" />

            {/* Name, Username & Badges */}
            <div className="w-full flex flex-col items-center gap-2">
              <PulseBox className="h-6 w-44 rounded-lg" />
              <PulseBox className="h-3.5 w-28 rounded-md" />
              <PulseBox className="h-6 w-36 rounded-[8px] mt-1" />
              <PulseBox className="h-3.5 w-32 rounded-md mt-0.5" />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: ProfileTab Details Skeleton */}
        <div
          className={`flex-1 w-full p-6 sm:p-8 flex flex-col items-start gap-6 rounded-[12px] border transition-colors ${
            isLight
              ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-sm"
              : "bg-[#383838] border-[#444444] shadow-lg"
          }`}
        >
          {/* Header Row */}
          <div className="w-full flex items-center justify-between border-b pb-3 border-[#444444]/40">
            <PulseBox className="h-5 w-64 rounded-lg" />
            <PulseBox className="h-7 w-20 rounded-full" />
          </div>

          {/* 2-Column Field Grid */}
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex flex-col items-start gap-1.5 w-full">
                <PulseBox className="h-3.5 w-24 rounded-md" />
                <div
                  className={`w-full h-[38px] rounded-[8px] border transition-colors flex items-center px-3 ${
                    isLight
                      ? "bg-[#F5F5F5] border-[#E5E5E5]"
                      : "bg-[#282828] border-[#444444]"
                  }`}
                >
                  <PulseBox className="h-3 w-1/2 rounded-md" />
                </div>
              </div>
            ))}
          </div>

          {/* Address Section */}
          <div className="w-full space-y-3 pt-2">
            <PulseBox className="h-4 w-40 rounded-md" />
            <PulseBox className="h-12 w-full rounded-xl" />
          </div>

          <div className="w-full space-y-3">
            <PulseBox className="h-4 w-44 rounded-md" />
            <PulseBox className="h-12 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default SkeletonAccountPage;
