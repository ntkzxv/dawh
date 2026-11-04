"use client";

import React, { forwardRef, useState } from "react";
import { useTheme } from "@/context/ThemeContext";
import { Search, X } from "lucide-react";

export interface SearchInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "onChange"> {
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  className?: string;
  inputClassName?: string;
  width?: string;
  showClearButton?: boolean;
  clearLabel?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value,
      onChange,
      onClear,
      placeholder = "ค้นหา...",
      className = "",
      inputClassName = "",
      width = "w-[180px] sm:w-[220px]",
      showClearButton = true,
      clearLabel = "Clear search",
      disabled = false,
      ...rest
    },
    ref,
  ) => {
    const { theme } = useTheme();
    const isLight = theme === "light";
    const [isFocused, setIsFocused] = useState(false);

    const handleClear = () => {
      onChange("");
      onClear?.();
    };

    return (
      <div
        className={`relative flex items-center px-3 py-1.5 h-[33px] rounded-[6px] border text-[13px] transition-colors ${width} ${
          isLight
            ? `bg-[var(--cards)] border-[var(--toolbar-control-border)] text-[var(--text-primary)] ${
                isFocused ? "border-[var(--toolbar-control-border-focus)] ring-1 ring-[var(--toolbar-control-border)]/30" : ""
              }`
            : `bg-[var(--input-bg)] border-[var(--toolbar-control-border)] text-[var(--text-secondary)] ${
                isFocused ? "border-[var(--toolbar-control-border-focus)] ring-1 ring-[var(--toolbar-control-border)]/30" : ""
              }`
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      >
        <Search
          size={14}
          className="text-[var(--text-muted)] shrink-0 mr-2 select-none pointer-events-none"
          aria-hidden="true"
        />
        <input
          ref={ref}
          type="text"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          onFocus={(e) => {
            setIsFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            rest.onBlur?.(e);
          }}
          placeholder={placeholder}
          className={`w-full bg-transparent border-none outline-none text-[13px] placeholder:text-[var(--text-muted)] pr-5 ${inputClassName}`}
          {...rest}
        />
        {showClearButton && value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label={clearLabel}
            className={`absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors cursor-pointer ${
              isLight
                ? "text-[var(--text-muted)] hover:text-[#222222] hover:bg-zinc-100"
                : "text-[var(--text-muted)] hover:text-white hover:bg-white/10"
            }`}
          >
            <X size={12} />
          </button>
        )}
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
