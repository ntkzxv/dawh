"use client";

import React, { useState, useMemo, useEffect } from "react";
import { useTheme } from "@/context/ThemeContext";
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Calendar as CalendarIcon,
  RotateCcw,
} from "lucide-react";

export type DateRange = [string | null, string | null];

export interface CalendarProps {
  value?: string | null; // ISO YYYY-MM-DD
  onChange?: (date: string) => void;
  rangeValue?: DateRange;
  onRangeChange?: (range: DateRange) => void;
  mode?: "single" | "range";
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  isThai?: boolean;
  className?: string;
  showTodayButton?: boolean;
  showClearButton?: boolean;
  onClear?: () => void;
}

const MONTHS_TH = [
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน",
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
];

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

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
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

const DAYS_TH = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
const DAYS_EN = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

// Helper to pad number to 2 digits
function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

// Format Date object to YYYY-MM-DD string
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Parse YYYY-MM-DD to Date object
export function parseIsoDate(s?: string | null): Date | null {
  if (!s) return null;
  const parts = s.split("-");
  if (parts.length !== 3) return null;
  const y = parseInt(parts[0], 10);
  const m = parseInt(parts[1], 10) - 1;
  const d = parseInt(parts[2], 10);
  if (isNaN(y) || isNaN(m) || isNaN(d)) return null;
  return new Date(y, m, d);
}

