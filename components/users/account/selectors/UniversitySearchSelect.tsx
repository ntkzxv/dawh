"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { GraduationCap, Search, X, Check, Plus } from "lucide-react";
import { searchUniversities, type UniversityItem } from "@/data/masterData";

export interface UniversitySearchSelectProps {
  valueTh?: string;
  valueEn?: string;
  onChange: (th: string, en: string) => void;
  isLight: boolean;
  isThai: boolean;
}

export function UniversitySearchSelect({
  valueTh,
  valueEn,
  onChange,
  isLight,
  isThai,
}: UniversitySearchSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isCustomMode, setIsCustomMode] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const filtered = useMemo(() => {
    return searchUniversities(searchQuery);
  }, [searchQuery]);

  const hasSelected = !!(valueTh || valueEn);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }
  }, [isOpen]);

  const handleSelect = (uni: UniversityItem) => {
    if (uni.id === "other") {
      setIsCustomMode(true);
      setIsOpen(false);
      setHighlightedIndex(0);
      return;
    }
    onChange(uni.name_th, uni.name_en);
    setIsOpen(false);
    setIsCustomMode(false);
    setHighlightedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        e.preventDefault();
        setIsOpen(true);
        setHighlightedIndex(0);
      }
      return;
    }

    const totalCount = filtered.length + 1; // +1 for custom manual input option
    if (totalCount === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % totalCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + totalCount) % totalCount);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex < filtered.length) {
        handleSelect(filtered[highlightedIndex]);
      } else {
        setIsCustomMode(true);
        setIsOpen(false);
        setHighlightedIndex(0);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setIsOpen(false);
      setHighlightedIndex(0);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full sm:col-span-2" ref={containerRef}>
      <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
        {isThai ? "มหาวิทยาลัย / สถาบันการศึกษา" : "University / Educational Institution"}
      </label>

      {/* Selected Card or Search Trigger */}
      {hasSelected && !isOpen && !isCustomMode ? (
        <div
          className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-all ${
            isLight
              ? "bg-[#F9F9FA] border-[#E4E4E7] hover:border-[#222222]"
              : "bg-[#282828] border-[#444444] hover:border-white"
          }`}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                isLight ? "bg-[#222222] text-white" : "bg-white text-[#222222]"
              }`}
            >
              <GraduationCap size={16} />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-bold truncate">
                {isThai ? (valueTh || valueEn) : (valueEn || valueTh)}
              </span>
              {(isThai ? valueEn : valueTh) && (isThai ? valueEn !== valueTh : valueTh !== valueEn) && (
                <span
                  className={`text-[11px] truncate mt-0.5 ${
                    isLight ? "text-[#666666]" : "text-[#A1A1AA]"
                  }`}
                >
                  {isThai ? valueEn : valueTh}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              setIsOpen(true);
              setSearchQuery("");
              setHighlightedIndex(0);
            }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all shrink-0 cursor-pointer ${
              isLight
                ? "bg-slate-200/70 hover:bg-slate-300/80 text-[#222222]"
                : "bg-[#383838] hover:bg-[#444444] text-white"
            }`}
          >
            {isThai ? "เปลี่ยนสถาบัน" : "Change"}
          </button>
        </div>
      ) : (
        <div className="relative w-full">
          <div className="relative flex items-center">
            <input
              type="text"
              autoFocus={isOpen}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setHighlightedIndex(0);
                if (!isOpen) setIsOpen(true);
              }}
              onFocus={() => {
                setIsOpen(true);
                setHighlightedIndex(0);
              }}
              onKeyDown={handleKeyDown}
              placeholder={
                isThai
                  ? "ค้นหาชื่อมหาวิทยาลัย"
                  : "Search university"
              }
              className={`w-full p-2.5 pl-9 pr-8 rounded-lg border text-xs outline-none transition-all ${
                isLight
                  ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222] focus:bg-white focus:border-[#222222]"
                  : "bg-[#282828] border-[#444444] text-[#FFFFFF] focus:bg-[#202020] focus:border-white"
              }`}
            />
            <div
              className={`absolute left-3 pointer-events-none ${
                isLight ? "text-[#666666]" : "text-[#A1A1AA]"
              }`}
            >
              <Search size={14} />
            </div>
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 text-slate-400 hover:text-slate-600 p-1"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Autocomplete Results Dropdown */}
          {isOpen && (
            <div
              className={`absolute top-full left-0 right-0 mt-1.5 z-50 max-h-[260px] overflow-y-auto rounded-xl border shadow-2xl backdrop-blur-md flex flex-col p-1.5 gap-1 animate-in fade-in zoom-in-95 duration-150 ${
                isLight
                  ? "bg-white/95 border-[#E4E4E7] shadow-xl text-[#222222]"
                  : "bg-[#2B2B2B]/95 border-[#444444] shadow-2xl text-[#FFFFFF]"
              }`}
            >
              <div className="px-2 py-1 flex items-center justify-between text-[10px] font-semibold text-slate-400">
                <span>{isThai ? `ผลการค้นหา (${filtered.length})` : `Results (${filtered.length})`}</span>
                <span>{isThai ? "เลือกเพื่อกรอกอัตโนมัติ" : "Click to auto-fill"}</span>
              </div>

              {filtered.map((item, idx) => {
                const isSelected = item.name_th === valueTh || item.name_en === valueEn;
                const isHigh = idx === highlightedIndex;
                const primaryName = isThai ? item.name_th : item.name_en;
                const secondaryName = isThai ? item.name_en : item.name_th;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full p-2 rounded-lg flex items-center justify-between text-left transition-all cursor-pointer ${
                      isSelected
                        ? isLight
                          ? "bg-[#222222] text-white shadow-sm font-semibold"
                          : "bg-white text-[#222222] shadow-sm font-semibold"
                        : isHigh
                        ? isLight
                          ? "bg-slate-200/80 text-[#222222] font-medium"
                          : "bg-[#383838] text-white font-medium"
                        : isLight
                        ? "hover:bg-slate-100 text-[#222222]"
                        : "hover:bg-[#383838] text-[#E4E4E7]"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {item.abbr_en && (
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                            isSelected
                              ? isLight
                                ? "bg-white/20 text-white"
                                : "bg-[#222222] text-white"
                              : isLight
                              ? "bg-slate-200 text-slate-700"
                              : "bg-[#444444] text-[#E4E4E7]"
                          }`}
                        >
                          {item.abbr_en}
                        </span>
                      )}
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-semibold truncate leading-tight">
                          {primaryName}
                        </span>
                        <span
                          className={`text-[10px] truncate leading-tight mt-0.5 ${
                            isSelected
                              ? isLight
                                ? "text-white/70"
                                : "text-[#222222]/70"
                              : isLight
                              ? "text-slate-500"
                              : "text-slate-400"
                          }`}
                        >
                          {secondaryName}
                        </span>
                      </div>
                    </div>
                    {isSelected && <Check size={14} className="shrink-0 ml-2" />}
                  </button>
                );
              })}

              {/* Custom manual input trigger */}
              <button
                type="button"
                onClick={() => {
                  setIsCustomMode(true);
                  setIsOpen(false);
                }}
                onMouseEnter={() => setHighlightedIndex(filtered.length)}
                className={`w-full p-2.5 mt-1 border-t rounded-lg flex items-center gap-2 text-left transition-all cursor-pointer ${
                  highlightedIndex === filtered.length
                    ? isLight
                      ? "bg-slate-200/80 text-indigo-700 font-semibold"
                      : "bg-[#383838] text-indigo-300 font-semibold"
                    : isLight
                    ? "border-slate-100 hover:bg-slate-50 text-indigo-600 font-semibold"
                    : "border-zinc-700/60 hover:bg-[#353535] text-indigo-400 font-semibold"
                }`}
              >
                <Plus size={14} />
                <span className="text-xs">
                  {isThai
                    ? "➕ ไม่พบสถาบันในระบบ / ระบุชื่อเอง"
                    : "➕ Cannot find institution / Type manually"}
                </span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual Dual-Language Inputs if custom mode */}
      {isCustomMode && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl border border-dashed border-indigo-500/40 bg-indigo-500/5 animate-in fade-in zoom-in-95 duration-150">
          <div className="flex flex-col gap-1">
            <label className={`text-[11px] font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "ชื่อสถาบันการศึกษา (ภาษาไทย)" : "Institution Name (Thai)"}
            </label>
            <input
              type="text"
              value={valueTh || ""}
              onChange={(e) => onChange(e.target.value, valueEn || "")}
              placeholder={isThai ? "ระบุชื่อสถาบันภาษาไทย" : "Thai Institution Name"}
              className={`p-2.5 rounded-lg border text-xs outline-none ${
                isLight ? "bg-white border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-white"
              }`}
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={`text-[11px] font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "ชื่อสถาบันการศึกษา (English)" : "Institution Name (English)"}
            </label>
            <input
              type="text"
              value={valueEn || ""}
              onChange={(e) => onChange(valueTh || "", e.target.value)}
              placeholder="English Institution Name"
              className={`p-2.5 rounded-lg border text-xs outline-none ${
                isLight ? "bg-white border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-white"
              }`}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default UniversitySearchSelect;
