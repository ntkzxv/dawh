"use client";

import { SlidersHorizontal } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

export interface FilterButtonProps {
  controls: string;
  expanded: boolean;
  label: string;
  activeFilterCount?: number;
  onClick: () => void;
}

export default function FilterButton({
  controls,
  expanded,
  label,
  activeFilterCount = 0,
  onClick,
}: FilterButtonProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <button
      type="button"
      aria-expanded={expanded}
      aria-controls={controls}
      onClick={onClick}
      className={`inline-flex h-[33px] items-center gap-1.5 rounded-[6px] border px-4 py-2 text-[13px] font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 ${
        isLight
          ? "border-[#E4E4E7] bg-white text-[#222222] hover:bg-slate-50"
          : "border-[#444444] bg-[#383838] text-white hover:bg-white/5"
      }`}
    >
      <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
      {label}
      {activeFilterCount > 0 && (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#6366F1] px-1 text-xs text-white">
          {activeFilterCount}
        </span>
      )}
    </button>
  );
}
