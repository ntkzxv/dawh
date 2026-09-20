"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "@/context/ThemeContext";
import { Calendar as CalendarIcon, X } from "lucide-react";
import Calendar, { parseIsoDate } from "./Calendar";

export interface DatePickerProps {
  value?: string | null; // ISO YYYY-MM-DD
  onChange?: (date: string) => void;
  placeholder?: string;
  isThai?: boolean;
  disabled?: boolean;
  clearable?: boolean;
  minDate?: string;
  maxDate?: string;
  align?: "left" | "right";
  size?: "sm" | "md";
  className?: string;
  triggerClassName?: string;
  calendarClassName?: string;
}

const MONTHS_TH_SHORT = [
  "ม.ค.",
  "ก.พ.",
  "มี.ค.",
  "เม.ย.",
  "พ.ค.",
  "มิ.ย.",
  "ก.ค.",
  "ส.ค.",
  "ก.ย.",
  "ต.ค.",
  "พ.ย.",
  "ธ.ค.",
];

const MONTHS_EN_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function DatePicker({
  value,
  onChange,
  placeholder,
  isThai = true,
  disabled = false,
  clearable = true,
  minDate,
  maxDate,
  align = "left",
  size = "md",
  className = "",
  triggerClassName = "",
  calendarClassName = "",
}: DatePickerProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLDivElement>(null);
  const calendarPortalRef = useRef<HTMLDivElement>(null);
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  // Format date display for input button
  const displayLabel = useMemo(() => {
    if (!value) return placeholder || (isThai ? "เลือกวันที่..." : "Select date...");
    const parsed = parseIsoDate(value);
    if (!parsed) return value;
    const d = parsed.getDate();
    const m = parsed.getMonth();
    const y = parsed.getFullYear();

    if (isThai) {
      return `${d} ${MONTHS_TH_SHORT[m]} ${y + 543}`;
    }
    return `${MONTHS_EN_SHORT[m]} ${d}, ${y}`;
  }, [value, isThai, placeholder]);

  // Viewport position calculation for Portal
  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const calendarHeight = 350;
    const calendarWidth = 300;

    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < calendarHeight && spaceAbove > spaceBelow;

    const style: React.CSSProperties = {
      position: "fixed",
      zIndex: 99999,
      width: `${calendarWidth}px`,
    };

    if (openUpward) {
      style.bottom = `${Math.max(8, viewportHeight - rect.top + 6)}px`;
      style.transformOrigin = "bottom";
    } else {
      style.top = `${Math.max(8, rect.bottom + 6)}px`;
      style.transformOrigin = "top";
    }

    if (align === "right") {
      const rightDist = viewportWidth - rect.right;
      style.right = `${Math.max(8, Math.min(rightDist, viewportWidth - calendarWidth - 8))}px`;
    } else {
      style.left = `${Math.max(8, Math.min(rect.left, viewportWidth - calendarWidth - 8))}px`;
    }

    setPopupStyle(style);
  }, [align]);

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      updatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Close when clicked outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        calendarPortalRef.current?.contains(target)
      ) {
        return;
      }
      setIsOpen(false);
    };

    const handleScroll = (event: Event) => {
      if (calendarPortalRef.current?.contains(event.target as Node)) {
        return;
      }
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          setIsOpen(false);
          return;
        }
      }
      updatePosition();
    };

    const handleResize = () => updatePosition();

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

  // Keyboard accessibility
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleSelectDate = (dateStr: string) => {
    onChange?.(dateStr);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.("");
    setIsOpen(false);
  };

  const isSmall = size === "sm";

  return (
    <div ref={triggerRef} className={`relative inline-block w-full text-left ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={toggleOpen}
        className={`w-full flex items-center justify-between gap-2 rounded-lg border transition-all cursor-pointer select-none outline-none ${
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
          <CalendarIcon
            size={isSmall ? 13 : 15}
            className={`shrink-0 ${
              value ? "text-[#6366F1]" : isLight ? "text-zinc-500" : "text-zinc-400"
            }`}
          />
          <span
            className={`truncate font-medium ${
              !value ? "opacity-50 font-normal" : ""
            }`}
          >
            {displayLabel}
          </span>
        </div>

        {clearable && value && !disabled && (
          <span
            onClick={handleClear}
            title={isThai ? "ล้างวันที่" : "Clear date"}
            className="p-0.5 rounded hover:bg-black/10 dark:hover:bg-white/10 opacity-60 hover:opacity-100 transition-opacity cursor-pointer shrink-0"
          >
            <X size={13} />
          </span>
        )}
      </button>

      {/* Floating Calendar Popup in Portal */}
      {isOpen &&
        mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={calendarPortalRef}
            style={popupStyle}
            className={`animate-in fade-in zoom-in-95 duration-150 ${calendarClassName}`}
          >
            <Calendar
              value={value}
              onChange={handleSelectDate}
              minDate={minDate}
              maxDate={maxDate}
              isThai={isThai}
              onClear={() => {
                onChange?.("");
                setIsOpen(false);
              }}
            />
          </div>,
          document.body
        )}
    </div>
  );
}
