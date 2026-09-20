"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  MapPin,
  Lock,
  CheckCircle2,
  Check,
  X,
  Loader2,
  Sun,
  Moon,
  Globe,
  ArrowLeft,
  ChevronDown,
  LayoutGrid,
  ShieldCheck,
  Monitor,
  Settings,
  LogOut,
  Building2,
  Briefcase,
  GraduationCap,
  Calendar,
  AlertCircle,
  KeyRound,
  UserCheck,
  Phone,
  Mail,
  Home,
  User,
  Heart,
  CreditCard,
  DollarSign,
  Clock,
  Fingerprint,
  FileText,
  Search,
  Plus,
  Copy,
  Pencil,
  Camera,
  Delete,
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useNotification } from "@/context/NotificationContext";
import { authClient, getCurrentSession, logout } from "@/lib/auth-client";
import { fetchAndStoreUserProfile, toEmployeeProfile } from "@/lib/user-profile";
import { apiPut } from "@/lib/api/client";
import { getOnboardingOptions } from "@/lib/api/onboarding";
import { getAppMe, checkIsAdmin, type AppMe } from "@/lib/api/session";
import { ApiRequestError } from "@/lib/api/client";
import { readPendingRegistrationProfile } from "@/lib/auth/pending-profile";
import { isValidIsoDate, isValidPhone, isValidThaiCitizenId } from "@/lib/profiles/client-validation";
import {
  EmployeeProfile,
  Branch,
  DEFAULT_BRANCHES,
  formatBranchName,
  formatMaritalStatus,
  formatRelativeTime,
  formatPrefix,
  getPrefixDisplayLabel,
  normalizePrefix,
  formatBirthDate,
} from "@/types/user";
import { useLoading } from "@/components/loading_screen";
import { HeaderNavbar, MobileNavbar } from "@/components/navbar";
import { AvatarCropModal } from "@/components/users/AvatarCropModal";
import { useAppLanguage, setAppLanguage } from "@/utils/language";
import {
  searchUniversities,
  searchThaiAddress,
  formatThaiAddressString,
  formatEnglishAddressString,
  UniversityItem,
  ThaiAddressItem,
  THAI_ADDRESS_DATA,
  getProvinces,
  getDistricts,
  getSubdistricts,
  findAddressItem,
  searchMajorSubjects,
  MajorSubjectItem,
} from "@/data/masterData";

const PRESET_RELIGIONS = ["พุทธ", "อิสลาม", "คริสต์", "ฮินดู", "ซิกข์", "ไม่นับถือศาสนา"];

export interface FormCustomSelectOption {
  value: string;
  label: string;
  sublabel?: string | null;
  badge?: string;
}

export interface FormCustomSelectProps {
  id: string;
  value: string;
  placeholder?: string;
  options: FormCustomSelectOption[];
  isOpen: boolean;
  onToggle: () => void;
  onSelect: (val: string) => void;
  isLight: boolean;
  isInvalid?: boolean;
  icon?: React.ReactNode;
}

