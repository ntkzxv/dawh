"use client";

import React, { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  isThai?: boolean;
  className?: string;
  showTotalItems?: boolean;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  isThai = true,
  className = "",
  showTotalItems = true,
}: PaginationProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Fixed 10 items per page by default
  const effectivePageSize = pageSize || 10;

  // Calculate range of items being shown
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * effectivePageSize + 1;
  const endItem = Math.min(currentPage * effectivePageSize, totalItems);

  /**
   * Generates page buttons with dots:
   * When totalPages <= 7: shows all pages [1, 2, 3, 4, 5, 6, 7]
   * When currentPage near start: [1, 2, 3, 4, 5, "...", totalPages]
   * When currentPage near end: [1, "...", totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages]
   * When currentPage in middle: [1, "...", currentPage-1, currentPage, currentPage+1, "...", totalPages]
   */
  const paginationRange = useMemo<(number | string)[]>(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    // Near start: 1, 2, 3, 4, 5, "...", totalPages
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, "...", totalPages];
    }

    // Near end: 1, "...", totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages
    if (currentPage >= totalPages - 3) {
      return [
        1,
        "...",
        totalPages - 4,
        totalPages - 3,
        totalPages - 2,
        totalPages - 1,
        totalPages,
      ];
    }

    // Middle: 1, "...", currentPage-1, currentPage, currentPage+1, "...", totalPages
    return [
      1,
      "...",
      currentPage - 1,
      currentPage,
      currentPage + 1,
      "...",
      totalPages,
    ];
  }, [totalPages, currentPage]);

  if (totalPages <= 0 && totalItems === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 select-none text-xs ${className}`}
    >
      {/* Left: Total Items Summary */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        {showTotalItems && (
          <div className="text-xs opacity-70">
            {isThai ? (
              <>
                แสดง <span className="font-semibold text-zinc-900 dark:text-white">{startItem}-{endItem}</span> จากทั้งหมด{" "}
                <span className="font-semibold text-zinc-900 dark:text-white">{totalItems.toLocaleString()}</span> รายการ
              </>
            ) : (
              <>
                Showing <span className="font-semibold text-zinc-900 dark:text-white">{startItem}-{endItem}</span> of{" "}
                <span className="font-semibold text-zinc-900 dark:text-white">{totalItems.toLocaleString()}</span> items
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: Clean Minimal Page Navigation */}
      <div className="flex items-center gap-1.5">
        {/* Previous Page Arrow */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title={isThai ? "ก่อนหน้า" : "Previous Page"}
          className={`p-2 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-25 ${
            isLight
              ? "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
              : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <ChevronLeft size={18} />
        </button>

        {/* Numbered Page Buttons & Dots */}
        <div className="flex items-center gap-1">
          {paginationRange.map((pageNumber, idx) => {
            if (pageNumber === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-sm font-medium opacity-40 select-none"
                >
                  &#8230;
                </span>
              );
            }

            const page = Number(pageNumber);
            const isActive = page === currentPage;

            return (
              <button
                key={page}
                type="button"
                onClick={() => onPageChange(page)}
                className={`min-w-[32px] h-[32px] px-2 rounded-lg text-xs font-medium transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? "bg-[#6366F1] text-white font-bold shadow-sm"
                    : isLight
                    ? "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                    : "text-zinc-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Page Arrow */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title={isThai ? "ถัดไป" : "Next Page"}
          className={`p-2 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-25 ${
            isLight
              ? "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
              : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
