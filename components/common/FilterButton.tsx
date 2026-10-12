"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export interface FilterButtonProps {
  controls: string;
  expanded: boolean;
  label: string;
  clearLabel?: string;
  activeFilterCount?: number;
  onClear?: () => void;
  onClick: () => void;
}

export default function FilterButton({
  controls,
  expanded,
  label,
  clearLabel = "Clear filters",
  activeFilterCount = 0,
  onClear,
  onClick,
}: FilterButtonProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={activeFilterCount > 0 && onClear ? onClear : onClick}
      aria-label={activeFilterCount > 0 && onClear ? clearLabel : undefined}
      title={activeFilterCount > 0 && onClear ? clearLabel : undefined}
      className={`group inline-flex h-[33px] items-center gap-1.5 rounded-[6px] border px-4 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 ${
        isLight
          ? "border-[#E4E4E7] bg-white text-[#222222] hover:bg-slate-50"
          : "border-[#444444] bg-[#383838] text-white hover:bg-white/5"
      }`}
    >
      <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
      {label}
      {activeFilterCount > 0 && (
        <span className="relative inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6366F1] px-1 text-xs text-white">
          <span className={onClear ? "transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0" : ""}>{activeFilterCount}</span>
          {onClear && <X className="absolute h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true" />}
        </span>
      )}
    </button>
  );
}