function FormCustomSelect({
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

function UniversitySearchSelect({
  valueTh,
  valueEn,
  onChange,
  isLight,
  isThai,
}: {
  valueTh?: string;
  valueEn?: string;
  onChange: (th: string, en: string) => void;
  isLight: boolean;
  isThai: boolean;
}) {
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

// Internal address state shape
interface AddressParts {
  houseNo: string;       // บ้านเลขที่
  moo?: string;          // เลขหมู่บ้าน
  soi?: string;          // ซอย
  province_en: string;
  district_en: string;
  subdistrict_en: string;
  zipcode: string;
}

function translateThaiSoiToEn(val: string): string {
  if (!val) return "";
  let s = val.trim();
  if (s.startsWith("ซอย")) {
    s = s.substring(3).trim();
  } else if (s.startsWith("ซ.")) {
    s = s.substring(2).trim();
  }
  return s ? `Soi ${s}` : "";
}

function parseDetailAddress(detailStr: string): { houseNo: string; moo: string; soi: string } {
  const result = { houseNo: "", moo: "", soi: "" };
  if (!detailStr) return result;

  let text = detailStr.trim();

  // Check for Soi / ซอย
  const soiMatch = text.match(/(?:Soi|ซอย|ซ\.)\s*(.+)$/i);
  if (soiMatch && soiMatch.index !== undefined) {
    result.soi = soiMatch[1].trim();
    text = text.substring(0, soiMatch.index).trim();
  }

  // Check for Moo / หมู่
  const mooMatch = text.match(/(?:Moo|หมู่ที่|หมู่|ม\.)\s*(\d+[^\s]*)/i);
  if (mooMatch && mooMatch.index !== undefined) {
    result.moo = mooMatch[1].trim();
    const idx = mooMatch.index;
    text = (text.substring(0, idx) + " " + text.substring(idx + mooMatch[0].length)).trim();
  }

  result.houseNo = text.trim();
  return result;
}

function parseAddressString(addr: string): AddressParts {
  const result: AddressParts = { houseNo: "", moo: "", soi: "", province_en: "", district_en: "", subdistrict_en: "", zipcode: "" };
  if (!addr) return result;

  const rawParts = addr.split(",").map((s) => s.trim());

  // 1. Strict 4-part representation: [detailText, subdistrict_en, district_en, province_en zipcode]
  if (rawParts.length === 4) {
    const detailRaw = rawParts[0];
    result.subdistrict_en = rawParts[1];
    result.district_en = rawParts[2];
    const provZipRaw = rawParts[3];

    if (provZipRaw) {
      const lastSpaceIdx = provZipRaw.lastIndexOf(" ");
      if (lastSpaceIdx !== -1) {
        const potentialZip = provZipRaw.substring(lastSpaceIdx + 1).trim();
        if (/^\d{5}$/.test(potentialZip)) {
          result.zipcode = potentialZip;
          result.province_en = provZipRaw.substring(0, lastSpaceIdx).trim();
        } else {
          result.province_en = provZipRaw.trim();
        }
      } else {
        result.province_en = provZipRaw.trim();
      }
    }

    const detail = parseDetailAddress(detailRaw);
    result.houseNo = detail.houseNo;
    result.moo = detail.moo;
    result.soi = detail.soi;
    return result;
  }

  // 2. Intelligent token / keyword match with master data fallback
  const zipMatch = addr.match(/\b(\d{5})\b/);
  if (zipMatch) {
    result.zipcode = zipMatch[1];
  }

  for (const item of THAI_ADDRESS_DATA) {
    if (rawParts.some((p) => p.toLowerCase() === item.province_en.toLowerCase() || p.includes(item.province_th) || p.startsWith(item.province_en))) {
      result.province_en = item.province_en;
      break;
    }
  }

  if (result.province_en) {
    for (const item of THAI_ADDRESS_DATA) {
      if (item.province_en === result.province_en) {
        if (rawParts.some((p) => p.toLowerCase() === item.district_en.toLowerCase() || p.includes(item.district_th))) {
          result.district_en = item.district_en;
          break;
        }
      }
    }
  }

  if (result.province_en && result.district_en) {
    for (const item of THAI_ADDRESS_DATA) {
      if (item.province_en === result.province_en && item.district_en === result.district_en) {
        if (rawParts.some((p) => p.toLowerCase() === item.subdistrict_en.toLowerCase() || p.includes(item.subdistrict_th))) {
          result.subdistrict_en = item.subdistrict_en;
          if (!result.zipcode) result.zipcode = item.zipcode;
          break;
        }
      }
    }
  }

  const detail = parseDetailAddress(rawParts[0] || "");
  result.houseNo = detail.houseNo;
  result.moo = detail.moo;
  result.soi = detail.soi;

  return result;
}

function buildEnglishAddress(parts: AddressParts): string {
  const { houseNo, moo, soi, subdistrict_en, district_en, province_en, zipcode } = parts;
  
  const detailParts: string[] = [];
  if (houseNo && houseNo.trim()) detailParts.push(houseNo.trim());
  if (moo && moo.trim()) {
    let m = moo.trim();
    if (m.startsWith("หมู่ที่")) m = m.substring(7).trim();
    else if (m.startsWith("หมู่")) m = m.substring(4).trim();
    else if (m.startsWith("ม.")) m = m.substring(2).trim();
    detailParts.push(`Moo ${m}`);
  }
  if (soi && soi.trim()) {
    detailParts.push(translateThaiSoiToEn(soi));
  }

  const detailText = detailParts.join(" ");
  const provZip = [province_en, zipcode].filter(Boolean).join(" ");
  return [detailText, subdistrict_en || "", district_en || "", provZip || ""].join(", ");
}

function ThaiAddressSelector({
  label,
  value,
  onChange,
  isLight,
  isThai,
  isRequired,
  isInvalid,
  onCopyFromCurrent,
  showCopyButton,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  isLight: boolean;
  isThai: boolean;
  isRequired?: boolean;
  isInvalid?: boolean;
  onCopyFromCurrent?: () => void;
  showCopyButton?: boolean;
}) {
  const [prevValue, setPrevValue] = useState(value);
  const parsed = useMemo(() => parseAddressString(value), [value]);
  const [houseNo, setHouseNo] = useState(parsed.houseNo);
  const [moo, setMoo] = useState(parsed.moo || "");
  const [soi, setSoi] = useState(parsed.soi || "");
  const [selectedProvince, setSelectedProvince] = useState(parsed.province_en);
  const [selectedDistrict, setSelectedDistrict] = useState(parsed.district_en);
  const [selectedSubdistrict, setSelectedSubdistrict] = useState(parsed.subdistrict_en);
  const [zipcode, setZipcode] = useState(parsed.zipcode);

  // Sync internal state during render when value prop changes externally (e.g. Copy from Current Address)
  if (value !== prevValue) {
    setPrevValue(value);
    const parsedNew = parseAddressString(value);
    setHouseNo(parsedNew.houseNo);
    setMoo(parsedNew.moo || "");
    setSoi(parsedNew.soi || "");
    setSelectedProvince(parsedNew.province_en);
    setSelectedDistrict(parsedNew.district_en);
    setSelectedSubdistrict(parsedNew.subdistrict_en);
    setZipcode(parsedNew.zipcode);
  }

  const [activeField, setActiveField] = useState<"province" | "district" | "subdistrict" | null>(null);
  const [provinceSearch, setProvinceSearch] = useState("");
  const [districtSearch, setDistrictSearch] = useState("");
  const [subdistrictSearch, setSubdistrictSearch] = useState("");
  const containerRef = useRef<HTMLDivElement | null>(null);

  const provinces = useMemo(() => getProvinces(), []);
  const districts = useMemo(() => selectedProvince ? getDistricts(selectedProvince) : [], [selectedProvince]);
  const subdistricts = useMemo(() => selectedProvince && selectedDistrict ? getSubdistricts(selectedProvince, selectedDistrict) : [], [selectedProvince, selectedDistrict]);

  const filteredProvinces = useMemo(() => {
    if (!provinceSearch) return provinces;
    const q = provinceSearch.toLowerCase();
    return provinces.filter((p) => p.province_th.toLowerCase().includes(q) || p.province_en.toLowerCase().includes(q));
  }, [provinces, provinceSearch]);

  const filteredDistricts = useMemo(() => {
    if (!districtSearch) return districts;
    const q = districtSearch.toLowerCase();
    return districts.filter((d) => d.district_th.toLowerCase().includes(q) || d.district_en.toLowerCase().includes(q));
  }, [districts, districtSearch]);

  const filteredSubdistricts = useMemo(() => {
    if (!subdistrictSearch) return subdistricts;
    const q = subdistrictSearch.toLowerCase();
    return subdistricts.filter((s) => s.subdistrict_th.toLowerCase().includes(q) || s.subdistrict_en.toLowerCase().includes(q));
  }, [subdistricts, subdistrictSearch]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setActiveField(null);
      }
    };
    if (activeField) {
      document.addEventListener("mousedown", handler);
      return () => document.removeEventListener("mousedown", handler);
    }
  }, [activeField]);

  // Sync houseNo, moo, soi and selections back out as english string whenever parts change
  const pushChange = useCallback((parts: Partial<AddressParts>) => {
    const next: AddressParts = {
      houseNo,
      moo,
      soi,
      province_en: selectedProvince,
      district_en: selectedDistrict,
      subdistrict_en: selectedSubdistrict,
      zipcode,
      ...parts,
    };
    onChange(buildEnglishAddress(next));
  }, [houseNo, moo, soi, selectedProvince, selectedDistrict, selectedSubdistrict, zipcode, onChange]);

  const handleSelectProvince = (p: { province_en: string }) => {
    setSelectedProvince(p.province_en);
    setSelectedDistrict("");
    setSelectedSubdistrict("");
    setZipcode("");
    setActiveField(null);
    setProvinceSearch("");
    setHighlightedIndex(0);
    pushChange({ province_en: p.province_en, district_en: "", subdistrict_en: "", zipcode: "" });
  };

  const handleSelectDistrict = (d: { district_en: string }) => {
    setSelectedDistrict(d.district_en);
    setSelectedSubdistrict("");
    setZipcode("");
    setActiveField(null);
    setDistrictSearch("");
    setHighlightedIndex(0);
    pushChange({ district_en: d.district_en, subdistrict_en: "", zipcode: "" });
  };

  const handleSelectSubdistrict = (s: { subdistrict_en: string; zipcode: string }) => {
    setSelectedSubdistrict(s.subdistrict_en);
    setZipcode(s.zipcode);
    setActiveField(null);
    setSubdistrictSearch("");
    setHighlightedIndex(0);
    // Find item to get full province label
    const item = findAddressItem(selectedProvince, selectedDistrict, s.subdistrict_en);
    const prov = item?.province_en || selectedProvince;
    pushChange({ subdistrict_en: s.subdistrict_en, zipcode: s.zipcode, province_en: prov });
  };

  const handleHouseNoChange = (val: string) => {
    setHouseNo(val);
    pushChange({ houseNo: val });
  };

  const handleMooChange = (val: string) => {
    setMoo(val);
    pushChange({ moo: val });
  };

  const handleSoiChange = (val: string) => {
    setSoi(val);
    pushChange({ soi: val });
  };

  const [highlightedIndex, setHighlightedIndex] = useState(0);

  // Handle keyboard navigation (ArrowUp, ArrowDown, Enter, Escape)
  const handleKeyDown = (
    e: React.KeyboardEvent,
    listLength: number,
    onSelectCurrent: (index: number) => void
  ) => {
    if (listLength === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % listLength);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 + listLength) % listLength);
    } else if (e.key === "Enter") {
      e.preventDefault();
      onSelectCurrent(highlightedIndex);
    } else if (e.key === "Escape") {
      e.preventDefault();
      setActiveField(null);
    }
  };

  const baseInput = `w-full p-2.5 rounded-lg border text-xs outline-none transition-all ${isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222] focus:bg-white focus:border-[#222222]" : "bg-[#282828] border-[#444444] text-[#FFFFFF] focus:bg-[#202020] focus:border-white"}`;
  const dropdownClass = `absolute top-full left-0 right-0 mt-1 z-50 max-h-[200px] overflow-y-auto rounded-xl border shadow-2xl flex flex-col p-1 gap-0.5 animate-in fade-in zoom-in-95 duration-150 ${isLight ? "bg-white/97 border-[#E4E4E7] text-[#222222]" : "bg-[#2B2B2B]/97 border-[#444444] text-[#FFFFFF]"}`;
  const optionClass = (sel: boolean, isHigh: boolean) => `w-full px-2.5 py-1.5 rounded-lg text-left text-xs flex items-center gap-2 cursor-pointer transition-all ${
    sel
      ? (isLight ? "bg-[#222222] text-white font-semibold" : "bg-white text-[#222222] font-semibold")
      : isHigh
      ? (isLight ? "bg-slate-200/80 font-medium" : "bg-[#383838] text-white font-medium")
      : (isLight ? "hover:bg-slate-100" : "hover:bg-[#383838]")
  }`;

  return (
    <div className="flex flex-col gap-2 w-full" ref={containerRef}>
      <div className="flex items-center justify-between gap-2">
        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
          {label} {isRequired && "*"}
        </label>
        {showCopyButton && onCopyFromCurrent && (
          <button
            type="button"
            onClick={onCopyFromCurrent}
            className={`text-[11px] font-medium flex items-center gap-1.5 transition-colors cursor-pointer select-none ${
              isLight
                ? "text-zinc-600 hover:text-black hover:underline"
                : "text-zinc-400 hover:text-white hover:underline"
            }`}
          >
            <Copy
              size={12}
              className={isLight ? "text-zinc-600" : "text-zinc-400"}
            />
            <span>{isThai ? "ใช้ที่อยู่เดียวกับที่อยู่ปัจจุบัน" : "Same as Current Address"}</span>
          </button>
        )}
      </div>

      {/* Row 1: Province + District */}
      <div className="grid grid-cols-2 gap-2">
        {/* Province */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setActiveField((f) => f === "province" ? null : "province")}
            className={`${baseInput} w-full flex items-center justify-between cursor-pointer`}
          >
            <span className={selectedProvince ? "font-medium" : (isLight ? "text-slate-400" : "text-zinc-500")}>
              {selectedProvince
                ? (isThai ? provinces.find((p) => p.province_en === selectedProvince)?.province_th || selectedProvince : selectedProvince)
                : (isThai ? "จังหวัด *" : "Province *")}
            </span>
            <ChevronDown size={13} className={`shrink-0 ml-1 transition-transform ${activeField === "province" ? "rotate-180" : ""} ${isLight ? "text-slate-500" : "text-zinc-400"}`} />
          </button>
          {activeField === "province" && (
            <div className={dropdownClass}>
              <div className="p-1">
                <input
                  autoFocus
                  type="text"
                  value={provinceSearch}
                  onChange={(e) => setProvinceSearch(e.target.value)}
                  onKeyDown={(e) =>
                    handleKeyDown(e, filteredProvinces.length, (idx) => {
                      if (filteredProvinces[idx]) handleSelectProvince(filteredProvinces[idx]);
                    })
                  }
                  placeholder={isThai ? "ค้นหาจังหวัด (↑↓ เพื่อเลือก Enter เพื่อยืนยัน)" : "Search province (↑↓ to navigate)"}
                  className={`w-full px-2 py-1.5 rounded-lg border text-xs outline-none ${isLight ? "bg-[#F5F5F5] border-[#E5E5E5]" : "bg-[#333] border-[#555]"}`}
                />
              </div>
              {filteredProvinces.map((p, idx) => (
                <button
                  key={p.province_en}
                  type="button"
                  onClick={() => handleSelectProvince(p)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={optionClass(selectedProvince === p.province_en, highlightedIndex === idx)}
                >
                  {isThai ? p.province_th : p.province_en}
                </button>
              ))}
              {filteredProvinces.length === 0 && <div className="px-3 py-2 text-[11px] text-slate-400">{isThai ? "ไม่พบจังหวัด" : "No results"}</div>}
            </div>
          )}
        </div>

        {/* District */}
        <div className="relative">
          <button
            type="button"
            disabled={!selectedProvince}
            onClick={() => setActiveField((f) => f === "district" ? null : "district")}
            className={`${baseInput} w-full flex items-center justify-between ${selectedProvince ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
          >
            <span className={selectedDistrict ? "font-medium" : (isLight ? "text-slate-400" : "text-zinc-500")}>
              {selectedDistrict
                ? (isThai ? districts.find((d) => d.district_en === selectedDistrict)?.district_th || selectedDistrict : selectedDistrict)
                : (isThai ? "อำเภอ/เขต" : "District")}
            </span>
            <ChevronDown size={13} className={`shrink-0 ml-1 transition-transform ${activeField === "district" ? "rotate-180" : ""} ${isLight ? "text-slate-500" : "text-zinc-400"}`} />
          </button>
          {activeField === "district" && (
            <div className={dropdownClass}>
              <div className="p-1">
                <input
                  autoFocus
                  type="text"
                  value={districtSearch}
                  onChange={(e) => setDistrictSearch(e.target.value)}
                  onKeyDown={(e) =>
                    handleKeyDown(e, filteredDistricts.length, (idx) => {
                      if (filteredDistricts[idx]) handleSelectDistrict(filteredDistricts[idx]);
                    })
                  }
                  placeholder={isThai ? "ค้นหาอำเภอ (↑↓ เพื่อเลือก Enter เพื่อยืนยัน)" : "Search district (↑↓ to navigate)"}
                  className={`w-full px-2 py-1.5 rounded-lg border text-xs outline-none ${isLight ? "bg-[#F5F5F5] border-[#E5E5E5]" : "bg-[#333] border-[#555]"}`}
                />
              </div>
              {filteredDistricts.map((d, idx) => (
                <button
                  key={d.district_en}
                  type="button"
                  onClick={() => handleSelectDistrict(d)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={optionClass(selectedDistrict === d.district_en, highlightedIndex === idx)}
                >
                  {isThai ? d.district_th : d.district_en}
                </button>
              ))}
              {filteredDistricts.length === 0 && <div className="px-3 py-2 text-[11px] text-slate-400">{isThai ? "ไม่พบอำเภอ" : "No results"}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Subdistrict + Zipcode */}
      <div className="grid grid-cols-2 gap-2">
        {/* Subdistrict */}
        <div className="relative">
          <button
            type="button"
            disabled={!selectedDistrict}
            onClick={() => setActiveField((f) => f === "subdistrict" ? null : "subdistrict")}
            className={`${baseInput} w-full flex items-center justify-between ${selectedDistrict ? "cursor-pointer" : "opacity-50 cursor-not-allowed"}`}
          >
            <span className={selectedSubdistrict ? "font-medium" : (isLight ? "text-slate-400" : "text-zinc-500")}>
              {selectedSubdistrict
                ? (isThai ? subdistricts.find((s) => s.subdistrict_en === selectedSubdistrict)?.subdistrict_th || selectedSubdistrict : selectedSubdistrict)
                : (isThai ? "ตำบล/แขวง" : "Subdistrict")}
            </span>
            <ChevronDown size={13} className={`shrink-0 ml-1 transition-transform ${activeField === "subdistrict" ? "rotate-180" : ""} ${isLight ? "text-slate-500" : "text-zinc-400"}`} />
          </button>
          {activeField === "subdistrict" && (
            <div className={dropdownClass}>
              <div className="p-1">
                <input
                  autoFocus
                  type="text"
                  value={subdistrictSearch}
                  onChange={(e) => setSubdistrictSearch(e.target.value)}
                  onKeyDown={(e) =>
                    handleKeyDown(e, filteredSubdistricts.length, (idx) => {
                      if (filteredSubdistricts[idx]) handleSelectSubdistrict(filteredSubdistricts[idx]);
                    })
                  }
                  placeholder={isThai ? "ค้นหาตำบล (↑↓ เพื่อเลือก Enter เพื่อยืนยัน)" : "Search subdistrict (↑↓ to navigate)"}
                  className={`w-full px-2 py-1.5 rounded-lg border text-xs outline-none ${isLight ? "bg-[#F5F5F5] border-[#E5E5E5]" : "bg-[#333] border-[#555]"}`}
                />
              </div>
              {filteredSubdistricts.map((s, idx) => (
                <button
                  key={`${s.subdistrict_en}-${s.zipcode}`}
                  type="button"
                  onClick={() => handleSelectSubdistrict(s)}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                  className={optionClass(selectedSubdistrict === s.subdistrict_en, highlightedIndex === idx)}
                >
                  <span className="flex-1 text-left">{isThai ? s.subdistrict_th : s.subdistrict_en}</span>
                  <span className={`font-mono text-[10px] shrink-0 ${isLight ? "text-slate-400" : "text-zinc-500"}`}>{s.zipcode}</span>
                </button>
              ))}
              {filteredSubdistricts.length === 0 && <div className="px-3 py-2 text-[11px] text-slate-400">{isThai ? "ไม่พบตำบล" : "No results"}</div>}
            </div>
          )}
        </div>

        {/* Zipcode (auto-filled) */}
        <input
          type="text"
          readOnly
          value={zipcode}
          placeholder={isThai ? "รหัสไปรษณีย์" : "Zipcode"}
          className={`${baseInput} font-mono cursor-default ${isLight ? "bg-[#EFEFEF]" : "bg-[#202020]"}`}
        />
      </div>

      {/* Row 3: 3 Separate Boxes (บ้านเลขที่, เลขหมู่บ้าน, ซอย) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {/* 1. บ้านเลขที่ (House No.) */}
        <input
          type="text"
          value={houseNo}
          onChange={(e) => handleHouseNoChange(e.target.value)}
          placeholder={isThai ? "บ้านเลขที่" : "House No."}
          className={baseInput}
        />

        {/* 2. เลขหมู่บ้าน (Village / Moo) */}
        <input
          type="text"
          value={moo}
          onChange={(e) => handleMooChange(e.target.value)}
          placeholder={isThai ? "เลขหมู่บ้าน (ถ้ามี)" : "Village / Moo (optional)"}
          className={baseInput}
        />

        {/* 3. ซอย (Soi) */}
        <input
          type="text"
          value={soi}
          onChange={(e) => handleSoiChange(e.target.value)}
          placeholder={isThai ? "ซอย (ถ้ามี)" : "Soi / Alley (optional)"}
          className={baseInput}
        />
      </div>
    </div>
  );
}

// MajorSubjectAutocomplete Component
function MajorSubjectAutocomplete({
  value,
  onChange,
  isLight,
  isThai,
}: {
  value: string;
  onChange: (en: string) => void;
  isLight: boolean;
  isThai: boolean;
}) {
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
        <div className={`p-2.5 rounded-lg border flex items-center justify-between gap-2 ${isLight ? "bg-[#F5F5F5] border-[#E5E5E5]" : "bg-[#282828] border-[#444444]"}`}>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-semibold truncate">{isThai ? (selectedItem?.name_th || value) : value}</span>
            {selectedItem && (
              <span className={`text-[10px] truncate mt-0.5 ${isLight ? "text-[#666]" : "text-[#A1A1AA]"}`}>
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
              className={`w-full p-2.5 pl-8 pr-7 rounded-lg border text-xs outline-none ${isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222] focus:bg-white focus:border-[#222222]" : "bg-[#282828] border-[#444444] text-white focus:bg-[#202020] focus:border-white"}`}
            />
            <Search size={13} className="absolute left-2.5 pointer-events-none text-slate-400" />
            {query && (
              <button type="button" onClick={() => { setQuery(""); setHighlightedIndex(0); }} className="absolute right-2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer">
                <X size={11} />
              </button>
            )}
          </div>
          {isOpen && (
            <div className={`absolute top-full left-0 right-0 mt-1 z-50 max-h-[220px] overflow-y-auto rounded-xl border shadow-2xl flex flex-col p-1 gap-0.5 animate-in fade-in zoom-in-95 duration-150 ${isLight ? "bg-white/97 border-[#E4E4E7] text-[#222222]" : "bg-[#2B2B2B]/97 border-[#444444] text-white"}`}>
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
                      ? "bg-slate-200/80 text-indigo-700"
                      : "bg-[#383838] text-indigo-300"
                    : isLight
                    ? "border-slate-100 hover:bg-slate-50 text-indigo-600"
                    : "border-zinc-700/60 hover:bg-[#353535] text-indigo-400"
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

export interface AccountViewProps {
  onNavigate?: (target: string) => void;
  onBack?: () => void;
  initialTab?: "profile" | "employment" | "security" | "admin";
}

export type SettingsViewProps = AccountViewProps;

export default function AccountView({
  onNavigate,
  onBack,
  initialTab = "profile",
}: AccountViewProps) {
  const router = useRouter();
  const { navigateWithLoading } = useLoading();
  const { theme, toggleTheme } = useTheme();
  const { notify } = useNotification();
  const isLight = theme === "light";

  // Tab State: 'profile' (Profile & Contact) | 'employment' (Employment Details) | 'security' (Change Email & Password) | 'admin' (Admin Control Panel)
  const [activeTab, setActiveTab] = useState<"profile" | "employment" | "security" | "admin">(() => {
    if (initialTab === "security" || initialTab === "employment" || initialTab === "profile" || initialTab === "admin") {
      return initialTab;
    }
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("tab");
      if (param === "security" || param === "password" || param === "email") return "security";
      if (param === "employment") return "employment";
      if (param === "admin") return "admin";
    }
    return "profile";
  });

  // Dropdown Menu State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Custom Dropdowns in Modal Form
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  // Language State with useAppLanguage hook
  const lang = useAppLanguage();
  const isThai = lang === "TH";

  // Close active custom dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-custom-dropdown]")) {
        setActiveDropdownId(null);
      }
    };
    if (activeDropdownId) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }
  }, [activeDropdownId]);

  const toggleLanguage = () => {
    const nextLang: "TH" | "EN" = lang === "TH" ? "EN" : "TH";
    setAppLanguage(nextLang);
  };

  // Profile State
  const [profile, setProfile] = useState<Partial<EmployeeProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [appMe, setAppMe] = useState<AppMe | null>(null);

  // Search State
  const [searchQuery, setSearchQuery] = useState("");

  // Modals State
  const [showSecondaryRegModal, setShowSecondaryRegModal] = useState(false);
  const [regStep, setRegStep] = useState<"fill" | "review">("fill");
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [showPinPromptModal, setShowPinPromptModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [showAvatarCropModal, setShowAvatarCropModal] = useState(false);

  const regFormScrollRef = useRef<HTMLDivElement | null>(null);
  const reviewScrollRef = useRef<HTMLDivElement | null>(null);
  const [isFormAtBottom, setIsFormAtBottom] = useState(false);
  const [isReviewAtBottom, setIsReviewAtBottom] = useState(false);

  const handleFormScroll = useCallback(() => {
    if (!regFormScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = regFormScrollRef.current;
    setIsFormAtBottom(scrollTop + clientHeight >= scrollHeight - 40);
  }, []);

  const handleReviewScroll = useCallback(() => {
    if (!reviewScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = reviewScrollRef.current;
    setIsReviewAtBottom(scrollTop + clientHeight >= scrollHeight - 40);
  }, []);

  useEffect(() => {
    if (showSecondaryRegModal) {
      setIsFormAtBottom(false);
      setIsReviewAtBottom(false);
      const timer = setTimeout(() => {
        handleFormScroll();
        handleReviewScroll();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [showSecondaryRegModal, regStep, handleFormScroll, handleReviewScroll]);

  // Religion Dropdown & Custom Input State
  const [religionChoice, setReligionChoice] = useState<string>("");
  const [customReligion, setCustomReligion] = useState<string>("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Prevent background scrolling when any modal is open
  useEffect(() => {
    const isAnyModalOpen =
      showSecondaryRegModal ||
      showPinPromptModal ||
      showPinSetupModal ||
      showPasswordModal ||
      showExitConfirmModal ||
      showAvatarCropModal;

    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [showSecondaryRegModal, showPinPromptModal, showPinSetupModal, showPasswordModal, showExitConfirmModal, showAvatarCropModal]);

  // Helper to detect invalid required fields
  const isFieldInvalid = (fieldName: string) => {
    if (!hasAttemptedSubmit) return false;
    switch (fieldName) {
      case "first_name_th":
        return !regForm.first_name_th.trim();
      case "last_name_th":
        return !regForm.last_name_th.trim();
      case "first_name":
        return !regForm.first_name.trim();
      case "last_name":
        return !regForm.last_name.trim();
      case "id_card":
        return regForm.id_card.trim().replace(/\D/g, "").length !== 13;
      case "birth_date":
        return !regForm.birth_date;
      case "phone":
        return !regForm.phone.trim();
      case "current_address":
        return !regForm.current_address.trim();
      case "registered_address":
        return !regForm.registered_address.trim();
      case "branch_name":
        return !regForm.branch_name.trim();
      default:
        return false;
    }
  };

  // Helper for dynamic input styling
  const getInputClass = (_fieldName?: string, extraClasses: string = "") => {
    return `p-2.5 rounded-lg border text-xs outline-none transition-all ${
      isLight
        ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222] focus:border-[#222222]"
        : "bg-[#282828] border-[#444444] text-[#FFFFFF] focus:border-white"
    } ${extraClasses}`;
  };

  // Corporate Branches List from DB with pre-seeded fallback
  const [branchesList] = useState<Branch[]>(DEFAULT_BRANCHES);

  // Secondary Registration Form State (Every single DB field)
  const [regForm, setRegForm] = useState({
    username: "",
    prefix: "mr",
    first_name_th: "",
    last_name_th: "",
    nickname_th: "",
    first_name: "",
    last_name: "",
    nickname: "",
    id_card: "",
    birth_date: "",
    gender: "ชาย",
    blood_type: "",
    marital_status: "",
    nationality: "",
    religion: "",
    phone: "",
    emergency_contact_name_th: "",
    emergency_contact_name: "",
    emergency_contact_relationship: "บิดา/มารดา",
    emergency_contact_phone: "",
    current_address: "",
    registered_address: "",
    department: "",
    branch_id: "00000000-0000-0000-0000-000000000001",
    branch_name: "สำนักงานใหญ่ (Headquarter)",
    education_level: "ปริญญาตรี",
    major_subject: "",
    university_th: "",
    university_en: "",
    university_name: "",
    bio: "",
  });

  // Resolved phone from register (locked if present)
  const lockedPhone = useMemo(() => {
    if (profile.phone) return profile.phone;
    if (typeof window !== "undefined") return localStorage.getItem("current_user_phone") || "";
    return "";
  }, [profile.phone]);

  // PIN Form State
  const [pinDigits, setPinDigits] = useState(["", "", "", "", "", ""]);
  const [confirmPinDigits, setConfirmPinDigits] = useState(["", "", "", "", "", ""]);
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");
  const [lastTypedPinIndex, setLastTypedPinIndex] = useState<number | null>(null);
  const [pinShake, setPinShake] = useState(false);
  const pinMorphTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const confirmPinInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Password Form Fields (Current, New, Confirm New)
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);

  // Security Tab Form State (Email & Password)
  const [newEmail, setNewEmail] = useState("");
  const [confirmNewEmail, setConfirmNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  // Password Strength Calculation (Identical to Register)
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: "", color: "bg-transparent", textClass: "" };

    const hasLength = newPassword.length >= 8 && newPassword.length <= 32;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    let score = 0;
    if (hasLength) score += 1;
    if (hasUppercase) score += 1;
    if (hasLowercase) score += 1;
    if (hasNumber) score += 1;

    if (score <= 1) {
      return {
        score: 1,
        label: isThai ? "ไม่ปลอดภัย (Weak)" : "Weak",
        color: isLight ? "bg-[#E74C3C]" : "bg-[#E71D36]",
        textClass: isLight ? "text-[#E74C3C] font-bold" : "text-[#E71D36] font-semibold",
      };
    }
    if (score === 2) {
      return {
        score: 2,
        label: isThai ? "ปานกลาง (Fair)" : "Fair",
        color: "bg-[#FF9F1C]",
        textClass: isLight ? "text-[#FF9F1C] font-bold" : "text-[#FF9F1C] font-semibold",
      };
    }
    if (score === 3) {
      return {
        score: 3,
        label: isThai ? "ระดับดี (Good)" : "Good",
        color: "bg-[#2EC4B6]",
        textClass: isLight ? "text-[#2EC4B6] font-bold" : "text-[#2EC4B6] font-semibold",
      };
    }
    return {
      score: 4,
      label: isThai ? "ปลอดภัยมาก (Strong)" : "Strong",
      color: "bg-[#2EC4B6]",
      textClass: isLight ? "text-[#2EC4B6] font-bold" : "text-[#2EC4B6] font-semibold",
    };
  }, [newPassword, isThai, isLight]);

  // Helper to sync form state from employee profile data
  const syncFormFromProfile = useCallback((data: Partial<EmployeeProfile>) => {
    const matchedBranch = DEFAULT_BRANCHES.find(
      (b) => b.id === data.branch_id || b.branch_name === data.branch_name || b.branch_code === data.branch_name
    );

    const currentReligion = data.religion || "";
    if (currentReligion && PRESET_RELIGIONS.includes(currentReligion)) {
      setReligionChoice(currentReligion);
      setCustomReligion("");
    } else if (currentReligion) {
      setReligionChoice("อื่นๆ");
      setCustomReligion(currentReligion);
    } else {
      setReligionChoice("");
      setCustomReligion("");
    }

    setRegForm({
      username: data.username || "",
      prefix: normalizePrefix(data.prefix),
      first_name_th: data.first_name_th || "",
      last_name_th: data.last_name_th || "",
      nickname_th: data.nickname_th || "",
      first_name: data.first_name || "",
      last_name: data.last_name || "",
      nickname: data.nickname || "",
      id_card: data.id_card || "",
      birth_date:
        data.birth_date ||
        (typeof window !== "undefined" ? localStorage.getItem("current_user_birth_date") || "" : ""),
      gender: data.gender || "ชาย",
      blood_type: data.blood_type || "",
      marital_status: data.marital_status || "",
      nationality: data.nationality || "",
      religion: currentReligion || "",
      phone: data.phone || (typeof window !== "undefined" ? localStorage.getItem("current_user_phone") || "" : ""),
      emergency_contact_name_th: data.emergency_contact_name_th || "",
      emergency_contact_name: data.emergency_contact_name || "",
      emergency_contact_relationship: data.emergency_contact_relationship || "บิดา/มารดา",
      emergency_contact_phone: data.emergency_contact_phone || "",
      current_address: data.current_address || "",
      registered_address: data.registered_address || "",
      department: data.department || "",
      branch_id: data.branch_id || matchedBranch?.id || "00000000-0000-0000-0000-000000000001",
      branch_name: data.branch_name || matchedBranch?.branch_name || "สำนักงานใหญ่ (Headquarter)",
      education_level: data.education_level || "ปริญญาตรี",
      major_subject: data.major_subject || "",
      university_th: data.university_th || data.university_name || "",
      university_en: data.university_en || "",
      university_name: data.university_name || data.university_th || "",
      bio: data.bio || "",
    });
  }, []);

  // Open Secondary Registration Modal Helper
  const openSecondaryRegistrationModal = () => {
    setRegStep("fill");
    setIsTermsAgreed(false);
    setModalError(null);
    setHasAttemptedSubmit(false);

    // Sync birth_date if present
    const resolvedBirthDate =
      regForm.birth_date ||
      profile.birth_date ||
      readPendingRegistrationProfile()?.birthDate ||
      (typeof window !== "undefined" ? localStorage.getItem("current_user_birth_date") || "" : "");
    if (resolvedBirthDate && !regForm.birth_date) {
      setRegForm((prev) => ({ ...prev, birth_date: resolvedBirthDate }));
    }

    // Auto-populate locked username from profile or email prefix if empty
    const resolvedUsername =
      regForm.username ||
      profile.username ||
      (profile.email ? profile.email.split("@")[0].replace(/[^a-zA-Z0-9._-]/g, "") : "") ||
      "";
    if (resolvedUsername && !regForm.username) {
      setRegForm((prev) => ({ ...prev, username: resolvedUsername }));
    }


    const currRel = regForm.religion || profile.religion || "";
    if (currRel) {
      if (PRESET_RELIGIONS.includes(currRel)) {
        setReligionChoice(currRel);
        setCustomReligion("");
      } else {
        setReligionChoice("อื่นๆ");
        setCustomReligion(currRel);
      }
    } else {
      setReligionChoice("");
      setCustomReligion("");
    }
    setShowSecondaryRegModal(true);
  };

  // Direct URL query parameter / hash routing (e.g. ?modal=register, ?modal=review, ?modal=pin)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const modalParam = params.get("modal");
      if (modalParam === "register" || modalParam === "fill") {
        openSecondaryRegistrationModal();
      } else if (modalParam === "review") {
        setRegStep("review");
        setShowSecondaryRegModal(true);
      } else if (modalParam === "pin") {
        setPinDigits(["", "", "", "", "", ""]);
        setConfirmPinDigits(["", "", "", "", "", ""]);
        setPinStep("enter");
        setShowPinSetupModal(true);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, []);

  // Close Dropdown on Outside Click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Fetch the canonical employee profile through the application API.
  useEffect(() => {
    // 1. Instant Cache Load (0ms)
    let cachedProfile: Partial<EmployeeProfile> | null = null;
    try {
      const cached = localStorage.getItem("dawh_user_profile");
      if (cached) {
        cachedProfile = JSON.parse(cached);
        if (cachedProfile) {
          setProfile(cachedProfile);
          syncFormFromProfile(cachedProfile);
        }
      }
    } catch {
      // Non-blocking
    }

    async function loadUserProfile() {
      if (!cachedProfile) {
        setIsLoading(true);
      }
      try {
        try {
          const me = await getAppMe();
          if (me?.data) {
            setAppMe(me.data);
          }
        } catch {
          // non-blocking
        }

        const session = await getCurrentSession();
        const targetId = session?.user.id;
        const targetEmail = session?.user.email;

        if (targetId) {
          // A profile endpoint can be temporarily unavailable while the access
          // configuration is being seeded. Keep the account page usable and
          // hydrate the identity captured during registration instead of
          // leaving every field blank.
          let fetched: EmployeeProfile | null = null;
          try {
            fetched = await fetchAndStoreUserProfile(targetId, targetEmail);
          } catch (profileError) {
            console.warn("Unable to load employee profile; using registration identity.", profileError);
          }

          if (fetched) {
            setProfile(fetched);
            syncFormFromProfile(fetched);
            return;
          }

          const pending = readPendingRegistrationProfile();
          const pendingProfile: Partial<EmployeeProfile> = {
            id: targetId,
            email: targetEmail || "",
            username: pending?.username || "",
            first_name: pending?.firstName || session.user.name?.split(" ")[0] || "",
            last_name: pending?.lastName || session.user.name?.split(" ").slice(1).join(" ") || "",
            birth_date: pending?.birthDate || "",
            phone: pending?.phone || "",
            full_name: session.user.name || undefined,
          };
          setProfile(pendingProfile);
          syncFormFromProfile(pendingProfile);
          setRegForm((current) => ({
            ...current,
            username: pendingProfile.username || current.username,
            first_name: pendingProfile.first_name || current.first_name,
            last_name: pendingProfile.last_name || current.last_name,
            birth_date: pendingProfile.birth_date || current.birth_date,
            phone: pendingProfile.phone || current.phone,
          }));
        }
      } catch (err) {
        console.error("Error loading user profile in settings:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserProfile();
  }, [syncFormFromProfile]);

  // Check if profile is incomplete (any missing key database fields)
  const missingFields: string[] = [];
  if (!profile.id_card) missingFields.push(isThai ? "เลขบัตรประชาชน" : "Citizen ID");
  if (!profile.phone) missingFields.push(isThai ? "เบอร์โทรศัพท์" : "Phone");

  if (!profile.current_address) missingFields.push(isThai ? "ที่อยู่ปัจจุบัน" : "Address");
  if (!profile.registered_address) missingFields.push(isThai ? "ที่อยู่ตามทะเบียนบ้าน" : "Registered Address");
  if (!profile.emergency_contact_phone && !profile.emergency_contact_name)
    missingFields.push(isThai ? "ผู้ติดต่อฉุกเฉิน" : "Emergency Contact");
  if (!profile.education_level) missingFields.push(isThai ? "วุฒิการศึกษา" : "Education");

  // [ENABLED] ตรวจสอบข้อมูลไม่สมบูรณ์เพื่อแสดงแบนเนอร์และการแจ้งเตือน (ตัด Quick PIN ออกเนื่องจากระบบ Auth ใหม่ไม่ใช้งาน PIN)
  const isProfileIncomplete = missingFields.length > 0 || (!profile.profile_completed_at && profile.is_complete !== true);

  // Auto-open Secondary Registration modal if autoOpen or incomplete query param exists
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("autoOpen") === "true" || params.get("incomplete") === "true") {
        const timer = setTimeout(() => {
          openSecondaryRegistrationModal();
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [openSecondaryRegistrationModal]);

  // Trigger Notification Popup (Bottom-Right Yellow Warning) if Profile is Incomplete
  const hasNotifiedIncompleteRef = useRef(false);
  useEffect(() => {
    if (!isLoading && profile.id && isProfileIncomplete && !hasNotifiedIncompleteRef.current) {
      hasNotifiedIncompleteRef.current = true;
      notify.warning(
        isThai ? "กรุณากรอกข้อมูลส่วนตัวเพิ่มเติม" : "Complete Profile Information",
        {
          message: isThai
            ? `ข้อมูลประวัติยังไม่สมบูรณ์ (${missingFields.slice(0, 3).join(", ")}) กรุณากรอกข้อมูลเพื่อความสมบูรณ์ของระบบ`
            : "Your employee records are incomplete. Please update your details.",
          duration: 6000,
        }
      );
    }
  }, [isLoading, profile.id, isProfileIncomplete, isThai, missingFields, notify]);

  // Check if active user is Admin
  const isAdmin =
    checkIsAdmin(appMe?.roles, appMe?.permissions, profile.role) ||
    profile.role?.toLowerCase() === "admin" ||
    profile.role?.toLowerCase() === "superadmin" ||
    profile.role?.toLowerCase().includes("administrator") ||
    profile.role?.toLowerCase().includes("admin");

  // Display calculations
  const fullName =
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.username ||
    profile.email ||
    "—";

  const initials =
    (profile.first_name?.[0] || profile.username?.[0] || (fullName !== "—" ? fullName.charAt(0) : "U")).toUpperCase() +
    (profile.last_name?.[0] || "").toUpperCase();

  const departmentTitle =
    profile.department ||
    (isThai ? "ฝ่ายปฏิบัติการทั่วไป (General Operations)" : "General Operations");

  const branchTitle =
    (profile.branch_name && profile.branch_name !== "—" ? formatBranchName(profile.branch_name, isThai ? "TH" : "EN") : null) ||
    (profile.branch_id ? DEFAULT_BRANCHES.find((b) => b.id === profile.branch_id)?.branch_name : null) ||
    (isThai ? "สำนักงานใหญ่ (Headquarters)" : "Headquarters");

  const emailText = profile.email || "—";
  const phoneText = profile.phone || "—";
  const idCardText = profile.id_card || "—";
  const birthDateText = formatBirthDate(profile.birth_date);
  const genderText = profile.gender || "—";
  const bloodTypeText = profile.blood_type || "—";
  const maritalText = profile.marital_status ? formatMaritalStatus(profile.marital_status, lang) : "—";
  const nationalityText = profile.nationality || "—";
  const religionText = profile.religion || "—";
  const nicknameText = profile.nickname ? `(${profile.nickname})` : "";
  const emergencyText =
    profile.emergency_contact_name ||
    profile.emergency_contact_phone ||
    profile.emergency_contact_relationship
      ? `${profile.emergency_contact_name || ""}${profile.emergency_contact_relationship ? ` (${profile.emergency_contact_relationship})` : ""} ${profile.emergency_contact_phone ? `• ${profile.emergency_contact_phone}` : ""}`.trim()
      : "—";
  const currentAddressText = profile.current_address || "—";
  const registeredAddressText = profile.registered_address || "—";

  const avatarFileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  // Avatar Upload Handler
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size limit (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      notify.error(isThai ? "ไฟล์มีขนาดใหญ่เกินไป" : "File too large", {
        message: isThai ? "กรุณาอัปโหลดรูปภาพขนาดไม่เกิน 5MB" : "Please upload an image smaller than 5MB.",
        duration: 4000,
      });
      return;
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      notify.error(isThai ? "ประเภทไฟล์ไม่ถูกต้อง" : "Invalid file type", {
        message: isThai ? "กรุณาเลือกไฟล์รูปภาพ (PNG, JPG, JPEG, WebP)" : "Please select an image file.",
        duration: 4000,
      });
      return;
    }

    try {
      setIsUploadingAvatar(true);

      // Convert image to base64 data URL for instant & persistent profile picture storage
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Url = reader.result as string;

        // employee_profiles intentionally has no avatar column; keep the preview local.
        if (typeof window !== "undefined") {
          try {
            const cachedProfile = localStorage.getItem("dawh_user_profile");
            if (cachedProfile) {
              const parsed = JSON.parse(cachedProfile);
              parsed.avatar_url = base64Url;
              localStorage.setItem("dawh_user_profile", JSON.stringify(parsed));
            }
          } catch {
            // Non-blocking
          }
        }

        // 4. Update React State
        setProfile((prev) => ({ ...prev, avatar_url: base64Url }));

        notify.success(isThai ? "อัปเดตรูปโปรไฟล์สำเร็จ" : "Profile Picture Updated", {
          message: isThai ? "บันทึกรูปภาพโปรไฟล์ใหม่เรียบร้อยแล้ว" : "Your new profile picture has been saved.",
          duration: 3500,
        });
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Error uploading avatar:", err);
      notify.error(isThai ? "เกิดข้อผิดพลาดในการอัปโหลด" : "Upload Failed", {
        message: isThai ? "ไม่สามารถอัปโหลดรูปภาพได้ กรุณาลองใหม่อีกครั้ง" : "Could not upload image, please try again.",
        duration: 4000,
      });
    } finally {
      setIsUploadingAvatar(false);
      // Reset input value
      if (avatarFileInputRef.current) {
        avatarFileInputRef.current.value = "";
      }
    }
  };

  // Logout Handler
  const handleLogout = async () => {
    await logout();
  };

  // DEV_TESTPUSHFILL_START - Temporary auto-fill test values (DELETE ME EASILY WHEN DONE)
  const handleTestPushFill = () => {
    const defaultBranch = branchesList[0]?.branch_name || "สำนักงานใหญ่ (Headquarter)";
    const defaultBranchId = branchesList[0]?.id || "00000000-0000-0000-0000-000000000001";

    setRegForm((prev) => ({
      ...prev,
      username: prev.username || profile.username || "test_employee",
      prefix: "mr",
      first_name_th: "ทดสอบ",
      last_name_th: "ระบบ",
      nickname_th: "เทส",
      first_name: "Test",
      last_name: "User",
      nickname: "Tester",
      id_card: "1100500123456",
      birth_date: "1995-05-15",
      gender: "ชาย",
      blood_type: "O",
      marital_status: "โสด",
      nationality: "ไทย",
      religion: "พุทธ",
      phone: prev.phone || profile.phone || "0812345678",
      emergency_contact_name_th: "สมศรี ใจดี",
      emergency_contact_name: "Emergency Contact",
      emergency_contact_relationship: "บิดา/มารดา",
      emergency_contact_phone: "0898765432",
      current_address: "99/9 หมู่ 1 ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120",
      registered_address: "99/9 หมู่ 1 ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120",
      department: "Information Technology",
      branch_id: defaultBranchId,
      branch_name: defaultBranch,
      education_level: "ปริญญาตรี",
      major_subject: "วิทยาการคอมพิวเตอร์",
      university_th: "จุฬาลงกรณ์มหาวิทยาลัย",
      university_en: "Chulalongkorn University",
      university_name: "จุฬาลงกรณ์มหาวิทยาลัย",
      bio: "Test Account for system QA",
    }));
    setIsTermsAgreed(true);
    setModalError(null);
    setHasAttemptedSubmit(false);
  };
  // DEV_TESTPUSHFILL_END

  // Step 1: Validate Secondary Registration Form & Proceed to Review Step
  const handleValidateAndProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    setModalError(null);

    // 1. Strict Validation of all mandatory employee fields
    if (!regForm.first_name_th.trim() || !regForm.last_name_th.trim()) {
      const msg = isThai ? "กรุณากรอกชื่อจริงและนามสกุล (ภาษาไทย) ให้ครบถ้วน" : "Please fill in Thai first and last name.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const cleanFirstNameEn = (regForm.first_name || profile.first_name || "").trim();
    const cleanLastNameEn = (regForm.last_name || profile.last_name || "").trim();
    if (!cleanFirstNameEn || !cleanLastNameEn) {
      const msg = isThai ? "กรุณากรอกชื่อจริงและนามสกุล (English) ให้ครบถ้วน" : "Please fill in English first and last name.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const cleanIdCard = regForm.id_card.trim().replace(/\D/g, "");
    if (!isValidThaiCitizenId(cleanIdCard)) {
      const msg = isThai ? "กรุณากรอกเลขบัตรประชาชน 13 หลักให้ถูกต้อง" : "Please enter a valid 13-digit Thai citizen ID.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    // Birth date is collected during the initial registration and shown locked here.
    const activeBirthDate =
      regForm.birth_date ||
      profile.birth_date ||
      readPendingRegistrationProfile()?.birthDate ||
      (typeof window !== "undefined" ? localStorage.getItem("current_user_birth_date") || "" : "");
    if (!isValidIsoDate(activeBirthDate)) {
      const msg = isThai
        ? "ไม่พบวันเกิดจากข้อมูลการสมัคร กรุณากลับไปสมัครด้วยแท็บเดิม"
        : "Birth date from registration is missing. Please continue in the original registration tab.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const resolvedUsername =
      (regForm.username.trim() ||
        profile.username ||
        profile.email?.split("@")[0]?.replace(/[^a-zA-Z0-9._-]/g, "") ||
        "employee").toLowerCase();

    const activePhone = (
      regForm.phone ||
      profile.phone ||
      readPendingRegistrationProfile()?.phone ||
      (typeof window !== "undefined" ? localStorage.getItem("current_user_phone") || "" : "")
    ).trim();
    if (!activePhone) {
      const msg = isThai ? "กรุณาระบุเบอร์โทรศัพท์มือถือ" : "Please enter mobile phone number.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!isValidPhone(activePhone)) {
      const msg = isThai ? "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง" : "Please enter a valid phone number.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!regForm.current_address.trim()) {
      const msg = isThai ? "กรุณากรอกที่อยู่ปัจจุบัน ให้ครบถ้วน" : "Please enter current address.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!regForm.registered_address.trim()) {
      const msg = isThai ? "กรุณากรอกที่อยู่ตามทะเบียนบ้าน ให้ครบถ้วน" : "Please enter registered address.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!regForm.branch_name.trim()) {
      const msg = isThai ? "กรุณาเลือกสาขาที่สังกัด" : "Please select branch assignment.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const requiredValues = [
      resolvedUsername, regForm.prefix, regForm.nickname_th, regForm.nickname,
      regForm.gender, regForm.blood_type, regForm.marital_status, regForm.nationality,
      regForm.religion, regForm.education_level, regForm.major_subject,
      regForm.university_th || regForm.university_name, regForm.university_en || regForm.university_name,
      regForm.emergency_contact_name_th, regForm.emergency_contact_name,
      regForm.emergency_contact_relationship, regForm.emergency_contact_phone,
    ];
    const currentAddress = parseAddressString(regForm.current_address);
    const registeredAddress = parseAddressString(regForm.registered_address);
    const addressValues = [
      currentAddress.houseNo, currentAddress.province_en, currentAddress.district_en, currentAddress.subdistrict_en, currentAddress.zipcode,
      registeredAddress.houseNo, registeredAddress.province_en, registeredAddress.district_en, registeredAddress.subdistrict_en, registeredAddress.zipcode,
    ];
    if (requiredValues.some((value) => !value.trim()) || addressValues.some((value) => !value.trim())) {
      const msg = isThai ? "กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน" : "Please complete every required field before continuing.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // Ensure state has reconciled fallback values before moving to review
    setRegForm((prev) => ({
      ...prev,
      username: resolvedUsername,
      first_name: cleanFirstNameEn,
      last_name: cleanLastNameEn,
      birth_date: activeBirthDate,
      phone: activePhone,
    }));

    setIsTermsAgreed(false);
    setRegStep("review");
  };

  // Step 2: Confirm, Accept Terms, Save to DB & Proceed to PIN Setup
  const handleConfirmSaveAndProceedToPin = async () => {
    if (!isTermsAgreed || isSaving) return;

    setIsSaving(true);
    setModalError(null);
    try {
      // Artificial UX smooth delay so the user sees the submission and loading animation clearly
      await new Promise((resolve) => setTimeout(resolve, 800));

      const pending = readPendingRegistrationProfile();
      const resolvedFirstName = (regForm.first_name || profile.first_name || pending?.firstName || "").trim();
      const resolvedLastName = (regForm.last_name || profile.last_name || pending?.lastName || "").trim();
      const cleanFullName = `${resolvedFirstName} ${resolvedLastName}`.trim();
      const cleanIdCard = regForm.id_card.trim().replace(/\D/g, "");
      const cleanBirthDate = (
        regForm.birth_date || profile.birth_date || pending?.birthDate ||
        (typeof window !== "undefined" ? localStorage.getItem("current_user_birth_date") || "" : "")
      ).trim();
      if (!isValidIsoDate(cleanBirthDate)) {
        throw new Error(isThai
          ? "ไม่พบวันเกิดจากข้อมูลการสมัคร กรุณากลับไปสมัครด้วยแท็บเดิม"
          : "Birth date from registration is missing. Please continue in the original registration tab.");
      }
      const cleanUsername =
        (regForm.username.trim() ||
          profile.username ||
          pending?.username ||
          profile.email?.split("@")[0]?.replace(/[^a-zA-Z0-9._-]/g, "") ||
          "employee").toLowerCase();
      const resolvedPhone = (
        regForm.phone ||
        profile.phone ||
        pending?.phone ||
        (typeof window !== "undefined" ? localStorage.getItem("current_user_phone") || "" : "")
      ).trim();

      const currentAddress = parseAddressString(regForm.current_address);
      const registeredAddress = parseAddressString(regForm.registered_address);
      const branch = branchesList.find((item) => item.id === regForm.branch_id || item.branch_name === regForm.branch_name) ?? DEFAULT_BRANCHES[0];
      const options = await getOnboardingOptions();
      const facility = options.data.facilities.find(
        (item) => item.id === regForm.branch_id || item.code === branch.branch_code || item.name === branch.branch_name,
      ) ?? options.data.facilities[0];
      if (!facility) throw new Error("No active facility is available for this profile.");
      const department = options.data.departments.find(
        (item) => item.id === regForm.department || item.code === regForm.department || item.name === regForm.department,
      );
      const response = await apiPut<import("@/lib/profiles").EmployeeProfileDto>("/api/profile/me/complete", {
        username: cleanUsername,
        prefix: regForm.prefix.trim(),
        firstNameTh: regForm.first_name_th.trim(),
        lastNameTh: regForm.last_name_th.trim(),
        nicknameTh: regForm.nickname_th.trim(),
        firstNameEn: resolvedFirstName,
        lastNameEn: resolvedLastName,
        nicknameEn: regForm.nickname.trim(),
        citizenId: cleanIdCard,
        birthDate: cleanBirthDate,
        gender: regForm.gender,
        bloodType: regForm.blood_type,
        maritalStatus: regForm.marital_status.trim(),
        nationality: regForm.nationality.trim(),
        religion: regForm.religion.trim(),
        educationLevel: regForm.education_level,
        majorSubject: regForm.major_subject.trim(),
        universityNameTh: regForm.university_th.trim() || regForm.university_name.trim(),
        universityNameEn: regForm.university_en.trim() || regForm.university_name.trim(),
        phone: resolvedPhone,
        emergencyContactNameTh: regForm.emergency_contact_name_th.trim(),
        emergencyContactNameEn: regForm.emergency_contact_name.trim() || null,
        emergencyContactRelationship: regForm.emergency_contact_relationship,
        emergencyContactPhone: regForm.emergency_contact_phone.trim(),
        currentAddress: {
          houseNo: currentAddress.houseNo,
          village: currentAddress.moo || null,
          soi: currentAddress.soi || null,
          province: currentAddress.province_en,
          district: currentAddress.district_en,
          subdistrict: currentAddress.subdistrict_en,
          postalCode: currentAddress.zipcode,
        },
        registeredAddress: {
          houseNo: registeredAddress.houseNo,
          village: registeredAddress.moo || null,
          soi: registeredAddress.soi || null,
          province: registeredAddress.province_en,
          district: registeredAddress.district_en,
          subdistrict: registeredAddress.subdistrict_en,
          postalCode: registeredAddress.zipcode,
        },
        facilityId: facility.id,
        departmentId: department?.id ?? null,
        termsAccepted: true,
      });
      const result = response.data;

      // Update local state and persistent cache
      const updatedProfile: Partial<EmployeeProfile> = { ...toEmployeeProfile(result), full_name: cleanFullName };
      setProfile(updatedProfile);
      if (typeof window !== "undefined") {
        localStorage.setItem("dawh_user_profile", JSON.stringify(updatedProfile));
        sessionStorage.removeItem("dawh_pending_profile");
        window.dispatchEvent(new CustomEvent("dawh_profile_updated", { detail: updatedProfile }));
      }

      setSaveSuccess(true);
      notify.success(
        isThai ? "บันทึกข้อมูลโปรไฟล์เรียบร้อย" : "Profile Updated Successfully",
        {
          message: isThai
            ? "ข้อมูลส่วนตัวของท่านได้รับการบันทึกแล้ว"
            : "Your employee profile has been saved.",
          duration: 4000,
        }
      );
      setTimeout(() => {
        setSaveSuccess(false);
        setShowSecondaryRegModal(false);
        setRegStep("fill");
      }, 700);
    } catch (err: unknown) {
      let errorMsg = err instanceof Error ? err.message : null;
      if (err instanceof ApiRequestError && err.details && typeof err.details === "object") {
        const details = Object.entries(err.details as Record<string, unknown>)
          .map(([field, message]) => `${field}: ${String(message)}`)
          .join("; ");
        if (details) errorMsg = `${err.message} ${details}`;
      }
      errorMsg ||= isThai ? "เกิดข้อผิดพลาดในการบันทึกข้อมูล" : "Failed to update profile";
      setModalError(errorMsg);
      notify.error(isThai ? "เกิดข้อผิดพลาด" : "Save Failed", {
        message: errorMsg,
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // PIN Keypad Handlers
  const triggerPinDigitMorph = (index: number) => {
    if (pinMorphTimeoutRef.current) clearTimeout(pinMorphTimeoutRef.current);
    setLastTypedPinIndex(index);
    pinMorphTimeoutRef.current = setTimeout(() => {
      setLastTypedPinIndex(null);
    }, 550);
  };

  const handlePinKeypadPress = (val: string) => {
    if (isSaving) return;
    if (pinStep === "enter") {
      setPinDigits((prev) => {
        const idx = prev.findIndex((d) => d === "");
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = val;
        triggerPinDigitMorph(idx);
        return next;
      });
    } else {
      setConfirmPinDigits((prev) => {
        const idx = prev.findIndex((d) => d === "");
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = val;
        triggerPinDigitMorph(idx);
        return next;
      });
    }
  };

  const handlePinKeypadBackspace = () => {
    if (isSaving) return;
    if (pinMorphTimeoutRef.current) clearTimeout(pinMorphTimeoutRef.current);
    setLastTypedPinIndex(null);
    if (pinStep === "enter") {
      setPinDigits((prev) => {
        const filledIdxs = prev.map((d, i) => (d !== "" ? i : -1)).filter((i) => i !== -1);
        if (filledIdxs.length === 0) return prev;
        const lastIdx = filledIdxs[filledIdxs.length - 1];
        const next = [...prev];
        next[lastIdx] = "";
        return next;
      });
    } else {
      setConfirmPinDigits((prev) => {
        const filledIdxs = prev.map((d, i) => (d !== "" ? i : -1)).filter((i) => i !== -1);
        if (filledIdxs.length === 0) return prev;
        const lastIdx = filledIdxs[filledIdxs.length - 1];
        const next = [...prev];
        next[lastIdx] = "";
        return next;
      });
    }
  };

  const handlePinKeypadClear = () => {
    if (isSaving) return;
    if (pinMorphTimeoutRef.current) clearTimeout(pinMorphTimeoutRef.current);
    setLastTypedPinIndex(null);
    if (pinStep === "enter") {
      setPinDigits(["", "", "", "", "", ""]);
    } else {
      setConfirmPinDigits(["", "", "", "", "", ""]);
    }
  };

  // Advance to confirm step or save PIN
  const handleAdvancePin = async () => {
    const pinStr = pinDigits.join("");
    const confirmPinStr = confirmPinDigits.join("");

    if (pinStep === "enter") {
      if (pinStr.length !== 6) return;
      setModalError(null);
      setPinStep("confirm");
      setConfirmPinDigits(["", "", "", "", "", ""]);
      setLastTypedPinIndex(null);
      return;
    }

    if (confirmPinStr !== pinStr) {
      setPinShake(true);
      const msg = isThai ? "รหัส PIN ยืนยันไม่ตรงกัน กรุณาลองใหม่อีกครั้ง" : "PINs do not match. Please try again.";
      setModalError(msg);
      notify.warning(isThai ? "รหัส PIN ไม่ตรงกัน" : "PIN Mismatch", {
        message: msg,
        duration: 4000,
      });
      setTimeout(() => {
        setPinShake(false);
        setConfirmPinDigits(["", "", "", "", "", ""]);
        setLastTypedPinIndex(null);
      }, 600);
      return;
    }

    const message = isThai
      ? "ระบบ Auth ใหม่ไม่รองรับการเข้าสู่ระบบด้วย PIN"
      : "Quick PIN is not supported by the new authentication system.";
    setModalError(message);
    notify.warning(isThai ? "ยกเลิก Quick PIN แล้ว" : "Quick PIN removed", {
      message,
      duration: 5000,
    });
  };

  // Hardware keyboard listener when showPinSetupModal is open
  useEffect(() => {
    if (!showPinSetupModal) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handlePinKeypadPress(e.key);
      } else if (e.code && e.code.startsWith("Numpad") && e.code.length === 7) {
        const numChar = e.code.replace("Numpad", "");
        if (/^[0-9]$/.test(numChar)) {
          e.preventDefault();
          handlePinKeypadPress(numChar);
        }
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handlePinKeypadBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handlePinKeypadClear();
      } else if (e.key === "Enter") {
        e.preventDefault();
        const active = pinStep === "enter" ? pinDigits : confirmPinDigits;
        if (active.every((d) => d !== "")) {
          handleAdvancePin();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showPinSetupModal, pinStep, pinDigits, confirmPinDigits, isSaving, profile.id, isThai, notify]);

  // Change Password Handler (Modal)
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim()) {
      setModalError(isThai ? "กรุณาระบุรหัสผ่านปัจจุบัน" : "Please enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      setModalError(isThai ? "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร" : "New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setModalError(isThai ? "รหัสผ่านใหม่ไม่ตรงกัน" : "New passwords do not match");
      return;
    }
    if (currentPassword === newPassword) {
      setModalError(isThai ? "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม" : "New password cannot be the same as current password");
      return;
    }

    setIsSaving(true);
    setModalError(null);

    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) throw new Error(error.message);

      setProfile((prev) => ({
        ...prev,
        needs_password_reset: false,
      }));

      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("dawh_needs_password_reset");
          const cached = localStorage.getItem("dawh_user_profile");
          if (cached) {
            const parsed = JSON.parse(cached);
            parsed.needs_password_reset = false;
            localStorage.setItem("dawh_user_profile", JSON.stringify(parsed));
          }
        }
      } catch {
        // fallback
      }

      setSaveSuccess(true);
      notify.success(
        isThai ? "เปลี่ยนรหัสผ่านสำเร็จ" : "Password Changed Successfully",
        {
          message: isThai
            ? "รหัสผ่านใหม่ของท่านได้รับการบันทึกแล้ว"
            : "Your password has been securely updated.",
          duration: 4000,
        }
      );
      setTimeout(() => {
        setSaveSuccess(false);
        setShowPasswordModal(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }, 1200);
    } catch (err: unknown) {
      const errorMsg = (err instanceof Error ? err.message : null) || (isThai ? "ไม่สามารถเปลี่ยนรหัสผ่านได้" : "Failed to update password");
      setModalError(errorMsg);
      notify.error(isThai ? "เกิดข้อผิดพลาด" : "Password Update Error", {
        message: errorMsg,
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Tab: Change Email Handler
  const handleTabChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !emailRegex.test(newEmail)) {
      setEmailError(isThai ? "กรุณาระบุรูปแบบอีเมลที่ถูกต้อง" : "Please enter a valid email address");
      return;
    }
    if (newEmail.toLowerCase() === (profile.email || "").toLowerCase()) {
      setEmailError(isThai ? "อีเมลใหม่ตรงกับอีเมลปัจจุบันที่ใช้งานอยู่" : "New email cannot be identical to your current email");
      return;
    }
    if (confirmNewEmail && newEmail.toLowerCase() !== confirmNewEmail.toLowerCase()) {
      setEmailError(isThai ? "อีเมลทั้งสองช่องไม่ตรงกัน" : "Email confirmation does not match");
      return;
    }

    setIsSavingEmail(true);
    setEmailError(null);

    try {
      const { error } = await authClient.changeEmail({
        newEmail,
        callbackURL: "/settings",
      });

      if (error) throw new Error(error.message);

      setEmailSuccess(true);
      notify.success(
        isThai ? "ส่งคำขอยืนยันอีเมลสำเร็จ" : "Email Update Requested",
        {
          message: isThai
            ? "ระบบได้ส่งลิงก์ยืนยันไปยังอีเมลใหม่เรียบร้อยแล้ว กรุณาคลิกลิงก์เพื่อยืนยันการเปลี่ยนแปลง"
            : "A confirmation link has been sent to your new email. Please verify to complete.",
          duration: 6000,
        }
      );

      setTimeout(() => {
        setEmailSuccess(false);
        setNewEmail("");
        setConfirmNewEmail("");
      }, 2000);
    } catch (err: unknown) {
      const errorMsg = (err instanceof Error ? err.message : null) || (isThai ? "ไม่สามารถเปลี่ยนอีเมลได้" : "Failed to update email");
      setEmailError(errorMsg);
      notify.error(isThai ? "เกิดข้อผิดพลาด" : "Email Update Error", {
        message: errorMsg,
        duration: 5000,
      });
    } finally {
      setIsSavingEmail(false);
    }
  };

  // Tab: Change Password Handler (Requires Current Password + 2x New Password)
  const handleTabChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim()) {
      setPasswordError(isThai ? "กรุณาระบุรหัสผ่านเดิม (ปัจจุบัน)" : "Please enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(isThai ? "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร" : "New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError(isThai ? "รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน" : "New passwords do not match");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError(isThai ? "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม" : "New password cannot be the same as current password");
      return;
    }

    setIsSavingPassword(true);
    setPasswordError(null);

    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) throw new Error(error.message);

      setProfile((prev) => ({
        ...prev,
        needs_password_reset: false,
      }));

      try {
        if (typeof window !== "undefined") {
          localStorage.removeItem("dawh_needs_password_reset");
          const cached = localStorage.getItem("dawh_user_profile");
          if (cached) {
            const parsed = JSON.parse(cached);
            parsed.needs_password_reset = false;
            localStorage.setItem("dawh_user_profile", JSON.stringify(parsed));
          }
        }
      } catch {
        // ignore
      }

      setPasswordSuccess(true);
      notify.success(
        isThai ? "เปลี่ยนรหัสผ่านสำเร็จ" : "Password Changed Successfully",
        {
          message: isThai
            ? "รหัสผ่านใหม่ของคุณได้รับการบันทึกและเปิดใช้งานแล้ว"
            : "Your new password has been securely updated.",
          duration: 4000,
        }
      );
      setTimeout(() => {
        setPasswordSuccess(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }, 1500);
    } catch (err: unknown) {
      const errorMsg = (err instanceof Error ? err.message : null) || (isThai ? "ไม่สามารถเปลี่ยนรหัสผ่านได้" : "Failed to update password");
      setPasswordError(errorMsg);
      notify.error(isThai ? "เกิดข้อผิดพลาด" : "Password Update Error", {
        message: errorMsg,
        duration: 5000,
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div
      className={`h-screen w-full flex flex-col overflow-hidden transition-colors duration-300 ${
        isLight
          ? "bg-[#F8FAFC] text-[#222222]"
          : "bg-[#2C2C2C] text-[#FFFFFF] selection:bg-white/20"
      }`}
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      {/* ========================================================================= */}
      {/* 1. REUSABLE APP HEADER (HeaderNavbar with Official Brand Logo)           */}
      {/* ========================================================================= */}
      <div className="shrink-0 w-full z-40">
        <HeaderNavbar
          showLogo={true}
          showAccount={true}
          title={isThai ? "การตั้งค่าบัญชีพนักงาน" : "Platform Settings"}
          subtitle={
            isThai
              ? "จัดการและตรวจสอบข้อมูลประวัติในระบบองค์กร"
              : "Configure and update your administrative profile"
          }
          onNavigate={onNavigate}
          onBack={onBack}
          lang={lang}
          onLangChange={setAppLanguage}
        />

        {/* Mobile Navigation Header & Bottom Bar for Settings */}
        <MobileNavbar />
      </div>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT BODY (1200px max-width, padding 32px, gap 24px)           */}
      {/* ========================================================================= */}
      <div className="flex-1 w-full overflow-y-auto min-h-0">
        <main className="w-full max-w-[1200px] mx-auto p-4 sm:p-8 pb-[96px] md:pb-8 flex flex-col items-start gap-6">

        {/* ========================================================================= */}
        {/* ⭐ ADMIN CREDENTIAL RESET BANNER (Only shows when reset flag active, NO icons) */}
        {/* ========================================================================= */}
        {(profile.needs_password_reset ||
          profile.needs_pin_reset ||
          (typeof window !== "undefined" &&
            (localStorage.getItem("dawh_needs_password_reset") === "true" ||
              localStorage.getItem("dawh_needs_pin_reset") === "true"))) && (
          <div
            className={`w-full p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 ${
              isLight
                ? "bg-[#FFF7ED] border-[#FDBA74] text-[#9A3412] shadow-sm"
                : "bg-[#2D1B13] border-[#7C2D12] text-[#FFEDD5] shadow-lg"
            }`}
          >
            <div className="flex flex-col gap-0.5">
              <h3 className="font-bold text-[15px] leading-tight">
                {isThai
                  ? "ผู้ดูแลระบบได้ทำการรีเซ็ตข้อมูลความปลอดภัยของคุณ"
                  : "Your security credentials have been reset by Admin"}
              </h3>
              <p className="text-[12.5px] leading-normal opacity-85">
                {isThai
                  ? "คุณสามารถเข้าสู่ระบบและกดปุ่มเพื่อตั้งรหัสผ่านหรือรหัส PIN ใหม่ได้ด้วยตนเองทันที"
                  : "You can set your new password or PIN below."}
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 flex-wrap">
              {(profile.needs_password_reset ||
                (typeof window !== "undefined" &&
                  localStorage.getItem("dawh_needs_password_reset") === "true")) && (
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(true)}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer ${
                    isLight
                      ? "bg-[#EA580C] hover:bg-[#C2410C] text-white"
                      : "bg-[#FB923C] hover:bg-[#F97316] text-[#222222]"
                  }`}
                >
                  <span>{isThai ? "ตั้งรหัสผ่านใหม่" : "Set New Password"}</span>
                </button>
              )}

              {(profile.needs_pin_reset ||
                (typeof window !== "undefined" &&
                  localStorage.getItem("dawh_needs_pin_reset") === "true")) && (
                <button
                  type="button"
                  onClick={() => {
                    setPinDigits(["", "", "", "", "", ""]);
                    setConfirmPinDigits(["", "", "", "", "", ""]);
                    setPinStep("enter");
                    setShowPinSetupModal(true);
                  }}
                  className={`px-4 py-2.5 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer ${
                    isLight
                      ? "bg-[#222222] hover:bg-black text-white"
                      : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#222222]"
                  }`}
                >
                  <span>{isThai ? "ตั้งรหัส PIN ใหม่" : "Set New PIN"}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* ⭐ SECONDARY REGISTRATION PROMPT BANNER (Pure White & Clean Standard)      */}
        {/* ========================================================================= */}
        {isProfileIncomplete && (
          <div
            className={`w-full p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 ${
              isLight
                ? "bg-white border-[#E4E4E7] text-[#222222] shadow-sm"
                : "bg-[#383838] border-[#444444] text-[#FFFFFF] shadow-lg"
            }`}
          >
            <div className="flex items-start gap-3.5">
              <div
                className={`p-2.5 rounded-xl shrink-0 mt-0.5 shadow-sm ${
                  isLight ? "bg-[#222222] text-white" : "bg-white text-[#222222]"
                }`}
              >
                <User size={18} />
              </div>
              <div className="flex flex-col gap-0.5">
                <h3 className="font-bold text-[15px] leading-tight">
                  {isThai
                    ? "ข้อมูลโปรไฟล์ของคุณยังไม่ครบถ้วน (กรอกข้อมูลรอบสอง)"
                    : "Complete Your Profile Registration"}
                </h3>
                <p
                  className={`text-[12.5px] leading-normal ${
                    isLight ? "text-[#666666]" : "text-[#E4E4E7]"
                  }`}
                >
                  {isThai
                    ? `ยังขาดข้อมูล: ${missingFields.slice(0, 3).join(", ")}${missingFields.length > 3 ? ` และอีก ${missingFields.length - 3} รายการ` : ""} กรุณากรอกข้อมูลให้ครบถ้วนและตั้งรหัส PIN 6 หลัก`
                    : `Missing fields: ${missingFields.slice(0, 3).join(", ")}. Please complete your secondary registration & 6-digit PIN.`}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={openSecondaryRegistrationModal}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-sm flex items-center justify-center shrink-0 cursor-pointer ${
                isLight
                  ? "bg-[#222222] hover:bg-black text-white"
                  : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#222222]"
              }`}
            >
              <span>{isThai ? "กรอกข้อมูลเพิ่มเติมรอบสอง" : "Complete Registration"}</span>
            </button>
          </div>
        )}

        <div
          className={`w-full h-[42px] border-b flex flex-row items-start gap-2 select-none overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
            isLight ? "border-[#E4E4E7]" : "border-[#444444]"
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`relative px-6 py-3 h-[42px] text-[14px] leading-[18px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "profile"
                ? isLight
                  ? "text-[#222222]"
                  : "text-[#FFFFFF]"
                : isLight
                ? "text-[#666666] hover:text-[#222222]"
                : "text-[#E4E4E7] hover:text-[#FFFFFF]"
            }`}
          >
            <span>{isThai ? "ข้อมูลประวัติส่วนตัว" : "Personal Profile"}</span>
            {activeTab === "profile" && (
              <motion.div
                layoutId="activeSettingsTabUnderline"
                className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                  isLight ? "bg-[#222222]" : "bg-white"
                }`}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 35,
                }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("employment")}
            className={`relative px-6 py-3 h-[42px] text-[14px] leading-[18px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              activeTab === "employment"
                ? isLight
                  ? "text-[#222222]"
                  : "text-[#FFFFFF]"
                : isLight
                ? "text-[#666666] hover:text-[#222222]"
                : "text-[#E4E4E7] hover:text-[#FFFFFF]"
            }`}
          >
            <span>{isThai ? "ข้อมูลเกี่ยวกับบริษัทและสัญญา" : "Company & Employment"}</span>
            {activeTab === "employment" && (
              <motion.div
                layoutId="activeSettingsTabUnderline"
                className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                  isLight ? "bg-[#222222]" : "bg-white"
                }`}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 35,
                }}
              />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`relative px-6 py-3 h-[42px] text-[14px] leading-[18px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
              activeTab === "security"
                ? isLight
                  ? "text-[#222222]"
                  : "text-[#FFFFFF]"
                : isLight
                ? "text-[#666666] hover:text-[#222222]"
                : "text-[#E4E4E7] hover:text-[#FFFFFF]"
            }`}
          >
            <span>{isThai ? "เปลี่ยนอีเมลและรหัสผ่าน" : "Change Email / Password"}</span>
            {((profile.needs_password_reset) ||
              (typeof window !== "undefined" && localStorage.getItem("dawh_needs_password_reset") === "true")) && (
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            )}
            {activeTab === "security" && (
              <motion.div
                layoutId="activeSettingsTabUnderline"
                className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                  isLight ? "bg-[#222222]" : "bg-white"
                }`}
                transition={{
                  type: "spring",
                  stiffness: 450,
                  damping: 35,
                }}
              />
            )}
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => router.push("/controlpanel")}
              className={`relative px-6 py-3 h-[42px] text-[14px] leading-[18px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === "admin"
                  ? isLight
                    ? "text-[#222222]"
                    : "text-[#FFFFFF]"
                  : isLight
                  ? "text-[#666666] hover:text-[#222222]"
                  : "text-[#E4E4E7] hover:text-[#FFFFFF]"
              }`}
            >
              <span>{isThai ? "แผงควบคุมระบบ" : "Admin Control Panel"}</span>
            </button>
          )}
        </div>

        {(activeTab === "profile" || activeTab === "employment" || activeTab === "security") && (
          <div className="w-full flex flex-col lg:flex-row items-start gap-6 animate-in fade-in duration-200">
            <div
              className={`w-full lg:w-[360px] p-8 flex flex-col items-center gap-6 rounded-[12px] border transition-colors shrink-0 ${
                isLight
                  ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-sm"
                  : "bg-[#383838] border-[#444444] shadow-lg"
              }`}
            >
              {/* Avatar Container with Edit Pencil Button */}
              <div className="relative group">
                <div
                  className={`w-[110px] h-[110px] rounded-full border overflow-hidden flex items-center justify-center select-none shadow-sm transition-all ${
                    isLight
                      ? "bg-[#F5F5F5] border-[#E5E5E5]"
                      : "bg-[#282828] border-[#444444]"
                  }`}
                >
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={profile.avatar_url} alt={fullName} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    <span className={`font-bold text-[48px] leading-[60px] ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`} style={{ fontFamily: "var(--font-outfit), sans-serif" }}>
                      {initials}
                    </span>
                  )}
                </div>

                {/* Circular Pencil Button */}
                <button
                  type="button"
                  onClick={() => setShowAvatarCropModal(true)}
                  title={isThai ? "เปลี่ยนรูปโปรไฟล์" : "Change Profile Picture"}
                  className={`absolute bottom-0 right-0 w-8 h-8 rounded-full border shadow-md flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 cursor-pointer ${
                    isLight
                      ? "bg-[#222222] hover:bg-black text-[#FFFFFF] border-white"
                      : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#222222] border-[#282828]"
                  }`}
                >
                  <Pencil size={14} />
                </button>
              </div>

              <div className="w-full flex flex-col items-center gap-1.5">
                <h2 className={`font-bold text-[20px] leading-[25px] text-center ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`} style={{ fontFamily: "var(--font-outfit), sans-serif" }}>
                  {fullName}
                </h2>

                {/* Username with @ prefix directly below name */}
                <span className={`text-[13px] font-medium leading-tight ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                  @{profile.username || (profile.email ? profile.email.split("@")[0] : "username")}
                </span>

                {/* Staff ID Badge */}
                <div
                  className={`mt-1.5 px-3 py-1 rounded-[8px] border text-xs font-mono font-semibold flex items-center gap-1.5 select-text ${
                    isLight
                      ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]"
                      : "bg-[#282828] border-[#444444] text-[#FFFFFF]"
                  }`}
                >
                  <span className={`text-[10.5px] font-sans font-normal ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                    {isThai ? "รหัสพนักงาน:" : "Staff ID:"}
                  </span>
                  <span>{profile.staff_code || (profile.id ? `EMP-${profile.id.slice(0, 4).toUpperCase()}` : "EMP-1001")}</span>
                </div>

                {/* Department Info */}
                {departmentTitle !== "—" && (
                  <div className="flex flex-row items-center px-2 py-0.5 gap-1.5 text-xs opacity-75">
                    <span className={`text-[11px] ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                      {isThai ? "แผนก:" : "Dept:"} {departmentTitle}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {activeTab === "profile" && (
              <div
                className={`flex-1 w-full p-6 sm:p-8 flex flex-col items-start gap-5 rounded-[12px] border transition-colors ${
                  isLight
                    ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-sm"
                    : "bg-[#383838] border-[#444444] shadow-lg"
                }`}
              >
                <div className="w-full flex items-center justify-between border-b pb-3 border-[#444444]/40">
                  <h3
                    className={`font-bold text-[16px] leading-[20px] ${
                      isLight ? "text-[#222222]" : "text-[#FFFFFF]"
                    }`}
                    style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                  >
                    {isThai ? "ข้อมูลประวัติส่วนตัวและการติดต่อ" : "Personal Profile & Contact Details"}
                  </h3>
                </div>

                <div className="w-full flex flex-col gap-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                    {isThai ? "ข้อมูลชื่อและบัญชีผู้ใช้" : "Name & Account Details"}
                  </span>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "ชื่อจริง (ภาษาไทย)" : "First Name (Thai)"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text font-medium ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {profile.first_name_th || "—"}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "นามสกุล (ภาษาไทย)" : "Last Name (Thai)"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text font-medium ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {profile.last_name_th || "—"}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "ชื่อเล่น (ภาษาไทย)" : "Nickname (Thai)"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {profile.nickname_th || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "ชื่อจริง (English)" : "First Name (English)"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text font-medium ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {profile.first_name || "—"}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "นามสกุล (English)" : "Last Name (English)"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text font-medium ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {profile.last_name || "—"}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "ชื่อเล่น (English)" : "Nickname (English)"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {profile.nickname || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "คำนำหน้า (Prefix)" : "Prefix"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {profile.prefix ? getPrefixDisplayLabel(profile.prefix, isThai ? "TH" : "EN") : "—"}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "ชื่อผู้ใช้" : "Username"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] font-mono select-text ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {profile.username || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                    {isThai ? "ข้อมูลส่วนบุคคลและเอกสารประจำตัว" : "Personal Identity & Details"}
                  </span>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="flex flex-col items-start gap-1 sm:col-span-2">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "เลขบัตรประชาชน" : "Citizen ID"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] font-mono select-text ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {idCardText}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "วันเกิด" : "Birth Date"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {birthDateText}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "เพศ" : "Gender"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {genderText}
                      </div>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "กรุ๊ปเลือด" : "Blood Type"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {bloodTypeText}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "สถานภาพสมรส" : "Marital Status"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {maritalText}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "สัญชาติ" : "Nationality"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {nationalityText}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "ศาสนา" : "Religion"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {religionText}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                    {isThai ? "ข้อมูลการศึกษา" : "Educational Background"}
                  </span>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "วุฒิการศึกษา" : "Education Level"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text truncate ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {profile.education_level || "—"}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "สาขาวิชา" : "Major Subject"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text truncate ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {profile.major_subject || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "สถาบันการศึกษา (ภาษาไทย)" : "University (Thai)"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text truncate ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {profile.university_th || profile.university_name || "—"}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "สถาบันการศึกษา (English)" : "Institution (English)"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text truncate ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {profile.university_en || "—"}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                    {isThai ? "ข้อมูลการติดต่อและที่อยู่อาศัย" : "Contact & Addresses"}
                  </span>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "อีเมลติดต่อ" : "Contact Email"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] font-mono select-text truncate ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {emailText}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "เบอร์โทรศัพท์" : "Phone Number"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] font-mono select-text ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {phoneText}
                      </div>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "ผู้ติดต่อฉุกเฉิน (ไทย)" : "Emergency Contact (Thai)"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text truncate ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {profile.emergency_contact_name_th || "—"}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "ผู้ติดต่อฉุกเฉิน (English)" : "Emergency Contact (English)"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text truncate ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {profile.emergency_contact_name || "—"}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "เบอร์ผู้ติดต่อฉุกเฉิน" : "Emergency Phone"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] font-mono select-text ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {profile.emergency_contact_phone || "—"}
                      </div>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "ที่อยู่ปัจจุบัน" : "Current Resident Address"}
                      </label>
                      <div
                        className={`w-full p-3 min-h-[56px] flex items-center rounded-[8px] border text-[12px] leading-relaxed select-text ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {currentAddressText}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "ที่อยู่ตามทะเบียนบ้าน" : "Registered Legal Address"}
                      </label>
                      <div
                        className={`w-full p-3 min-h-[56px] flex items-center rounded-[8px] border text-[12px] leading-relaxed select-text ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {registeredAddressText}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="w-full pt-3 border-t border-[#444444]/40 flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => {
                      notify.info(
                        isThai ? "แจ้งเรื่องขอแก้ไขข้อมูล" : "Profile Modification Request",
                        {
                          message: isThai
                            ? "ระบบส่งคำร้องขอแก้ไขข้อมูลส่วนตัวอยู่ระหว่างการพัฒนาระบบ"
                            : "The profile modification request ticket system is currently in development.",
                          duration: 4000,
                        }
                      );
                    }}
                    className={`px-4 py-2.5 h-[37px] rounded-[8px] font-semibold text-[13px] leading-[17px] transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-1.5 shadow-sm ${
                      isLight
                        ? "bg-[#222222] hover:bg-black text-[#FFFFFF]"
                        : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#222222]"
                    }`}
                  >
                    <FileText size={14} />
                    <span>{isThai ? "แจ้งเรื่องขอแก้ไขข้อมูล" : "Request Profile Update"}</span>
                  </button>
                </div>
              </div>
            )}

            {activeTab === "employment" && (
              <div
                className={`flex-1 w-full p-6 sm:p-8 flex flex-col items-start gap-5 rounded-[12px] border transition-colors ${
                  isLight
                    ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-sm"
                    : "bg-[#383838] border-[#444444] shadow-lg"
                }`}
              >
                <div className="w-full flex items-center justify-between border-b pb-3 border-[#444444]/40">
                  <h3
                    className={`font-bold text-[16px] leading-[20px] ${
                      isLight ? "text-[#222222]" : "text-[#FFFFFF]"
                    }`}
                    style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                  >
                    {isThai ? "ข้อมูลเกี่ยวกับบริษัทและสัญญาการจ้างงาน" : "Company & Employment Information"}
                  </h3>
                </div>

                <div className="w-full flex flex-col gap-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                    {isThai ? "ข้อมูลสังกัดและตำแหน่งงานในองค์กร" : "Organization & Position Assignment"}
                  </span>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "แผนก / ฝ่ายสังกัด" : "Department"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text truncate ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {departmentTitle}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "สาขาประจำการ" : "Branch Location"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text truncate ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {branchTitle}
                      </div>
                    </div>
                  </div>

                  <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "สถานะการจ้างงาน" : "Employment Status"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] font-semibold select-text ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#2EC4B6]" : "bg-[#282828] border-[#444444] text-[#2EC4B6]"
                        }`}
                      >
                        {profile.employment_status || (isThai ? "พนักงานประจำ" : "Permanent Staff")}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "วันที่เริ่มงาน" : "Start Date"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {profile.start_date || "—"}
                      </div>
                    </div>

                    <div className="flex flex-col items-start gap-1">
                      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "โครงสร้างเงินเดือน / ค่าตอบแทน" : "Compensation"}
                      </label>
                      <div
                        className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text font-semibold ${
                          isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                        }`}
                      >
                        {profile.salary ? `฿${profile.salary.toLocaleString()}` : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB: CHANGE EMAIL & PASSWORD */}
            {activeTab === "security" && (
              <div
                className={`flex-1 w-full p-6 sm:p-8 flex flex-col items-start gap-6 rounded-[12px] border transition-colors ${
                  isLight
                    ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-sm"
                    : "bg-[#383838] border-[#444444] shadow-lg"
                }`}
              >
                {/* Header */}
                <div className="w-full flex items-center justify-between border-b pb-3.5 border-[#444444]/40">
                  <div>
                    <h3
                      className={`font-bold text-[16px] leading-[20px] ${
                        isLight ? "text-[#222222]" : "text-[#FFFFFF]"
                      }`}
                      style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                    >
                      {isThai ? "เปลี่ยนอีเมลและรหัสผ่าน (Change Email & Password)" : "Change Email & Password"}
                    </h3>
                    <p className={`text-[12px] mt-0.5 ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                      {isThai
                        ? "จัดการข้อมูลความปลอดภัย อัปเดตอีเมลสำหรับเข้าสู่ระบบ และตั้งรหัสผ่านใหม่"
                        : "Manage authentication credentials, update login email, and set your new password"}
                    </p>
                  </div>
                </div>

                {/* Optional Alert: Temporary Password Reset Needed */}
                {((profile.needs_password_reset) ||
                  (typeof window !== "undefined" && localStorage.getItem("dawh_needs_password_reset") === "true")) && (
                  <div className="w-full p-3.5 rounded-xl border flex items-start gap-3 bg-amber-500/10 border-amber-500/30 text-amber-500">
                    <AlertCircle size={18} className="shrink-0 mt-0.5" />
                    <div className="flex-1 text-xs leading-relaxed">
                      <p className="font-bold">
                        {isThai ? "แจ้งเตือน: บัญชีกำลังใช้งานรหัสผ่านชั่วคราว" : "Notice: Using Temporary Password"}
                      </p>
                      <p className={`mt-0.5 ${isLight ? "text-amber-700" : "text-amber-200/90"}`}>
                        {isThai
                          ? "เพื่อความปลอดภัยสูงสุด กรุณากำหนดรหัสผ่านใหม่ของคุณในส่วน 'เปลี่ยนรหัสผ่าน' ด้านล่าง"
                          : "For system security, please update your account password to a permanent one below."}
                      </p>
                    </div>
                  </div>
                )}

                {/* ------------------------------------------------------------- */}
                {/* 1. CHANGE EMAIL SECTION                                       */}
                {/* ------------------------------------------------------------- */}
                <div className="w-full flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "เปลี่ยนอีเมลสำหรับเข้าสู่ระบบ" : "Change Account Email"}
                    </span>
                  </div>

                  {/* Current Email Display */}
                  <div className="flex flex-col gap-1">
                    <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                      {isThai ? "อีเมลปัจจุบันที่ใช้งานอยู่" : "Current Email Address"}
                    </label>
                    <div
                      className={`w-full p-2.5 h-[40px] flex items-center justify-between rounded-[8px] border text-[13px] font-mono select-text ${
                        isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
                      }`}
                    >
                      <span className="truncate">{emailText}</span>
                      <span className="px-2 py-0.5 rounded text-[10.5px] font-sans font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1 shrink-0">
                        <CheckCircle2 size={11} />
                        {isThai ? "ใช้งานอยู่" : "Active"}
                      </span>
                    </div>
                  </div>

                  {/* Change Email Form */}
                  <form onSubmit={handleTabChangeEmail} className="w-full flex flex-col gap-3">
                    {emailError && (
                      <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{emailError}</span>
                      </div>
                    )}

                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "อีเมลใหม่ *" : "New Email Address *"}
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="email"
                            value={newEmail}
                            onChange={(e) => {
                              setNewEmail(e.target.value);
                              if (emailError) setEmailError(null);
                            }}
                            placeholder={isThai ? "ระบุอีเมลใหม่ เช่น user@company.com" : "e.g. user@company.com"}
                            className={`w-full p-2.5 h-[38px] rounded-lg border text-xs outline-none transition-all ${
                              isLight
                                ? "bg-white border-[#E5E5E5] text-[#222222] focus:border-[#222222] focus:ring-1 focus:ring-[#222222]"
                                : "bg-[#282828] border-[#444444] text-[#FFFFFF] focus:border-white focus:ring-1 focus:ring-white"
                            }`}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ยืนยันอีเมลใหม่ *" : "Confirm New Email *"}
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="email"
                            value={confirmNewEmail}
                            onChange={(e) => {
                              setConfirmNewEmail(e.target.value);
                              if (emailError) setEmailError(null);
                            }}
                            placeholder={isThai ? "พิมพ์อีเมลใหม่อีกครั้ง" : "Re-enter new email"}
                            className={`w-full p-2.5 h-[38px] rounded-lg border text-xs outline-none transition-all ${
                              isLight
                                ? "bg-white border-[#E5E5E5] text-[#222222] focus:border-[#222222] focus:ring-1 focus:ring-[#222222]"
                                : "bg-[#282828] border-[#444444] text-[#FFFFFF] focus:border-white focus:ring-1 focus:ring-white"
                            }`}
                          />
                        </div>
                      </div>
                    </div>

                    <p className={`text-[11.5px] leading-relaxed ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                      {isThai
                        ? "หมายเหตุ: เมื่อกดบันทึก ระบบจะส่งลิงก์ยืนยันไปยังอีเมลใหม่ กรุณาคลิกลิงก์ในอีเมลเพื่อเสร็จสิ้นกระบวนการ"
                        : "Note: A confirmation link will be sent to the new email address. You must verify it before the change takes effect."}
                    </p>

                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      {(newEmail || confirmNewEmail || emailError) && (
                        <button
                          type="button"
                          onClick={() => {
                            setNewEmail("");
                            setConfirmNewEmail("");
                            setEmailError(null);
                          }}
                          className={`px-2.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer select-none ${
                            isLight
                              ? "text-zinc-500 hover:text-black hover:underline"
                              : "text-zinc-400 hover:text-white hover:underline"
                          }`}
                        >
                          {isThai ? "ยกเลิก" : "Cancel"}
                        </button>
                      )}

                      <button
                        type="submit"
                        disabled={isSavingEmail || !newEmail.trim()}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                          !newEmail.trim() || isSavingEmail
                            ? "opacity-50 cursor-not-allowed bg-zinc-300 dark:bg-[#444444] text-zinc-500 dark:text-zinc-400"
                            : isLight
                            ? "bg-[#222222] hover:bg-black text-white active:scale-95"
                            : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#222222] active:scale-95"
                        }`}
                      >
                        {isSavingEmail ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : emailSuccess ? (
                          <CheckCircle2 size={13} className="text-emerald-500" />
                        ) : null}
                        <span>
                          {isSavingEmail
                            ? isThai
                              ? "กำลังส่งคำขอ..."
                              : "Updating..."
                            : emailSuccess
                            ? isThai
                              ? "ส่งคำขอสำเร็จ!"
                              : "Confirmation Sent!"
                            : isThai
                            ? "บันทึกและส่งคำขอยืนยันอีเมล"
                            : "Update Email Address"}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* 2. CHANGE PASSWORD SECTION                                    */}
                {/* ------------------------------------------------------------- */}
                <div className="w-full flex flex-col gap-4 pt-5 border-t border-[#444444]/30">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "เปลี่ยนรหัสผ่าน" : "Change Password"}
                    </span>
                  </div>

                  <form onSubmit={handleTabChangePassword} className="w-full flex flex-col gap-3">
                    {passwordError && (
                      <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in duration-150">
                        <AlertCircle size={14} className="shrink-0" />
                        <span>{passwordError}</span>
                      </div>
                    )}

                    {/* 3 Password Fields: 1. Current Password -> 2. New Password -> 3. Confirm New Password */}
                    <div className="flex flex-col gap-3">
                      {/* Field 1: Current Password */}
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "รหัสผ่านปัจจุบัน *" : "Current Password *"}
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type={showCurrentPassword ? "text" : "password"}
                            value={currentPassword}
                            onChange={(e) => {
                              setCurrentPassword(e.target.value);
                              if (passwordError) setPasswordError(null);
                            }}
                            placeholder={isThai ? "พิมพ์รหัสผ่านปัจจุบันเพื่อยืนยันตัวตน" : "Enter your current password"}
                            className={`w-full p-2.5 pr-10 h-[38px] rounded-lg border text-xs outline-none transition-all ${
                              isLight
                                ? "bg-white border-[#E5E5E5] text-[#222222] focus:border-[#222222] focus:ring-1 focus:ring-[#222222]"
                                : "bg-[#282828] border-[#444444] text-[#FFFFFF] focus:border-white focus:ring-1 focus:ring-white"
                            }`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                            className={`absolute right-2.5 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                              isLight ? "text-[#666666]" : "text-[#A1A1AA]"
                            }`}
                          >
                            {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      {/* Fields 2 & 3: New Password & Confirm New Password */}
                      <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {/* New Password */}
                        <div className="flex flex-col gap-1">
                          <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                            {isThai ? "รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร) *" : "New Password (At least 8 chars) *"}
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type={showNewPassword ? "text" : "password"}
                              value={newPassword}
                              onChange={(e) => {
                                setNewPassword(e.target.value);
                                if (passwordError) setPasswordError(null);
                              }}
                              placeholder={isThai ? "กำหนดรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร" : "Enter new password (min. 8 characters)"}
                              className={`w-full p-2.5 pr-10 h-[38px] rounded-lg border text-xs outline-none transition-all ${
                                isLight
                                  ? "bg-white border-[#E5E5E5] text-[#222222] focus:border-[#222222] focus:ring-1 focus:ring-[#222222]"
                                  : "bg-[#282828] border-[#444444] text-[#FFFFFF] focus:border-white focus:ring-1 focus:ring-white"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowNewPassword(!showNewPassword)}
                              className={`absolute right-2.5 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                                isLight ? "text-[#666666]" : "text-[#A1A1AA]"
                              }`}
                            >
                              {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>

                        {/* Confirm New Password */}
                        <div className="flex flex-col gap-1">
                          <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                            {isThai ? "ยืนยันรหัสผ่านใหม่อีกครั้ง *" : "Confirm New Password *"}
                          </label>
                          <div className="relative flex items-center">
                            <input
                              type={showConfirmNewPassword ? "text" : "password"}
                              value={confirmNewPassword}
                              onChange={(e) => {
                                setConfirmNewPassword(e.target.value);
                                if (passwordError) setPasswordError(null);
                              }}
                              placeholder={isThai ? "พิมพ์รหัสผ่านใหม่อีกครั้งเพื่อยืนยัน" : "Re-enter new password"}
                              className={`w-full p-2.5 pr-10 h-[38px] rounded-lg border text-xs outline-none transition-all ${
                                isLight
                                  ? "bg-white border-[#E5E5E5] text-[#222222] focus:border-[#222222] focus:ring-1 focus:ring-[#222222]"
                                  : "bg-[#282828] border-[#444444] text-[#FFFFFF] focus:border-white focus:ring-1 focus:ring-white"
                              }`}
                            />
                            <button
                              type="button"
                              onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                              className={`absolute right-2.5 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                                isLight ? "text-[#666666]" : "text-[#A1A1AA]"
                              }`}
                            >
                              {showConfirmNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Password Strength Meter & Single Status Label (หลอดรวมเหมือนใน Register) */}
                    <div className="w-full flex flex-col gap-1.5 pt-1">
                      <div className="flex items-center justify-between">
                        <span className={`text-[11.5px] font-medium ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                          {isThai ? "ระดับความปลอดภัยของรหัสผ่าน" : "Password Strength"}
                        </span>
                        {newPassword ? (
                          <span
                            className={`text-[10.5px] font-bold tracking-wider uppercase transition-all duration-300 ${
                              confirmNewPassword && newPassword !== confirmNewPassword
                                ? "text-rose-500 font-semibold"
                                : passwordStrength.textClass
                            }`}
                          >
                            {confirmNewPassword && newPassword !== confirmNewPassword
                              ? isThai
                                ? "รหัสผ่านไม่ตรงกัน"
                                : "Passwords do not match"
                              : confirmNewPassword && newPassword === confirmNewPassword
                              ? `${passwordStrength.label} • ${isThai ? "ตรงกัน" : "Match"}`
                              : passwordStrength.label}
                          </span>
                        ) : (
                          <span className={`text-[10.5px] ${isLight ? "text-zinc-400" : "text-zinc-500"}`}>
                            {isThai ? "อย่างน้อย 8 ตัวอักษร" : "Min. 8 characters"}
                          </span>
                        )}
                      </div>

                      {/* หลอดรวม 4 ขีดเหมือนใน Register */}
                      <div className="flex gap-1.5 h-[3.5px]">
                        {[1, 2, 3, 4].map((level) => (
                          <div
                            key={level}
                            className={`h-full flex-1 rounded-full transition-all duration-300 ${
                              newPassword && passwordStrength.score >= level
                                ? confirmNewPassword && newPassword !== confirmNewPassword
                                  ? "bg-rose-500"
                                  : passwordStrength.color
                                : isLight
                                ? "bg-slate-200"
                                : "bg-[#444444]"
                            }`}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2.5 pt-1">
                      {(currentPassword || newPassword || confirmNewPassword || passwordError) && (
                        <button
                          type="button"
                          onClick={() => {
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmNewPassword("");
                            setPasswordError(null);
                          }}
                          className={`px-2.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer select-none ${
                            isLight
                              ? "text-zinc-500 hover:text-black hover:underline"
                              : "text-zinc-400 hover:text-white hover:underline"
                          }`}
                        >
                          {isThai ? "ยกเลิก" : "Cancel"}
                        </button>
                      )}

                      <button
                        type="submit"
                        disabled={isSavingPassword || !currentPassword.trim() || newPassword.length < 8 || newPassword !== confirmNewPassword}
                        className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                          isSavingPassword || !currentPassword.trim() || newPassword.length < 8 || newPassword !== confirmNewPassword
                            ? "opacity-50 cursor-not-allowed bg-zinc-300 dark:bg-[#444444] text-zinc-500 dark:text-zinc-400"
                            : isLight
                            ? "bg-[#222222] hover:bg-black text-white active:scale-95"
                            : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#222222] active:scale-95"
                        }`}
                      >
                        {isSavingPassword ? (
                          <Loader2 size={13} className="animate-spin" />
                        ) : passwordSuccess ? (
                          <CheckCircle2 size={13} className="text-emerald-500" />
                        ) : null}
                        <span>
                          {isSavingPassword
                            ? isThai
                              ? "กำลังอัปเดตรหัสผ่าน..."
                              : "Updating..."
                            : passwordSuccess
                            ? isThai
                              ? "เปลี่ยนรหัสผ่านสำเร็จ!"
                              : "Password Changed!"
                            : isThai
                            ? "อัปเดตรหัสผ่านใหม่"
                            : "Update Password"}
                        </span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* ------------------------------------------------------------- */}
                {/* 3. 6-DIGIT PIN SECURITY & RECOVERY                            */}
                {/* ------------------------------------------------------------- */}
                <div className="w-full flex flex-col gap-3 pt-5 border-t border-[#444444]/30">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ระบบความปลอดภัยเพิ่มเติม" : "Additional Security"}
                    </span>
                  </div>

                  <div
                    className={`w-full p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                      isLight ? "bg-[#F8FAFC] border-[#E2E8F0]" : "bg-[#282828] border-[#444444]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg transition-colors ${
                          !(profile.pin_code || profile.is_pin_enabled)
                            ? isLight
                              ? "bg-amber-500/10 border border-amber-500/50 text-amber-600 shadow-xs"
                              : "bg-amber-500/10 border border-amber-500/50 text-amber-400"
                            : isLight
                            ? "bg-white border border-transparent text-zinc-700 shadow-xs"
                            : "bg-[#333333] border border-transparent text-zinc-200"
                        }`}
                      >
                        <Fingerprint size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className={`text-xs font-bold ${isLight ? "text-[#222222]" : "text-white"}`}>
                            {isThai ? "รหัส PIN 6 หลัก (Quick 6-Digit PIN)" : "Quick 6-Digit PIN"}
                          </h4>
                          {(profile.pin_code || profile.is_pin_enabled) && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                              {isThai ? "ตั้งค่าแล้ว" : "Configured"}
                            </span>
                          )}
                        </div>
                        <p className={`text-[11.5px] mt-0.5 ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                          {isThai
                            ? "ใช้สำหรับการเข้าถึงโมดูลสำคัญและการยืนยันตัวตนอย่างรวดเร็วในองค์กร"
                            : "Used for quick authorization and sensitive actions verification"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowPinSetupModal(true)}
                      className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shrink-0 ${
                        isLight
                          ? "border-[#E5E5E5] bg-white text-[#222222] hover:bg-slate-50 active:scale-95"
                          : "border-[#555555] bg-[#333333] text-white hover:bg-[#3d3d3d] active:scale-95"
                      }`}
                    >
                      {profile.pin_code || profile.is_pin_enabled
                        ? isThai
                          ? "เปลี่ยนรหัส PIN"
                          : "Change PIN"
                        : isThai
                        ? "ตั้งค่ารหัส PIN ทันที"
                        : "Setup PIN"}
                    </button>
                  </div>

                  {!(profile.pin_code || profile.is_pin_enabled) && (
                    <p className="w-full text-xs text-amber-500 font-medium">
                      {isThai ? "ยังไม่ได้ตั้งค่า" : "Not Set"}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. POPUP MODAL: SECONDARY REGISTRATION (กรอกข้อมูลโปรไฟล์รอบสอง)            */}
      {/* ========================================================================= */}
      {showSecondaryRegModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-[720px] max-h-[90vh] rounded-[20px] border shadow-2xl flex flex-col overflow-hidden ${
              isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
            }`}
          >
            {/* Modal Header (Fixed) */}
            <div
              className={`flex items-center justify-between p-5 sm:p-6 border-b shrink-0 ${
                isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444]/60 bg-[#383838]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${isLight ? "bg-[#222222] text-white" : "bg-white text-[#222222]"}`}>
                  {regStep === "fill" ? <User size={18} /> : <FileText size={18} />}
                </div>
                <div>
                  <h4
                    className={`font-bold text-[18px] leading-tight ${
                      isLight ? "text-[#222222]" : "text-[#FFFFFF]"
                    }`}
                    style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                  >
                    {regStep === "fill"
                      ? isThai ? "กรอกข้อมูลโปรไฟล์เพิ่มเติม (ลงทะเบียนรอบ 2)" : "Complete Profile Information"
                      : isThai ? "ตรวจสอบข้อมูลและยอมรับเงื่อนไข" : "Review Information & Terms"}
                  </h4>
                  <p className={`text-[12px] mt-0.5 ${isLight ? "text-[#666666]" : "text-[#E4E4E7]"}`}>
                    {regStep === "fill"
                      ? isThai ? "ขั้นตอนที่ 1 จาก 2 : กรุณากรอกข้อมูลส่วนตัวเพื่อความสมบูรณ์ของระบบ" : "Step 1 of 2 : Please fill in your enterprise employee records"
                      : isThai ? "ขั้นตอนที่ 2 จาก 2 : กรุณาตรวจสอบข้อมูลและยอมรับข้อตกลงก่อนบันทึก" : "Step 2 of 2 : Please verify your information and agree to terms"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {/* DEV_TESTPUSHFILL_START - Text button for test fill (DELETE ME EASILY WHEN DONE) */}
                <button
                  type="button"
                  onClick={handleTestPushFill}
                  className="text-xs text-amber-500 hover:text-amber-400 underline cursor-pointer p-1 font-mono"
                  title="Auto-fill test data"
                >
                  testpushfill
                </button>
                {/* DEV_TESTPUSHFILL_END */}

                <button
                  type="button"
                  onClick={() => setShowExitConfirmModal(true)}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                    isLight ? "text-slate-400 hover:text-[#222222] hover:bg-slate-100" : "text-[#E4E4E7] hover:text-[#FFFFFF] hover:bg-[#444444]"
                  }`}
                  title={isThai ? "ปิด / ออกจากแบบฟอร์ม" : "Close"}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {regStep === "fill" ? (
              /* ================================================================= */
              /* STEP 1: FORM INPUTS                                              */
              /* ================================================================= */
              <form onSubmit={handleValidateAndProceedToReview} className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                {/* Scroll-to-bottom Down Arrow Button (hides when at bottom) */}
                {!isFormAtBottom && (
                  <button
                    type="button"
                    onClick={() => regFormScrollRef.current?.scrollTo({ top: regFormScrollRef.current.scrollHeight, behavior: "smooth" })}
                    className={`absolute bottom-20 right-5 sm:right-7 p-2.5 rounded-full shadow-lg border transition-all hover:scale-110 active:scale-95 cursor-pointer z-20 flex items-center justify-center animate-in fade-in duration-200 ${
                      isLight
                        ? "bg-white/95 hover:bg-white border-[#E4E4E7] text-[#222222] shadow-slate-400/30"
                        : "bg-[#282828]/95 hover:bg-[#333333] border-[#555555] text-white shadow-black/50"
                    }`}
                    title={isThai ? "เลื่อนลงไปล่างสุด" : "Scroll to bottom"}
                  >
                    <ChevronDown size={18} />
                  </button>
                )}

                {/* Scrollable Form Body (Scrollbar strictly contained inside between header and footer) */}
                <div ref={regFormScrollRef} onScroll={handleFormScroll} className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 pb-36 space-y-4">
                  {modalError && (
                    <p className="text-xs text-rose-500 font-medium py-1 select-none">
                      {modalError}
                    </p>
                  )}

                  {/* Section: ข้อมูลชื่อและบัญชีผู้ใช้ (Name & Account) */}
                  <div className="flex flex-col gap-3">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลชื่อและบัญชีผู้ใช้" : "Name & Account Details"}
                    </h5>

                    {/* Thai Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อจริง (ภาษาไทย) *" : "First Name (Thai) *"}
                        </label>
                        <input
                          type="text"
                          value={regForm.first_name_th}
                          onChange={(e) => setRegForm({ ...regForm, first_name_th: e.target.value })}
                          placeholder={isThai ? "ชื่อจริง" : "First Name"}
                          className={getInputClass("first_name_th")}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "นามสกุล (ภาษาไทย) *" : "Last Name (Thai) *"}
                        </label>
                        <input
                          type="text"
                          value={regForm.last_name_th}
                          onChange={(e) => setRegForm({ ...regForm, last_name_th: e.target.value })}
                          placeholder={isThai ? "นามสกุล" : "Last Name"}
                          className={getInputClass("last_name_th")}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อเล่น (ภาษาไทย)" : "Nickname (Thai)"}
                        </label>
                        <input
                          type="text"
                          value={regForm.nickname_th}
                          onChange={(e) => setRegForm({ ...regForm, nickname_th: e.target.value })}
                          placeholder={isThai ? "ชื่อเล่น" : "Nickname"}
                          className={getInputClass("nickname_th")}
                        />
                      </div>
                    </div>

                      {/* English Name (3 columns) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>First Name (English) *</label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={regForm.first_name || profile.first_name || ""}
                              onChange={(e) => setRegForm({ ...regForm, first_name: e.target.value })}
                              placeholder="First Name"
                              className={getInputClass("first_name")}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>Last Name (English) *</label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={regForm.last_name || profile.last_name || ""}
                              onChange={(e) => setRegForm({ ...regForm, last_name: e.target.value })}
                              placeholder="Last Name"
                              className={getInputClass("last_name")}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>Nickname (English)</label>
                          <input
                            type="text"
                            value={regForm.nickname}
                            onChange={(e) => setRegForm({ ...regForm, nickname: e.target.value })}
                            placeholder="Nickname"
                            className={getInputClass("nickname")}
                          />
                        </div>
                      </div>

                    {/* Prefix and Username (2 columns) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "คำนำหน้าชื่อ" : "Prefix"}
                        </label>
                        <FormCustomSelect
                          id="prefix"
                          value={regForm.prefix || ""}
                          placeholder={isThai ? "คำนำหน้าชื่อ" : "Prefix"}
                          options={[
                            { value: "", label: isThai ? "- ไม่ระบุ -" : "- None -" },
                            { value: "mr", label: isThai ? "นาย" : "Mr." },
                            { value: "mrs", label: isThai ? "นาง" : "Mrs." },
                            { value: "miss", label: isThai ? "นางสาว" : "Miss" },
                          ]}
                          isOpen={activeDropdownId === "prefix"}
                          onToggle={() => setActiveDropdownId((prev) => (prev === "prefix" ? null : "prefix"))}
                          onSelect={(val) => {
                            setRegForm({ ...regForm, prefix: val });
                            setActiveDropdownId(null);
                          }}
                          isLight={isLight}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อผู้ใช้" : "Username"}
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={regForm.username || profile.username || (profile.email ? profile.email.split("@")[0] : "") || ""}
                            placeholder={isThai ? "ชื่อผู้ใช้" : "Username"}

                            className={`w-full p-2.5 pr-9 rounded-lg border text-xs font-mono font-medium outline-none cursor-not-allowed select-none transition-all ${
                              isLight
                                ? "bg-[#F0F0F0] border-[#E5E5E5] text-[#555555]"
                                : "bg-[#202020] border-[#383838] text-[#A1A1AA]"
                            }`}
                          />
                          <div
                            className={`absolute right-3 pointer-events-none ${
                              isLight ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            <Lock size={13} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section: ข้อมูลส่วนบุคคลและเอกสารประจำตัว (Personal Identity & Details) */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลส่วนบุคคลและเอกสารประจำตัว" : "Personal Identity & Details"}
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "เลขประจำตัวประชาชน *" : "National ID Card *"}
                        </label>
                        <input
                          type="text"
                          maxLength={13}
                          value={regForm.id_card}
                          onChange={(e) => setRegForm({ ...regForm, id_card: e.target.value.replace(/\D/g, "") })}
                          placeholder={isThai ? "เลขประจำตัวประชาชน 13 หลัก" : "13-Digit National ID"}
                          className={getInputClass("id_card", "font-mono tracking-wider")}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "วัน/เดือน/ปีเกิด" : "Birth Date"}
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={formatBirthDate(regForm.birth_date || profile.birth_date)}
                            placeholder={isThai ? "วัน/เดือน/ปีเกิด" : "Birth Date"}
                            className={`w-full p-2.5 pr-9 rounded-lg border text-xs font-mono font-medium outline-none cursor-not-allowed select-none transition-all ${
                              isLight
                                ? "bg-[#F0F0F0] border-[#E5E5E5] text-[#555555]"
                                : "bg-[#202020] border-[#383838] text-[#A1A1AA]"
                            }`}
                          />
                          <div
                            className={`absolute right-3 pointer-events-none ${
                              isLight ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            <Lock size={13} />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "เพศ" : "Gender"}
                        </label>
                        <FormCustomSelect
                          id="gender"
                          value={regForm.gender || "ชาย"}
                          placeholder={isThai ? "เพศ" : "Gender"}
                          options={[
                            { value: "ชาย", label: isThai ? "ชาย" : "Male" },
                            { value: "หญิง", label: isThai ? "หญิง" : "Female" },
                            { value: "อื่นๆ", label: isThai ? "อื่นๆ" : "Other" },
                          ]}
                          isOpen={activeDropdownId === "gender"}
                          onToggle={() => setActiveDropdownId((prev) => (prev === "gender" ? null : "gender"))}
                          onSelect={(val) => {
                            setRegForm({ ...regForm, gender: val });
                            setActiveDropdownId(null);
                          }}
                          isLight={isLight}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "กรุ๊ปเลือด" : "Blood Type"}
                        </label>
                        <FormCustomSelect
                          id="blood_type"
                          value={regForm.blood_type}
                          placeholder={isThai ? "เลือกกรุ๊ปเลือด" : "Select Blood Type"}
                          options={[
                            { value: "A", label: "A" },
                            { value: "B", label: "B" },
                            { value: "AB", label: "AB" },
                            { value: "O", label: "O" },
                          ]}
                          isOpen={activeDropdownId === "blood_type"}
                          onToggle={() => setActiveDropdownId((prev) => (prev === "blood_type" ? null : "blood_type"))}
                          onSelect={(val) => {
                            setRegForm({ ...regForm, blood_type: val });
                            setActiveDropdownId(null);
                          }}
                          isLight={isLight}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "สถานภาพสมรส" : "Marital Status"}
                        </label>
                        <FormCustomSelect
                          id="marital_status"
                          value={regForm.marital_status}
                          placeholder={isThai ? "เลือกสถานภาพ" : "Select Status"}
                          options={[
                            { value: "โสด", label: isThai ? "โสด" : "Single" },
                            { value: "สมรส", label: isThai ? "สมรส" : "Married" },
                            { value: "หย่าร้าง", label: isThai ? "หย่าร้าง" : "Divorced" },
                            { value: "หม้าย", label: isThai ? "หม้าย" : "Widowed" },
                          ]}
                          isOpen={activeDropdownId === "marital_status"}
                          onToggle={() => setActiveDropdownId((prev) => (prev === "marital_status" ? null : "marital_status"))}
                          onSelect={(val) => {
                            setRegForm({ ...regForm, marital_status: val });
                            setActiveDropdownId(null);
                          }}
                          isLight={isLight}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "สัญชาติ" : "Nationality"}
                        </label>
                        <input
                          type="text"
                          value={regForm.nationality}
                          onChange={(e) => setRegForm({ ...regForm, nationality: e.target.value })}
                          placeholder={isThai ? "ระบุสัญชาติ (เช่น ไทย)" : "e.g. Thai"}
                          className={`p-2.5 rounded-lg border text-xs outline-none ${
                            isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#FFFFFF]"
                          }`}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ศาสนา" : "Religion"}
                        </label>
                        <FormCustomSelect
                          id="religion"
                          value={religionChoice}
                          placeholder={isThai ? "เลือกศาสนา" : "Select Religion"}
                          options={[
                            { value: "พุทธ", label: isThai ? "พุทธ" : "Buddhism" },
                            { value: "อิสลาม", label: isThai ? "อิสลาม" : "Islam" },
                            { value: "คริสต์", label: isThai ? "คริสต์" : "Christianity" },
                            { value: "ฮินดู", label: isThai ? "ฮินดู" : "Hinduism" },
                            { value: "ซิกข์", label: isThai ? "ซิกข์" : "Sikhism" },
                            { value: "ไม่นับถือศาสนา", label: isThai ? "ไม่นับถือศาสนา" : "Non-religious / None" },
                            { value: "อื่นๆ", label: isThai ? "อื่นๆ (ระบุเอง)" : "Other (Specify)" },
                          ]}
                          isOpen={activeDropdownId === "religion"}
                          onToggle={() => setActiveDropdownId((prev) => (prev === "religion" ? null : "religion"))}
                          onSelect={(val) => {
                            setReligionChoice(val);
                            if (val === "อื่นๆ") {
                              setRegForm({ ...regForm, religion: customReligion });
                            } else {
                              setRegForm({ ...regForm, religion: val });
                              setCustomReligion("");
                            }
                            setActiveDropdownId(null);
                          }}
                          isLight={isLight}
                        />

                        {religionChoice === "อื่นๆ" && (
                          <input
                            type="text"
                            value={customReligion}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomReligion(val);
                              setRegForm({ ...regForm, religion: val });
                            }}
                            placeholder={isThai ? "กรุณาระบุศาสนาของคุณ" : "Please specify religion"}
                            className={`mt-1.5 p-2.5 rounded-lg border text-xs outline-none animate-in fade-in zoom-in-95 duration-150 ${
                              isLight ? "bg-white border-[#222222] text-[#222222]" : "bg-[#282828] border-white text-[#FFFFFF]"
                            }`}
                            autoFocus
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section: ข้อมูลการศึกษา (Education Details) */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลการศึกษา" : "Educational Background"}
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "วุฒิการศึกษา" : "Education Level"}
                        </label>
                        <FormCustomSelect
                          id="education_level"
                          value={regForm.education_level || "ปริญญาตรี"}
                          placeholder={isThai ? "วุฒิการศึกษา" : "Education Level"}
                          options={[
                            { value: "มัธยมศึกษาตอนปลาย / ปวช.", label: isThai ? "มัธยมศึกษาตอนปลาย / ปวช." : "High School / Vocational" },
                            { value: "ปวส. / อนุปริญญา", label: isThai ? "ปวส. / อนุปริญญา" : "Diploma / Associate" },
                            { value: "ปริญญาตรี", label: isThai ? "ปริญญาตรี" : "Bachelor's Degree" },
                            { value: "ปริญญาโท", label: isThai ? "ปริญญาโท" : "Master's Degree" },
                            { value: "ปริญญาเอก", label: isThai ? "ปริญญาเอก" : "Doctorate / Ph.D." },
                            { value: "อื่นๆ", label: isThai ? "อื่นๆ" : "Other" },
                          ]}
                          isOpen={activeDropdownId === "education_level"}
                          onToggle={() => setActiveDropdownId((prev) => (prev === "education_level" ? null : "education_level"))}
                          onSelect={(val) => {
                            setRegForm({ ...regForm, education_level: val });
                            setActiveDropdownId(null);
                          }}
                          isLight={isLight}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <MajorSubjectAutocomplete
                          value={regForm.major_subject}
                          onChange={(en) => setRegForm({ ...regForm, major_subject: en })}
                          isLight={isLight}
                          isThai={isThai}
                        />
                      </div>
                    </div>

                    <UniversitySearchSelect
                      valueTh={regForm.university_th}
                      valueEn={regForm.university_en}
                      onChange={(th, en) => {
                        setRegForm({
                          ...regForm,
                          university_th: th,
                          university_en: en,
                          university_name: isThai ? (th || en) : (en || th),
                        });
                      }}
                      isLight={isLight}
                      isThai={isThai}
                    />
                  </div>

                  {/* Section: ข้อมูลการติดต่อและที่อยู่อาศัย (Contact & Addresses) */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลการติดต่อและที่อยู่อาศัย" : "Contact & Addresses"}
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "เบอร์โทรศัพท์มือถือ *" : "Mobile Phone *"}
                        </label>
                        {lockedPhone ? (
                          <div className="relative flex items-center">
                            <input
                              type="tel"
                              readOnly
                              disabled
                              value={lockedPhone}
                              className={`w-full p-2.5 pr-9 rounded-lg border text-xs font-mono font-medium outline-none cursor-not-allowed select-none transition-all ${
                                isLight
                                  ? "bg-[#F0F0F0] border-[#E5E5E5] text-[#555555]"
                                  : "bg-[#202020] border-[#383838] text-[#A1A1AA]"
                              }`}
                            />
                            <div className={`absolute right-3 pointer-events-none ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                              <Lock size={13} />
                            </div>
                          </div>
                        ) : (
                          <input
                            type="tel"
                            value={regForm.phone}
                            onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                            placeholder={isThai ? "เบอร์โทรศัพท์มือถือ" : "Mobile Phone"}
                            className={getInputClass("phone", "font-mono")}
                          />
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ความสัมพันธ์ผู้ติดต่อฉุกเฉิน *" : "Emergency Relationship *"}
                        </label>
                        <FormCustomSelect
                          id="emergency_contact_relationship"
                          value={regForm.emergency_contact_relationship || "บิดา/มารดา"}
                          placeholder={isThai ? "ความสัมพันธ์" : "Relationship"}
                          options={[
                            { value: "บิดา/มารดา", label: isThai ? "บิดา / มารดา" : "Parents" },
                            { value: "คู่สมรส", label: isThai ? "คู่สมรส" : "Spouse" },
                            { value: "พี่/น้อง", label: isThai ? "พี่ / น้อง" : "Sibling" },
                            { value: "บุตร", label: isThai ? "บุตร" : "Child" },
                            { value: "ญาติ", label: isThai ? "ญาติ" : "Relative" },
                            { value: "เพื่อน", label: isThai ? "เพื่อนสนิท" : "Friend" },
                            { value: "อื่นๆ", label: isThai ? "อื่นๆ" : "Other" },
                          ]}
                          isOpen={activeDropdownId === "emergency_contact_relationship"}
                          onToggle={() => setActiveDropdownId((prev) => (prev === "emergency_contact_relationship" ? null : "emergency_contact_relationship"))}
                          onSelect={(val) => {
                            setRegForm({ ...regForm, emergency_contact_relationship: val });
                            setActiveDropdownId(null);
                          }}
                          isLight={isLight}
                        />
                      </div>
                    </div>

                    {/* Emergency Contact: Name TH, Name EN, Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อผู้ติดต่อฉุกเฉิน (ภาษาไทย) *" : "Emergency Contact (Thai) *"}
                        </label>
                        <input
                          type="text"
                          placeholder={isThai ? "ชื่อผู้ติดต่อฉุกเฉิน (ภาษาไทย)" : "Emergency Contact Name"}
                          value={regForm.emergency_contact_name_th}
                          onChange={(e) => setRegForm({ ...regForm, emergency_contact_name_th: e.target.value })}
                          className={`p-2.5 rounded-lg border text-xs outline-none ${
                            isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#FFFFFF]"
                          }`}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อผู้ติดต่อฉุกเฉิน (English)" : "Emergency Contact (English)"}
                        </label>
                        <input
                          type="text"
                          placeholder={isThai ? "ชื่อผู้ติดต่อฉุกเฉิน (English)" : "Emergency Contact Name"}
                          value={regForm.emergency_contact_name}
                          onChange={(e) => setRegForm({ ...regForm, emergency_contact_name: e.target.value })}
                          className={`p-2.5 rounded-lg border text-xs outline-none ${
                            isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#FFFFFF]"
                          }`}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "เบอร์โทรติดต่อฉุกเฉิน *" : "Emergency Phone *"}
                        </label>
                        <input
                          type="tel"
                          value={regForm.emergency_contact_phone}
                          onChange={(e) => setRegForm({ ...regForm, emergency_contact_phone: e.target.value })}
                          placeholder={isThai ? "เบอร์โทรติดต่อฉุกเฉิน" : "Emergency Phone"}
                          className={`p-2.5 rounded-lg border text-xs font-mono outline-none ${
                            isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <ThaiAddressSelector
                        label={isThai ? "ที่อยู่ปัจจุบัน" : "Current Address"}
                        isRequired
                        value={regForm.current_address}
                        onChange={(val) => setRegForm({ ...regForm, current_address: val })}
                        isLight={isLight}
                        isThai={isThai}
                      />

                      <ThaiAddressSelector
                        label={isThai ? "ที่อยู่ตามทะเบียนบ้าน" : "Registered Address"}
                        isRequired
                        value={regForm.registered_address}
                        onChange={(val) => setRegForm({ ...regForm, registered_address: val })}
                        isLight={isLight}
                        isThai={isThai}
                        showCopyButton={true}
                        onCopyFromCurrent={() => {
                          if (regForm.current_address) {
                            setRegForm({ ...regForm, registered_address: regForm.current_address });
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Section: สังกัดงานและองค์กร (Branch Assignment) */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลสาขาประจำการ" : "Branch Assignment"}
                    </h5>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "สาขาที่สังกัด *" : "Branch Assignment *"}
                        </label>

                        {/* Custom Dropdown Trigger Button with Auto-Scroll */}
                        <FormCustomSelect
                          id="branch"
                          value={regForm.branch_name || ""}
                          placeholder={isThai ? "เลือกสาขาที่สังกัด" : "Select Branch Assignment"}
                          options={branchesList.map((b) => ({
                            value: b.branch_name,
                            label: isThai ? b.branch_name : (b.branch_name_en || b.branch_name),
                            sublabel: b.address,
                            badge: b.branch_code,
                          }))}
                          isOpen={activeDropdownId === "branch"}
                          onToggle={() => setActiveDropdownId((prev) => (prev === "branch" ? null : "branch"))}
                          onSelect={(val) => {
                            const matched = branchesList.find((b) => b.branch_name === val);
                            setRegForm({
                              ...regForm,
                              branch_name: val,
                              branch_id: matched?.id || regForm.branch_id,
                            });
                            setActiveDropdownId(null);
                          }}
                          isLight={isLight}
                          isInvalid={isFieldInvalid("branch_name")}
                          icon={<Building2 size={13} />}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Actions (Fixed at bottom) */}
                <div
                  className={`flex items-center justify-between gap-2.5 p-4 sm:px-6 border-t shrink-0 ${
                    isLight ? "border-[#E4E4E7] bg-[#FAFAFA]" : "border-[#444444]/60 bg-[#303030]"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    {modalError && (
                      <p className="text-xs text-rose-500 font-medium truncate select-none">
                        {modalError}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setShowExitConfirmModal(true)}
                      className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                        isLight ? "text-slate-500 hover:text-[#222222] hover:bg-slate-200/50" : "text-[#E4E4E7] hover:text-[#FFFFFF] hover:bg-[#444444]"
                      }`}
                    >
                      {isThai ? "ยกเลิก" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      className={`px-6 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all ${
                        isLight ? "bg-[#222222] text-white hover:bg-black" : "bg-[#FFFFFF] text-[#222222] hover:bg-[#F4F4F5]"
                      }`}
                    >
                      <span>{isThai ? "ตรวจสอบข้อมูลและยอมรับเงื่อนไข" : "Review & Continue"}</span>
                      <ArrowLeft size={14} className="rotate-180" />
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* ================================================================= */
              /* STEP 2: REVIEW SUMMARY & TERMS OF SERVICE AGREEMENT               */
              /* ================================================================= */
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                {/* Scroll-to-bottom Down Arrow Button (hides when at bottom) */}
                {!isReviewAtBottom && (
                  <button
                    type="button"
                    onClick={() => reviewScrollRef.current?.scrollTo({ top: reviewScrollRef.current.scrollHeight, behavior: "smooth" })}
                    className={`absolute bottom-20 right-5 sm:right-7 p-2.5 rounded-full shadow-lg border transition-all hover:scale-110 active:scale-95 cursor-pointer z-20 flex items-center justify-center animate-in fade-in duration-200 ${
                      isLight
                        ? "bg-white/95 hover:bg-white border-[#E4E4E7] text-[#222222] shadow-slate-400/30"
                        : "bg-[#282828]/95 hover:bg-[#333333] border-[#555555] text-white shadow-black/50"
                    }`}
                    title={isThai ? "เลื่อนลงไปล่างสุด" : "Scroll to bottom"}
                  >
                    <ChevronDown size={18} />
                  </button>
                )}

                {/* Scrollable Review Body */}
                <div ref={reviewScrollRef} onScroll={handleReviewScroll} className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 pb-20 space-y-4">
                  {modalError && (
                    <p className="text-xs text-rose-500 font-medium py-1 select-none">
                      {modalError}
                    </p>
                  )}

                  {/* Info Notice Banner */}
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                      isLight ? "bg-slate-50 border-slate-200 text-[#222222]" : "bg-[#282828] border-[#444444] text-white"
                    }`}
                  >
                    <ShieldCheck size={18} className="text-[#2EC4B6] shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold">{isThai ? "สรุปข้อมูลการลงทะเบียนรอบ 2" : "Registration Summary"}</span>
                      <span className={`text-[11.5px] leading-relaxed ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                        {isThai
                          ? "โปรดตรวจสอบข้อมูลของท่านให้ถูกต้อง ข้อมูลทั้งหมดจะถูกใช้ในสัญญาจ้างงานและสิทธิ์การเข้าถึงระบบองค์กร"
                          : "Please carefully review your personal information. These records are tied to enterprise clearance and operations."}
                      </span>
                    </div>
                  </div>

                  {/* Section 1: ข้อมูลประจำตัวและชื่อ (Read-Only Form) */}
                  <div className="flex flex-col gap-3">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลชื่อและบัญชีผู้ใช้" : "Name & Account Details"}
                    </h5>

                    {/* Thai Names */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "คำนำหน้า" : "Prefix"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={getPrefixDisplayLabel(regForm.prefix, isThai ? "TH" : "EN")}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อจริง (ภาษาไทย)" : "First Name (Thai)"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.first_name_th || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "นามสกุล (ภาษาไทย)" : "Last Name (Thai)"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.last_name_th || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อเล่น (ภาษาไทย)" : "Nickname (Thai)"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.nickname_th || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>

                    {/* English Names & Username */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "First Name (English)" : "First Name"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.first_name || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "Last Name (English)" : "Last Name"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.last_name || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "Nickname (English)" : "Nickname"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.nickname || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อผู้ใช้ในระบบ" : "Username"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={`@${regForm.username || "—"}`}
                          className={`w-full p-2.5 rounded-lg border text-xs font-mono outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Personal Identity Details: ID Card, Birth Date, Gender, Blood, Marital, Nationality, Religion */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "เลขประจำตัวประชาชน (13 หลัก)" : "Citizen ID Card (13 Digits)"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.id_card || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs font-mono tracking-wider outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "วันเดือนปีเกิด" : "Birth Date"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={formatBirthDate(regForm.birth_date)}
                          className={`w-full p-2.5 rounded-lg border text-xs font-mono outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "เพศ" : "Gender"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.gender || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "กรุ๊ปเลือด" : "Blood Type"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.blood_type || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs font-semibold outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "สถานภาพสมรส" : "Marital Status"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.marital_status || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "สัญชาติ" : "Nationality"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.nationality || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ศาสนา" : "Religion"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.religion || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: ข้อมูลการศึกษา (Read-Only Form) */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลการศึกษา" : "Educational Background"}
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "วุฒิการศึกษา" : "Education Level"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.education_level || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "สาขาวิชา" : "Major Subject"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.major_subject || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "สถาบันการศึกษา / มหาวิทยาลัย" : "University / Institution"}
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={
                          regForm.university_th
                            ? `${regForm.university_th} ${regForm.university_en ? `(${regForm.university_en})` : ""}`
                            : regForm.university_name || "—"
                        }
                        className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                          isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Section 3: ข้อมูลการติดต่อและที่อยู่อาศัย (Read-Only Form) */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลการติดต่อและที่อยู่อาศัย" : "Contact & Addresses"}
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "เบอร์โทรศัพท์มือถือ" : "Mobile Phone"}
                        </label>
                        <input
                          type="tel"
                          readOnly
                          disabled
                          value={regForm.phone || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs font-mono outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ความสัมพันธ์ผู้ติดต่อฉุกเฉิน" : "Emergency Relationship"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.emergency_contact_relationship || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อผู้ติดต่อฉุกเฉิน (ภาษาไทย)" : "Emergency Contact (Thai)"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.emergency_contact_name_th || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อผู้ติดต่อฉุกเฉิน (English)" : "Emergency Contact (English)"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.emergency_contact_name || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "เบอร์โทรติดต่อฉุกเฉิน" : "Emergency Phone"}
                        </label>
                        <input
                          type="tel"
                          readOnly
                          disabled
                          value={regForm.emergency_contact_phone || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs font-mono outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ที่อยู่ปัจจุบัน" : "Current Address"}
                        </label>
                        <textarea
                          rows={2}
                          readOnly
                          disabled
                          value={regForm.current_address || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs leading-relaxed outline-none resize-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ที่อยู่ตามทะเบียนบ้าน" : "Registered Address"}
                        </label>
                        <textarea
                          rows={2}
                          readOnly
                          disabled
                          value={regForm.registered_address || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs leading-relaxed outline-none resize-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: สังกัดงานและองค์กร (Read-Only Form) */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลสาขาประจำการ" : "Branch Assignment"}
                    </h5>
                    <div className="flex flex-col gap-1">
                      <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "สาขาที่สังกัด" : "Branch Assignment"}
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={regForm.branch_name || "สำนักงานใหญ่ (Headquarters)"}
                        className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                          isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Terms of Service & Privacy Agreement Box */}
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? "text-[#222222]" : "text-white"}`}>
                        <FileText size={13} />
                        <span>{isThai ? "ข้อตกลงและนโยบายความเป็นส่วนตัว" : "Terms & Privacy Policy"}</span>
                      </span>

                      <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs flex items-center gap-1 font-medium transition-colors hover:underline cursor-pointer ${
                          isLight ? "text-zinc-600 hover:text-black" : "text-zinc-400 hover:text-white"
                        }`}
                        title={isThai ? "เปิดอ่านฉบับเต็มในแท็บใหม่" : "Open full terms in new tab"}
                      >
                        <span>{isThai ? "อ่านฉบับเต็ม" : "Read Full Terms"}</span>
                        <ArrowUpRight size={13} />
                      </a>
                    </div>

                    <div
                      className={`p-5 rounded-xl border min-h-[180px] max-h-[260px] overflow-y-auto text-xs leading-relaxed space-y-3.5 ${
                        isLight ? "bg-white border-[#E4E4E7] text-[#444444]" : "bg-[#1E1E1E] border-[#3E3E3E] text-[#D4D4D8]"
                      }`}
                    >
                      <div>
                        <span className={`font-bold block text-[13px] ${isLight ? "text-[#222222]" : "text-white"}`}>
                          {isThai ? "1. การคุ้มครองข้อมูลส่วนบุคคล" : "1. Data Protection & PDPA"}
                        </span>
                        <p className="mt-1">
                          {isThai
                            ? "ข้อมูลส่วนบุคคลทั้งหมดที่ท่านระบุจะถูกจัดเก็บ เข้ารหัส และประมวลผลอย่างปลอดภัยตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล เพื่อการบริหารงานบุคคลและสัญญาจ้างงาน"
                            : "All personal information provided is stored, encrypted, and processed in accordance with privacy laws for employment and clearance purposes."}
                        </p>
                      </div>
                      <div>
                        <span className={`font-bold block text-[13px] ${isLight ? "text-[#222222]" : "text-white"}`}>
                          {isThai ? "2. การรับรองความถูกต้องของข้อมูล" : "2. Truthfulness & Authenticity"}
                        </span>
                        <p className="mt-1">
                          {isThai
                            ? "ท่านรับรองว่าข้อมูลทั้งหมดที่ระบุไว้ข้างต้นเป็นความจริง ถูกต้อง และสมบูรณ์ทุกประการ"
                            : "You certify that all information submitted is true, complete, and accurate."}
                        </p>
                      </div>
                      <div>
                        <span className={`font-bold block text-[13px] ${isLight ? "text-[#222222]" : "text-white"}`}>
                          {isThai ? "3. การรักษาความปลอดภัยบัญชีและรหัส PIN" : "3. Account & PIN Security"}
                        </span>
                        <p className="mt-1">
                          {isThai
                            ? "บัญชีผู้ใช้และรหัส PIN 6 หลักที่ท่านจะกำหนดในขั้นตอนถัดไปเป็นสิทธิ์เฉพาะบุคคล ห้ามส่งต่อหรือเปิดเผยแก่บุคคลอื่น"
                            : "Your account credentials and the 6-digit PIN created in the next step are strictly personal and non-transferable."}
                        </p>
                      </div>
                    </div>

                    {/* Interactive Terms Checkbox */}
                    <button
                      type="button"
                      onClick={() => setIsTermsAgreed(!isTermsAgreed)}
                      className={`w-full py-1.5 px-0.5 flex items-start gap-3 text-left cursor-pointer select-none transition-opacity mt-1 hover:opacity-90 ${
                        isLight ? "text-[#333333]" : "text-[#E4E4E7]"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-all ${
                          isTermsAgreed
                            ? isLight
                              ? "bg-[#222222] border-[#222222] text-white"
                              : "bg-white border-white text-[#222222]"
                            : isLight
                            ? "border-[#CCCCCC] bg-white"
                            : "border-[#666666] bg-transparent"
                        }`}
                      >
                        {isTermsAgreed && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="text-xs leading-relaxed">
                        {isThai ? (
                          <>
                            ฉันได้ตรวจสอบข้อมูลทั้งหมดข้างต้นถูกต้องครบถ้วน และยินยอมปฏิบัติตาม{" "}
                            <span className="font-semibold underline">เงื่อนไขการให้บริการ (Terms of Service)</span> และ{" "}
                            <span className="font-semibold underline">นโยบายความเป็นส่วนตัว (Privacy Policy)</span> ขององค์กรทุกประการ
                          </>
                        ) : (
                          <>
                            I have verified that all entered information is accurate and I agree to the{" "}
                            <span className="font-semibold underline">Terms of Service</span> and{" "}
                            <span className="font-semibold underline">Data Privacy Policy</span>.
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Review Actions (Fixed at bottom) */}
                <div
                  className={`flex items-center justify-between gap-2.5 p-4 sm:px-6 border-t shrink-0 ${
                    isLight ? "border-[#E4E4E7] bg-[#FAFAFA]" : "border-[#444444]/60 bg-[#303030]"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    {modalError && (
                      <p className="text-xs text-rose-500 font-medium truncate select-none">
                        {modalError}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setRegStep("fill")}
                    className={`px-4 py-2.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isLight
                        ? "border-[#E5E5E5] bg-white text-[#222222] hover:bg-slate-100"
                        : "border-[#555555] bg-[#282828] text-white hover:bg-[#333333]"
                    }`}
                  >
                    <ArrowLeft size={14} />
                    <span>{isThai ? "ย้อนกลับไปแก้ไข" : "Back to Edit"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmSaveAndProceedToPin}
                    disabled={!isTermsAgreed || isSaving}
                    className={`px-6 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all ${
                      !isTermsAgreed || isSaving
                        ? "opacity-50 cursor-not-allowed bg-slate-300 dark:bg-[#444444] text-slate-500 dark:text-slate-400"
                        : isLight
                        ? "bg-[#222222] text-white hover:bg-black cursor-pointer"
                        : "bg-[#FFFFFF] text-[#222222] hover:bg-[#F4F4F5] cursor-pointer"
                    }`}
                  >
                    {isSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : saveSuccess ? (
                      <Check size={15} strokeWidth={2.5} className="text-[#2EC4B6]" />
                    ) : null}
                    <span>
                      {saveSuccess
                        ? (isThai ? "บันทึกเรียบร้อย!" : "Saved!")
                        : (isThai ? "บันทึกข้อมูล" : "Save")}
                    </span>
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* POPUP MODAL: ASK TO CREATE PIN (สอบถามการสร้างรหัส PIN หรือกดข้าม)            */}
      {/* ========================================================================= */}
      {showPinPromptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-[400px] rounded-[24px] border p-6 sm:p-7 shadow-2xl flex flex-col items-center gap-5 text-center relative animate-in zoom-in-95 duration-150 ${
              isLight ? "bg-[#FAFAFA] border-[#E4E4E7]" : "bg-[#242424] border-[#383838]"
            }`}
          >
            {/* Close / Skip button in top right */}
            <button
              type="button"
              onClick={() => {
                setShowPinPromptModal(false);
                notify.info(isThai ? "ข้ามการตั้งรหัส PIN" : "PIN Setup Skipped", {
                  message: isThai
                    ? "คุณสามารถตั้งรหัส PIN ได้ตลอดเวลาในแท็บความปลอดภัย"
                    : "You can set up your PIN anytime in Security settings.",
                  duration: 4000,
                });
              }}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer ${
                isLight ? "text-zinc-400 hover:text-black hover:bg-zinc-100" : "text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
              title={isThai ? "ข้าม" : "Skip"}
            >
              <X size={16} />
            </button>

            {/* Icon Graphic */}
            <div
              className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
                isLight ? "bg-[#222222] text-white" : "bg-white text-[#222222]"
              }`}
            >
              <KeyRound size={26} />
            </div>

            {/* Header Titles */}
            <div className="flex flex-col gap-1.5">
              <h4 className={`text-lg sm:text-[19px] font-bold tracking-tight ${isLight ? "text-black" : "text-white"}`}>
                {isThai ? "ต้องการสร้างรหัส PIN หรือไม่?" : "Set Up a 6-Digit PIN?"}
              </h4>
              <p className={`text-xs leading-relaxed max-w-xs mx-auto ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                {isThai
                  ? "รหัส PIN 6 หลักช่วยให้คุณเข้าสู่ระบบได้อย่างสะดวก รวดเร็ว และปลอดภัยยิ่งขึ้น (สามารถตั้งค่าภายหลังได้)"
                  : "A 6-digit PIN enables faster and more secure sign-in. You can also configure this later."}
              </p>
            </div>

            {/* Action Buttons: Skip and Create */}
            <div className="w-full flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowPinPromptModal(false);
                  notify.info(isThai ? "ข้ามการตั้งรหัส PIN" : "PIN Setup Skipped", {
                    message: isThai
                      ? "คุณสามารถตั้งรหัส PIN ได้ตลอดเวลาในแท็บความปลอดภัย"
                      : "You can set up your PIN anytime in Security settings.",
                    duration: 4000,
                  });
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
                  isLight
                    ? "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                    : "border-zinc-700 hover:bg-zinc-800 text-zinc-300"
                }`}
              >
                {isThai ? "ข้าม" : "Skip"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setShowPinPromptModal(false);
                  setPinDigits(["", "", "", "", "", ""]);
                  setConfirmPinDigits(["", "", "", "", "", ""]);
                  setPinStep("enter");
                  setShowPinSetupModal(true);
                }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-md cursor-pointer ${
                  isLight
                    ? "bg-[#000000] hover:bg-[#222222] text-white"
                    : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#18181B]"
                }`}
              >
                {isThai ? "สร้างรหัส PIN" : "Create PIN"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. POPUP MODAL: 6-DIGIT QUICK PIN SETUP (ตั้งรหัส PIN 6 หลัก ดีไซน์ใหม่)     */}
      {/* ========================================================================= */}
      {showPinSetupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div
            className={`w-full max-w-[380px] rounded-[24px] border p-6 sm:p-7 shadow-2xl flex flex-col items-center gap-5 text-center overflow-hidden relative ${
              isLight ? "bg-[#FAFAFA] border-[#E4E4E7]" : "bg-[#282828] border-[#3F3F3F]"
            }`}
          >
            {/* DEV_TESTPUSHFILL_START - Test fill PIN 123456 (DELETE ME EASILY WHEN DONE) */}
            <button
              type="button"
              onClick={() => {
                setPinDigits(["1", "2", "3", "4", "5", "6"]);
                setConfirmPinDigits(["1", "2", "3", "4", "5", "6"]);
                setPinStep("confirm");
              }}
              className="absolute top-4 left-4 text-xs text-amber-500 hover:text-amber-400 underline cursor-pointer p-1 font-mono"
              title="Auto-fill PIN 123456"
            >
              testpushfill
            </button>
            {/* DEV_TESTPUSHFILL_END */}

            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShowPinSetupModal(false);
                setPinDigits(["", "", "", "", "", ""]);
                setConfirmPinDigits(["", "", "", "", "", ""]);
                setPinStep("enter");
              }}
              className={`absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer ${
                isLight ? "text-zinc-400 hover:text-black hover:bg-zinc-100" : "text-zinc-400 hover:text-white hover:bg-white/10"
              }`}
              title={isThai ? "ปิด" : "Close"}
            >
              <X size={16} />
            </button>

            {/* Header Titles */}
            <div className="text-center">
              <h4 className={`text-lg sm:text-[20px] font-bold tracking-tight ${isLight ? "text-black" : "text-white"}`}>
                {pinStep === "enter"
                  ? isThai ? "กำหนดรหัสผ่าน PIN Code" : "Create 6-Digit PIN"
                  : isThai ? "ยืนยันรหัสผ่าน PIN Code อีกครั้ง" : "Confirm 6-Digit PIN"}
              </h4>
              <p className={`text-xs mt-1 max-w-xs mx-auto leading-relaxed ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
                {pinStep === "enter"
                  ? isThai
                    ? "กรอกรหัสตัวเลข 6 หลักที่คุณต้องการใช้สำหรับเข้าสู่ระบบ"
                    : "Enter the 6-digit numeric PIN for quick sign-in."
                  : isThai
                  ? "กรอกรหัส PIN เดิมอีกครั้งเพื่อยืนยันความถูกต้อง"
                  : "Re-enter the exact same 6 digits to verify."}
              </p>
            </div>

            {/* Error message */}
            {modalError && (
              <div className="w-full p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs">
                {modalError}
              </div>
            )}

            {/* DYNAMIC CAPSULE: MORPHS INTO FULL-WIDTH BUTTON ON COMPLETE WITH SLIDE ANIMATION */}
            <div className={`w-full flex flex-col items-center ${pinShake ? "animate-shake" : ""}`}>
              <div className="w-full max-w-[270px] h-[44px] sm:h-[46px] relative overflow-hidden rounded-full">
                <AnimatePresence mode="wait" initial={false}>
                  {!(pinStep === "enter" ? pinDigits : confirmPinDigits).every((d) => d !== "") ? (
                    /* State 1: PIN Input Dots Capsule */
                    <motion.div
                      key="settings-capsule-dots"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.2, ease: "easeOut" }}
                      className={`w-full h-full rounded-full border px-4 flex items-center justify-center transition-all ${
                        isLight
                          ? "bg-white border-zinc-300"
                          : "bg-[#1E1E1E] border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-center gap-3 select-none">
                        {(pinStep === "enter" ? pinDigits : confirmPinDigits).map((digit, i) => {
                          const isFilled = digit !== "";
                          const isCurrentlyTyping = lastTypedPinIndex === i;

                          return (
                            <div
                              key={`pin-dot-settings-${pinStep}-${i}`}
                              className="flex items-center justify-center w-3 h-5 relative"
                            >
                              <AnimatePresence mode="wait">
                                {isFilled ? (
                                  isCurrentlyTyping ? (
                                    /* Transient Number Flash */
                                    <motion.span
                                      key={`num-set-${i}-${digit}`}
                                      initial={{ scale: 0.7, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      exit={{ scale: 0.5, opacity: 0 }}
                                      transition={{ duration: 0.14 }}
                                      className={`text-sm sm:text-base font-bold font-mono ${
                                        isLight ? "text-black" : "text-white"
                                      }`}
                                    >
                                      {digit}
                                    </motion.span>
                                  ) : (
                                    /* Small Solid White/Black Dot */
                                    <motion.span
                                      key={`dot-set-${i}`}
                                      initial={{ scale: 0.4, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      exit={{ scale: 0.4, opacity: 0 }}
                                      transition={{ duration: 0.14 }}
                                      className={`w-2 h-2 rounded-full ${
                                        isLight ? "bg-black" : "bg-white"
                                      }`}
                                    />
                                  )
                                ) : (
                                  /* Small Unfilled Gray Dot */
                                  <motion.span
                                    key={`empty-set-${i}`}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`w-2 h-2 rounded-full ${
                                      isLight ? "bg-zinc-300" : "bg-zinc-700"
                                    }`}
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  ) : (
                    /* State 2: Entire Capsule Transforms into Full-Width Slide-In Button */
                    <motion.button
                      key="settings-capsule-submit-btn"
                      initial={{ x: "-100%", opacity: 0 }}
                      animate={{ x: "0%", opacity: 1 }}
                      exit={{ x: "100%", opacity: 0 }}
                      transition={{ type: "spring", stiffness: 440, damping: 28 }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      type="button"
                      onClick={handleAdvancePin}
                      disabled={isSaving}
                      className={`w-full h-full rounded-full font-bold text-xs sm:text-[13px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors ${
                        isLight
                          ? "bg-black hover:bg-zinc-800 text-white"
                          : "bg-white hover:bg-zinc-200 text-black"
                      }`}
                    >
                      {isSaving ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <>
                          <span>
                            {pinStep === "enter"
                              ? isThai ? "ยืนยันรหัสผ่าน" : "Continue"
                              : isThai ? "บันทึกรหัสผ่าน" : "Confirm"}
                          </span>
                          <ArrowRight size={15} strokeWidth={2.4} />
                        </>
                      )}
                    </motion.button>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* BORDERLESS NUMBER KEYPAD (No Borders, No ABC text, Scaled Down by 20%) */}
            <div className="grid grid-cols-3 gap-1.5 max-w-[210px] mx-auto w-full pt-1">
              {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  key={num}
                  type="button"
                  onClick={() => handlePinKeypadPress(num)}
                  disabled={isSaving}
                  className={`h-10 rounded-full border-0 text-lg font-bold flex items-center justify-center cursor-pointer select-none transition-colors ${
                    isLight
                      ? "text-black hover:bg-zinc-200/70 active:bg-zinc-300/80"
                      : "text-white hover:bg-white/10 active:bg-white/20"
                  }`}
                >
                  {num}
                </motion.button>
              ))}

              {/* Bottom Left: Clear Button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={handlePinKeypadClear}
                disabled={isSaving}
                className={`h-10 rounded-full border-0 text-xs font-bold flex items-center justify-center cursor-pointer select-none transition-colors ${
                  isLight
                    ? "text-zinc-400 hover:text-black hover:bg-zinc-200/70"
                    : "text-zinc-500 hover:text-white hover:bg-white/10"
                }`}
              >
                C
              </motion.button>

              {/* 0 Button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={() => handlePinKeypadPress("0")}
                disabled={isSaving}
                className={`h-10 rounded-full border-0 text-lg font-bold flex items-center justify-center cursor-pointer select-none transition-colors ${
                  isLight
                    ? "text-black hover:bg-zinc-200/70 active:bg-zinc-300/80"
                    : "text-white hover:bg-white/10 active:bg-white/20"
                }`}
              >
                0
              </motion.button>

              {/* Backspace Button */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                type="button"
                onClick={handlePinKeypadBackspace}
                disabled={isSaving}
                className={`h-10 rounded-full border-0 text-xs font-bold flex items-center justify-center cursor-pointer select-none transition-colors ${
                  isLight
                    ? "text-zinc-400 hover:text-black hover:bg-zinc-200/70"
                    : "text-zinc-500 hover:text-white hover:bg-white/10"
                }`}
                title="Delete"
              >
                <Delete size={16} strokeWidth={2.2} />
              </motion.button>
            </div>

            {/* Back Button if in Confirm Step */}
            {pinStep === "confirm" && (
              <button
                type="button"
                onClick={() => {
                  setPinStep("enter");
                  setConfirmPinDigits(["", "", "", "", "", ""]);
                  setLastTypedPinIndex(null);
                }}
                className={`text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 mt-1 ${
                  isLight ? "text-zinc-500 hover:text-black" : "text-zinc-400 hover:text-white"
                }`}
              >
                <ArrowLeft size={13} />
                <span>{isThai ? "ย้อนกลับไปกำหนดรหัสใหม่" : "Back to step 1"}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. CHANGE PASSWORD MODAL                                                  */}
      {/* ========================================================================= */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-[420px] rounded-[16px] border p-6 shadow-2xl flex flex-col gap-4 overflow-hidden ${
              isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
            }`}
          >
            <div className="flex items-center justify-between border-b pb-3 border-[#444444]/40">
              <h4
                className={`font-bold text-[18px] ${
                  isLight ? "text-[#222222]" : "text-[#FFFFFF]"
                }`}
                style={{ fontFamily: "var(--font-outfit), sans-serif" }}
              >
                {isThai ? "เปลี่ยนรหัสผ่าน" : "Change Password"}
              </h4>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className={`p-1 rounded-lg transition-colors cursor-pointer ${
                  isLight ? "text-slate-400 hover:text-[#222222]" : "text-[#E4E4E7] hover:text-[#FFFFFF]"
                }`}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="flex flex-col gap-3.5">
              {modalError && (
                <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs">
                  {modalError}
                </div>
              )}

              <div className="flex flex-col gap-1">
                <label className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-[#E4E4E7]"}`}>{isThai ? "รหัสผ่านปัจจุบัน (เดิม) *" : "Current Password *"}</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={isThai ? "ระบุรหัสผ่านปัจจุบันของคุณ" : "Enter your current password"}
                  className={`p-2.5 rounded-lg border text-xs outline-none ${
                    isLight
                      ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]"
                      : "bg-[#282828] border-[#444444] text-[#FFFFFF]"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-[#E4E4E7]"}`}>{isThai ? "รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร) *" : "New Password (At least 8 characters) *"}</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={isThai ? "อย่างน้อย 8 ตัวอักษร" : "At least 8 characters"}
                  className={`p-2.5 rounded-lg border text-xs outline-none ${
                    isLight
                      ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]"
                      : "bg-[#282828] border-[#444444] text-[#FFFFFF]"
                  }`}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-[#E4E4E7]"}`}>{isThai ? "ยืนยันรหัสผ่านใหม่อีกครั้ง *" : "Confirm New Password *"}</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder={isThai ? "พิมพ์รหัสผ่านใหม่อีกครั้ง" : "Repeat new password"}
                  className={`p-2.5 rounded-lg border text-xs outline-none ${
                    isLight
                      ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]"
                      : "bg-[#282828] border-[#444444] text-[#FFFFFF]"
                  }`}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#444444]/30">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setCurrentPassword("");
                    setNewPassword("");
                    setConfirmNewPassword("");
                  }}
                  className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    isLight ? "text-slate-500 hover:text-[#222222]" : "text-[#E4E4E7] hover:text-[#FFFFFF]"
                  }`}
                >
                  {isThai ? "ยกเลิก" : "Cancel"}
                </button>
                <button
                  type="submit"
                  disabled={isSaving || !currentPassword.trim() || newPassword.length < 8 || newPassword !== confirmNewPassword}
                  className={`px-5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer ${
                    isLight ? "bg-[#222222] text-white" : "bg-[#FFFFFF] text-[#222222]"
                  }`}
                >
                  {isSaving ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : saveSuccess ? (
                    <CheckCircle2 size={13} className="text-[#2EC4B6]" />
                  ) : null}
                  <span>{saveSuccess ? (isThai ? "สำเร็จ!" : "Updated!") : (isThai ? "อัปเดตรหัสผ่าน" : "Update Password")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. POPUP MODAL: CONFIRM EXIT & DISCARD CHANGES                            */}
      {/* ========================================================================= */}
      {showExitConfirmModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div
            className={`w-full max-w-[420px] rounded-[22px] border p-6 sm:p-7 shadow-2xl flex flex-col items-center gap-5 text-center overflow-hidden animate-in zoom-in-95 duration-150 ${
              isLight ? "bg-white border-[#E4E4E7]" : "bg-[#333333] border-[#444444]"
            }`}
          >
            {/* Content Text */}
            <div className="flex flex-col gap-2">
              <h4
                className={`font-bold text-[19px] leading-tight ${
                  isLight ? "text-[#222222]" : "text-[#FFFFFF]"
                }`}
                style={{ fontFamily: "var(--font-outfit), sans-serif" }}
              >
                {isThai ? "ยืนยันการออกจากแบบฟอร์ม?" : "Discard Changes & Exit?"}
              </h4>
              <p className={`text-xs leading-relaxed ${isLight ? "text-[#666666]" : "text-[#D4D4D8]"}`}>
                {isThai
                  ? "หากออกจากหน้านี้ ข้อมูลทั้งหมดที่คุณกรอกไว้จะหายไปและคุณจะต้องเริ่มกรอกใหม่ทั้งหมดในครั้งถัดไป คุณต้องการออกจากแบบฟอร์มใช่หรือไม่?"
                  : "If you exit now, all entered information will be discarded and you will need to re-enter all fields again next time. Are you sure you want to exit?"}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2 border-t border-[#444444]/20">
              <button
                type="button"
                onClick={() => setShowExitConfirmModal(false)}
                className={`w-full sm:flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  isLight
                    ? "bg-[#222222] text-white hover:bg-black shadow-sm"
                    : "bg-white text-[#222222] hover:bg-slate-100 shadow-sm"
                }`}
              >
                {isThai ? "กรอกข้อมูลต่อ" : "Keep Editing"}
              </button>
              <button
                type="button"
                onClick={() => {
                  syncFormFromProfile(profile);
                  setModalError(null);
                  setHasAttemptedSubmit(false);
                  setShowExitConfirmModal(false);
                  setShowSecondaryRegModal(false);
                  setShowPinPromptModal(false);
                  setShowPinSetupModal(false);
                  notify.info(
                    isThai ? "ยกเลิกการกรอกข้อมูลแล้ว" : "Form Dismissed",
                    {
                      message: isThai
                        ? "ข้อมูลที่กรอกไว้ยังไม่ได้รับการบันทึก"
                        : "Unsaved changes have been discarded.",
                      duration: 3500,
                    }
                  );
                }}
                className={`w-full sm:flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                  isLight
                    ? "border-rose-300 text-rose-600 hover:bg-rose-50"
                    : "border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
                }`}
              >
                {isThai ? "ยืนยันการออก" : "Discard & Exit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. POPUP MODAL: AVATAR 1:1 CROP & WEBP UPLOAD */}
      <AvatarCropModal
        isOpen={showAvatarCropModal}
        onClose={() => setShowAvatarCropModal(false)}
        userId={profile.id || ""}
        onSuccess={(publicUrl) => {
          setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
          notify.success(
            isThai ? "อัปเดตรูปโปรไฟล์สำเร็จ" : "Profile Picture Updated",
            {
              message: isThai ? "แปลงเป็น WebP 1:1 และบันทึกเรียบร้อยแล้ว" : "Cropped to 1:1 WebP and saved successfully.",
              duration: 3500,
            }
          );
        }}
        isLight={isLight}
        isThai={isThai}
      />
    </div>
  );
}
