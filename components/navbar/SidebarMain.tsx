"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronUp,
  LayoutGrid,
  Layers,
  Sun,
  Moon,
  Menu,
  X,
  PackageCheck,
  Boxes,
  ArrowLeftRight,
  RotateCw,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { useTheme } from "@/context/ThemeContext";
import { DAWH_LOGOS } from "@/config/brand";
import { useLoading } from "@/components/loading_screen";
import { useAppLanguage, setAppLanguage } from "@/utils/language";
import { motion, AnimatePresence } from "framer-motion";
import { useAccountMenu } from "@/hooks/useAccountMenu";
import DropdownMenu from "./DropdownMenu";
import MobileNavbar from "./MobileNavbar";

export interface NavbarMainProps {
  children?: React.ReactNode;
  logoWhiteUrl?: string;
  logoDarkUrl?: string;
  logoUrl?: string;
  hubPath?: string;
  settingsPath?: string;
  loginPath?: string;
  initialMinimized?: boolean;
  onMinimizedChange?: (minimized: boolean) => void;
  lang?: "th" | "en";
  onLangChange?: (lang: "th" | "en") => void;
  showAccount?: boolean;
  showHub?: boolean;
  refreshButton?: {
    onClick: () => void;
    isLoading?: boolean;
    label?: string;
  };
  serverStatus?: {
    connected: boolean;
    label: string;
    sublabel?: string;
  };
}

const DEFAULT_LOGO_WHITE = DAWH_LOGOS.horizontal.black;
const DEFAULT_LOGO_DARK = DAWH_LOGOS.horizontal.light;

