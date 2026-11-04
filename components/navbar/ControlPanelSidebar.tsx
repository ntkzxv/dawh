"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  ChevronLeft,
  ChevronUp,
  History,
  Layers,
  LayoutGrid,
  Building2,
  Database,
  Package,
  Power,
  X,
  UserRound,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { DAWH_LOGOS } from "@/config/brand";
import { useLoading } from "@/components/loading_screen";
import { useTheme } from "@/context/ThemeContext";
import { useAccountMenu } from "@/hooks/useAccountMenu";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import type { ControlPanelTab } from "@/components/warehouse/ControlPanelNavigationContext";
import { useControlPanelNavigation } from "@/components/warehouse/ControlPanelNavigationContext";
import {
  getAuditCategoryKey,
  getAuditCategoryLabel,
} from "@/components/warehouse/auditLog";
import DropdownMenu from "./DropdownMenu";
import NavbarsubWarehouse, { type MenuGroup } from "./NavbarsubWarehouse";

const DEFAULT_LOGO_LIGHT_THEME = "/assets/dawh_nospacewight_dark_logo.png";
const DEFAULT_LOGO_DARK_THEME = "/assets/dawh_nospacewight_light_logo.png";
const MINIMIZED_LOGO_LIGHT_THEME = DAWH_LOGOS.square1024.black;
const MINIMIZED_LOGO_DARK_THEME = DAWH_LOGOS.square1024.light;

