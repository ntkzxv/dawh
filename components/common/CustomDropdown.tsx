"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { useTheme } from "@/context/ThemeContext";
import { ChevronDown, Check, Search, X } from "lucide-react";

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  subLabel?: string;
  icon?: React.ReactNode;
  badge?: string | number;
  badgeColor?: string;
  disabled?: boolean;
}

export interface CustomDropdownProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  align?: "left" | "right";
  size?: "sm" | "md";
  icon?: React.ReactNode;
}

export default function CustomDropdown<T = string>({
  value,
  onChange,
  options,
  placeholder = "Select option...",
  className = "",
  triggerClassName = "",
  menuClassName = "",
  disabled = false,
  searchable = false,
  searchPlaceholder = "Search...",
  align = "left",
  size = "md",
  icon,
}: CustomDropdownProps<T>) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handlePointerDown);
    }
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isOpen]);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchable && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    }
  }, [isOpen, searchable]);

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Find currently selected option
  const selectedOption = useMemo(() => {
    return options.find((opt) => opt.value === value);
  }, [options, value]);

  // Filter options by search
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.subLabel && opt.subLabel.toLowerCase().includes(q)) ||
        (typeof opt.value === "string" && opt.value.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  const handleSelect = (option: DropdownOption<T>) => {
    if (option.disabled || disabled) return;
    onChange(option.value);
    setIsOpen(false);
    setSearchQuery("");
  };

  const isSmall = size === "sm";

  return (
    <div
      ref={dropdownRef}
      className={`relative inline-block text-left ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        className={`w-full flex items-center justify-between gap-2.5 rounded-lg border font-medium transition-all duration-150 cursor-pointer select-none text-left outline-none ${
          isSmall ? "px-2.5 py-1.5 text-[11px]" : "px-3 py-2 text-xs"
        } ${
          disabled
            ? "opacity-50 cursor-not-allowed bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
            : isLight
            ? isOpen
              ? "bg-white border-zinc-400 text-zinc-900 shadow-xs"
              : "bg-zinc-100/90 hover:bg-zinc-100 border-zinc-200 text-zinc-800"
            : isOpen
            ? "bg-[#333333] border-white/60 text-white shadow-xs"
            : "bg-[#2C2C2C] hover:bg-[#333333] border-[#555555] text-white"
        } ${triggerClassName}`}
      >
        <div className="flex items-center gap-2 truncate min-w-0 flex-1">
          {(icon || selectedOption?.icon) && (
            <span className="shrink-0 text-current">{icon || selectedOption?.icon}</span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
          {selectedOption?.badge && (
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-md font-mono shrink-0 ${
                isLight ? "bg-zinc-200 text-zinc-700" : "bg-white/10 text-zinc-300"
              }`}
            >
              {selectedOption.badge}
            </span>
          )}
        </div>

        <ChevronDown
          size={isSmall ? 13 : 14}
          className={`shrink-0 transition-transform duration-200 opacity-60 ${
            isOpen ? "rotate-180 opacity-100" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu Box */}
      {isOpen && (
        <div
          role="listbox"
          className={`absolute top-full mt-1.5 min-w-full w-max max-w-[340px] rounded-xl border p-1.5 shadow-2xl z-50 flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150 ${
            align === "right" ? "right-0" : "left-0"
          } ${
            isLight
              ? "bg-white border-zinc-200 text-zinc-900 shadow-zinc-900/10"
              : "bg-[#252525] border-[#444444] text-white shadow-black/60"
          } ${menuClassName}`}
        >
          {/* Optional Search Bar */}
          {searchable && (
            <div className="p-1 border-b border-zinc-200 dark:border-white/10 mb-1">
              <div
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-xs ${
                  isLight
                    ? "bg-zinc-50 border-zinc-200 focus-within:border-zinc-400"
                    : "bg-[#1E1E1E] border-[#444444] focus-within:border-zinc-400"
                }`}
              >
                <Search size={13} className="opacity-50 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full bg-transparent outline-none text-xs text-inherit placeholder:opacity-50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="opacity-50 hover:opacity-100 cursor-pointer"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto [scrollbar-width:thin] space-y-0.5">
            {filteredOptions.length === 0 ? (
              <div className="px-3 py-3 text-center text-xs opacity-50 italic">
                No matches found
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = opt.value === value;
                return (
                  <div
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    className={`flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-xs transition-colors cursor-pointer select-none ${
                      opt.disabled
                        ? "opacity-35 cursor-not-allowed"
                        : isSelected
                        ? isLight
                          ? "bg-zinc-900 text-white font-semibold"
                          : "bg-white/15 text-white font-semibold"
                        : isLight
                        ? "hover:bg-zinc-100 text-zinc-700 hover:text-zinc-900"
                        : "hover:bg-white/[0.08] text-zinc-300 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {opt.icon && <span className="shrink-0">{opt.icon}</span>}
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-medium">{opt.label}</div>
                        {opt.subLabel && (
                          <div
                            className={`text-[10.5px] truncate font-normal ${
                              isSelected ? "opacity-80" : "opacity-50"
                            }`}
                          >
                            {opt.subLabel}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {opt.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                            isSelected
                              ? isLight
                                ? "bg-white/20 text-white"
                                : "bg-white/20 text-white"
                              : isLight
                              ? "bg-zinc-100 text-zinc-600"
                              : "bg-[#333333] text-zinc-400"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      )}
                      {isSelected && <Check size={14} className="shrink-0" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
