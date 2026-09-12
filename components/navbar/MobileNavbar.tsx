"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import {
  Home,
  Package,
  Users,
  ShieldCheck,
  UserCircle,
  Sun,
  Moon,
  Globe,
  LogOut,
  X,
  ChevronDown,
  ChevronUp,
  Layers,
  Settings,
  Monitor,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage, setAppLanguage } from "@/utils/language";
import { clearAuthSession, fetchAndStoreUserProfile } from "@/utils/auth";
import { supabase } from "@/utils/supabase";
import { useLoading } from "@/components/loading_screen";
import { DAWH_LOGOS, getDawhLogo } from "@/config/brand";
import { motion, AnimatePresence } from "framer-motion";

interface SubTabItem {
  id: string;
  label: string;
  path: string;
}

interface MobileNavbarProps {
  subTabs?: SubTabItem[];
  activeSubTabId?: string;
  onSubTabChange?: (tabId: string) => void;
  childrenSubMenu?: React.ReactNode;
}

export default function MobileNavbar({
  subTabs,
  activeSubTabId,
  onSubTabChange,
  childrenSubMenu,
}: MobileNavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { navigateWithLoading } = useLoading();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang.toLowerCase() === "th";

  // Account Drawer Bottom Sheet State
  const [isAccountSheetOpen, setIsAccountSheetOpen] = useState(false);
  const [isSubMenuDrawerOpen, setIsSubMenuDrawerOpen] = useState(false);

  // User Profile State with live database fetching
  const [userProfile, setUserProfile] = useState<{
    name: string;
    employeeCode: string;
    role: string;
    branchCode: string;
    avatarUrl: string | null;
    initials: string;
    isAdmin: boolean;
  }>({
    name: "Authorized Staff",
    employeeCode: "EMP-2847",
    role: "Staff",
    branchCode: "BKK-HQ",
    avatarUrl: null,
    initials: "DA",
    isAdmin: false,
  });

  const parseAndSetProfile = (p: any) => {
    if (!p) return;
    const fullName =
      p.full_name ||
      [p.first_name, p.last_name].filter(Boolean).join(" ") ||
      [p.first_name_th, p.last_name_th].filter(Boolean).join(" ") ||
      p.name ||
      p.username ||
      "Staff Member";

    const parts = fullName.trim().split(" ");
    const initials =
      parts.length >= 2
        ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
        : fullName.slice(0, 2).toUpperCase();

    const roleStr = p.role || "Staff";
    const roleFormatted = roleStr.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase());

    const isAdminRole =
      roleStr.toLowerCase() === "devops" ||
      roleStr.toLowerCase() === "super_admin" ||
      roleStr.toLowerCase() === "superadmin" ||
      roleStr.toLowerCase() === "admin" ||
      roleStr.toLowerCase().includes("admin") ||
      roleStr.toLowerCase().includes("devops");

    setUserProfile({
      name: fullName,
      employeeCode: p.employee_code || p.employee_id || "EMP-2847",
      role: roleFormatted,
      branchCode: p.branch_code || p.branch_name || "BKK-HQ",
      avatarUrl: p.avatar_url || null,
      initials: initials || "DA",
      isAdmin: isAdminRole,
    });
  };

  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("dawh_user_profile");
        if (cached) {
          parseAndSetProfile(JSON.parse(cached));
        }
      } catch (e) {
        // Fallback
      }

      const loadLiveProfile = async () => {
        try {
          let targetId = localStorage.getItem("current_user_id") || undefined;
          let targetEmail = localStorage.getItem("current_user_email") || undefined;

          if (!targetId) {
            const { data: { session } } = await supabase.auth.getSession();
            targetId = session?.user?.id;
            targetEmail = session?.user?.email;
          }

          if (targetId) {
            const fetched = await fetchAndStoreUserProfile(targetId, targetEmail, 1);
            if (fetched) {
              parseAndSetProfile(fetched);
            }
          }
        } catch (err) {
          // Non-blocking
        }
      };

      loadLiveProfile();

      const handleProfileUpdate = () => {
        try {
          const cached = localStorage.getItem("dawh_user_profile");
          if (cached) parseAndSetProfile(JSON.parse(cached));
        } catch {}
      };

      window.addEventListener("dawh_profile_updated", handleProfileUpdate);
      return () => window.removeEventListener("dawh_profile_updated", handleProfileUpdate);
    }
  }, []);

  // Close drawers on route change
  useEffect(() => {
    setIsAccountSheetOpen(false);
    setIsSubMenuDrawerOpen(false);
  }, [pathname]);

  // Sub Tabs Fold/Collapse State
  const [isSubTabsFolded, setIsSubTabsFolded] = useState(false);

  // Determine active bottom nav route
  const isHomeActive = pathname === "/workspace" || pathname === "/portal" || pathname === "/";
  const isAccountActive = pathname.startsWith("/account") || pathname.startsWith("/settings");

  const dynamicTabs: SubTabItem[] = useMemo(() => {
    if (subTabs && subTabs.length > 0) return subTabs;
    return [];
  }, [subTabs]);

  return (
    <div className="block md:hidden w-full select-none shrink-0">
      {/* ========================================================================= */}
      {/* 1. TOP APP BAR (mobile-navbar-head)                                       */}
      {/* ========================================================================= */}
      <header
        className={`sticky top-0 inset-x-0 h-[52px] z-40 px-5 flex items-center justify-between border-b transition-colors duration-200 ${
          isLight
            ? "bg-white/95 border-[#E4E4E7] text-slate-900 shadow-xs"
            : "bg-[#2C2C2C] border-[#444444] text-white"
        }`}
        style={{ boxSizing: "border-box" }}
      >
        {/* Brand Logo Left (Official Horizontal Logo, No Boxes or Random Text) */}
        <div
          onClick={() => router.push("/portal")}
          className="flex items-center cursor-pointer hover:opacity-90 transition-opacity"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={getDawhLogo(theme, "horizontal")}
            alt="DAWH Logo"
            className="h-[28px] sm:h-[30px] w-auto object-contain select-none"
            draggable={false}
          />
        </div>

        {/* Right Controls: Unboxed Fold Sub-Tabs Icon */}
        <div className="flex items-center">
          {dynamicTabs.length > 0 && (
            <button
              type="button"
              onClick={() => setIsSubTabsFolded(!isSubTabsFolded)}
              className={`p-2 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
                isLight
                  ? "text-slate-600 hover:text-black hover:bg-slate-100"
                  : "text-[#AAAAAA] hover:text-white hover:bg-white/10"
              }`}
              title={isSubTabsFolded ? "ขยายแท็บย่อย" : "พับแท็บย่อย"}
            >
              {isSubTabsFolded ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
            </button>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. SUB TAB BAR (sub-tab-bar with smooth collapsible fold animation)       */}
      {/* ========================================================================= */}
      <AnimatePresence initial={false}>
        {!isSubTabsFolded && dynamicTabs.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 52, opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`sticky top-[52px] inset-x-0 h-[52px] z-30 px-4 py-3 flex items-center gap-2 overflow-x-auto no-scrollbar border-b transition-colors duration-200 ${
              isLight
                ? "bg-[#F8FAFC] border-[#E4E4E7]"
                : "bg-[#222222] border-[#444444]"
            }`}
            style={{ boxSizing: "border-box", scrollbarWidth: "none" }}
          >
            {dynamicTabs.map((tab) => {
              const isTabActive =
                activeSubTabId === tab.id ||
                (pathname === tab.path) ||
                (tab.id === "receive" && pathname.startsWith("/warehouse/receive")) ||
                (tab.id === "stock" && pathname.startsWith("/warehouse/inventory")) ||
                (tab.id === "transfer" && pathname.startsWith("/warehouse/transfer")) ||
                (tab.id === "reports" && pathname.startsWith("/warehouse/analysis")) ||
                (tab.id === "contracts" && pathname.startsWith("/datacenter/contracts")) ||
                (tab.id === "customers" && pathname.startsWith("/datacenter/customers")) ||
                (tab.id === "payments" && pathname.startsWith("/datacenter/payments")) ||
                (tab.id === "chat" && pathname.startsWith("/ai/chat")) ||
                (tab.id === "workflows" && pathname.startsWith("/ai/workflows")) ||
                (tab.id === "overview" && (pathname === "/warehouse" || pathname === "/datacenter" || pathname === "/ai"));

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    if (onSubTabChange) onSubTabChange(tab.id);
                    router.push(tab.path);
                  }}
                  className={`px-3 py-1.5 rounded-[100px] text-[12px] font-bold shrink-0 transition-all cursor-pointer ${
                    isTabActive
                      ? isLight
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-[#FFFFFF] text-[#000000] shadow-sm"
                      : isLight
                      ? "border border-[#E4E4E7] bg-white text-slate-600 hover:text-slate-900"
                      : "border border-[#444444] text-[#FFFFFF] hover:bg-white/5"
                  }`}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace, sans-serif",
                    lineHeight: "16px",
                  }}
                >
                  {tab.label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 3. BOTTOM NAVIGATION BAR & SCRIM (bottom-navigation-scrim & bottom-nav)  */}
      {/* ========================================================================= */}
      <div
        className="fixed bottom-0 inset-x-0 z-50 flex flex-col pointer-events-auto"
        style={{ height: "88px" }}
      >
        {/* Bottom Nav Bar (64px) */}
        <nav
          className={`h-[64px] w-full px-2.5 flex items-center justify-between border-t backdrop-blur-[10px] transition-colors duration-200 ${
            isLight
              ? "bg-white/85 border-[#E4E4E7] text-slate-800"
              : "bg-[rgba(51,51,51,0.7)] border-[#444444] text-white"
          }`}
          style={{ boxSizing: "border-box" }}
        >
          {/* Item 1: PORTAL */}
          <button
            type="button"
            onClick={() => navigateWithLoading("/portal", isThai ? "กำลังเปิดศูนย์รวมระบบ..." : "Opening Portal...", isThai ? "กำลังโหลดระบบงาน..." : "Loading workspace...")}
            className="flex-1 h-[64px] flex flex-col items-center justify-center gap-0.5 cursor-pointer group"
          >
            <div className="w-[20px] h-[28px] flex flex-col items-center justify-center">
              <Home size={20} className={isHomeActive ? "text-white" : "text-[#AAAAAA] group-hover:text-white"} />
              {isHomeActive && (
                <div className="w-[4px] h-[4px] rounded-full bg-white shadow-[0_0_4px_#FFFFFF] mt-1" />
              )}
            </div>
            <span
              className={`text-[9px] font-bold uppercase tracking-wider text-center ${
                isHomeActive ? "text-white font-extrabold" : "text-[#AAAAAA]"
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Portal
            </span>
          </button>

          {/* Item 2: ACCOUNT */}
          <button
            type="button"
            onClick={() => router.push("/account")}
            className="flex-1 h-[64px] flex flex-col items-center justify-center gap-0.5 cursor-pointer group"
          >
            <div className="w-[20px] h-[28px] flex flex-col items-center justify-center">
              <Settings size={20} className={isAccountActive ? "text-white" : "text-[#AAAAAA] group-hover:text-white"} />
              {isAccountActive && (
                <div className="w-[4px] h-[4px] rounded-full bg-white shadow-[0_0_4px_#FFFFFF] mt-1" />
              )}
            </div>
            <span
              className={`text-[9px] font-bold uppercase tracking-wider text-center ${
                isAccountActive ? "text-white font-extrabold" : "text-[#AAAAAA]"
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Account
            </span>
          </button>

          {/* Item 3: MENU / PREFERENCES */}
          <button
            type="button"
            onClick={() => setIsAccountSheetOpen(true)}
            className="flex-1 h-[64px] flex flex-col items-center justify-center gap-0.5 cursor-pointer group"
          >
            <div className="w-[20px] h-[28px] flex flex-col items-center justify-center">
              <UserCircle size={20} className={isAccountSheetOpen ? "text-white" : "text-[#AAAAAA] group-hover:text-white"} />
              {isAccountSheetOpen && (
                <div className="w-[4px] h-[4px] rounded-full bg-white shadow-[0_0_4px_#FFFFFF] mt-1" />
              )}
            </div>
            <span
              className={`text-[9px] font-bold uppercase tracking-wider text-center ${
                isAccountSheetOpen ? "text-white font-extrabold" : "text-[#AAAAAA]"
              }`}
              style={{ fontFamily: "'JetBrains Mono', monospace" }}
            >
              Menu
            </span>
          </button>
        </nav>

        {/* Safe Area Bottom (24px) with Home Indicator */}
        <div
          className={`h-[24px] w-full flex items-center justify-center pb-2 backdrop-blur-[10px] ${
            isLight ? "bg-white/85" : "bg-[rgba(51,51,51,0.7)]"
          }`}
        >
          <div className="w-[120px] h-[4px] rounded-[2px] bg-white opacity-30" />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. ACCOUNT BOTTOM SHEET (Figma Spec Pixel-Perfect)                        */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isAccountSheetOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
            {/* Backdrop Tap to Close */}
            <div className="flex-1 w-full" onClick={() => setIsAccountSheetOpen(false)} />

            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full bg-[#2C2C2C] border-t border-[#444444] rounded-t-[24px] text-white p-4 pb-8 space-y-4 shadow-2xl"
              style={{ boxSizing: "border-box" }}
            >
              {/* Drag Handle Bar */}
              <div className="w-full flex justify-center py-1">
                <div className="w-[40px] h-[4px] bg-[#666666] rounded-[2px]" />
              </div>

              {/* Profile Card (Real Live Data) */}
              <div
                className="w-full bg-[#333333] border border-[#444444] rounded-[16px] p-4 flex items-center gap-4"
                style={{ boxSizing: "border-box" }}
              >
                {/* Glow Avatar / Real Photo */}
                <div className="w-[48px] h-[48px] rounded-full bg-[#2C2C2C] border-2 border-white shadow-[0_0_8px_#FFFFFF] flex items-center justify-center shrink-0 overflow-hidden">
                  {userProfile.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={userProfile.avatarUrl}
                      alt={userProfile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span
                      className="font-bold text-[16px] text-white"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {userProfile.initials}
                    </span>
                  )}
                </div>

                {/* Profile Details */}
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h4
                      className="font-bold text-[16px] text-white truncate"
                      style={{ fontFamily: "'Geist', sans-serif" }}
                    >
                      {userProfile.name}
                    </h4>
                    <button
                      onClick={() => setIsAccountSheetOpen(false)}
                      className="text-[#AAAAAA] hover:text-white p-1"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <span
                    className="text-[11px] text-[#AAAAAA] font-normal block font-mono"
                  >
                    {userProfile.employeeCode}
                  </span>
                  <div className="flex items-center gap-1.5 pt-0.5 flex-wrap">
                    <span
                      className="px-1.5 py-0.5 bg-[#444444] rounded-[4px] text-[9px] font-bold text-white font-mono"
                    >
                      {userProfile.role}
                    </span>
                    <span
                      className="px-1.5 py-0.5 border border-[#444444] rounded-[4px] text-[9px] font-bold text-[#AAAAAA] font-mono"
                    >
                      {userProfile.branchCode}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation Quick Actions */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAccountSheetOpen(false);
                    navigateWithLoading(
                      "/settings",
                      isThai ? "กำลังเปิดการตั้งค่าบัญชี..." : "Opening Settings...",
                      isThai ? "กำลังโหลดข้อมูลส่วนตัวและความปลอดภัย..." : "Loading profile..."
                    );
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#333333] hover:bg-[#3E3E3E] text-white text-xs font-semibold border border-[#444444] transition-all cursor-pointer"
                >
                  <Settings size={14} />
                  <span>{isThai ? "การตั้งค่าบัญชี" : "Account Settings"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsAccountSheetOpen(false);
                    navigateWithLoading(
                      "/portal",
                      isThai ? "กำลังเปิดศูนย์รวมระบบ..." : "Opening Portal...",
                      isThai ? "กำลังโหลดระบบงาน..." : "Loading workspace..."
                    );
                  }}
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#333333] hover:bg-[#3E3E3E] text-white text-xs font-semibold border border-[#444444] transition-all cursor-pointer"
                >
                  <Home size={14} />
                  <span>{isThai ? "ศูนย์รวมระบบ" : "Workspace Portal"}</span>
                </button>
              </div>

              {/* System Preferences */}
              <div className="space-y-3 pt-1">
                <span
                  className="text-[10px] text-[#AAAAAA] font-normal uppercase tracking-wider block font-mono"
                >
                  System Preferences
                </span>

                {/* Console Interface Theme */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-[14px] text-white font-normal"
                    style={{ fontFamily: "'Geist', sans-serif" }}
                  >
                    Console Interface Theme
                  </span>

                  {/* Theme Toggle Button */}
                  <div className="w-[64px] h-[32px] bg-[#333333] border border-[#444444] rounded-[16px] p-[3px] flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        if (!isLight) toggleTheme();
                      }}
                      className={`w-[22px] h-[22px] flex items-center justify-center rounded-full transition-all cursor-pointer ${
                        isLight ? "bg-white text-black shadow-xs" : "text-[#AAAAAA]"
                      }`}
                    >
                      <Sun size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (isLight) toggleTheme();
                      }}
                      className={`w-[26px] h-[26px] flex items-center justify-center rounded-[13px] transition-all cursor-pointer ${
                        !isLight ? "bg-white text-black shadow-xs" : "text-[#AAAAAA]"
                      }`}
                    >
                      <Moon size={14} />
                    </button>
                  </div>
                </div>

                {/* System Language */}
                <div className="flex items-center justify-between">
                  <span
                    className="text-[14px] text-white font-normal"
                    style={{ fontFamily: "'Geist', sans-serif" }}
                  >
                    System Language
                  </span>

                  {/* Language Segmented Control */}
                  <div className="w-[100px] h-[32px] bg-[#333333] border border-[#444444] rounded-[8px] p-[2px] flex items-center gap-[2px]">
                    <button
                      type="button"
                      onClick={() => setAppLanguage("TH")}
                      className={`flex-1 h-[28px] rounded-[6px] flex items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer font-mono ${
                        isThai ? "bg-white text-black font-extrabold" : "text-[#AAAAAA]"
                      }`}
                    >
                      <Globe size={10} />
                      <span>TH</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAppLanguage("EN")}
                      className={`flex-1 h-[28px] rounded-[6px] flex items-center justify-center text-[11px] font-bold transition-all cursor-pointer font-mono ${
                        !isThai ? "bg-white text-black font-extrabold" : "text-[#AAAAAA]"
                      }`}
                    >
                      <span>EN</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Sign Out Button */}
              <button
                type="button"
                onClick={async () => {
                  setIsAccountSheetOpen(false);
                  await clearAuthSession();
                  router.push("/auth/login");
                }}
                className="w-full h-[41px] border border-[#444444] rounded-[8px] flex items-center justify-center gap-2 text-white font-bold text-[13px] hover:bg-white/10 transition-all cursor-pointer mt-3 font-mono"
              >
                <LogOut size={16} />
                <span>SIGN OUT OF CONSOLE</span>
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ========================================================================= */}
      {/* 5. SUB MENU DRAWER (When clicking Top Bell / Menu button)                 */}
      {/* ========================================================================= */}
      <AnimatePresence>
        {isSubMenuDrawerOpen && (
          <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-xs">
            <div className="flex-1 w-full" onClick={() => setIsSubMenuDrawerOpen(false)} />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="w-full max-h-[75vh] bg-[#222222] border-t border-[#444444] rounded-t-[24px] text-white p-4 space-y-4 overflow-y-auto mb-[88px]"
            >
              <div className="flex items-center justify-between border-b border-[#333333] pb-2">
                <span className="font-bold text-sm" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  Warehouse Menu
                </span>
                <button onClick={() => setIsSubMenuDrawerOpen(false)} className="text-[#AAAAAA] hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-2">
                {childrenSubMenu}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
