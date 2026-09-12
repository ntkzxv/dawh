"use client";

import React, { useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronUp,
  Settings,
  LogOut,
  Languages,
  LayoutGrid,
  Layers,
  Sun,
  Moon,
  Monitor,
  Menu,
  X,
  PackageCheck,
  Boxes,
  ArrowLeftRight,
} from "lucide-react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { supabase } from "@/utils/supabase";
import { clearAuthSession } from "@/utils/auth";
import { useTheme } from "@/context/ThemeContext";
import { DAWH_LOGOS } from "@/config/brand";
import { useLoading } from "@/components/loading_screen";
import { useAppLanguage, setAppLanguage } from "@/utils/language";
import { motion, AnimatePresence } from "framer-motion";
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
}: NavbarMainProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { navigateWithLoading } = useLoading();
  const { theme, toggleTheme } = useTheme();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("User");
  const [userUsername, setUserUsername] = useState<string | null>(null);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [isMinimized, setIsMinimized] = useState(initialMinimized);
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const appLang = useAppLanguage();
  const activeLang = controlledLang ?? (appLang.toLowerCase() as "th" | "en");
  const isLight = theme === "light";

  // Auto-close mobile drawer on route change
  useEffect(() => {
    setIsMobileDrawerOpen(false);
  }, [pathname]);

  // Dynamic logo based on active theme and minimized state
  const MINIMIZED_LOGO_LIGHT = "https://aifcrdoxzvkkoyemukag.supabase.co/storage/v1/object/sign/image/logo/dawh_black4x2048logo.png?token=eyJraWQiOiI4ODY5ZGQ3ZS0zZGFlLTRiNGUtYTk4MS1iMDZiZDE3MjdlMzIiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpbWFnZS9sb2dvL2Rhd2hfYmxhY2s0eDIwNDhsb2dvLnBuZyIsInNjb3BlIjoiZG93bmxvYWQiLCJpYXQiOjE3ODc4NzgwNTIsImV4cCI6MTgxOTQxNDA1Mn0.mxYm7LTG-oFslXLhR44IH0JV__R6U2uvp-vTvikVJpcMk0nNUCZilWPLvVSp_XLHQP8vru2b9N8SPYSY_qLkvA";
  const MINIMIZED_LOGO_DARK = "https://aifcrdoxzvkkoyemukag.supabase.co/storage/v1/object/sign/image/logo/dawh_light2048logo.png?token=eyJraWQiOiI4ODY5ZGQ3ZS0zZGFlLTRiNGUtYTk4MS1iMDZiZDE3MjdlMzIiLCJhbGciOiJIUzUxMiJ9.eyJ1cmwiOiJpbWFnZS9sb2dvL2Rhd2hfbGlnaHQyMDQ4bG9nby5wbmciLCJzY29wZSI6ImRvd25sb2FkIiwiaWF0IjoxNzg3ODc4MDkwLCJleHAiOjE4MTk0MTQwOTB9.snX3XF6HEYgVZfixln7CeB-fft8bk5AsWnwPDw1T-By2vnVVnlJDR90J3-_1MbFTfhWO9x1Eye-T0inMMUNG7w";

  const currentLogo = isMinimized
    ? (isLight ? MINIMIZED_LOGO_LIGHT : MINIMIZED_LOGO_DARK)
    : (logoUrl || (isLight ? logoWhiteUrl : logoDarkUrl));

  useEffect(() => {
    let isMounted = true;
    setMounted(true);

    // Format Helper: "Nattakit B." or Nickname fallback
    const formatDisplayName = (
      fullName?: string | null,
      fName?: string | null,
      lName?: string | null,
      nicknameTh?: string | null,
      nicknameEn?: string | null
    ) => {
      if (fName && lName) {
        return `${fName} ${lName.charAt(0).toUpperCase()}.`;
      }
      if (fullName) {
        const parts = fullName.trim().split(/\s+/);
        if (parts.length >= 2) {
          return `${parts[0]} ${parts[parts.length - 1].charAt(0).toUpperCase()}.`;
        }
        return parts[0];
      }
      if (nicknameTh) return nicknameTh;
      if (nicknameEn) return nicknameEn;
      return "Administrator";
    };

    // 1. Instant Cache Check (0ms - prevents any profile avatar/name flicker)
    try {
      const cached = localStorage.getItem("dawh_user_profile");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed) {
          setUserRole(parsed.role?.toLowerCase() || null);
          setUserName(formatDisplayName(parsed.full_name, parsed.first_name, parsed.last_name, parsed.nickname_th, parsed.nickname));
          setUserUsername(parsed.username || (parsed.nickname ? parsed.nickname.toLowerCase() : "user"));
          setUserAvatar(parsed.avatar_url || null);
        }
      }
    } catch {
      // Non-blocking
    }

    const loadUserData = async () => {
      try {
        if (typeof window === "undefined") return;
        const { data: { session } } = await supabase.auth.getSession();
        let targetId = session?.user?.id || localStorage.getItem("current_user_id") || undefined;
        let targetEmail = session?.user?.email || localStorage.getItem("current_user_email") || undefined;

        if (targetId) {
          const { data } = await supabase
            .from("employees")
            .select("role, full_name, username, first_name, last_name, nickname, nickname_th, avatar_url")
            .eq("id", targetId)
            .maybeSingle();

          if (data && isMounted) {
            setUserRole(data.role?.toLowerCase() || null);
            setUserName(formatDisplayName(data.full_name, data.first_name, data.last_name, data.nickname_th, data.nickname));
            setUserUsername(data.username || (data.nickname ? data.nickname.toLowerCase() : "user"));
            setUserAvatar(data.avatar_url || null);
            return;
          }

          // RPC fallback
          try {
            const { data: rpcEmp } = await supabase.rpc("rpc_get_employee_profile", {
              p_id: targetId,
            });
            if (rpcEmp && isMounted) {
              setUserRole(rpcEmp.role?.toLowerCase() || null);
              setUserName(formatDisplayName(rpcEmp.full_name, rpcEmp.first_name, rpcEmp.last_name, rpcEmp.nickname_th, rpcEmp.nickname));
              setUserUsername(rpcEmp.username || (rpcEmp.nickname ? rpcEmp.nickname.toLowerCase() : "user"));
              setUserAvatar(rpcEmp.avatar_url || null);
              return;
            }
          } catch {
            // non-blocking
          }
        }

        if (targetEmail) {
          const { data } = await supabase
            .from("employees")
            .select("role, full_name, username, first_name, last_name, nickname, nickname_th, avatar_url")
            .eq("email", targetEmail)
            .maybeSingle();

          if (data && isMounted) {
            setUserRole(data.role?.toLowerCase() || null);
            setUserName(formatDisplayName(data.full_name, data.first_name, data.last_name, data.nickname_th, data.nickname));
            setUserUsername(data.username || (data.nickname ? data.nickname.toLowerCase() : "user"));
            setUserAvatar(data.avatar_url || null);
            return;
          }
        }

        // Check cached dawh_user_profile or session metadata
        const cached = localStorage.getItem("dawh_user_profile");
        if (cached && isMounted) {
          const parsed = JSON.parse(cached);
          setUserRole(parsed.role?.toLowerCase() || null);
          setUserName(formatDisplayName(parsed.full_name, parsed.first_name, parsed.last_name, parsed.nickname_th, parsed.nickname));
          setUserUsername(parsed.username || (parsed.nickname ? parsed.nickname.toLowerCase() : "user"));
          setUserAvatar(parsed.avatar_url || null);
          return;
        }

        if (session?.user && isMounted) {
          const meta = session.user.user_metadata || {};
          setUserName(formatDisplayName(meta.full_name, meta.first_name, meta.last_name, meta.nickname_th, meta.nickname));
          setUserUsername(meta.username || session.user.email?.split("@")[0] || "user");
          setUserAvatar(meta.avatar_url || null);
          setUserRole(meta.role || null);
          return;
        }

        // Default active user fallback if no session yet
        if (isMounted) {
          const fallbackName = targetEmail ? targetEmail.split("@")[0] : "Administrator";
          setUserName(fallbackName);
          setUserUsername(fallbackName.toLowerCase());
          setUserRole("super_admin");
        }
      } catch {
        // Non-blocking fallback
      } finally {
        if (isMounted) setMounted(true);
      }
    };

    loadUserData();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleLanguage = () => {
    const nextLang = activeLang === "en" ? "th" : "en";
    setAppLanguage(nextLang.toUpperCase() as "TH" | "EN");
    onLangChange?.(nextLang);
  };

  const handleToggleMinimize = () => {
    const nextState = !isMinimized;
    setIsMinimized(nextState);
    setIsAccountOpen(false);
    onMinimizedChange?.(nextState);
  };

  const translations = {
    en: {
      hub: "Module Hub",
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
        className={`hidden md:flex sticky top-0 h-dvh flex-col transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] z-40 shrink-0 ${
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
      <div className="flex flex-col items-center justify-center w-full overflow-hidden shrink-0 h-[96px] px-2.5 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
        <div
          className={`relative flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isMinimized ? "w-8 h-8" : "w-full h-[69px]"
          }`}
        >
          {currentLogo ? (
            <Image
              src={currentLogo}
              alt="Logo"
              fill
              priority
              sizes="(max-width: 768px) 32px, 220px"
              className="object-contain transition-opacity duration-200"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = "none";
              }}
            />
          ) : (
            <div className="flex items-center gap-2.5">
              <div
                className={`flex items-center justify-center rounded-xl font-bold shadow-sm shrink-0 ${
                  isMinimized ? "h-7 w-7" : "h-9 w-9"
                } ${
                  isLight
                    ? "bg-slate-900 text-[#FFFFFF]"
                    : "bg-[#FFFFFF] text-slate-950"
                }`}
              >
                <Layers className={isMinimized ? "h-4 w-4" : "h-5 w-5"} />
              </div>
              <span
                className={`font-extrabold text-2xl tracking-tight whitespace-nowrap overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isLight ? "text-slate-900" : "text-[#FFFFFF]"
                } ${isMinimized ? "max-w-0 opacity-0" : "max-w-[140px] opacity-100"}`}
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
        className={`mx-4 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] border-b mb-2 ${
          isLight ? "border-[#E4E4E7]" : "border-[#444444]"
        } ${isMinimized ? "opacity-60 scale-x-60" : "opacity-100 scale-x-100"}`}
      />

      {/* SUB NAVBAR AREA */}
      <div
        className={`flex-1 px-3 w-full transition-all duration-500 no-scrollbar ${
          isMinimized ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"
        }`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>

      {/* ACCOUNT & CONTROL AREA */}
      <div
        className={`px-3 pt-5 pb-2.5 mt-auto w-full shrink-0 border-t space-y-2 transition-colors duration-500 ${
          isLight
            ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-sm"
            : "bg-[#1E1E1E] border-[#383838]"
        }`}
      >
        {/* Quick Controls: Hub & Minimize Buttons */}
        <div
          className={`w-full flex items-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
            isMinimized
              ? "flex-col gap-2 items-center"
              : "items-center gap-1.5 px-0.5"
          }`}
        >
          {/* Hub Button */}
          <button
            type="button"
            onClick={() =>
              navigateWithLoading(
                hubPath,
                "กำลังเปิดศูนย์รวมโมดูล...",
                "กำลังโหลดโมดูลและสิทธิ์การใช้งาน..."
              )
            }
            className={`flex items-center justify-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] group cursor-pointer overflow-hidden ${
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
              className={`shrink-0 flex items-center justify-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
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

            {/* Text: Centered, Fast Fade Out on Minimize */}
            <div
              className={`flex items-center justify-center overflow-hidden transition-all duration-300 ease-out ${
                isMinimized
                  ? "max-w-0 opacity-0 -translate-x-3 duration-100 pointer-events-none"
                  : "max-w-[140px] opacity-100 translate-x-0 duration-300"
              }`}
            >
              <span className="text-[12px] font-semibold leading-none tracking-wide truncate whitespace-nowrap text-center">
                {t.hub}
              </span>
            </div>
          </button>

          {/* Minimize / Expand Button */}
          <button
            type="button"
            onClick={handleToggleMinimize}
            className={`flex items-center justify-center rounded-xl border transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-75 cursor-pointer shrink-0 ${
              isLight
                ? "border-[#E4E4E7] bg-[#FFFFFF] text-[#2C2C2C] hover:bg-[#F4F4F5] shadow-sm"
                : "border-[#444444] bg-[#383838] text-[#E4E4E7] hover:border-white/30 hover:text-[#FFFFFF]"
            } ${isMinimized ? "w-10 h-10 aspect-square" : "h-9 w-9"}`}
            aria-label="Toggle sidebar minimize"
          >
            <ChevronLeft
              size={17}
              className={`transition-transform duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isMinimized ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* User Profile Card & Expandable Controls */}
        <div className="w-full space-y-2">
          {/* Smooth Account Divider */}
          <div
            className={`mx-auto border-t transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isLight ? "border-[#E4E4E7]" : "border-[#444444]"
            } ${isMinimized ? "w-6 opacity-100 mb-2 scale-x-100" : "w-0 opacity-0 mb-0 scale-x-0"}`}
          />

          {/* Main Account Button */}
          <button
            type="button"
            onClick={() =>
              isMinimized ? handleToggleMinimize() : setIsAccountOpen(!isAccountOpen)
            }
            className={`flex items-center transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden cursor-pointer ${
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
              className={`shrink-0 flex items-center justify-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] rounded-full border ${
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
                  className="w-full h-full object-cover"
                  alt="Profile"
                />
              ) : (
                <span className="text-xs uppercase font-bold" suppressHydrationWarning>
                  {mounted ? userName.charAt(0) : ""}
                </span>
              )}
            </div>

            <div
              className={`min-w-0 flex-1 text-left flex flex-col justify-center overflow-hidden transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isMinimized
                  ? "max-w-0 opacity-0 -translate-x-4 pointer-events-none"
                  : "max-w-[140px] opacity-100 translate-x-0"
              }`}
            >
              <p
                className={`text-[12.5px] font-bold truncate leading-none tracking-normal ${
                  isLight ? "text-[#18181B]" : "text-[#FFFFFF]"
                }`}
                suppressHydrationWarning
              >
                {mounted ? userName : ""}
              </p>
              <p
                className={`text-[11px] font-medium tracking-wide truncate leading-none mt-1 ${
                  isLight ? "text-slate-500" : "text-[#A1A1AA]"
                }`}
                suppressHydrationWarning
              >
                {mounted ? `@${userUsername || "username"}` : ""}
              </p>
            </div>

            <ChevronUp
              size={15}
              className={`shrink-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                isLight ? "text-[#383838]" : "text-[#E4E4E7]"
              } ${
                isMinimized
                  ? "opacity-0 w-0 -translate-x-2 pointer-events-none"
                  : `opacity-100 translate-x-0 ${isAccountOpen ? "" : "rotate-180"}`
              }`}
            />
          </button>

          {/* Action Dropdown Menu (Opens Upwards/Downwards with Smooth Slide Animation) */}
          <AnimatePresence>
            {!isMinimized && isAccountOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -12 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -12 }}
                transition={{
                  duration: 0.22,
                  ease: [0.16, 1, 0.3, 1],
                }}
                className="overflow-hidden mt-1.5 origin-top"
              >
                <div
                  className={`overflow-hidden space-y-0.5 rounded-2xl p-1 border shadow-lg ${
                    isLight
                      ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-slate-200/80"
                      : "bg-[#282828] border-[#444444]"
                  }`}
                >
                  {/* Theme Switcher in Dropdown */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] font-medium transition-all text-left cursor-pointer ${
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
                      {isLight ? t.themeDark : t.themeLight}
                    </span>
                  </button>

                  {/* Language Switcher */}
                  <button
                    type="button"
                    onClick={toggleLanguage}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] font-medium transition-all text-left cursor-pointer ${
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
                    <span className="truncate">{t.lang}</span>
                  </button>



                  {/* Account Settings */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsAccountOpen(false);
                      navigateWithLoading(
                        settingsPath,
                        "กำลังเปิดการตั้งค่าบัญชี...",
                        "กำลังโหลดข้อมูลโปรไฟล์และความปลอดภัย..."
                      );
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] font-medium transition-all text-left cursor-pointer ${
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
                    <span className="truncate">{t.account}</span>
                  </button>

                  {/* Logout Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      setIsAccountOpen(false);
                      await clearAuthSession();
                      router.push(loginPath);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[12px] font-medium text-rose-500 hover:bg-rose-500/10 transition-all text-left cursor-pointer"
                  >
                    <LogOut size={15} className="shrink-0 text-rose-500" />
                    <span className="truncate">{t.logout}</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

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
