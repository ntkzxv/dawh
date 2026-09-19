"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  LayoutGrid,
  Monitor,
  Settings,
  LogOut,
  Languages,
  User,
  MoreVertical,
} from "lucide-react";
import { usePathname } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { getCurrentSession, logout } from "@/lib/auth-client";
import { checkProfileCompleteness, fetchAndStoreUserProfile, toEmployeeProfile } from "@/lib/user-profile";
import { EmployeeProfile } from "@/types/user";
import { useLoading } from "@/components/loading_screen";
import { getDawhLogo } from "@/config/brand";
import { ProfileGuardModal } from "@/components/auth";
import { useNotification } from "@/context/NotificationContext";
import { useAppLanguage, setAppLanguage } from "@/utils/language";
import { motion, AnimatePresence } from "framer-motion";
import { getAppMe } from "@/lib/api/session";

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
  const { navigateWithLoading } = useLoading();
  const { theme, toggleTheme } = useTheme();
  const { notify } = useNotification();
  const isLight = theme === "light";

  // Check if current page is Workspace
  const isWorkspacePage =
    showLogo ||
    pathname === "/workspace" ||
    pathname === "/" ||
    pathname?.startsWith("/workspace");

  // Dropdown Menu State
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showGuardModal, setShowGuardModal] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Language State with useAppLanguage hook
  const appLang = useAppLanguage();
  const activeLang: "TH" | "EN" = controlledLang ?? appLang;
  const isThai = activeLang === "TH";

  const toggleLanguage = () => {
    const nextLang: "TH" | "EN" = activeLang === "TH" ? "EN" : "TH";
    setAppLanguage(nextLang);
    onLangChange?.(nextLang);
  };

  // Profile & Mounted State
  const [profile, setProfile] = useState<Partial<EmployeeProfile>>({});
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);

  // Close Dropdown on Outside Click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch the canonical employee profile through the application API.
  useEffect(() => {
    let isMounted = true;
    setMounted(true);
    // 1. Instant Cache Check (0ms)
    try {
      const cached = localStorage.getItem("dawh_user_profile");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && (parsed.full_name || parsed.first_name || parsed.first_name_th || parsed.username || parsed.email)) {
          setProfile(parsed);
          setIsProfileLoaded(true);
        }
      }
      const cachedSession = localStorage.getItem("dawh_session_user");
      if (cachedSession) {
        const parsedSession = JSON.parse(cachedSession);
        if (parsedSession) {
          setProfile((prev) => ({ ...parsedSession, ...prev }));
          setIsProfileLoaded(true);
        }
      }
    } catch {
      // Non-blocking
    }

    async function loadUserProfile() {
      try {
        let appMe: Awaited<ReturnType<typeof getAppMe>> | null = null;
        try {
          const me = await getAppMe();
          appMe = me;
          if (isMounted) {
            setPermissions(me.data.permissions);
            if (me.data.profile) {
              const canonicalProfile = toEmployeeProfile(me.data.profile);
              setProfile(canonicalProfile);
              setIsProfileLoaded(true);
              localStorage.setItem("dawh_user_profile", JSON.stringify(canonicalProfile));
            } else {
              setProfile((prev) => ({
                ...prev,
                id: me.data.user.id,
                email: me.data.user.email,
                full_name: me.data.user.name,
              }));
              setIsProfileLoaded(true);
            }
          }
        } catch {
          // Profile and session APIs remain the source of truth for navigation guards.
        }
        const session = await getCurrentSession();
        const targetId = session?.user.id;
        const targetEmail = session?.user.email;

        if (targetId && !appMe?.data.profile) {
          const fetched = await fetchAndStoreUserProfile(targetId, targetEmail);
          if (fetched) {
            setProfile(fetched);
            setIsProfileLoaded(true);
            try {
              localStorage.setItem("dawh_session_user", JSON.stringify({
                id: fetched.id,
                email: fetched.email,
                full_name: fetched.full_name || [fetched.first_name, fetched.last_name].filter(Boolean).join(" ") || undefined,
                first_name: fetched.first_name || undefined,
                last_name: fetched.last_name || undefined,
                username: fetched.username || undefined,
              }));
            } catch {
              // Non-blocking
            }
            return;
          }

          // Fallback: ถ้ายังไม่มีข้อมูลใน employee_profiles ให้ดึง name และ email จาก Better Auth Session มาแสดงผล
          if (session?.user) {
            const sessionProfile: Partial<EmployeeProfile> = {
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.name || undefined,
              first_name: session.user.name?.split(" ")[0] || undefined,
              last_name: session.user.name?.split(" ").slice(1).join(" ") || undefined,
              username: session.user.email?.split("@")[0] || undefined,
            };
            setProfile((prev) => ({ ...prev, ...sessionProfile }));
            setIsProfileLoaded(true);
            try {
              localStorage.setItem("dawh_session_user", JSON.stringify(sessionProfile));
            } catch {
              // Non-blocking
            }
          }
        }
      } catch (err) {
        console.error("Error loading user profile in navbar:", err);
      }
    }

    loadUserProfile();

    const handleProfileUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<EmployeeProfile>>;
      if (customEvent.detail) {
        setProfile((prev) => ({ ...prev, ...customEvent.detail }));
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("dawh_profile_updated", handleProfileUpdated);
      return () => {
        isMounted = false;
        window.removeEventListener("dawh_profile_updated", handleProfileUpdated);
      };
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // UI-only hint; every API still enforces permissions server-side.
  const isAdmin = permissions.some((permission) => permission.startsWith("admin."));

  // Display calculations (Supporting Nicknames and usernames when full name is empty)
  const validFullName =
    profile.full_name &&
    profile.full_name !== "Authorized Staff" &&
    profile.full_name !== "H. Administrator" &&
    profile.full_name !== "Staff Member"
      ? profile.full_name
      : "";

  const fullName =
    validFullName ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    [profile.first_name_th, profile.last_name_th].filter(Boolean).join(" ") ||
    (profile.nickname_th ? `ชื่อเล่น: ${profile.nickname_th}` : "") ||
    (profile.nickname ? `Nickname: ${profile.nickname}` : "") ||
    profile.username ||
    (profile.email ? profile.email.split("@")[0] : "") ||
    (typeof window !== "undefined" ? localStorage.getItem("current_user_email")?.split("@")[0] : "") ||
    "";

  const initials = (
    profile.nickname_th?.charAt(0) ||
    profile.nickname?.charAt(0) ||
    profile.first_name?.charAt(0) ||
    profile.username?.charAt(0) ||
    (fullName ? fullName.charAt(0) : "U")
  ).toUpperCase();

  const departmentDisplay =
    profile.department ||
    (profile.role ? `Role: ${profile.role}` : "");

  // Dynamic Route-Aware Title & Subtitle Fallbacks
  const getRouteTitleAndSubtitle = () => {
    if (title && subtitle) return { title, subtitle };

    if (pathname?.startsWith("/account") || pathname?.startsWith("/settings")) {
      return {
        title: title || (isThai ? "การตั้งค่าบัญชีและโปรไฟล์" : "Account & Profile Settings"),
        subtitle: subtitle || (isThai ? "จัดการและตรวจสอบข้อมูลประวัติในระบบองค์กร" : "Configure and update your employee profile"),
      };
    }
    if (pathname?.startsWith("/workspace")) {
      return {
        title: title || (isThai ? "ศูนย์รวมระบบงาน DAWH" : "DAWH Workspace Hub"),
        subtitle: subtitle || (isThai ? "ระบบปฏิบัติการองค์กรพร้อมสำหรับการพัฒนาโมดูล" : "Enterprise operations hub ready for refactor"),
      };
    }

    return {
      title: title || (isThai ? "ระบบจัดการองค์กร" : "Enterprise System"),
      subtitle: subtitle || (isThai ? "ศูนย์ข้อมูลและระบบบริหารจัดการ DAWH" : "DAWH Operations & Platform Services"),
    };
  };

  const { title: displayTitle, subtitle: displaySubtitle } = getRouteTitleAndSubtitle();

  // Logout Handler
  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
  };

  const { isComplete, missingFields } = checkProfileCompleteness(profile);

  const handleGuardedNavigate = (target: string, fallbackPath?: string) => {
    if (
      !isComplete &&
      target !== "settings" &&
      target !== "account" &&
      target !== "auth" &&
      target !== "workspace" &&
      target !== "portal" &&
      target !== "controlpanel"
    ) {
      setShowGuardModal(true);
      notify.warning(
        isThai ? "ต้องกรอกข้อมูลให้ครบถ้วนก่อน" : "Incomplete Profile Information",
        {
          message: isThai
            ? "กรุณากรอกข้อมูลส่วนตัวในหน้าตั้งค่าก่อนเข้าใช้งานส่วนอื่นๆ"
            : "Please complete your employee profile in Settings before accessing system modules.",
          duration: 5000,
        }
      );
      return;
    }

    if (fallbackPath) {
      const loadingTitle =
        target === "controlpanel"
          ? isThai
            ? "กำลังเปิดแผงควบคุมระบบ..."
            : "Opening Control Panel..."
          : isThai
          ? "กำลังเปิดศูนย์รวมโมดูล..."
          : "Opening Module Hub...";
      const loadingDesc =
        target === "controlpanel"
          ? isThai
            ? "กำลังโหลดแผงควบคุมและสิทธิ์การดูแลระบบ..."
            : "Loading control panel & admin privileges..."
          : isThai
          ? "กำลังโหลดโมดูลและสิทธิ์การใช้งาน..."
          : "Loading modules and permissions...";

      navigateWithLoading(fallbackPath, loadingTitle, loadingDesc);
    } else if (onNavigate) {
      onNavigate(target);
    }
  };

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
          onClick={() => handleGuardedNavigate("workspace", "/workspace")}
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

      {/* Right: Unboxed Clean Account Trigger & Dropdown (Hidden by default) */}
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
              {/* Account Info Header inside Dropdown (Clickable to /account) */}
              <div
                onClick={() => {
                  if (pathname !== "/account" && pathname !== "/settings") {
                    setIsDropdownOpen(false);
                    handleGuardedNavigate("account", "/account");
                  }
                }}
                className="group px-3 py-3 rounded-xl mb-2 flex items-center justify-between gap-3 cursor-pointer select-none"
                role="button"
                tabIndex={0}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div
                    className={`flex items-center justify-center w-10 h-10 rounded-full shrink-0 border overflow-hidden ${
                      isLight
                        ? "bg-white border-slate-300 text-[#222222]"
                        : "bg-[#2C2C2C] border-[#444444] text-[#FFFFFF]"
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
                      <span className="font-bold text-sm" suppressHydrationWarning>
                        {initials || "U"}
                      </span>
                    ) : (
                      <div className={`w-full h-full rounded-full animate-pulse ${isLight ? "bg-slate-200" : "bg-[#383838]"}`} />
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    {mounted && (isProfileLoaded || fullName) ? (
                      <span className={`font-bold text-[13px] truncate ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`} suppressHydrationWarning>
                        {fullName || (profile.email ? profile.email.split("@")[0] : "User")}
                      </span>
                    ) : (
                      <div className={`h-[14px] w-[90px] rounded-md animate-pulse my-0.5 ${isLight ? "bg-slate-200" : "bg-[#383838]"}`} />
                    )}
                    {mounted && departmentDisplay ? (
                      <span className={`text-[11px] truncate ${isLight ? "text-[#666666]" : "text-[#E4E4E7]"}`} suppressHydrationWarning>
                        {departmentDisplay}
                      </span>
                    ) : mounted && (isProfileLoaded || fullName) && profile.email ? (
                      <span className="text-[11px] text-[#A1A1AA] truncate" suppressHydrationWarning>
                        {profile.email}
                      </span>
                    ) : !isProfileLoaded && !fullName ? (
                      <div className={`h-[11px] w-[60px] rounded-md animate-pulse mt-0.5 ${isLight ? "bg-slate-200" : "bg-[#383838]"}`} />
                    ) : null}
                  </div>
                </div>

                {/* Vertical 3-Dots Action Icon */}
                <div
                  className={`flex items-center justify-center shrink-0 transition-colors ${
                    isLight
                      ? "text-zinc-400 group-hover:text-black"
                      : "text-zinc-500 group-hover:text-white"
                  }`}
                >
                  <MoreVertical size={16} />
                </div>
              </div>

              {/* Divider below Account Header */}
              <div
                className={`mx-1 mb-1.5 border-t ${
                  isLight ? "border-slate-200" : "border-[#383838]"
                }`}
              />

              {/* Quick Actions List */}
              <div className="space-y-1">
                {/* Account Settings */}
                {pathname !== "/account" && pathname !== "/settings" && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleGuardedNavigate("account", "/account");
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all text-left cursor-pointer ${
                      isLight
                        ? "text-slate-800 hover:bg-[#F4F4F5] hover:text-slate-950"
                        : "text-[#F4F4F5] hover:bg-white/10 hover:text-[#FFFFFF]"
                    }`}
                  >
                    <User
                      size={15}
                      className={`shrink-0 ${
                        isLight ? "text-[#222222]" : "text-[#FFFFFF]"
                      }`}
                    />
                    <span className="truncate">
                      {isThai ? "ตั้งค่าโปรไฟล์" : "Profile Settings"}
                    </span>
                  </button>
                )}

                {/* Module Hub (ศูนย์รวมโมดูล - แสดงใน Dropdown ทุกหน้า) */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    handleGuardedNavigate("workspace", "/workspace");
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all text-left cursor-pointer ${
                    isLight
                      ? "text-slate-800 hover:bg-[#F4F4F5] hover:text-slate-950"
                      : "text-[#F4F4F5] hover:bg-white/10 hover:text-[#FFFFFF]"
                  }`}
                >
                  <LayoutGrid
                    size={15}
                    className={`shrink-0 ${
                      isLight ? "text-[#222222]" : "text-[#FFFFFF]"
                    }`}
                  />
                  <span className="truncate">{isThai ? "ศูนย์รวมโมดูล" : "Module Hub"}</span>
                </button>

                {/* Control Panel (Admin & Operations) */}
                {pathname !== "/controlpanel" && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      handleGuardedNavigate("controlpanel", "/controlpanel");
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-[12px] font-semibold transition-all text-left cursor-pointer ${
                      isLight
                        ? "text-slate-800 hover:bg-[#F4F4F5] hover:text-slate-950"
                        : "text-[#F4F4F5] hover:bg-white/10 hover:text-[#FFFFFF]"
                    }`}
                  >
                    <Monitor
                      size={15}
                      className={`shrink-0 ${
                        isLight ? "text-[#222222]" : "text-[#FFFFFF]"
                      }`}
                    />
                    <span className="truncate">{isThai ? "แผงควบคุมระบบ" : "Control Panel"}</span>
                  </button>
                )}

                {/* เส้นขีดคั่นใต้ Control Panel / Module Hub */}
                <div
                  className={`my-1 border-t ${
                    isLight ? "border-slate-200" : "border-[#383838]"
                  }`}
                />

                {/* Theme Switcher Button */}
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all text-left cursor-pointer ${
                    isLight
                      ? "text-[#2C2C2C] hover:bg-[#F4F4F5] hover:text-[#222222]"
                      : "text-[#F4F4F5] hover:bg-white/10 hover:text-[#FFFFFF]"
                  }`}
                >
                  {isLight ? (
                    <Moon size={15} className="shrink-0 text-[#222222]" />
                  ) : (
                    <Sun size={15} className="shrink-0 text-[#FFFFFF]" />
                  )}
                  <span className="truncate">
                    {isLight ? (isThai ? "โหมดมืด" : "Dark Mode") : (isThai ? "โหมดสว่าง" : "Light Mode")}
                  </span>
                </button>

                {/* Language Switcher Button */}
                <button
                  type="button"
                  onClick={toggleLanguage}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all text-left cursor-pointer ${
                    isLight
                      ? "text-slate-800 hover:bg-[#F4F4F5] hover:text-slate-950"
                      : "text-[#F4F4F5] hover:bg-white/10 hover:text-[#FFFFFF]"
                  }`}
                >
                  <Languages
                    size={15}
                    className={`shrink-0 ${
                      isLight ? "text-[#222222]" : "text-[#FFFFFF]"
                    }`}
                  />
                  <span className="truncate">
                    {isThai ? "ภาษาไทย" : "English"}
                  </span>
                </button>

                {/* Profile Settings */}
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    if (onNavigate) onNavigate("settings");
                    else navigateWithLoading("/settings");
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-[12px] font-medium transition-all text-left cursor-pointer ${
                    isLight
                      ? "text-slate-800 hover:bg-[#F4F4F5] hover:text-slate-950"
                      : "text-[#F4F4F5] hover:text-[#FFFFFF] hover:bg-white/10"
                  }`}
                >
                  <Settings
                    size={15}
                    className={`shrink-0 ${
                      isLight ? "text-[#222222]" : "text-[#FFFFFF]"
                    }`}
                  />
                  <span className="truncate">{isThai ? "ตั้งค่า" : "Settings"}</span>
                </button>

                {/* Log Out */}
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-red-400 hover:text-red-500 hover:bg-rose-500/10 text-[12px] font-medium transition-all text-left cursor-pointer"
                >
                  <LogOut size={15} className="shrink-0" />
                  <span className="truncate">{isThai ? "ออกจากระบบ" : "Sign Out"}</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      )}

      {/* Blocker Modal for Incomplete Profile */}
      <ProfileGuardModal
        isOpen={showGuardModal}
        missingFields={missingFields}
        onClose={() => setShowGuardModal(false)}
        onGoToSettings={() => {
          setShowGuardModal(false);
          setIsDropdownOpen(false);
          if (onNavigate) onNavigate("settings");
          else navigateWithLoading("/settings");
        }}
      />
    </header>
  );
}
