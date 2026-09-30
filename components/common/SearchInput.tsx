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
            ? `bg-white border-[#E4E4E7] text-[#222222] ${
                isFocused ? "border-zinc-400 ring-1 ring-zinc-300" : ""
              }`
            : `bg-[#383838] border-[#444444] text-[#F8FAFC] ${
                isFocused ? "border-white/50 ring-1 ring-white/20" : ""
              }`
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""} ${className}`}
      >
        <Search
          size={14}
          className="text-[#A1A1AA] shrink-0 mr-2 select-none pointer-events-none"
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
          className={`w-full bg-transparent border-none outline-none text-[13px] placeholder:text-[#A1A1AA] pr-5 ${inputClassName}`}
          {...rest}
        />
        {showClearButton && value && !disabled && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Clear search"
            className={`absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-4 w-4 items-center justify-center rounded-full transition-colors cursor-pointer ${
              isLight
                ? "text-[#A1A1AA] hover:text-[#222222] hover:bg-zinc-100"
                : "text-[#A1A1AA] hover:text-white hover:bg-white/10"
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
