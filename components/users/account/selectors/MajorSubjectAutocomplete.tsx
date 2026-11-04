"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Check, Plus } from "lucide-react";
import { searchMajorSubjects, type MajorSubjectItem } from "@/data/masterData";

export interface MajorSubjectAutocompleteProps {
  value: string;
  onChange: (en: string) => void;
  isLight: boolean;
  isThai: boolean;
}

export function MajorSubjectAutocomplete({
  value,
  onChange,
  isLight,
  isThai,
}: MajorSubjectAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const results = useMemo(() => searchMajorSubjects(query, isThai ? "TH" : "EN"), [query, isThai]);
  const selectedItem = useMemo(() => results.find((s) => s.name_en === value) || null, [results, value]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [isOpen]);

  const handleSelect = (item: MajorSubjectItem) => {
    onChange(item.name_en);
    setQuery("");
    setIsOpen(false);
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

    const totalCount = results.length + (query ? 1 : 0);
    if (totalCount === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % totalCount);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + totalCount) % totalCount);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex < results.length) {
        handleSelect(results[highlightedIndex]);
      } else if (query) {
        onChange(query);
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
    <div className="flex flex-col gap-1 w-full relative" ref={containerRef}>
      <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
        {isThai ? "สาขาวิชา" : "Major Subject"}
      </label>

      {value && !isOpen ? (
        <div className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 bg-[var(--canvas)] ${isLight ? "border-[#737D88]" : "border-[#444444]"}`}>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold truncate">{isThai ? (selectedItem?.name_th || value) : value}</span>
            {selectedItem && (
              <span className={`text-[10px] truncate mt-0.5 ${isLight ? "text-[#666]" : "text-[var(--text-muted)]"}`}>
                {isThai ? value : selectedItem.name_th}
              </span>
            )}
          </div>
          <button type="button" onClick={() => { setIsOpen(true); setQuery(""); setHighlightedIndex(0); }} className={`text-[11px] font-semibold shrink-0 px-2.5 py-1 rounded-lg cursor-pointer ${isLight ? "bg-slate-200 hover:bg-slate-300 text-[#222]" : "bg-[#383838] hover:bg-[#444] text-white"}`}>
            {isThai ? "เปลี่ยน" : "Change"}
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative flex items-center">
            <input
              type="text"
              autoFocus={isOpen}
              value={query}
              onChange={(e) => { setQuery(e.target.value); setHighlightedIndex(0); if (!isOpen) setIsOpen(true); }}
              onFocus={() => { setIsOpen(true); setHighlightedIndex(0); }}
              onKeyDown={handleKeyDown}
              placeholder={isThai ? "ค้นหาสาขาวิชา" : "Search major subject"}
              className={`w-full p-2.5 pl-8 pr-7 rounded-lg border text-xs outline-none bg-[var(--canvas)] ${isLight ? "border-[#737D88] text-[#222222] focus:border-[#222222]" : "border-[#E4E4E7] text-[#F4F4F5] focus:border-white"}`}
            />
            <Search size={13} className="absolute left-2.5 pointer-events-none text-slate-400" />
            {query && (
              <button type="button" onClick={() => { setQuery(""); setHighlightedIndex(0); }} className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer">
                <X size={11} />
              </button>
            )}
          </div>
          {isOpen && (
            <div className={`absolute top-full left-0 right-0 mt-1 z-50 max-h-[220px] overflow-y-auto rounded-xl border shadow-2xl flex flex-col p-1 gap-0.5 animate-in fade-in zoom-in-95 duration-150 ${isLight ? "bg-white/97 border-[#E4E4E7] text-[#222222]" : "bg-[var(--canvas)]/97 border-[#444444] text-white"}`}>
              {results.map((item, idx) => {
                const isSelected = value === item.name_en;
                const isHigh = idx === highlightedIndex;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center gap-2 cursor-pointer transition-all ${
                      isSelected
                        ? isLight
                          ? "bg-[#222222] text-white font-semibold"
                          : "bg-white text-[#222222] font-semibold"
                        : isHigh
                        ? isLight
                          ? "bg-slate-200/80 text-[#222222] font-medium"
                          : "bg-[#383838] text-white font-medium"
                        : isLight
                        ? "hover:bg-slate-100"
                        : "hover:bg-[#383838]"
                    }`}
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="font-semibold truncate leading-tight">{isThai ? item.name_th : item.name_en}</span>
                      <span className={`text-[10px] truncate mt-0.5 ${isSelected ? "opacity-70" : (isLight ? "text-slate-500" : "text-slate-400")}`}>{isThai ? item.name_en : item.name_th}</span>
                    </div>
                    {isSelected && <Check size={13} className="shrink-0" />}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => { if (query) onChange(query); setIsOpen(false); }}
                onMouseEnter={() => setHighlightedIndex(results.length)}
                className={`w-full px-2.5 py-1.5 mt-0.5 border-t rounded-lg text-left text-xs flex items-center gap-1 cursor-pointer font-semibold ${
                  highlightedIndex === results.length
                    ? isLight
                      ? "bg-slate-200/80 text-[var(--status-info)]"
                      : "bg-[#383838] text-[var(--status-info)]"
                    : isLight
                    ? "border-slate-100 hover:bg-slate-50 text-[var(--status-info)]"
                    : "border-zinc-700/60 hover:bg-[var(--cards)] text-[var(--status-info)]"
                }`}
              >
                <Plus size={12} />
                <span>{isThai ? "ระบุสาขาวิชาเอง" : "Enter custom major"}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MajorSubjectAutocomplete;