export default function ControlPanelSidebar({
  isMinimized,
  onMinimizedChange,
  onTabChange,
  mobileOpen = false,
  onMobileClose,
}: {
  isMinimized: boolean;
  onMinimizedChange: (minimized: boolean) => void;
  activeTab: ControlPanelTab;
  onTabChange: (tab: ControlPanelTab) => void;
  mobileOpen?: boolean;
  onMobileClose?: () => void;
}) {
  const router = useRouter();
  const { navigateWithLoading } = useLoading();
  const { theme } = useTheme();
  const accountMenu = useAccountMenu({ settingsPath: "/settings" });
  const account = useOptionalWarehouseAccount();
  const pathname = usePathname();
  const { auditCategories } = useControlPanelNavigation();
  const { isThai } = accountMenu;
  const isLight = theme === "light";
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [accountPopupPosition, setAccountPopupPosition] = useState({ top: 16, left: 90 });
  const accountButtonRef = useRef<HTMLButtonElement | null>(null);
  const accountPopupRef = useRef<HTMLDivElement | null>(null);
  const [logoErrorSource, setLogoErrorSource] = useState<string | null>(null);

  useEffect(() => {
    if (!isAccountOpen || !isMinimized) return;

    const handleOutsideClick = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        !accountPopupRef.current?.contains(target) &&
        !accountButtonRef.current?.contains(target)
      ) {
        setIsAccountOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsAccountOpen(false);
    };
    const handleResize = () => setIsAccountOpen(false);

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [isAccountOpen, isMinimized]);

  const openMinimizedAccountPopup = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (isAccountOpen) {
      setIsAccountOpen(false);
      return;
    }
    const rect = event.currentTarget.getBoundingClientRect();
    const popupHeight = 420;
    const top = Math.max(
      16,
      Math.min(rect.bottom - popupHeight, window.innerHeight - popupHeight - 16),
    );
    const left = Math.max(16, Math.min(rect.right + 10, window.innerWidth - 296));
    setAccountPopupPosition({ top, left });
    setIsAccountOpen(true);
  };

  const currentLogo = isMinimized
    ? isLight
      ? MINIMIZED_LOGO_LIGHT_THEME
      : MINIMIZED_LOGO_DARK_THEME
    : isLight
      ? DEFAULT_LOGO_LIGHT_THEME
      : DEFAULT_LOGO_DARK_THEME;

  const canManageBranches = ["ADMIN", "CEO"].includes(account?.me?.role ?? "");
  const isAdmin = account?.me?.role === "ADMIN";
  const menuItems: MenuGroup[] = [
    {
      id: "users-management",
      title: isThai ? "จัดการผู้ใช้" : "Users Management",
      icon: UserRound,
      path: "/controlpanel/users",
    },
    ...(isAdmin ? [{
      id: "module-status",
      title: isThai ? "สถานะโมดูล" : "Module status",
      icon: Power,
      path: "/controlpanel/module-status",
    }] : []),
    {
      id: "master-data",
      title: isThai ? "ข้อมูลหลัก" : "Master Data",
      icon: Database,
      children: [
        { label: isThai ? "สินค้า" : "Products", path: "/controlpanel/products", icon: Package },
        ...(canManageBranches ? [{ label: isThai ? "สาขา" : "Branches", path: "/controlpanel/branches", icon: Building2 }] : []),
      ],
    },
    {
      id: "audit",
      title: isThai ? "บันทึกและตรวจสอบ" : "Audit & Logs",
      icon: History,
      children: canManageBranches ? auditCategories.map((category) => {
        const key = getAuditCategoryKey(category);
        return {
          label: getAuditCategoryLabel(category, isThai),
          path: `/controlpanel/audit-log/${key}`,
          icon: History,
        };
      }) : [],
    },
  ].filter((group) => group.path || group.children?.length);

  const handleToggleMinimize = () => {
    const next = !isMinimized;
    onMinimizedChange(next);
    setIsAccountOpen(false);
  };

  const navigateControlPanel = (path: string) => {
    const nextTab: ControlPanelTab = path.startsWith("/controlpanel/audit-log/")
      ? "audit"
      : path === "/controlpanel/users" ? "members"
        : path === "/controlpanel/products" ? "master-data"
        : path === "/controlpanel/branches" ? "branches"
          : path === "/controlpanel/access-preview" ? "security"
            : path === "/controlpanel/user-scopes" ? "scopes"
              : path === "/controlpanel/account-status" ? "account-status"
                : path === "/controlpanel/module-status" ? "module-status"
                : "master-data";
    onTabChange(nextTab);
    onMobileClose?.();
    if (pathname !== path) router.push(path);
  };

  return (
    <>
      <aside
        aria-label={isThai ? "แถบด้านข้างแผงควบคุม" : "Control Panel sidebar"}
        className={`${
          mobileOpen
            ? "fixed inset-y-0 left-0 z-[60] flex h-dvh w-[min(86vw,18rem)] shadow-2xl md:sticky md:top-0 md:z-40 md:h-dvh"
            : "sticky top-0 hidden h-dvh md:flex"
        } shrink-0 flex-col transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] z-40 ${
          !mobileOpen && isMinimized ? "w-20 overflow-visible" : "w-64 overflow-hidden"
        } ${
          isLight
            ? "bg-[#FFFFFF] text-[#222222] border-r border-[#E4E4E7] shadow-xs"
            : "bg-[#222222] text-[#FFFFFF] border-r border-[#444444]"
        }`}
      >
        {/* Mobile Top Safe Area Inset */}
        <div className="pt-safe" />

        {/* ======================================================== */}
        {/* Sidebar logo */}
        {/* ======================================================== */}
        <div className={`flex flex-col items-center justify-center w-full overflow-hidden shrink-0 px-2.5 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${isMinimized ? "h-[88px]" : "h-[80px]"}`}>
          <div
            className={`relative flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isMinimized ? "w-[38px] h-[38px]" : "w-full h-[39px] scale-95"
            }`}
          >
            {currentLogo && logoErrorSource !== currentLogo ? (
              <Image
                src={currentLogo}
                alt="Logo"
                fill
                priority
                sizes="(max-width: 768px) 38px, 150px"
                className={`object-contain transition-opacity duration-300 ${
                  isMinimized ? "p-0.5" : "p-0"
                }`}
                onError={() => setLogoErrorSource(currentLogo)}
              />
            ) : (
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex items-center justify-center rounded-xl font-bold shadow-sm shrink-0 transition-all duration-300 ${
                    isMinimized ? "h-8 w-8" : "h-9 w-9"
                  } ${
                    isLight
                      ? "bg-[#222222] text-[#FFFFFF]"
                      : "bg-[#FFFFFF] text-[#222222]"
                  }`}
                >
                  <Layers className={isMinimized ? "h-4 w-4" : "h-5 w-5"} />
                </div>
                <span
                  className={`font-extrabold text-2xl tracking-tight whitespace-nowrap overflow-hidden transition-all ease-out ${
                    isLight ? "text-[#222222]" : "text-[#FFFFFF]"
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

        {mobileOpen && (
          <button
            type="button"
            onClick={onMobileClose}
            aria-label={isThai ? "ปิดเมนู" : "Close menu"}
            className="absolute right-3 top-7 rounded-lg p-2 text-current hover:bg-black/5 dark:hover:bg-white/10 md:hidden"
          >
            <X size={18} />
          </button>
        )}

        {/* Smooth Divider below Logo */}
        <div
          className={`w-full transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] border-b mb-2 ${
            isLight ? "border-[#E4E4E7]" : "border-[#444444]"
          } ${isMinimized ? "opacity-60" : "opacity-100"}`}
        />

        {/* SUB NAVBAR AREA */}
        <div className={`relative flex-1 px-3 w-full transition-all duration-700 no-scrollbar ${isMinimized ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"}`} style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}>
          {!isMinimized && (
            <p className={`px-1 pt-2 text-[11px] font-semibold ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
              {isThai ? "เมนูแผงควบคุม" : "Control Panel"}
            </p>
          )}
          <NavbarsubWarehouse
            isMinimized={isMinimized}
            lang={isThai ? "th" : "en"}
            menuItems={menuItems}
            onNavigate={navigateControlPanel}
          />
          <AnimatePresence>
            {isAccountOpen && !isMinimized && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                aria-hidden="true"
                onClick={() => setIsAccountOpen(false)}
                className={`absolute inset-0 z-20 backdrop-blur-[3px] ${
                  isLight ? "bg-white/20" : "bg-[#222222]/20"
                }`}
              />
            )}
          </AnimatePresence>
        </div>

        {/* ACCOUNT & CONTROL AREA */}
        <div
          className={`px-3 pt-5 pb-2.5 mt-auto w-full shrink-0 border-t space-y-2 transition-colors duration-700 ${
            isLight
              ? "bg-[#FFFFFF] border-[#E4E4E7]"
              : "bg-[var(--input-bg)] border-[#383838]"
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
                  "/workspace",
                  isThai ? "กำลังเปิดศูนย์รวมโมดูล..." : "Opening workspace hub...",
                  isThai ? "กำลังโหลดโมดูลและสิทธิ์การใช้งาน..." : "Loading modules and access permissions...",
                )
              }
              className={`flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group cursor-pointer overflow-hidden ${
                isLight
                  ? "bg-[#FFFFFF] border-[#E4E4E7] text-[#222222] hover:bg-[#F1F5F9]"
                  : "bg-[#383838] border-[#444444] text-[#FFFFFF] hover:bg-[#444444]"
              } ${
                isMinimized
                  ? "w-10 h-10 aspect-square mx-auto rounded-xl p-0 border"
                  : "flex-1 h-9 px-3 rounded-xl border gap-2 active:scale-95 text-center"
              }`}
              title={isThai ? "ศูนย์รวมโมดูล" : "Module Hub"}
            >
              <div
                className={`shrink-0 flex items-center justify-center overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isMinimized ? "w-8 h-8" : "w-4.5 h-4.5"
                }`}
              >
                <LayoutGrid
                  size={16}
                  className={`group-hover:rotate-90 transition-transform duration-500 shrink-0 ${
                    isLight
                      ? "text-[#222222] group-hover:text-black"
                      : "text-[#FFFFFF] group-hover:text-white"
                  }`}
                />
              </div>

              <div
                className={`flex items-center justify-center overflow-hidden transition-all duration-300 ease-out ${
                  isMinimized
                    ? "max-w-0 opacity-0 -translate-x-3 duration-200 pointer-events-none"
                    : "max-w-[140px] opacity-100 translate-x-0 duration-350 delay-100"
                }`}
              >
                <span className="text-[13.5px] font-semibold leading-none tracking-wide truncate whitespace-nowrap text-center">
                  {isThai ? "ศูนย์รวมโมดูล" : "Module Hub"}
                </span>
              </div>
            </button>

            {/* Minimize / Expand Button */}
            <button
              type="button"
              onClick={handleToggleMinimize}
              className={`flex items-center justify-center rounded-xl border transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] active:scale-75 cursor-pointer shrink-0 ${
                isLight
                  ? "border-[#E4E4E7] bg-[#FFFFFF] text-[#222222] hover:bg-[#F1F5F9]"
                  : "border-[#444444] bg-[#383838] text-[#E4E4E7] hover:border-white/30 hover:text-[#FFFFFF]"
              } ${isMinimized ? "w-10 h-10 aspect-square" : "h-9 w-9"}`}
              title={isThai ? "ย่อ/ขยายแถบด้านข้าง" : "Collapse/expand sidebar"}
              aria-label={isThai ? "ย่อ/ขยายแถบด้านข้าง" : "Collapse/expand sidebar"}
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
              } ${
                isMinimized
                  ? "w-6 opacity-100 mb-2 scale-x-100"
                  : "w-0 opacity-0 mb-0 scale-x-0"
              }`}
            />

            {/* Main Account Button */}
            <button
              ref={accountButtonRef}
              type="button"
              onClick={(event) =>
                isMinimized
                  ? openMinimizedAccountPopup(event)
                  : setIsAccountOpen((open) => !open)
              }
              className={`flex items-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden cursor-pointer ${
                isLight
                  ? "bg-[#FFFFFF] border-[#E4E4E7] text-[#222222] hover:bg-[#F1F5F9]"
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
                    ? "bg-[#F1F5F9] border-[#E4E4E7] text-[#222222]"
                    : "bg-white/10 text-[#FFFFFF] border-white/20"
                }`}
              >
                {accountMenu.mounted && accountMenu.profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={accountMenu.profile.avatar_url}
                    alt={accountMenu.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="font-bold text-xs">
                    {accountMenu.initials || "U"}
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
                    isLight ? "text-[#222222]" : "text-[#FFFFFF]"
                  }`}
                >
                  {accountMenu.fullName || (isThai ? "บัญชีผู้ใช้" : "User account")}
                </p>
                <p
                  className={`text-[11.5px] truncate leading-tight mt-0.5 ${
                    isLight ? "text-[#383838]" : "text-[var(--text-secondary)]"
                  }`}
                >
                  {accountMenu.accountSubtitle}
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
                  } ${isLight ? "text-[#383838]" : "text-[var(--text-secondary)]"}`}
                />
              </div>
            </button>

            {/* Expandable Account Actions Dropdown with framer-motion */}
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
                        : "bg-[var(--cards)] border-[#444444]"
                    }`}
                  >
                    <DropdownMenu
                      {...accountMenu}
                      onClose={() => setIsAccountOpen(false)}
                      variant="inline"
                      redLogoutInLight
                      settingsPath="/settings"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <AnimatePresence>
              {isAccountOpen && isMinimized && (
                <motion.div
                  ref={accountPopupRef}
                  initial={{ opacity: 0, scale: 0.96, x: -6 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.96, x: -6 }}
                  transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  style={{
                    position: "fixed",
                    top: accountPopupPosition.top,
                    left: accountPopupPosition.left,
                    zIndex: 9999,
                  }}
                  className={`w-[280px] rounded-2xl border p-2 shadow-[0_12.5px_25px_-6px_rgba(0,0,0,0.125)] ${
                    isLight
                      ? "border-[#E4E4E7] bg-white text-[#222222]"
                      : "border-[#444444] bg-[var(--cards)] text-white"
                  }`}
                >
                  <DropdownMenu
                    {...accountMenu}
                    onClose={() => setIsAccountOpen(false)}
                    variant="popup"
                    redLogoutInLight
                    closeOnPreferenceChange={isMinimized}
                    settingsPath="/settings"
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Bottom Safe Area Inset */}
          <div className="pb-safe" />
        </div>
      </aside>

    </>
  );
}