export default function NavbarMain({
  children,
  logoWhiteUrl = DEFAULT_LOGO_WHITE,
  logoDarkUrl = DEFAULT_LOGO_DARK,
  logoUrl,
  hubPath = "/workspace",
  settingsPath = "/settings",
  loginPath = "/auth/login",
  initialMinimized = false,
  onMinimizedChange,
  lang: controlledLang,
  onLangChange,
  showAccount = true,
  showHub = true,
  refreshButton,
  serverStatus,
}: NavbarMainProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { navigateWithLoading } = useLoading();
  const { theme, toggleTheme } = useTheme();
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const appLang = useAppLanguage();
  const activeLang = controlledLang ?? (appLang.toLowerCase() as "th" | "en");
  const isLight = theme === "light";

  // Shared account menu logic
  const accountMenu = useAccountMenu({
    lang: activeLang === "th" ? "TH" : "EN",
    onLangChange: (lang) => {
      onLangChange?.(lang.toLowerCase() as "th" | "en");
    },
    settingsPath,
  });
  const { profile: accountProfile, fullName: userName, initials, isAdmin, mounted: accountMounted } = accountMenu;
  const userAvatar = accountProfile.avatar_url || null;
  const userUsername = accountProfile.username || accountProfile.email?.split("@")[0] || null;

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  // Dynamic logo based on active theme and minimized state
  const currentLogo = isMinimized
    ? (isLight ? "/assets/dawh_black4x2048logo.png" : "/assets/dawh_light1024logo.png")
    : (logoUrl || (isLight ? logoWhiteUrl : logoDarkUrl));

  // Sync with localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dawh_sidebar_minimized");
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        setIsMinimized(parsed);
        onMinimizedChange?.(parsed);
      }
    } catch {
      // Non-blocking
    }
  }, []);

  // Sync when parent changes initialMinimized
  useEffect(() => {
    if (initialMinimized !== undefined) {
      setIsMinimized(initialMinimized);
    }
  }, [initialMinimized]);

  const handleToggleMinimize = () => {
    const nextState = !isMinimized;
    setIsMinimized(nextState);
    setIsAccountOpen(false);
    try {
      localStorage.setItem("dawh_sidebar_minimized", JSON.stringify(nextState));
    } catch {
      // Non-blocking
    }
    onMinimizedChange?.(nextState);
  };

  const translations = {
    en: {
      hub: "Module Hub",
      refresh: "Refresh Data",
      syncing: "Syncing...",
      account: "Settings",
      logout: "Log out",
      lang: "Switch to Thai",
      themeLight: "White Theme",
      themeDark: "Dark Theme",
      systemAccess: "System Access",
      authorizedStaff: "Authorized Staff",
    },
    th: {
      hub: "ศูนย์รวมโมดูล",
      refresh: "รีเฟรชข้อมูล",
      syncing: "กำลังซิงค์...",
      account: "ตั้งค่า",
      logout: "ออกจากระบบ",
      lang: "สลับเป็นภาษาอังกฤษ",
      themeLight: "สลับเป็นธีมขาว",
      themeDark: "สลับเป็นธีมมืด",
      systemAccess: "การเข้าถึงระบบ",
      authorizedStaff: "เจ้าหน้าที่ระบบ",
    },
  };
  const normalizedLang = (activeLang?.toLowerCase() === "en" ? "en" : "th") as "en" | "th";
  const t = translations[normalizedLang] || translations.th;

  return (
    <>
      <aside
        className={`hidden md:flex sticky top-0 h-dvh flex-col transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] z-40 shrink-0 ${
          isMinimized ? "w-20 overflow-visible" : "w-64 overflow-hidden"
        } ${
          isLight
            ? "bg-[#FFFFFF] text-slate-900 border-r border-[#E4E4E7] shadow-sm"
            : "bg-[#222222] text-[#FFFFFF] border-r border-[#444444]"
        }`}
      >
        {/* Mobile Top Safe Area Inset */}
        <div className="pt-safe" />

        {/* ======================================================== */}
        {/* 📌 [จุดที่ 1] LOGO AREA - Enlarged +1/3 in Expanded Mode */}
        {/* ======================================================== */}
        <div className="flex flex-col items-center justify-center w-full overflow-hidden shrink-0 h-[88px] px-2.5 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]">
          <div
            className={`relative flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isMinimized ? "w-10 h-10" : "w-full h-[58px]"
            }`}
          >
            {currentLogo ? (
              <Image
                src={currentLogo}
                alt="Logo"
                fill
                priority
                sizes="(max-width: 768px) 40px, 220px"
                className={`object-contain transition-opacity duration-300 ${
                  isMinimized ? "p-0.5" : "p-0"
                }`}
                onError={(e) => {
                  const target = e.currentTarget;
                  target.style.display = "none";
                }}
              />
            ) : (
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex items-center justify-center rounded-xl font-bold shadow-sm shrink-0 transition-all duration-300 ${
                    isMinimized ? "h-8 w-8" : "h-9 w-9"
                  } ${
                    isLight
                      ? "bg-slate-900 text-[#FFFFFF]"
                      : "bg-[#FFFFFF] text-slate-950"
                  }`}
                >
                  <Layers className={isMinimized ? "h-4 w-4" : "h-5 w-5"} />
                </div>
                <span
                  className={`font-extrabold text-2xl tracking-tight whitespace-nowrap overflow-hidden transition-all ease-out ${
                    isLight ? "text-slate-900" : "text-[#FFFFFF]"
                  } ${
                    isMinimized
                      ? "max-w-0 opacity-0 -translate-x-3 duration-200 pointer-events-none"
                      : "max-w-[140px] opacity-100 translate-x-0 duration-350 delay-100"
                  }`}
                  style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                >
                  dawh
                </span>
              </div>
            )}
          </div>
        </div>

      {/* Smooth Divider below Logo */}
      <div
        className={`mx-4 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] border-b mb-2 ${
          isLight ? "border-[#E4E4E7]" : "border-[#444444]"
        } ${isMinimized ? "opacity-60 scale-x-60" : "opacity-100 scale-x-100"}`}
      />

      {/* SUB NAVBAR AREA */}
      <div
        className={`flex-1 px-3 w-full transition-all duration-700 no-scrollbar ${
          isMinimized ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"
        }`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>

      {/* ACCOUNT & CONTROL AREA */}
      <div
        className={`px-3 ${showAccount ? "pt-5 pb-2.5" : "py-2.5"} mt-auto w-full shrink-0 border-t space-y-2 transition-colors duration-700 ${
          isLight
            ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-sm"
            : "bg-[#1E1E1E] border-[#383838]"
        }`}
      >
        {/* Server Status Indicator (Hidden when minimized) */}
        {serverStatus && !isMinimized && (
          <div
            className="w-full py-1 px-1 flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]"
            title={serverStatus.label || serverStatus.sublabel}
          >
            <p
              className={`text-[11px] font-medium leading-tight truncate text-center ${
                isLight ? "text-slate-500" : "text-[#A1A1AA]"
              }`}
            >
              {serverStatus.label || serverStatus.sublabel}
            </p>
          </div>
        )}

        {/* Quick Controls: Refresh / Hub & Minimize Buttons */}
        <div
          className={`w-full flex items-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isMinimized
              ? "flex-col gap-2 items-center"
              : "items-center gap-1.5 px-0.5"
          }`}
        >
          {/* Refresh Data Button (if provided) or Hub Button */}
          {refreshButton ? (
            <button
              type="button"
              onClick={refreshButton.onClick}
              disabled={refreshButton.isLoading}
              className={`flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group cursor-pointer overflow-hidden ${
                isLight
                  ? "bg-[#FFFFFF] border-[#E4E4E7] text-slate-800 hover:bg-[#F4F4F5] shadow-sm disabled:opacity-50"
                  : "bg-[#383838] border-[#444444] text-[#FFFFFF] hover:bg-[#444444] disabled:opacity-50"
              } ${
                isMinimized
                  ? "w-10 h-10 aspect-square mx-auto rounded-xl p-0 border"
                  : "flex-1 h-9 px-3 rounded-xl border gap-2 active:scale-95 text-center"
              }`}
              title={
                refreshButton.isLoading
                  ? t.syncing
                  : refreshButton.label || t.refresh
              }
            >
              {/* Icon: Centered & Rotate / Spin */}
              <div
                className={`shrink-0 flex items-center justify-center overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isMinimized ? "w-8 h-8" : "w-4.5 h-4.5"
                }`}
              >
                <RotateCw
                  size={15}
                  className={`${
                    refreshButton.isLoading
                      ? "animate-spin"
                      : "group-hover:rotate-180 transition-transform duration-500"
                  } shrink-0 ${
                    isLight ? "text-slate-800 group-hover:text-black" : "text-[#FFFFFF] group-hover:text-white"
                  }`}
                />
              </div>

              {/* Text: Centered, Smooth Fade Out on Minimize */}
              <div
                className={`flex items-center justify-center overflow-hidden transition-all duration-300 ease-out ${
                  isMinimized
                    ? "max-w-0 opacity-0 -translate-x-3 duration-200 pointer-events-none"
                    : "max-w-[140px] opacity-100 translate-x-0 duration-350 delay-100"
                }`}
              >
                <span className="text-[13px] font-semibold leading-none tracking-wide truncate whitespace-nowrap text-center">
                  {refreshButton.isLoading
                    ? t.syncing
                    : refreshButton.label || t.refresh}
                </span>
              </div>
            </button>
          ) : showHub ? (
            <button
              type="button"
              onClick={() =>
                navigateWithLoading(
                  hubPath,
                  "กำลังเปิดศูนย์รวมโมดูล...",
                  "กำลังโหลดโมดูลและสิทธิ์การใช้งาน..."
                )
              }
              className={`flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group cursor-pointer overflow-hidden ${
                isLight
                  ? "bg-[#FFFFFF] border-[#E4E4E7] text-slate-800 hover:bg-[#F4F4F5] shadow-sm"
                  : "bg-[#383838] border-[#444444] text-[#FFFFFF] hover:bg-[#444444]"
              } ${
                isMinimized
                  ? "w-10 h-10 aspect-square mx-auto rounded-xl p-0 border"
                  : "flex-1 h-9 px-3 rounded-xl border gap-2 active:scale-95 text-center"
              }`}
              title={t.hub}
            >
              {/* Icon: Centered & Hover Rotation */}
              <div
                className={`shrink-0 flex items-center justify-center overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isMinimized ? "w-8 h-8" : "w-4.5 h-4.5"
                }`}
              >
                <LayoutGrid
                  size={16}
                  className={`group-hover:rotate-90 transition-transform duration-500 shrink-0 ${
                    isLight ? "text-slate-800 group-hover:text-black" : "text-[#FFFFFF] group-hover:text-white"
                  }`}
                />
              </div>

              {/* Text: Centered, Smooth Fade Out on Minimize */}
              <div
                className={`flex items-center justify-center overflow-hidden transition-all duration-300 ease-out ${
                  isMinimized
                    ? "max-w-0 opacity-0 -translate-x-3 duration-200 pointer-events-none"
                    : "max-w-[140px] opacity-100 translate-x-0 duration-350 delay-100"
                }`}
              >
                <span className="text-[13.5px] font-semibold leading-none tracking-wide truncate whitespace-nowrap text-center">
                  {t.hub}
                </span>
              </div>
            </button>
          ) : null}

          {/* Minimize / Expand Button */}
          <button
            type="button"
            onClick={handleToggleMinimize}
            className={`flex items-center justify-center rounded-xl border transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-75 cursor-pointer shrink-0 ${
              isLight
                ? "border-[#E4E4E7] bg-[#FFFFFF] text-[#2C2C2C] hover:bg-[#F4F4F5] shadow-sm"
                : "border-[#444444] bg-[#383838] text-[#E4E4E7] hover:border-white/30 hover:text-[#FFFFFF]"
            } ${isMinimized ? "w-10 h-10 aspect-square" : "h-9 w-9"}`}
            aria-label="Toggle sidebar minimize"
          >
            <ChevronLeft
              size={17}
              className={`transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isMinimized ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* User Profile Card & Expandable Controls */}
        {showAccount && (
          <div className="w-full flex flex-col">
            {/* Smooth Account Divider */}
            <div
              className={`mx-auto border-t transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isLight ? "border-[#E4E4E7]" : "border-[#444444]"
              } ${isMinimized ? "w-6 opacity-100 mb-2 scale-x-100" : "w-0 opacity-0 mb-0 scale-x-0"}`}
            />

            {/* Main Account Button */}
            <button
              type="button"
              onClick={() =>
                isMinimized ? handleToggleMinimize() : setIsAccountOpen(!isAccountOpen)
              }
              className={`flex items-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden cursor-pointer ${
                isLight
                  ? "bg-[#FFFFFF] border-[#E4E4E7] text-[#222222] hover:bg-[#F4F4F5] shadow-sm"
                  : "bg-[#383838] border-[#444444] text-[#FFFFFF] hover:bg-[#444444]"
              } ${
                isMinimized
                  ? "w-10 h-10 aspect-square justify-center mx-auto rounded-xl p-0 border"
                  : "w-full px-3 py-2.5 rounded-2xl border gap-2.5 active:scale-95 text-left"
              }`}
            >
              <div
                className={`shrink-0 flex items-center justify-center overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-full border ${
                  isMinimized ? "w-8 h-8" : "w-9 h-9"
                } ${
                  isLight
                    ? "bg-slate-100 border-[#E4E4E7] text-[#222222]"
                    : "bg-white/10 text-[#FFFFFF] border-white/20"
                }`}
              >
                {mounted && userAvatar ? (
                  <img
                    src={userAvatar}
                    alt={userName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-xs">
                    {userName?.charAt(0)?.toUpperCase() || "U"}
                  </span>
                )}
              </div>

              {/* Account text label */}
              <div
                className={`flex-1 min-w-0 transition-all duration-300 ease-out overflow-hidden ${
                  isMinimized
                    ? "max-w-0 opacity-0 -translate-x-3 duration-200 pointer-events-none"
                    : "max-w-[130px] opacity-100 translate-x-0 duration-350 delay-100"
                }`}
              >
                <p
                  className={`text-[13px] font-semibold truncate leading-tight ${
                    isLight ? "text-slate-900" : "text-[#FFFFFF]"
                  }`}
                >
                  {userName}
                </p>
                <p
                  className={`text-[11.5px] truncate leading-tight mt-0.5 ${
                    isLight ? "text-slate-500" : "text-[#D4D4D8]"
                  }`}
                >
                  {userUsername || "dawh.internal"}
                </p>
              </div>

              {/* Expand/Collapse Chevron Indicator */}
              <div
                className={`transition-all duration-300 ease-out ${
                  isMinimized
                    ? "max-w-0 opacity-0 pointer-events-none"
                    : "max-w-5 opacity-100"
                }`}
              >
                <ChevronUp
                  size={15}
                  className={`transition-transform duration-300 ${
                    isAccountOpen ? "rotate-0" : "rotate-180"
                  } ${isLight ? "text-slate-400" : "text-[#D4D4D8]"}`}
                />
              </div>
            </button>

            {/* Expandable Account Actions Dropdown */}
            <AnimatePresence>
              {isAccountOpen && !isMinimized && (
                <motion.div
                  initial={{ opacity: 0, height: 0, y: 8 }}
                  animate={{ opacity: 1, height: "auto", y: 0 }}
                  exit={{ opacity: 0, height: 0, y: 8 }}
                  transition={{ duration: 0.25, ease: "easeInOut" }}
                  className="w-full overflow-hidden mt-2"
                >
                  <div
                    className={`p-2 rounded-2xl border shadow-lg ${
                      isLight
                        ? "bg-[#FFFFFF] border-[#E4E4E7]"
                        : "bg-[#282828] border-[#444444]"
                    }`}
                  >
                    <DropdownMenu
                      {...accountMenu}
                      onClose={() => setIsAccountOpen(false)}
                      variant="inline"
                      settingsPath={settingsPath}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Mobile Bottom Safe Area Inset */}
        <div className="pb-safe" />
      </div>
    </aside>

    {/* ======================================================== */}
    {/* MOBILE NAVIGATION SYSTEM (FIGMA SPEC PIXEL-PERFECT)     */}
    {/* ======================================================== */}
    <MobileNavbar childrenSubMenu={children} />
  </>
  );
}
