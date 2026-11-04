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
  iconOnly?: boolean;
}

export default function FilterButton({
  controls,
  expanded,
  label,
  clearLabel = "Clear filters",
  activeFilterCount = 0,
  onClear,
  onClick,
  iconOnly = false,
}: FilterButtonProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded-[6px] border text-[13px] font-semibold transition-colors ${iconOnly ? "size-[38px] justify-center" : "h-[33px]"} ${
        isLight
          ? "border-[var(--toolbar-control-border)] bg-[var(--toolbar-button-bg)] text-[var(--text-primary)] hover:bg-[var(--toolbar-button-hover)]"
          : "border-[var(--toolbar-control-border)] bg-[var(--toolbar-button-bg)] text-[var(--text-secondary)] hover:bg-[var(--toolbar-button-hover)]"
      }`}
    >
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={controls}
        aria-label={iconOnly ? label : undefined}
        title={iconOnly ? label : undefined}
        onClick={onClick}
        className={`inline-flex h-full items-center gap-1.5 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 ${iconOnly ? "px-0" : "pl-4"} ${activeFilterCount > 0 && !iconOnly ? "pr-0" : iconOnly ? "" : "pr-4"}`}
      >
        <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
        {!iconOnly && label}
      </button>
      {activeFilterCount > 0 && (
        onClear ? (
          <button
            type="button"
            onClick={onClear}
            aria-label={clearLabel}
            title={clearLabel}
            className="group relative mr-3 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--status-info)] px-1 text-xs text-[var(--accent-foreground)] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          >
            <span className="transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0">{activeFilterCount}</span>
            <X className="absolute h-3.5 w-3.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" aria-hidden="true" />
          </button>
        ) : (
          <span className="mr-3 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[var(--status-info)] px-1 text-xs text-[var(--accent-foreground)]">
            {activeFilterCount}
          </span>
        )
      )}
    </div>
  );
}
