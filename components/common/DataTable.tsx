"use client";

import React, { ReactNode } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Package } from "lucide-react";

export interface DataTableColumn<T> {
  key: string;
  header: ReactNode;
  headerClassName?: string;
  className?: string;
  align?: "left" | "center" | "right";
  render?: (item: T, index: number) => ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  keyExtractor: (item: T, index: number) => string | number;
  isLoading?: boolean;
  skeletonRowCount?: number;
  selectedKey?: string | number | null;
  onRowClick?: (item: T, index: number) => void;
  emptyIcon?: ReactNode;
  emptyTitle?: ReactNode;
  emptyAction?: ReactNode;
  minWidth?: string | number;
  className?: string;
  tableClassName?: string;
}

export default function DataTable<T>({
  columns,
  data,
  keyExtractor,
  isLoading = false,
  skeletonRowCount = 6,
  selectedKey,
  onRowClick,
  emptyIcon,
  emptyTitle = "ไม่พบข้อมูล",
  emptyAction,
  minWidth = "940px",
  className = "",
  tableClassName = "",
}: DataTableProps<T>) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className={`w-full rounded-[12px] border overflow-hidden ${
        isLight
          ? "bg-white border-[#E4E4E7] shadow-xs"
          : "bg-[#383838] border-[#444444]"
      } ${className}`}
    >
      <div className="overflow-x-auto">
        <table
          className={`w-full text-left text-[13px] border-collapse ${tableClassName}`}
          style={{ minWidth }}
        >
          <thead>
            <tr
              className={`h-[42px] border-b text-[12px] font-semibold text-white select-none ${
                isLight
                  ? "bg-slate-900 border-slate-800"
                  : "bg-[#282828] border-[#444444]"
              }`}
            >
              {columns.map((col) => {
                const alignClass =
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left";

                return (
                  <th
                    key={col.key}
                    className={`py-2.5 px-4 ${alignClass} ${col.headerClassName || ""}`}
                  >
                    {col.header}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody
            className={`divide-y ${
              isLight ? "divide-slate-200" : "divide-white/5"
            }`}
          >
            {isLoading ? (
              Array.from({ length: skeletonRowCount }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="animate-pulse">
                  {columns.map((col, cIdx) => {
                    const alignClass =
                      col.align === "right"
                        ? "justify-end"
                        : col.align === "center"
                        ? "justify-center"
                        : "justify-start";

                    return (
                      <td key={`skeleton-cell-${rIdx}-${col.key || cIdx}`} className="py-4 px-4">
                        <div className={`flex items-center ${alignClass}`}>
                          {cIdx === 0 ? (
                            <div className="flex flex-col gap-2 w-full max-w-[200px]">
                              <div className="h-3.5 w-24 bg-zinc-300 dark:bg-zinc-700 rounded" />
                              <div className="h-4 w-44 bg-zinc-200 dark:bg-zinc-800 rounded" />
                            </div>
                          ) : (
                            <div
                              className={`h-3.5 bg-zinc-200 dark:bg-zinc-800 rounded ${
                                col.align === "right"
                                  ? "w-14"
                                  : col.align === "center"
                                  ? "w-4 h-4"
                                  : "w-20"
                              }`}
                            />
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    {emptyIcon || (
                      <Package size={36} className="text-zinc-400 opacity-60" />
                    )}
                    <span
                      className={`text-[14px] font-medium ${
                        isLight ? "text-slate-600" : "text-zinc-300"
                      }`}
                    >
                      {emptyTitle}
                    </span>
                    {emptyAction && <div className="mt-1">{emptyAction}</div>}
                  </div>
                </td>
              </tr>
            ) : (
              data.map((item, idx) => {
                const key = keyExtractor(item, idx);
                const isSelected = selectedKey !== undefined && selectedKey !== null && selectedKey === key;
                const isClickable = Boolean(onRowClick);

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick && onRowClick(item, idx)}
                    className={`transition-colors select-none ${
                      isClickable ? "cursor-pointer" : ""
                    } ${
                      isSelected
                        ? isLight
                          ? "bg-slate-100/90"
                          : "bg-white/[0.08]"
                        : isLight
                        ? "hover:bg-slate-50"
                        : "hover:bg-white/[0.03]"
                    }`}
                  >
                    {columns.map((col) => {
                      const alignClass =
                        col.align === "right"
                          ? "text-right"
                          : col.align === "center"
                          ? "text-center"
                          : "text-left";

                      return (
                        <td
                          key={`cell-${key}-${col.key}`}
                          className={`py-3.5 px-4 ${alignClass} ${col.className || ""}`}
                        >
                          {col.render
                            ? col.render(item, idx)
                            : (item as Record<string, unknown>)[col.key] !== undefined
                            ? String((item as Record<string, unknown>)[col.key])
                            : null}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