export default function Calendar({
  value,
  onChange,
  rangeValue,
  onRangeChange,
  mode = "single",
  minDate,
  maxDate,
  isThai = true,
  className = "",
  showTodayButton = true,
  showClearButton = true,
  onClear,
}: CalendarProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const todayStr = useMemo(() => toIsoDate(new Date()), []);

  // Determine initial view date from value, rangeValue, or today
  const initialDate = useMemo(() => {
    if (mode === "single" && value) {
      return parseIsoDate(value) || new Date();
    }
    if (mode === "range" && rangeValue && rangeValue[0]) {
      return parseIsoDate(rangeValue[0]) || new Date();
    }
    return new Date();
  }, [mode, value, rangeValue]);

  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth()); // 0-11
  const [viewMode, setViewMode] = useState<"days" | "months" | "years">("days");

  // Keep view updated if external value changes
  useEffect(() => {
    if (mode === "single" && value) {
      const d = parseIsoDate(value);
      if (d) {
        setViewYear(d.getFullYear());
        setViewMonth(d.getMonth());
      }
    }
  }, [value, mode]);

  // Year decade paging (for years view)
  const decadeStart = Math.floor(viewYear / 10) * 10;

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  // Day grid calculation
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sunday
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

    const days: {
      dateString: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isDisabled: boolean;
    }[] = [];

    // Previous month filler days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = daysInPrevMonth - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateString = `${prevYear}-${pad(prevMonth + 1)}-${pad(d)}`;
      const isDisabled =
        (minDate ? dateString < minDate : false) ||
        (maxDate ? dateString > maxDate : false);

      days.push({
        dateString,
        dayNumber: d,
        isCurrentMonth: false,
        isDisabled,
      });
    }

    // Current month days
    for (let d = 1; d <= daysInMonth; d++) {
      const dateString = `${viewYear}-${pad(viewMonth + 1)}-${pad(d)}`;
      const isDisabled =
        (minDate ? dateString < minDate : false) ||
        (maxDate ? dateString > maxDate : false);

      days.push({
        dateString,
        dayNumber: d,
        isCurrentMonth: true,
        isDisabled,
      });
    }

    // Next month filler days to complete grid (multiples of 7, either 35 or 42)
    const remaining = (7 - (days.length % 7)) % 7;
    const totalNeeded = days.length + remaining < 35 ? 35 : days.length + remaining;
    const nextDaysCount = totalNeeded - days.length;

    for (let d = 1; d <= nextDaysCount; d++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateString = `${nextYear}-${pad(nextMonth + 1)}-${pad(d)}`;
      const isDisabled =
        (minDate ? dateString < minDate : false) ||
        (maxDate ? dateString > maxDate : false);

      days.push({
        dateString,
        dayNumber: d,
        isCurrentMonth: false,
        isDisabled,
      });
    }

    return days;
  }, [viewYear, viewMonth, minDate, maxDate]);

  // Click day handler
  const handleDayClick = (dateStr: string, isDisabled: boolean) => {
    if (isDisabled) return;

    if (mode === "single") {
      onChange?.(dateStr);
    } else if (mode === "range") {
      const [start, end] = rangeValue || [null, null];
      if (!start || (start && end)) {
        // Start new range selection
        onRangeChange?.([dateStr, null]);
      } else {
        // We have start, completing range
        if (dateStr < start) {
          onRangeChange?.([dateStr, start]);
        } else {
          onRangeChange?.([start, dateStr]);
        }
      }
    }
  };

  // Jump to today
  const handleSelectToday = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setViewMode("days");
    if (mode === "single") {
      onChange?.(todayStr);
    } else if (mode === "range") {
      onRangeChange?.([todayStr, todayStr]);
    }
  };

  // Clear handler
  const handleClear = () => {
    if (mode === "single") {
      onChange?.("");
    } else if (mode === "range") {
      onRangeChange?.([null, null]);
    }
    onClear?.();
  };

  const monthNames = isThai ? MONTHS_TH : MONTHS_EN;
  const monthNamesShort = isThai ? MONTHS_TH_SHORT : MONTHS_EN_SHORT;
  const dayNames = isThai ? DAYS_TH : DAYS_EN;

  return (
    <div
      className={`select-none p-3.5 rounded-2xl border text-xs flex flex-col gap-3 transition-colors ${
        isLight
          ? "bg-white border-zinc-200 text-zinc-900 shadow-xl shadow-zinc-900/5"
          : "bg-[#282828] border-[#444444] text-white shadow-2xl shadow-black/60"
      } ${className}`}
    >
      {/* Header Navigation */}
      <div className="flex items-center justify-between gap-1 pb-2 border-b border-zinc-200 dark:border-[#444444]/40">
        {/* Quick jump mode toggles */}
        <div className="flex items-center gap-1.5 font-bold">
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === "months" ? "days" : "months"))}
            className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
              viewMode === "months"
                ? "bg-[#6366F1] text-white"
                : isLight
                ? "hover:bg-zinc-100 text-zinc-800"
                : "hover:bg-[#383838] text-zinc-200"
            }`}
          >
            {monthNames[viewMonth]}
          </button>
          <button
            type="button"
            onClick={() => setViewMode((m) => (m === "years" ? "days" : "years"))}
            className={`px-2.5 py-1 rounded-lg font-mono transition-all cursor-pointer ${
              viewMode === "years"
                ? "bg-[#6366F1] text-white"
                : isLight
                ? "hover:bg-zinc-100 text-zinc-800"
                : "hover:bg-[#383838] text-zinc-200"
            }`}
          >
            {isThai ? viewYear + 543 : viewYear}
          </button>
        </div>

        {/* Step Arrows */}
        <div className="flex items-center gap-1">
          {viewMode === "days" && (
            <>
              <button
                type="button"
                onClick={handlePrevMonth}
                aria-label="Previous Month"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLight ? "hover:bg-zinc-100 text-zinc-600" : "hover:bg-white/10 text-zinc-300"
                }`}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                aria-label="Next Month"
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLight ? "hover:bg-zinc-100 text-zinc-600" : "hover:bg-white/10 text-zinc-300"
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}

          {viewMode === "months" && (
            <>
              <button
                type="button"
                onClick={() => setViewYear((y) => y - 1)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLight ? "hover:bg-zinc-100 text-zinc-600" : "hover:bg-white/10 text-zinc-300"
                }`}
              >
                <ChevronLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewYear((y) => y + 1)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLight ? "hover:bg-zinc-100 text-zinc-600" : "hover:bg-white/10 text-zinc-300"
                }`}
              >
                <ChevronRight size={16} />
              </button>
            </>
          )}

          {viewMode === "years" && (
            <>
              <button
                type="button"
                onClick={() => setViewYear((y) => y - 10)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLight ? "hover:bg-zinc-100 text-zinc-600" : "hover:bg-white/10 text-zinc-300"
                }`}
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                type="button"
                onClick={() => setViewYear((y) => y + 10)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isLight ? "hover:bg-zinc-100 text-zinc-600" : "hover:bg-white/10 text-zinc-300"
                }`}
              >
                <ChevronsRight size={16} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* VIEW 1: Days Calendar Grid */}
      {viewMode === "days" && (
        <div className="flex flex-col gap-1">
          {/* Weekday Names Header */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-[10.5px] opacity-60 pb-1">
            {dayNames.map((d, i) => (
              <div
                key={d}
                className={`py-1 ${
                  i === 0 ? "text-red-500 font-bold" : i === 6 ? "text-indigo-400 font-bold" : ""
                }`}
              >
                {d}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-y-1 gap-x-0.5">
            {calendarDays.map((item) => {
              const { dateString, dayNumber, isCurrentMonth, isDisabled } = item;
              const isToday = dateString === todayStr;

              // Selection logic
              let isSelected = false;
              let isInRange = false;
              let isRangeStart = false;
              let isRangeEnd = false;

              if (mode === "single") {
                isSelected = value === dateString;
              } else if (mode === "range" && rangeValue) {
                const [start, end] = rangeValue;
                if (start && !end) {
                  isSelected = start === dateString;
                } else if (start && end) {
                  isRangeStart = start === dateString;
                  isRangeEnd = end === dateString;
                  isSelected = isRangeStart || isRangeEnd;
                  isInRange = dateString >= start && dateString <= end;
                }
              }

              return (
                <div
                  key={dateString}
                  onClick={() => handleDayClick(dateString, isDisabled)}
                  className={`relative flex items-center justify-center h-8 transition-all select-none ${
                    isDisabled ? "cursor-not-allowed opacity-25" : "cursor-pointer"
                  } ${
                    isInRange && !isSelected
                      ? isLight
                        ? "bg-[#6366F1]/10 text-zinc-900"
                        : "bg-[#6366F1]/20 text-white"
                      : ""
                  } ${
                    isRangeStart
                      ? "rounded-l-lg"
                      : isRangeEnd
                      ? "rounded-r-lg"
                      : ""
                  }`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all relative ${
                      isSelected
                        ? "bg-[#6366F1] text-white font-bold shadow-md shadow-[#6366F1]/30 scale-105"
                        : isToday
                        ? isLight
                          ? "border border-[#6366F1] font-bold text-[#6366F1] hover:bg-zinc-100"
                          : "border border-[#6366F1] font-bold text-[#6366F1] hover:bg-white/10"
                        : !isCurrentMonth
                        ? "opacity-30 hover:opacity-70"
                        : isLight
                        ? "hover:bg-zinc-100 text-zinc-800"
                        : "hover:bg-white/10 text-zinc-200"
                    }`}
                  >
                    <span>{dayNumber}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: Quick Month Selector */}
      {viewMode === "months" && (
        <div className="grid grid-cols-3 gap-2 py-2">
          {monthNamesShort.map((mShort, idx) => {
            const isSelected = viewMonth === idx;
            return (
              <button
                key={mShort}
                type="button"
                onClick={() => {
                  setViewMonth(idx);
                  setViewMode("days");
                }}
                className={`py-3 rounded-xl font-medium text-xs transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#6366F1] text-white font-bold shadow-sm"
                    : isLight
                    ? "hover:bg-zinc-100 text-zinc-800"
                    : "hover:bg-[#383838] text-zinc-200"
                }`}
              >
                {monthNames[idx]}
              </button>
            );
          })}
        </div>
      )}

      {/* VIEW 3: Quick Year Selector */}
      {viewMode === "years" && (
        <div className="flex flex-col gap-2 py-1">
          <div className="text-center font-bold text-[11px] opacity-60">
            {isThai
              ? `${decadeStart + 543} - ${decadeStart + 11 + 543}`
              : `${decadeStart} - ${decadeStart + 11}`}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: 12 }).map((_, i) => {
              const y = decadeStart + i;
              const isSelected = viewYear === y;
              return (
                <button
                  key={y}
                  type="button"
                  onClick={() => {
                    setViewYear(y);
                    setViewMode("months");
                  }}
                  className={`py-2.5 rounded-xl font-mono text-xs transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#6366F1] text-white font-bold shadow-sm"
                      : isLight
                      ? "hover:bg-zinc-100 text-zinc-800"
                      : "hover:bg-[#383838] text-zinc-200"
                  }`}
                >
                  {isThai ? y + 543 : y}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Footer: Quick Actions */}
      {(showTodayButton || showClearButton) && (
        <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-[#444444]/40 text-[11px]">
          {showTodayButton && (
            <button
              type="button"
              onClick={handleSelectToday}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[#6366F1] hover:bg-[#6366F1]/10 font-bold transition-colors cursor-pointer"
            >
              <CalendarIcon size={13} />
              <span>{isThai ? "วันนี้" : "Today"}</span>
            </button>
          )}

          {showClearButton && (
            <button
              type="button"
              onClick={handleClear}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors cursor-pointer ${
                isLight
                  ? "hover:bg-zinc-100 text-zinc-500 hover:text-zinc-900"
                  : "hover:bg-[#383838] text-zinc-400 hover:text-white"
              }`}
            >
              <RotateCcw size={12} />
              <span>{isThai ? "ล้างค่า" : "Clear"}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
