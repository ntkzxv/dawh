"use client";

import React, { ReactNode } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Package } from "lucide-react";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";

export const DATA_TABLE_STYLES = {
  table: "w-full border-separate border-spacing-0 border-0 bg-transparent text-left text-[13px]",
  headerRow: "h-[36px] text-xs font-semibold select-none",
  headerCell: "py-2 px-3",
  body: "divide-y",
  bodyRow: "transition-colors select-none",
  bodyCell: "py-3 px-3",
} as const;

export const DATA_TABLE_FRAME_STYLES = {
  base: "overflow-hidden rounded-xl border",
  light: "border-[#D4D4D8] bg-white",
  dark: "border-[#555555] bg-[#383838]",
} as const;

export const dataTableFrameClassName = (isLight: boolean) =>
  `${DATA_TABLE_FRAME_STYLES.base} ${isLight ? DATA_TABLE_FRAME_STYLES.light : DATA_TABLE_FRAME_STYLES.dark}`;

export const dataTableStripedRowClassName = (isLight: boolean) =>
  isLight
    ? "odd:bg-white even:bg-[#F7F7F7] hover:!bg-[#EEEEEE]"
    : "odd:bg-[#383838] even:bg-[#414141] hover:!bg-[#4A4A4A]";

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
    <div className={`w-full overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <table
          className={`${DATA_TABLE_STYLES.table} ${tableClassName}`}
          style={{ minWidth }}
        >
          <thead>
            <tr
              className={`${DATA_TABLE_STYLES.headerRow} ${
                isLight
                  ? "bg-[#F4F4F5] text-[#666666]"
                  : "bg-[#2C2C2C] text-[#A1A1AA]"
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
                    className={`${DATA_TABLE_STYLES.headerCell} ${alignClass} first:rounded-l-[6px] last:rounded-r-[6px] ${col.headerClassName || ""}`}
                 >
                    {isLoading ? <SkeletonBox className="h-3 w-2/3" /> : col.header}
                 </th>
                );
              })}
            </tr>
          </thead>
          <tbody
            className={`${DATA_TABLE_STYLES.body} ${
              isLight ? "divide-[#E4E4E7]" : "divide-[#444444]"
            }`}
          >
            {isLoading ? (
              Array.from({ length: skeletonRowCount }).map((_, rIdx) => (
                <tr key={`skeleton-${rIdx}`} className="h-[56px]">
                  {columns.map((col, cIdx) => {
                    const alignClass =
                      col.align === "right"
                        ? "justify-end"
                        : col.align === "center"
                        ? "justify-center"
                        : "justify-start";

                    return (
                      <td key={`skeleton-cell-${rIdx}-${col.key || cIdx}`} className="px-3 py-3">
                        <div className={`flex items-center ${alignClass}`}>
                          <SkeletonBox
                            className={`${
                              cIdx === 0
                                ? "h-3.5 w-3/4 max-w-[200px]"
                                : col.key.toLowerCase().includes("action") || col.key.toLowerCase().includes("edit")
                                  ? "size-8 rounded-[6px]"
                                  : col.key.toLowerCase().includes("status")
                                    ? "h-5 w-14 rounded-full"
                                    : col.align === "center"
                                      ? "h-3.5 w-14"
                                      : col.align === "right"
                                        ? "h-3.5 w-12"
                                        : "h-3.5 w-20"
                            }`}
                          />
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
                    className={`${DATA_TABLE_STYLES.bodyRow} ${
                      isClickable ? "cursor-pointer" : ""
                    } ${
                      isSelected
                        ? isLight
                          ? "bg-slate-100/90"
                          : "bg-white/[0.08]"
                        : dataTableStripedRowClassName(isLight)
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
                          className={`${DATA_TABLE_STYLES.bodyCell} ${alignClass} ${col.className || ""}`}
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
