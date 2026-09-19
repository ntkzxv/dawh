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
import { getCurrentSession, signOut } from "@/lib/auth-client";
import { clearUserProfileCache, fetchAndStoreUserProfile, toEmployeeProfile } from "@/lib/user-profile";
import { getAppMe } from "@/lib/api/session";
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
        try {
          const me = await getAppMe();
          if (me.data.profile && isMounted) {
            const canonicalProfile = toEmployeeProfile(me.data.profile);
            setUserName(formatDisplayName(canonicalProfile.full_name, canonicalProfile.first_name, canonicalProfile.last_name, canonicalProfile.nickname_th, canonicalProfile.nickname));
            setUserUsername(canonicalProfile.username || "user");
            setUserAvatar(canonicalProfile.avatar_url || null);
            localStorage.setItem("dawh_user_profile", JSON.stringify(canonicalProfile));
          } else if (isMounted) {
            setUserName(me.data.user.name || me.data.user.email.split("@")[0]);
            setUserUsername(me.data.user.email.split("@")[0] || "user");
          }
        } catch {
          // Fall back to Better Auth identity below if the application API is unavailable.
        }
        const session = await getCurrentSession();
        const targetId = session?.user.id || undefined;
        const targetEmail = session?.user.email || undefined;

        if (targetId) {
          const empProfile = await fetchAndStoreUserProfile(targetId, targetEmail);
          if (empProfile && isMounted) {
            setUserRole(empProfile.role?.toLowerCase() || null);
            setUserName(formatDisplayName(empProfile.full_name, empProfile.first_name, empProfile.last_name, empProfile.nickname_th, empProfile.nickname));
            setUserUsername(empProfile.username || (empProfile.nickname ? empProfile.nickname.toLowerCase() : "user"));
            setUserAvatar(empProfile.avatar_url || null);
            return;
          }
        }

        // Check the business profile cache before falling back to auth identity.
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
          setUserName(session.user.name || session.user.email.split("@")[0]);
          setUserUsername(session.user.email.split("@")[0] || "user");
          setUserAvatar(session.user.image || null);
          setUserRole(null);
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
        className={`px-3 pt-5 pb-2.5 mt-auto w-full shrink-0 border-t space-y-2 transition-colors duration-700 ${
          isLight
            ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-sm"
            : "bg-[#1E1E1E] border-[#383838]"
        }`}
      >
        {/* Quick Controls: Hub & Minimize Buttons */}
        <div
          className={`w-full flex items-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
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
                  className="w-full h-full object-cover"
                  alt="Profile"
                />
              ) : (
                <span className="text-sm uppercase font-bold" suppressHydrationWarning>
                  {mounted ? userName.charAt(0) : ""}
                </span>
              )}
            </div>

            <div
              className={`min-w-0 flex-1 text-left flex flex-col justify-center overflow-hidden transition-all ease-out ${
                isMinimized
                  ? "max-w-0 opacity-0 -translate-x-4 duration-200 pointer-events-none"
                  : "max-w-[140px] opacity-100 translate-x-0 duration-350 delay-100"
              }`}
            >
              <p
                className={`text-[13.5px] font-bold truncate leading-none tracking-normal ${
                  isLight ? "text-[#18181B]" : "text-[#FFFFFF]"
                }`}
                suppressHydrationWarning
              >
                {mounted ? userName : ""}
              </p>
              <p
                className={`text-[12px] font-medium tracking-wide truncate leading-none mt-1 ${
                  isLight ? "text-slate-500" : "text-[#A1A1AA]"
                }`}
                suppressHydrationWarning
              >
                {mounted ? `@${userUsername || "username"}` : ""}
              </p>
            </div>

            <ChevronUp
              size={16}
              className={`shrink-0 transition-transform duration-350 ease-[cubic-bezier(0.4,0,0.2,1)] ${
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
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{
                  opacity: 1,
                  height: "auto",
                  marginTop: 6,
                  transition: {
                    height: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                    marginTop: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
                    opacity: { duration: 0.25, ease: "easeOut", delay: 0.05 },
                  },
                }}
                exit={{
                  opacity: 0,
                  height: 0,
                  marginTop: 0,
                  transition: {
                    height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                    marginTop: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                    opacity: { duration: 0.2, ease: "easeIn" },
                  },
                }}
                className="overflow-hidden"
              >
                <div
                  className={`overflow-hidden space-y-0.5 rounded-2xl p-1 border shadow-lg transition-colors duration-300 ${
                    isLight
                      ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-slate-200/80"
                      : "bg-[#282828] border-[#444444]"
                  }`}
                >
                  {/* Theme Switcher in Dropdown */}
                  <button
                    type="button"
                    onClick={toggleTheme}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all text-left cursor-pointer ${
                      isLight
                        ? "text-[#2C2C2C] hover:bg-[#F4F4F5] hover:text-[#222222]"
                        : "text-[#F4F4F5] hover:bg-white/10 hover:text-[#FFFFFF]"
                    }`}
                  >
                    {isLight ? (
                      <Moon size={16} className="shrink-0 text-[#222222]" />
                    ) : (
                      <Sun size={16} className="shrink-0 text-[#FFFFFF]" />
                    )}
                    <span className="truncate">
                      {isLight ? t.themeDark : t.themeLight}
                    </span>
                  </button>

                  {/* Language Switcher */}
                  <button
                    type="button"
                    onClick={toggleLanguage}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all text-left cursor-pointer ${
                      isLight
                        ? "text-slate-800 hover:bg-[#F4F4F5] hover:text-slate-950"
                        : "text-[#F4F4F5] hover:bg-white/10 hover:text-[#FFFFFF]"
                    }`}
                  >
                    <Languages
                      size={16}
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
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all text-left cursor-pointer ${
                      isLight
                        ? "text-slate-800 hover:bg-[#F4F4F5] hover:text-slate-950"
                        : "text-[#F4F4F5] hover:text-[#FFFFFF] hover:bg-white/10"
                    }`}
                  >
                    <Settings
                      size={16}
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
                      await signOut();
                      clearUserProfileCache();
                      router.push(loginPath);
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium text-rose-500 hover:bg-rose-500/10 transition-all text-left cursor-pointer"
                  >
                    <LogOut size={16} className="shrink-0 text-rose-500" />
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
