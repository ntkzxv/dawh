"use client";

import React, { useMemo, useState, useEffect, useRef, useId } from "react";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type CommonPaginationProps = {
  isThai?: boolean;
  className?: string;
};

type OffsetPaginationProps = CommonPaginationProps & {
  mode?: "offset";
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
  showTotalItems?: boolean;
  id?: string;
};

type CursorPaginationProps = CommonPaginationProps & {
  mode: "cursor";
  pageIndex: number;
  itemCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
  onPrevious: () => void;
  onNext: () => void;
  isLoading?: boolean;
};

export type PaginationProps = OffsetPaginationProps | CursorPaginationProps;

export default function Pagination(props: PaginationProps) {
  return props.mode === "cursor" ? (
    <CursorPagination {...props} />
  ) : (
    <OffsetPagination {...props} />
  );
}

function CursorPagination({
  pageIndex,
  itemCount,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
  isLoading = false,
  isThai = true,
  className = "",
}: CursorPaginationProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  if (itemCount === 0 && !hasPrevious) return null;

  const buttonClass = isLight
    ? "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
    : "text-zinc-400 hover:text-white hover:bg-white/10";

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-4 py-3 select-none text-xs ${className}`}
    >
      <div className="text-xs opacity-70">
        {isThai ? (
          <>
            หน้า <span className="font-semibold text-zinc-900 dark:text-white">{pageIndex}</span>
            {" · "}
            <span className="font-semibold text-zinc-900 dark:text-white">{itemCount}</span> รายการ
          </>
        ) : (
          <>
            Page <span className="font-semibold text-zinc-900 dark:text-white">{pageIndex}</span>
            {" · "}
            <span className="font-semibold text-zinc-900 dark:text-white">{itemCount}</span> items
          </>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        <button
          type="button"
          onClick={onPrevious}
          disabled={!hasPrevious || isLoading}
          title={isThai ? "ก่อนหน้า" : "Previous Page"}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-25 ${buttonClass}`}
        >
          <ChevronLeft size={16} />
          <span>{isThai ? "ก่อนหน้า" : "Previous"}</span>
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!hasNext || isLoading}
          title={isThai ? "ถัดไป" : "Next Page"}
          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-25 ${buttonClass}`}
        >
          <span>{isThai ? "ถัดไป" : "Next"}</span>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

function OffsetPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize = 10,
  onPageChange,
  isThai = true,
  className = "",
  showTotalItems = true,
  id,
}: OffsetPaginationProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const reactId = useId();
  const paginationId = id || reactId;

  // Track page change direction (-1 for prev/back, 1 for next/forward)
  const prevPageRef = useRef(currentPage);
  const [direction, setDirection] = useState<number>(0);

  useEffect(() => {
    if (currentPage !== prevPageRef.current) {
      setDirection(currentPage > prevPageRef.current ? 1 : -1);
      prevPageRef.current = currentPage;
    }
  }, [currentPage]);

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
      {/* Left: Total Items Summary with subtle smooth slide */}
      <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
        {showTotalItems && (
          <div className="text-xs opacity-70 flex items-center gap-1">
            {isThai ? (
              <>
                <span>แสดง</span>
                <span className="relative inline-flex overflow-hidden h-[18px] items-center">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={`thai-range-${currentPage}`}
                      initial={{ y: direction >= 0 ? 10 : -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: direction >= 0 ? -10 : 10, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="font-semibold text-zinc-900 dark:text-white"
                    >
                      {startItem}-{endItem}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span>จากทั้งหมด</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {totalItems.toLocaleString()}
                </span>
                <span>รายการ</span>
              </>
            ) : (
              <>
                <span>Showing</span>
                <span className="relative inline-flex overflow-hidden h-[18px] items-center">
                  <AnimatePresence mode="popLayout" initial={false}>
                    <motion.span
                      key={`en-range-${currentPage}`}
                      initial={{ y: direction >= 0 ? 10 : -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: direction >= 0 ? -10 : 10, opacity: 0 }}
                      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                      className="font-semibold text-zinc-900 dark:text-white"
                    >
                      {startItem}-{endItem}
                    </motion.span>
                  </AnimatePresence>
                </span>
                <span>of</span>
                <span className="font-semibold text-zinc-900 dark:text-white">
                  {totalItems.toLocaleString()}
                </span>
                <span>items</span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Right: Clean Minimal Page Navigation with Sliding Pill & Number Animation */}
      <div className="flex items-center gap-1.5">
        {/* Previous Page Arrow */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title={isThai ? "ก่อนหน้า" : "Previous Page"}
          className={`p-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-25 ${
            isLight
              ? "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
              : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <ChevronLeft size={18} />
        </motion.button>

        {/* Numbered Page Buttons & Dots with Sliding Active Pill */}
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
              <motion.button
                key={page}
                layout
                type="button"
                whileTap={{ scale: 0.92 }}
                onClick={() => onPageChange(page)}
                transition={{
                  layout: { duration: 0.25, ease: [0.16, 1, 0.3, 1] },
                }}
                className={`relative min-w-[32px] h-[32px] px-2 rounded-lg text-xs font-medium cursor-pointer flex items-center justify-center transition-colors ${
                  isActive
                    ? "text-white font-bold"
                    : isLight
                    ? "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
                    : "text-zinc-400 hover:text-white hover:bg-white/10"
                }`}
              >
                {/* Sliding active indicator pill using Framer Motion layoutId */}
                {isActive && (
                  <motion.div
                    layoutId={`pagination-active-pill-${paginationId}`}
                    className="absolute inset-0 bg-[#6366F1] rounded-lg shadow-sm"
                    transition={{
                      type: "spring",
                      stiffness: 380,
                      damping: 30,
                    }}
                  />
                )}

                {/* Number text with directional slide effect */}
                <motion.span
                  key={`num-${page}-${isActive}`}
                  initial={
                    isActive && direction !== 0
                      ? { x: direction > 0 ? 8 : -8, opacity: 0.5 }
                      : false
                  }
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="relative z-10 font-mono"
                >
                  {page}
                </motion.span>
              </motion.button>
            );
          })}
        </div>

        {/* Next Page Arrow */}
        <motion.button
          type="button"
          whileTap={{ scale: 0.88 }}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title={isThai ? "ถัดไป" : "Next Page"}
          className={`p-2 rounded-lg transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-25 ${
            isLight
              ? "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100"
              : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
        >
          <ChevronRight size={18} />
        </motion.button>
      </div>
    </div>
  );
}
