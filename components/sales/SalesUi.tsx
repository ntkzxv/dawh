"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Button } from "@/components/common/Button";
import {
  DATA_TABLE_STYLES,
  dataTableFrameClassName,
  dataTableRowBorderClassName,
} from "@/components/common/DataTable";
import { sidePanelFormStyles } from "@/components/common/SidePanel";
import { Field } from "@/components/warehouse/Ui";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";

// Thin layer over the warehouse building blocks: same tokens, no sales-only palette.

export const useFormStyles = () => sidePanelFormStyles(useTheme().theme === "light");

/** Filter bar above a table: search/filters left, primary action right. */
export function Toolbar({ children, actions }: { children?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">{children}</div>
      {actions}
    </div>
  );
}

/** Same card surface as warehouse overview cards. */
export function Card({
  title,
  actions,
  children,
  className = "",
}: {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const isLight = useTheme().theme === "light";
  return (
    <section className={`space-y-4 p-5 sm:p-6 ${dataTableFrameClassName(isLight)} ${className}`}>
      {(title || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="text-base font-bold">{title}</h2>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

/** Bordered table frame plus the cursor "load more" button outside it. */
export function TableFrame({ children }: { children: ReactNode }) {
  const isLight = useTheme().theme === "light";
  return <section className={`w-full ${dataTableFrameClassName(isLight)}`}>{children}</section>;
}

export function LoadMore({ show, loading, onClick }: { show: boolean | undefined; loading: boolean; onClick: () => void }) {
  const isThai = useAppLanguage() === "TH";
  if (!show) return null;
  return (
    <div className="flex justify-center">
      <Button variant="outline" loading={loading} onClick={onClick}>{isThai ? "โหลดเพิ่ม" : "Load more"}</Button>
    </div>
  );
}

export function LinkButton({ href, icon, children }: { href: string; icon?: ReactNode; children: ReactNode }) {
  const isLight = useTheme().theme === "light";
  return (
    <Link
      href={href}
      className={`inline-flex h-[33px] shrink-0 items-center justify-center gap-1.5 rounded-[6px] px-4 text-[13px] font-semibold transition-colors ${
        isLight ? "bg-[#222222] text-white hover:bg-black" : "bg-white text-[#222222] hover:bg-[#F1F5F9]"
      }`}
    >
      {icon}
      {children}
    </Link>
  );
}

/** Form field using the warehouse side-panel label/input scale. */
export function SalesField({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  const f = useFormStyles();
  return (
    <Field label={label} className={`${f.field} ${className}`} labelClassName={f.label}>
      {children}
    </Field>
  );
}

/** Label/value row used in detail panels and profile cards. */
export function DetailRow({ label, value }: { label: ReactNode; value: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 text-[13px]">
      <span className="shrink-0 text-[var(--text-muted)]">{label}</span>
      <span className="text-right font-medium">{value}</span>
    </div>
  );
}

/** Inset block inside a side panel (warehouse "stock by branch" style). */
export function PanelSection({ title, children }: { title?: ReactNode; children: ReactNode }) {
  const isLight = useTheme().theme === "light";
  return (
    <section className={`space-y-3 rounded-lg border p-4 ${isLight ? "border-[#E4E4E7] bg-[#F8FAFC]" : "border-[#444444] bg-[#222222]"}`}>
      {title && <h4 className="text-sm font-bold">{title}</h4>}
      {children}
    </section>
  );
}

export type MiniColumn<T> = { key: string; header: ReactNode; align?: "right"; className?: string; render: (row: T) => ReactNode };

/** Compact static table for nested data (no placeholder padding rows, unlike DataTable). */
export function MiniTable<T>({ columns, rows, rowKey }: { columns: MiniColumn<T>[]; rows: T[]; rowKey: (row: T) => string | number }) {
  const isLight = useTheme().theme === "light";
  return (
    <div className={dataTableFrameClassName(isLight)}>
      <div className="overflow-x-auto">
        <table className={`${DATA_TABLE_STYLES.table} min-w-[420px]`}>
          <thead>
            <tr className={`${DATA_TABLE_STYLES.headerRow} text-[var(--text-muted)] ${isLight ? "bg-[#F1F5F9]" : "bg-[#2C2C2C]"}`}>
              {columns.map((col) => (
                <th key={col.key} className={`${DATA_TABLE_STYLES.headerCell} ${col.align === "right" ? "text-right" : "text-left"}`}>{col.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`px-3 py-2 border-b last:border-b-0 ${dataTableRowBorderClassName(isLight)} ${col.align === "right" ? "text-right" : "text-left"} ${col.className ?? ""}`}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Segmented control in the warehouse stock-tabs style. */
export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (value: T) => void;
  options: [T, string][];
  label: string;
}) {
  const isLight = useTheme().theme === "light";
  return (
    <div
      role="tablist"
      aria-label={label}
      className={`inline-flex h-[37px] max-w-full overflow-x-auto rounded-[8px] border p-[3px] ${isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#2C2C2C]"}`}
    >
      {options.map(([key, text]) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={value === key}
          onClick={() => onChange(key)}
          className={`rounded-[5px] px-3 text-[13px] font-semibold whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--status-info)] ${
            value === key
              ? isLight ? "bg-[#222222] text-white" : "bg-white text-[#222222]"
              : isLight ? "text-[#383838] hover:text-[#222222]" : "text-[#E4E4E7] hover:text-white"
          }`}
        >
          {text}
        </button>
      ))}
    </div>
  );
}

/** Status pill, same colors as the warehouse catalog status column. */
export function Badge({ tone, children }: { tone: "success" | "danger"; children: ReactNode }) {
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        tone === "danger"
          ? "bg-[var(--status-danger)]/15 text-[var(--status-danger-badge-text)]"
          : "bg-[var(--status-success)]/15 text-[var(--status-success-badge-text)]"
      }`}
    >
      {children}
    </span>
  );
}
