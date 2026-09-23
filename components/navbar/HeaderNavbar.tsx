"use client";

import React, { useState, useRef } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { getDawhLogo } from "@/config/brand";
import { motion, AnimatePresence } from "framer-motion";
import { useAccountMenu } from "@/hooks/useAccountMenu";
import DropdownMenu from "./DropdownMenu";

export interface HeaderNavbarProps {
  title?: string;
  subtitle?: string;
  showLogo?: boolean;
  showAccount?: boolean;
  onNavigate?: (target: string) => void;
  onBack?: () => void;
  lang?: "TH" | "EN";
  onLangChange?: (lang: "TH" | "EN") => void;
}

export default function HeaderNavbar({
  title,
  subtitle,
  showLogo = false,
  showAccount = false,
  onNavigate,
  onBack,
  lang: controlledLang,
  onLangChange,
}: HeaderNavbarProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isLight = theme === "light";

  // Shared account menu logic (profile, permissions, navigation guards)
  const accountMenu = useAccountMenu({
    lang: controlledLang,
    onLangChange,
    onNavigate,
  });
  const { profile, fullName, initials, departmentDisplay, isProfileLoaded, mounted } = accountMenu;

  // Check if current page is Workspace
  const isWorkspacePage =
    showLogo ||
    pathname === "/workspace" ||
    pathname === "/" ||
    pathname?.startsWith("/workspace");

  // Dropdown open/close state + outside-click ref
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const { isThai } = accountMenu;

  // Dynamic Route-Aware Title & Subtitle Fallbacks
  const getRouteTitleAndSubtitle = () => {
    if (title !== undefined) {
      return {
        title,
        subtitle: subtitle || "",
      };
    }

    if (pathname?.startsWith("/controlpanel") || pathname?.startsWith("/admin")) {
      return {
        title: isThai ? "แผงควบคุมระบบผู้ดูแล" : "Admin Control Panel",
        subtitle: subtitle || "",
      };
    }

    if (pathname?.startsWith("/account") || pathname?.startsWith("/settings")) {
      return {
        title: isThai ? "การตั้งค่าบัญชีและโปรไฟล์" : "Account & Profile Settings",
        subtitle: subtitle || (isThai ? "จัดการและตรวจสอบข้อมูลประวัติในระบบองค์กร" : "Configure and update your employee profile"),
      };
    }
    if (pathname?.startsWith("/workspace")) {
      return {
        title: isThai ? "ศูนย์รวมระบบงาน DAWH" : "DAWH Workspace Hub",
        subtitle: subtitle || (isThai ? "ระบบปฏิบัติการองค์กรพร้อมสำหรับการพัฒนาโมดูล" : "Enterprise operations hub ready for refactor"),
      };
    }

    return {
      title: isThai ? "ระบบจัดการองค์กร" : "Enterprise System",
      subtitle: subtitle || "",
    };
  };

  const { title: displayTitle, subtitle: displaySubtitle } = getRouteTitleAndSubtitle();

  return (

    <header
      className={`hidden md:flex sticky top-0 z-40 w-full h-[72px] px-6 sm:px-8 py-4 flex-row justify-between items-center border-b transition-colors duration-300 ${
        isLight
          ? "bg-[#FFFFFF] border-[#E4E4E7]"
          : "bg-[#222222] border-[#444444]"
      }`}
    >
      {/* Left: Brand Logo OR Page Title & Subtitle */}
      {showLogo ? (
        <div
          onClick={() => accountMenu.handleGuardedNavigate("workspace", "/workspace")}
          className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 transition-opacity select-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getDawhLogo(theme, "horizontal")}
            alt="DAWH Logo"
            className="h-[36px] sm:h-[40px] w-auto object-contain select-none"
            draggable={false}
          />
        </div>
      ) : (
        <div className="flex flex-col items-start gap-[2px]">
          <h1
            className={`font-bold text-[18px] sm:text-[20px] leading-[26px] tracking-tight ${
              isLight ? "text-[#18181B]" : "text-[#FFFFFF]"
            }`}
            style={{ fontFamily: "var(--font-outfit), sans-serif" }}
          >
            {displayTitle}
          </h1>
          {Boolean(displaySubtitle) && (
            <p
              className={`font-normal text-[13.5px] leading-[18px] ${
                isLight ? "text-[#666666]" : "text-[#E4E4E7]"
              }`}
            >
              {displaySubtitle}
            </p>
          )}
        </div>
      )}

      {/* Right: Account Trigger Button + DropdownMenu */}
      {showAccount && (
        <div className="relative" ref={dropdownRef}>
          <button
          type="button"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className={`flex items-center gap-3 px-2 py-1.5 rounded-full transition-all duration-200 cursor-pointer ${
            isLight
              ? "hover:bg-[#F4F4F5] text-[#222222]"
              : "hover:bg-white/10 text-white"
          }`}
        >
          {/* Avatar Container with Real Avatar Image or Clean Monogram */}
          <div
            className={`relative flex items-center justify-center w-[38px] h-[38px] rounded-full overflow-hidden shrink-0 border ${
              isLight
                ? "bg-slate-100 border-slate-300 text-slate-800"
                : "bg-[#282828] border-[#444444] text-[#E4E4E7]"
            }`}
          >
            {mounted && profile.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile.avatar_url}
                alt={fullName || "User"}
                className="w-full h-full object-cover"
              />
            ) : mounted && (isProfileLoaded || fullName) ? (
              <span className="font-bold text-[14px]" suppressHydrationWarning>
                {initials || "U"}
              </span>
            ) : (
              <div className={`w-full h-full rounded-full animate-pulse ${isLight ? "bg-slate-200" : "bg-[#383838]"}`} />
            )}
          </div>

          {/* User Details */}
          <div className="hidden md:flex flex-col items-start text-left leading-tight min-w-[70px]">
            {mounted && (isProfileLoaded || fullName) ? (
              <span
                className={`font-semibold text-[14.5px] leading-[18px] max-w-[140px] truncate ${
                  isLight ? "text-[#222222]" : "text-[#FFFFFF]"
                }`}
                style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                suppressHydrationWarning
              >
                {fullName || (profile.email ? profile.email.split("@")[0] : "User")}
              </span>
            ) : (
              <div className={`h-[16px] w-[84px] rounded-md animate-pulse my-[1px] ${isLight ? "bg-slate-200" : "bg-[#383838]"}`} />
            )}
            {mounted && departmentDisplay ? (
              <div className="flex items-center gap-1.5 mt-[1px]">
                <span
                  className={`font-medium text-[12px] leading-[15px] truncate max-w-[140px] ${
                    isLight ? "text-[#666666]" : "text-[#E4E4E7]"
                  }`}
                  suppressHydrationWarning
                >
                  {departmentDisplay}
                </span>
              </div>
            ) : mounted && (isProfileLoaded || fullName) && profile.email ? (
              <span
                className={`font-normal text-[11px] leading-[14px] truncate max-w-[140px] ${
                  isLight ? "text-[#888888]" : "text-[#A1A1AA]"
                }`}
                suppressHydrationWarning
              >
                {profile.email}
              </span>
            ) : !isProfileLoaded && !fullName ? (
              <div className={`h-[12px] w-[56px] rounded-md animate-pulse mt-[2px] ${isLight ? "bg-slate-200" : "bg-[#383838]"}`} />
            ) : null}
          </div>

          {/* Chevron Indicator */}
          <ChevronDown
            size={16}
            className={`transition-transform duration-200 shrink-0 ${
              isDropdownOpen ? "rotate-180" : ""
            } ${isLight ? "text-[#666666]" : "text-[#E4E4E7]"}`}
          />
        </button>

        {/* Dropdown Menu Overlay with Smooth Slide-Down Animation */}
        <AnimatePresence>
          {isDropdownOpen && (
            <motion.div
              initial={{ opacity: 0, y: -18, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -14, scale: 0.96 }}
              transition={{
                duration: 0.22,
                ease: [0.16, 1, 0.3, 1],
              }}
              className={`absolute right-0 mt-2 w-[280px] rounded-2xl border p-2 shadow-2xl z-50 origin-top-right ${
                isLight
                  ? "bg-white border-[#E4E4E7] shadow-xl text-[#222222]"
                  : "bg-[#282828] border-[#444444] shadow-2xl text-white"
              }`}
            >
              <DropdownMenu
                {...accountMenu}
                onClose={() => setIsDropdownOpen(false)}
                onNavigate={onNavigate}
                variant="popup"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}
    </header>
  );
}
