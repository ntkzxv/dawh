"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";
import type { FormCustomSelectProps } from "../types";

export function FormCustomSelect({
  id,
  value,
  placeholder,
  options,
  isOpen,
  onToggle,
  onSelect,
  isLight,
  isInvalid,
  icon,
}: FormCustomSelectProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});

  useEffect(() => {
    setMounted(true);
  }, []);

  const selectedIndex = options.findIndex((o) => o.value === value);
  const [highlightedIndex, setHighlightedIndex] = useState<number | null>(null);
  const activeHighlightedIndex =
    highlightedIndex !== null && highlightedIndex < options.length
      ? highlightedIndex
      : selectedIndex >= 0
      ? selectedIndex
      : 0;
  const selectedOption = options.find((o) => o.value === value);

  const updatePosition = useCallback(() => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const openUpward = spaceBelow < 220 && spaceAbove > spaceBelow;

    const style: React.CSSProperties = {
      position: "fixed",
      zIndex: 99999,
      left: `${Math.max(8, Math.min(rect.left, viewportWidth - rect.width - 8))}px`,
      width: `${rect.width}px`,
      maxWidth: `${Math.min(viewportWidth - 16, rect.width)}px`,
    };

    if (openUpward) {
      style.bottom = `${Math.max(8, viewportHeight - rect.top + 6)}px`;
      style.transformOrigin = "bottom";
    } else {
      style.top = `${Math.max(8, rect.bottom + 6)}px`;
      style.transformOrigin = "top";
    }

    setMenuStyle(style);
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePosition();
    }
  }, [isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleScroll = (e: Event) => {
      if (menuRef.current?.contains(e.target as Node)) return;
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > window.innerHeight) {
          onToggle();
          return;
        }
      }
      updatePosition();
    };

    window.addEventListener("scroll", handleScroll, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", handleScroll, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen, onToggle, updatePosition]);

  const handleToggle = () => {
    const nextWillOpen = !isOpen;
    setHighlightedIndex(null);
    if (nextWillOpen) {
      updatePosition();
    }
    onToggle();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        setHighlightedIndex(selectedIndex >= 0 ? selectedIndex : 0);
        onToggle();
      }
      return;
    }

    if (options.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((activeHighlightedIndex + 1) % options.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((activeHighlightedIndex - 1 + options.length) % options.length);
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      if (options[activeHighlightedIndex]) {
        onSelect(options[activeHighlightedIndex].value);
        setHighlightedIndex(null);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      setHighlightedIndex(null);
      onToggle();
    }
  };

  return (
    <div className="relative w-full" ref={containerRef} data-custom-dropdown={id}>
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`w-full p-2.5 min-h-[38px] rounded-lg border text-xs flex items-center justify-between transition-all outline-none cursor-pointer ${
          isOpen
            ? isLight
              ? "border-[#222222] ring-2 ring-[#222222]/10 bg-white"
              : "border-white ring-2 ring-white/10 bg-[#333333]"
            : isInvalid
            ? "border-red-500 bg-red-50/10"
            : isLight
            ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222] hover:bg-[#EBEBEB]"
            : "bg-[#282828] border-[#444444] text-[#FFFFFF] hover:bg-[#303030]"
        }`}
      >
        <div className="flex items-center gap-2 truncate">
          {icon && (
            <span
              className={`shrink-0 ${
                isLight ? "text-[#222222]" : "text-[#FFFFFF]"
              }`}
            >
              {icon}
            </span>
          )}
          {selectedOption?.badge && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 ${
                isLight ? "bg-[#222222] text-white" : "bg-[#444444] text-white"
              }`}
            >
              {selectedOption.badge}
            </span>
          )}
          <span
            className={`truncate ${
              !selectedOption?.value
                ? isLight
                  ? "text-slate-400"
                  : "text-zinc-500"
                : "font-medium"
            }`}
          >
            {selectedOption ? selectedOption.label : placeholder || "—"}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`shrink-0 ml-1.5 transition-transform duration-200 ${
            isOpen
              ? "rotate-180 text-[#222222] dark:text-white"
              : isLight
              ? "text-[#666666]"
              : "text-[#A1A1AA]"
          }`}
        />
      </button>

      {isOpen &&
        mounted &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            data-custom-dropdown={id}
            style={menuStyle}
            className={`max-h-[220px] overflow-y-auto dropdown-scrollbar pr-1.5 rounded-xl border shadow-2xl backdrop-blur-md flex flex-col p-1.5 gap-1 animate-in fade-in zoom-in-95 duration-150 ${
              isLight
                ? "bg-white/95 border-[#E4E4E7] shadow-xl text-[#222222]"
                : "bg-[#2B2B2B]/95 border-[#444444] shadow-2xl text-[#FFFFFF]"
            }`}
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === activeHighlightedIndex;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onSelect(opt.value);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={`w-full p-2 rounded-lg flex items-center justify-between text-left transition-all cursor-pointer ${
                    isSelected
                      ? isLight
                        ? "bg-[#222222] text-white shadow-sm font-semibold"
                        : "bg-white text-[#222222] shadow-sm font-semibold"
                      : isHighlighted
                      ? isLight
                        ? "bg-slate-200/80 text-[#222222] font-medium"
                        : "bg-[#383838] text-white font-medium"
                      : isLight
                      ? "hover:bg-slate-100 text-[#222222]"
                      : "hover:bg-[#383838] text-[#E4E4E7]"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    {opt.badge && (
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
                        {opt.badge}
                      </span>
                    )}
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-semibold truncate leading-tight">
                        {opt.label}
                      </span>
                      {opt.sublabel && (
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
                          {opt.sublabel}
                        </span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>,
          document.body
        )}
    </div>
  );
}

export default FormCustomSelect;
