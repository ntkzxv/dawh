"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback, useLayoutEffect } from "react";
import { createPortal } from "react-dom";
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
  maxHeight?: number;
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
  maxHeight = 240,
}: CustomDropdownProps<T>) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Compute fixed position in viewport for Portal
  const updatePosition = useCallback(() => {
    if (!dropdownRef.current) return;
    const rect = dropdownRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;

    // Flip to top if space below is too tight (< 220px) and space above is greater
    const openUpward = spaceBelow < 220 && spaceAbove > spaceBelow;
    const availableHeight = openUpward ? spaceAbove - 16 : spaceBelow - 16;
    const maxMenuHeight = Math.min(maxHeight, Math.max(120, availableHeight - 60));

    const minWidth = Math.max(rect.width, 160);
    const maxWidth = Math.min(viewportWidth - 16, Math.max(rect.width, 380));

    const style: React.CSSProperties = {
      position: "fixed",
      zIndex: 99999,
      width: rect.width > 200 ? `${rect.width}px` : undefined,
      minWidth: `${minWidth}px`,
      maxWidth: `${maxWidth}px`,
    };

    if (openUpward) {
      style.bottom = `${Math.max(8, viewportHeight - rect.top + 6)}px`;
      style.transformOrigin = "bottom";
    } else {
      style.top = `${Math.max(8, rect.bottom + 6)}px`;
      style.transformOrigin = "top";
    }

    if (align === "right") {
      const rightDistance = viewportWidth - rect.right;
      style.right = `${Math.max(8, Math.min(rightDistance, viewportWidth - minWidth - 8))}px`;
    } else {
      style.left = `${Math.max(8, Math.min(rect.left, viewportWidth - minWidth - 8))}px`;
    }

    setMenuStyle(style);
  }, [align]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
      setSearchQuery("");
    }
  };

  // Keep position updated on mount of open state
  const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;
  useIsomorphicLayoutEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  // Close when clicked outside or scrolled off screen
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        dropdownRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
      setSearchQuery("");
    };

    const handleScroll = (event: Event) => {
      // Don't reposition if scrolling inside the dropdown's own options list
      if (menuRef.current?.contains(event.target as Node)) {
        return;
      }
      if (dropdownRef.current) {
        const rect = dropdownRef.current.getBoundingClientRect();
        // If trigger button is scrolled completely out of view, close dropdown
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setIsOpen(false);
          setSearchQuery("");
          return;
        }
      }
      updatePosition();
    };

    const handleResize = () => {
      updatePosition();
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", handleResize);
    };
  }, [isOpen, updatePosition]);

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
  const isBlock = className.includes("w-full") || className.includes("flex-1") || className.includes("block");

  return (
    <div
      ref={dropdownRef}
      className={`relative ${isBlock ? "w-full" : "inline-block"} text-left ${className}`}
    >
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
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

      {/* Floating Dropdown Menu in Portal (breaks out of any modal / popup / overflow container) */}
      {isOpen &&
        mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            role="listbox"
            style={menuStyle}
            className={`rounded-xl border p-1.5 shadow-2xl flex flex-col gap-1 animate-in fade-in zoom-in-95 duration-150 ${
              isLight
                ? "bg-white border-zinc-200 text-zinc-900 shadow-2xl shadow-zinc-900/15"
                : "bg-[#252525] border-[#444444] text-white shadow-2xl shadow-black/80"
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

            {/* Options List with Gorgeous Smooth Scrollbar */}
            <div
              style={{ maxHeight: `${maxHeight}px` }}
              className="overflow-y-auto dropdown-scrollbar pr-1.5 space-y-0.5"
            >
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
          </div>,
          document.body
        )}
    </div>
  );
}
