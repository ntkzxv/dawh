"use client";

import React from "react";
import {
  Sun,
  Moon,
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
import { useLoading } from "@/components/loading_screen";
import { ProfileGuardModal } from "@/components/auth";
import { UseAccountMenuReturn } from "@/hooks/useAccountMenu";

// ─────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────

export interface DropdownMenuProps extends UseAccountMenuReturn {
  /** Called to close the wrapping popup / sheet / panel */
  onClose: () => void;
  /**
   * popup  — used in HeaderNavbar (absolute dropdown).
   *          Shows profile header card at the top.
   * inline — used in SidebarMain (embedded expandable).
   *          No profile header card (the sidebar trigger button already shows it).
   */
  variant?: "popup" | "inline";
  /** Optional sidebar-style navigation callback (used by SidebarMain) */
  onNavigate?: (target: string) => void;
  /** Override /settings path (used by SidebarMain's settingsPath prop) */
  settingsPath?: string;
}

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────

export default function DropdownMenu({
  onClose,
  variant = "popup",
  onNavigate,
  settingsPath,
  // ── from useAccountMenu ──
  profile,
  fullName,
  initials,
  departmentDisplay,
  isAdmin,
  isProfileLoaded,
  mounted,
  isThai,
  toggleLanguage,
  showGuardModal,
  setShowGuardModal,
  missingFields,
  handleLogout,
  handleGuardedNavigate,
  handleSettingsNavigate,
}: DropdownMenuProps) {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { navigateWithLoading } = useLoading();
  const isLight = theme === "light";

  const iconSize = variant === "inline" ? 16 : 15;
  const itemPad = variant === "inline" ? "px-3 py-2.5" : "px-3.5 py-2.5";
  const itemFont = variant === "inline" ? "text-[13.5px] font-semibold" : "text-[12px] font-semibold";
  const utilPad = variant === "inline" ? "px-3 py-2.5" : "px-3.5 py-2";
  const utilFont = variant === "inline" ? "text-[13.5px] font-medium" : "text-[12px] font-medium";

  // Shared class builders
  const activeItemCls = isLight
    ? "bg-[#F4F4F5] text-[#18181B] cursor-default"
    : "bg-white/10 text-[#FFFFFF] cursor-default";

  const navItemCls = isLight
    ? "text-slate-800 hover:bg-[#F4F4F5] hover:text-slate-950 cursor-pointer"
    : "text-[#F4F4F5] hover:bg-white/10 hover:text-[#FFFFFF] cursor-pointer";

  const utilItemCls = isLight
    ? "text-[#2C2C2C] hover:bg-[#F4F4F5] hover:text-[#222222] cursor-pointer"
    : "text-[#F4F4F5] hover:bg-white/10 hover:text-[#FFFFFF] cursor-pointer";

  const dividerCls = `border-t ${isLight ? "border-slate-200" : "border-[#383838]"}`;

  // Navigate helper — closes dropdown then calls guarded navigate
  const goTo = (target: string, path: string) => {
    if (pathname === path) return; // already on this page
    onClose();
    handleGuardedNavigate(target, path);
  };

  const onSettings = () => handleSettingsNavigate(onClose);

  // ── Avatar skeleton / image / monogram ──
  const avatarContent = (size: "sm" | "md") => {
    const dim = size === "md" ? "w-10 h-10" : "w-[38px] h-[38px]";
    const textSize = size === "md" ? "text-sm" : "text-[14px]";
    const borderCls = isLight
      ? "bg-white border-slate-300 text-[#222222]"
      : "bg-[#2C2C2C] border-[#444444] text-[#FFFFFF]";
    return (
      <div className={`flex items-center justify-center ${dim} rounded-full shrink-0 border overflow-hidden ${borderCls}`}>
        {mounted && profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt={fullName || "User"} className="w-full h-full object-cover" />
        ) : mounted && (isProfileLoaded || fullName) ? (
          <span className={`font-bold ${textSize}`} suppressHydrationWarning>
            {initials || "U"}
          </span>
        ) : (
          <div className={`w-full h-full rounded-full animate-pulse ${isLight ? "bg-slate-200" : "bg-[#383838]"}`} />
        )}
      </div>
    );
  };

  // ── Badge for active page ──
  // (removed — no active-state highlights)

  return (
    <>
      <div className="space-y-1">
        {/* ── Profile header card (popup only) ── */}
        {variant === "popup" && (
          <>
            <div
              onClick={() => goTo("account", "/account")}
              className="group px-3 py-3 rounded-xl mb-2 flex items-center justify-between gap-3 cursor-pointer select-none"
              role="button"
              tabIndex={0}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {avatarContent("md")}
                <div className="flex flex-col min-w-0">
                  {mounted && (isProfileLoaded || fullName) ? (
                    <span
                      className={`font-bold text-[13px] truncate ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}
                      suppressHydrationWarning
                    >
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
              <div className={`flex items-center justify-center shrink-0 transition-colors ${isLight ? "text-zinc-400 group-hover:text-black" : "text-zinc-500 group-hover:text-white"}`}>
                <MoreVertical size={16} />
              </div>
            </div>
            <div className={`mx-1 mb-1.5 ${dividerCls}`} />
          </>
        )}

        {/* ── Profile ── */}
        <button
          type="button"
          onClick={() => goTo("account", "/account")}
          className={`w-full flex items-center gap-3 ${itemPad} rounded-xl ${itemFont} transition-all text-left ${navItemCls}`}
        >
          <User
            size={iconSize}
            className={`shrink-0 ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}
          />
          <span className="truncate flex-1">{isThai ? "โปรไฟล์" : "Profile"}</span>
        </button>

        {/* ── Module Hub ── */}
        <button
          type="button"
          onClick={() => goTo("workspace", "/workspace")}
          className={`w-full flex items-center gap-3 ${itemPad} rounded-xl ${itemFont} transition-all text-left ${navItemCls}`}
        >
          <LayoutGrid
            size={iconSize}
            className={`shrink-0 ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}
          />
          <span className="truncate">{isThai ? "ศูนย์รวมโมดูล" : "Module Hub"}</span>
        </button>

        {/* ── Control Panel (admin only) ── */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => goTo("controlpanel", "/controlpanel")}
            className={`w-full flex items-center gap-3 ${itemPad} rounded-xl ${itemFont} transition-all text-left ${navItemCls}`}
          >
            <Monitor
              size={iconSize}
              className={`shrink-0 ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}
            />
            <span className="truncate flex-1">{isThai ? "แผงควบคุมระบบ" : "Control Panel"}</span>
          </button>
        )}

        {/* ── Divider ── */}
        <div className={`my-1 ${dividerCls}`} />

        {/* ── Theme ── */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`w-full flex items-center gap-3 ${utilPad} rounded-xl ${utilFont} transition-all text-left ${utilItemCls}`}
        >
          {isLight ? (
            <Moon size={iconSize} className="shrink-0 text-[#222222]" />
          ) : (
            <Sun size={iconSize} className="shrink-0 text-[#FFFFFF]" />
          )}
          <span className="truncate">
            {isLight
              ? isThai ? "โหมดมืด" : "Dark Mode"
              : isThai ? "โหมดสว่าง" : "Light Mode"}
          </span>
        </button>

        {/* ── Language ── */}
        <button
          type="button"
          onClick={toggleLanguage}
          className={`w-full flex items-center gap-3 ${utilPad} rounded-xl ${utilFont} transition-all text-left ${isLight ? "text-slate-800 hover:bg-[#F4F4F5] hover:text-slate-950 cursor-pointer" : "text-[#F4F4F5] hover:bg-white/10 hover:text-[#FFFFFF] cursor-pointer"}`}
        >
          <Languages
            size={iconSize}
            className={`shrink-0 ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}
          />
          <span className="truncate">{isThai ? "ภาษาไทย" : "English"}</span>
        </button>

        {/* ── Settings ── */}
        <button
          type="button"
          onClick={onSettings}
          className={`w-full flex items-center gap-3 ${utilPad} rounded-xl ${utilFont} transition-all text-left ${isLight ? "text-slate-800 hover:bg-[#F4F4F5] hover:text-slate-950 cursor-pointer" : "text-[#F4F4F5] hover:text-[#FFFFFF] hover:bg-white/10 cursor-pointer"}`}
        >
          <Settings
            size={iconSize}
            className={`shrink-0 ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}
          />
          <span className="truncate flex-1">{isThai ? "การตั้งค่า" : "Settings"}</span>
        </button>

        {/* ── Logout ── */}
        <button
          type="button"
          onClick={async () => {
            onClose();
            await handleLogout();
          }}
          className={`w-full flex items-center gap-3 ${utilPad} rounded-xl ${utilFont} text-red-400 hover:text-red-500 hover:bg-rose-500/10 transition-all text-left cursor-pointer`}
        >
          <LogOut size={iconSize} className="shrink-0" />
          <span className="truncate">{isThai ? "ออกจากระบบ" : "Sign Out"}</span>
        </button>
      </div>

      {/* ── Guard Modal (renders as portal overlay) ── */}
      <ProfileGuardModal
        isOpen={showGuardModal}
        missingFields={missingFields}
        onClose={() => setShowGuardModal(false)}
        onGoToSettings={() => {
          setShowGuardModal(false);
          onClose();
          if (onNavigate) onNavigate("settings");
          else navigateWithLoading(settingsPath || "/settings");
        }}
      />
    </>
  );
}
