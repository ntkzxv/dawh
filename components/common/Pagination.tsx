"use client";

import React, { useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import CustomDropdown from "./CustomDropdown";

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  isThai?: boolean;
  className?: string;
  showPageSizeSelector?: boolean;
  showTotalItems?: boolean;
  siblingCount?: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 50, 100],
  isThai = true,
  className = "",
  showPageSizeSelector = true,
  showTotalItems = true,
  siblingCount = 1,
}: PaginationProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Calculate range of items being shown
  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalItems);

  // Generate page numbers with ellipsis
  const paginationRange = useMemo(() => {
    const totalPageNumbers = siblingCount * 2 + 5; // siblingCount + first + last + current + 2*dots

    if (totalPageNumbers >= totalPages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const leftSiblingIndex = Math.max(currentPage - siblingCount, 1);
    const rightSiblingIndex = Math.min(currentPage + siblingCount, totalPages);

    const shouldShowLeftDots = leftSiblingIndex > 2;
    const shouldShowRightDots = rightSiblingIndex < totalPages - 2;

    const firstPageIndex = 1;
    const lastPageIndex = totalPages;

    if (!shouldShowLeftDots && shouldShowRightDots) {
      const leftItemCount = 3 + 2 * siblingCount;
      const leftRange = Array.from({ length: leftItemCount }, (_, i) => i + 1);
      return [...leftRange, "...", totalPages];
    }

    if (shouldShowLeftDots && !shouldShowRightDots) {
      const rightItemCount = 3 + 2 * siblingCount;
      const rightRange = Array.from(
        { length: rightItemCount },
        (_, i) => totalPages - rightItemCount + i + 1
      );
      return [firstPageIndex, "...", ...rightRange];
    }

    if (shouldShowLeftDots && shouldShowRightDots) {
      const middleRange = Array.from(
        { length: rightSiblingIndex - leftSiblingIndex + 1 },
        (_, i) => leftSiblingIndex + i
      );
      return [firstPageIndex, "...", ...middleRange, "...", lastPageIndex];
    }

    return [];
  }, [totalPages, siblingCount, currentPage]);

  const pageSizeDropdownOptions = useMemo(() => {
    return pageSizeOptions.map((size) => ({
      value: String(size),
      label: isThai ? `${size} รายการ / หน้า` : `${size} / page`,
    }));
  }, [pageSizeOptions, isThai]);

  if (totalPages <= 0 && totalItems === 0) {
    return null;
  }

  return (
    <div
      className={`flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t text-xs transition-colors select-none ${
        isLight
          ? "border-[#E4E4E7] bg-white text-zinc-700"
          : "border-[#444444] bg-[#2C2C2C] text-zinc-300"
      } ${className}`}
    >
      {/* Left: Total Items Summary & Page Size Selector */}
      <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
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

        {showPageSizeSelector && onPageSizeChange && (
          <div className="flex items-center gap-1.5 min-w-[130px]">
            <CustomDropdown<string>
              value={String(pageSize)}
              onChange={(val: string) => {
                const newSize = Number(val);
                if (newSize > 0) {
                  onPageSizeChange(newSize);
                }
              }}
              options={pageSizeDropdownOptions}
              className="text-xs"
            />
          </div>
        )}
      </div>

      {/* Right: Page Navigation Buttons */}
      <div className="flex items-center gap-1">
        {/* First Page */}
        <button
          type="button"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1}
          title={isThai ? "หน้าแรก" : "First Page"}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
            isLight
              ? "border-zinc-200 hover:bg-zinc-100 text-zinc-700 disabled:hover:bg-transparent"
              : "border-[#444444] hover:bg-[#383838] text-zinc-300 disabled:hover:bg-transparent"
          }`}
        >
          <ChevronsLeft size={14} />
        </button>

        {/* Previous Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          title={isThai ? "ก่อนหน้า" : "Previous Page"}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
            isLight
              ? "border-zinc-200 hover:bg-zinc-100 text-zinc-700 disabled:hover:bg-transparent"
              : "border-[#444444] hover:bg-[#383838] text-zinc-300 disabled:hover:bg-transparent"
          }`}
        >
          <ChevronLeft size={14} />
        </button>

        {/* Numbered Page Buttons */}
        <div className="flex items-center gap-1">
          {paginationRange.map((pageNumber, idx) => {
            if (pageNumber === "...") {
              return (
                <span
                  key={`ellipsis-${idx}`}
                  className="px-2 py-1 text-xs opacity-50 select-none"
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
                className={`min-w-[30px] h-[30px] px-2 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center justify-center ${
                  isActive
                    ? isLight
                      ? "bg-zinc-900 text-white shadow-sm border border-zinc-900 font-bold"
                      : "bg-white text-zinc-900 shadow-sm border border-white font-bold"
                    : isLight
                    ? "border border-zinc-200 text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                    : "border border-[#444444] text-zinc-300 hover:bg-[#383838] hover:text-white"
                }`}
              >
                {page}
              </button>
            );
          })}
        </div>

        {/* Next Page */}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          title={isThai ? "ถัดไป" : "Next Page"}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
            isLight
              ? "border-zinc-200 hover:bg-zinc-100 text-zinc-700 disabled:hover:bg-transparent"
              : "border-[#444444] hover:bg-[#383838] text-zinc-300 disabled:hover:bg-transparent"
          }`}
        >
          <ChevronRight size={14} />
        </button>

        {/* Last Page */}
        <button
          type="button"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages}
          title={isThai ? "หน้าสุดท้าย" : "Last Page"}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer disabled:cursor-not-allowed disabled:opacity-30 ${
            isLight
              ? "border-zinc-200 hover:bg-zinc-100 text-zinc-700 disabled:hover:bg-transparent"
              : "border-[#444444] hover:bg-[#383838] text-zinc-300 disabled:hover:bg-transparent"
          }`}
        >
          <ChevronsRight size={14} />
        </button>
      </div>
    </div>
  );
}
