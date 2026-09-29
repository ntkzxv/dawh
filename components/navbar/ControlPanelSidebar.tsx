"use client";

import Image from "next/image";
import { useState, useRef, useEffect, type ElementType } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  History,
  Layers,
  LayoutGrid,
  Users,
  X,
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

const DEFAULT_LOGO_LIGHT_THEME = "/assets/dawh_nospacewight_dark_logo.png";
const DEFAULT_LOGO_DARK_THEME = "/assets/dawh_nospacewight_light_logo.png";
const MINIMIZED_LOGO_LIGHT_THEME = DAWH_LOGOS.square1024.black;
const MINIMIZED_LOGO_DARK_THEME = DAWH_LOGOS.square1024.light;

export default function ControlPanelSidebar({
  isMinimized,
  onMinimizedChange,
  activeTab,
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
  const selectedAuditCategory = pathname.split("/").at(-1);

  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [isAuditExpanded, setIsAuditExpanded] = useState(activeTab === "audit");
  const [isAuditCollapsedOnRoute, setIsAuditCollapsedOnRoute] = useState(false);
  const [logoErrorSource, setLogoErrorSource] = useState<string | null>(null);

  // Floating Sub Sidebar (Flyout when minimized)
  const [activePopupAudit, setActivePopupAudit] = useState(false);
  const [popupCoords, setPopupCoords] = useState({ top: 0, left: 0 });
  const popupRef = useRef<HTMLDivElement>(null);
  const auditButtonRef = useRef<HTMLButtonElement>(null);

  const isAuditRoute = pathname.startsWith("/controlpanel/audit-log/");
  const auditExpanded = isAuditRoute ? !isAuditCollapsedOnRoute : isAuditExpanded;

  const currentLogo = isMinimized
    ? isLight
      ? MINIMIZED_LOGO_LIGHT_THEME
      : MINIMIZED_LOGO_DARK_THEME
    : isLight
      ? DEFAULT_LOGO_LIGHT_THEME
      : DEFAULT_LOGO_DARK_THEME;

  useEffect(() => {
    setLogoErrorSource(null);
  }, [currentLogo]);

  // Click outside to close minimized flyout
  useEffect(() => {
    if (!activePopupAudit) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (popupRef.current && popupRef.current.contains(target)) return;
      if (auditButtonRef.current && auditButtonRef.current.contains(target)) return;
      setActivePopupAudit(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePopupAudit(false);
    };

    const handleResize = () => setActivePopupAudit(false);

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", handleResize);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleResize);
    };
  }, [activePopupAudit]);

  const tabs: Array<{
    label: string;
    id: ControlPanelTab;
    icon: ElementType;
    visible: boolean;
  }> = [
    {
      label: isThai ? "สมาชิก" : "Members",
      id: "members",
      icon: Users,
      visible: true,
    },
    {
      label: isThai ? "ข้อมูลองค์กร" : "Organization",
      id: "org",
      icon: Building2,
      visible: ["ADMIN", "CEO", "MANAGER"].includes(account?.me?.role ?? ""),
    },
    {
      label: isThai ? "บันทึกการตรวจสอบ" : "Audit Log",
      id: "audit",
      icon: History,
      visible: ["ADMIN", "CEO"].includes(account?.me?.role ?? ""),
    },
  ];

  const handleToggleMinimize = () => {
    const next = !isMinimized;
    onMinimizedChange(next);
    setIsAccountOpen(false);
    setActivePopupAudit(false);
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
        <div className="flex flex-col items-center justify-center w-full overflow-hidden shrink-0 h-[88px] px-2.5 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]">
          <div
            className={`relative flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isMinimized ? "w-[38px] h-[38px]" : "w-full h-[39px]"
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
          className={`mx-4 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] border-b mb-2 ${
            isLight ? "border-[#E4E4E7]" : "border-[#444444]"
          } ${isMinimized ? "opacity-60 scale-x-60" : "opacity-100 scale-x-100"}`}
        />

        {/* SUB NAVBAR AREA */}
        <nav
          aria-label={isThai ? "เมนูแผงควบคุม" : "Control Panel navigation"}
          className={`flex-1 px-3 w-full transition-all duration-700 no-scrollbar ${
            isMinimized ? "overflow-visible" : "overflow-y-auto overflow-x-hidden"
          }`}
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          <div className="w-full space-y-1.5 py-2 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]">
            <p
              className={`px-1 text-[11px] font-semibold transition-all ease-out ${
                isLight ? "text-slate-500" : "text-zinc-400"
              } ${
                isMinimized
                  ? "max-h-0 opacity-0 mb-0 -translate-x-2 pointer-events-none duration-200"
                  : "max-h-6 opacity-100 mb-2 translate-x-0 duration-300"
              }`}
            >
              {isThai ? "การจัดการ" : "Management"}
            </p>

            {tabs
              .filter((tab) => tab.visible)
              .map(({ label, id, icon: Icon }) => {
                const selected = activeTab === id;
                const auditTab = id === "audit";
                const isPopupOpen = auditTab && activePopupAudit;

                // Case 1: Simple tab item without sub-items (members, org)
                if (!auditTab) {
                  return (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-label={label}
                      title={isMinimized ? label : undefined}
                      onClick={() => {
                        onTabChange(id);
                        onMobileClose?.();
                        if (isAuditRoute) router.push("/controlpanel");
                      }}
                      className={`group relative rounded-xl border transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center overflow-hidden cursor-pointer outline-none focus:outline-none select-none ${
                        isMinimized
                          ? "w-12 h-12 justify-center mx-auto px-0"
                          : "w-full px-3.5 py-2.5 gap-3"
                      } ${
                        selected
                          ? isLight
                            ? "bg-[#F4F4F5] text-[#222222] border-[#E4E4E7] font-semibold"
                            : "bg-[#383838]/80 text-[#FFFFFF] border-[#444444]/60 font-semibold"
                          : isLight
                          ? "border-transparent text-[#2C2C2C] hover:bg-[#F4F4F5] hover:text-[#222222]"
                          : "border-transparent text-[#F4F4F5] hover:bg-[#383838]/60 hover:text-[#FFFFFF]"
                      }`}
                    >
                      <Icon
                        size={18}
                        className={`${
                          selected
                            ? isLight
                              ? "text-[#222222]"
                              : "text-[#FFFFFF]"
                            : isLight
                            ? "text-[#2C2C2C] group-hover:text-[#222222]"
                            : "text-[#E4E4E7] group-hover:text-[#FFFFFF]"
                        } shrink-0 transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
                        aria-hidden="true"
                      />

                      <span
                        className={`text-[13.5px] font-medium leading-tight text-left whitespace-nowrap overflow-hidden transition-all ease-out ${
                          selected
                            ? isLight
                              ? "text-[#222222] font-semibold"
                              : "text-[#FFFFFF] font-semibold"
                            : isLight
                            ? "text-[#2C2C2C] group-hover:text-[#222222]"
                            : "text-[#E4E4E7] group-hover:text-[#FFFFFF]"
                        } ${
                          isMinimized
                            ? "max-w-0 opacity-0 -translate-x-3 duration-200 pointer-events-none"
                            : "max-w-[170px] opacity-100 translate-x-0 duration-350 delay-100"
                        }`}
                      >
                        {label}
                      </span>

                      {/* Side line indicator when expanded */}
                      {!isMinimized && (
                        <div className="flex items-center justify-center w-4 shrink-0 ml-auto mr-[-3px]">
                          <span
                            className={`w-[2.5px] h-[13px] rounded-full shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                              isLight ? "bg-[#222222]" : "bg-white"
                            } ${
                              selected
                                ? "opacity-100 scale-y-100"
                                : "opacity-0 scale-y-50 pointer-events-none"
                            }`}
                          />
                        </div>
                      )}

                      {/* Bottom line indicator when minimized */}
                      {isMinimized && (
                        <span
                          className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-[2.5px] rounded-full shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                            isLight ? "bg-[#222222]" : "bg-white"
                          } ${
                            selected
                              ? "opacity-100 scale-x-100"
                              : "opacity-0 scale-x-50 pointer-events-none"
                          }`}
                        />
                      )}
                    </button>
                  );
                }

                // Case 2: Audit Log tab with sub-categories (Accordion + Minimized Flyout)
                return (
                  <div key={id} className="w-full flex flex-col">
                    <button
                      ref={auditButtonRef}
                      type="button"
                      role="tab"
                      aria-selected={selected}
                      aria-expanded={auditExpanded}
                      aria-label={label}
                      title={isMinimized ? label : undefined}
                      onClick={(e) => {
                        if (isMinimized) {
                          if (activePopupAudit) {
                            setActivePopupAudit(false);
                            return;
                          }
                          const rect = e.currentTarget.getBoundingClientRect();
                          const popupEstimatedHeight = auditCategories.length * 40 + 20;
                          const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;
                          let top = rect.top;
                          if (top + popupEstimatedHeight > windowHeight - 16) {
                            top = Math.max(16, windowHeight - popupEstimatedHeight - 16);
                          }
                          setPopupCoords({ top, left: rect.right + 10 });
                          setActivePopupAudit(true);
                          return;
                        }

                        // Expanded sidebar: only toggle accordion dropdown without navigating
                        if (isAuditRoute) {
                          setIsAuditCollapsedOnRoute((collapsed) => !collapsed);
                        } else {
                          setIsAuditExpanded((expanded) => !expanded);
                        }
                      }}
                      className={`group relative rounded-xl border transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center justify-between overflow-hidden cursor-pointer outline-none focus:outline-none select-none ${
                        isMinimized
                          ? "w-12 h-12 justify-center mx-auto px-0"
                          : "w-full px-3.5 py-2.5 gap-3"
                      } ${
                        isPopupOpen
                          ? isLight
                            ? "bg-[#E4E4E7] text-[#222222] border-[#D4D4D8]"
                            : "bg-[#383838] text-[#FFFFFF] border-[#555555]"
                          : selected
                          ? isLight
                            ? "bg-[#F4F4F5] text-[#222222] border-[#E4E4E7] font-semibold"
                            : "bg-[#383838]/80 text-[#FFFFFF] border-[#444444]/60 font-semibold"
                          : isLight
                          ? "border-transparent text-[#2C2C2C] hover:bg-[#F4F4F5] hover:text-[#222222]"
                          : "border-transparent text-[#F4F4F5] hover:bg-[#383838]/60 hover:text-[#FFFFFF]"
                      }`}
                    >
                      <div
                        className={`flex items-center ${
                          isMinimized ? "justify-center" : "gap-3"
                        } min-w-0`}
                      >
                        <Icon
                          size={18}
                          className={`${
                            isPopupOpen || selected
                              ? isLight
                                ? "text-[#222222]"
                                : "text-[#FFFFFF]"
                              : isLight
                              ? "text-[#2C2C2C] group-hover:text-[#222222]"
                              : "text-[#E4E4E7] group-hover:text-[#FFFFFF]"
                          } shrink-0 transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
                          aria-hidden="true"
                        />

                        <span
                          className={`text-[13.5px] font-medium leading-tight text-left whitespace-nowrap overflow-hidden transition-all ease-out ${
                            isPopupOpen || selected
                              ? isLight
                                ? "text-[#222222] font-semibold"
                                : "text-[#FFFFFF] font-semibold"
                              : isLight
                              ? "text-[#2C2C2C] group-hover:text-[#222222]"
                              : "text-[#E4E4E7] group-hover:text-[#FFFFFF]"
                          } ${
                            isMinimized
                              ? "max-w-0 opacity-0 -translate-x-3 duration-200 pointer-events-none"
                              : "max-w-[150px] opacity-100 translate-x-0 duration-350 delay-100"
                          }`}
                        >
                          {label}
                        </span>
                      </div>

                      {/* Accordion Chevron Indicator */}
                      {!isMinimized && (
                        <div className="flex items-center justify-center shrink-0">
                          <ChevronDown
                            size={16}
                            className={`shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                              isLight ? "text-slate-600" : "text-[#E4E4E7]"
                            } ${auditExpanded ? "rotate-180" : "rotate-0"}`}
                            aria-hidden="true"
                          />
                        </div>
                      )}

                      {/* Indicator when sidebar is minimized */}
                      {isMinimized && (
                        <span
                          className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-[2.5px] rounded-full shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                            isLight ? "bg-[#222222]" : "bg-white"
                          } ${
                            selected
                              ? "opacity-100 scale-x-100"
                              : "opacity-0 scale-x-50 pointer-events-none"
                          }`}
                        />
                      )}
                    </button>

                    {/* Accordion Sub-items (Grid animation identical to warehouse sidebar) */}
                    {!isMinimized && (
                      <div
                        className={`grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                          auditExpanded
                            ? "grid-rows-[1fr] opacity-100 mt-1 mb-1"
                            : "grid-rows-[0fr] opacity-0 mt-0 mb-0 pointer-events-none"
                        }`}
                      >
                        <div className="overflow-hidden">
                          <div
                            className={`ml-5 pl-3 border-l space-y-1 py-1 transition-colors ${
                              isLight ? "border-[#E4E4E7]" : "border-[#444444]"
                            }`}
                          >
                            {auditCategories.map((category) => {
                              const key = getAuditCategoryKey(category);
                              const isSubActive = isAuditRoute && selectedAuditCategory === key;

                              return (
                                <Link
                                  key={key}
                                  href={`/controlpanel/audit-log/${key}`}
                                  aria-current={isSubActive ? "page" : undefined}
                                  onClick={() => {
                                    onTabChange("audit");
                                    onMobileClose?.();
                                  }}
                                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left border transition-all duration-200 cursor-pointer outline-none focus:outline-none select-none ${
                                    isSubActive
                                      ? isLight
                                        ? "bg-[#222222] text-[#FFFFFF] border-[#222222] shadow-sm font-semibold"
                                        : "bg-[#383838] text-white border-[#555555] shadow-sm font-semibold"
                                      : isLight
                                      ? "border-transparent text-[#2C2C2C] hover:text-[#222222] hover:bg-[#F4F4F5] font-normal"
                                      : "border-transparent text-[#E4E4E7] hover:text-[#FFFFFF] hover:bg-white/5 font-normal"
                                  }`}
                                >
                                  <span className="text-[13px] font-medium leading-tight truncate">
                                    {getAuditCategoryLabel(category, isThai)}
                                  </span>

                                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                                    <span
                                      className={`w-[2px] h-[11px] rounded-full shrink-0 transition-all duration-300 ${
                                        isSubActive
                                          ? "bg-white opacity-100 scale-y-100"
                                          : "opacity-0 scale-y-50 pointer-events-none"
                                      }`}
                                    />
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </nav>

        {/* ACCOUNT & CONTROL AREA */}
        <div
          className={`px-3 pt-5 pb-2.5 mt-auto w-full shrink-0 border-t space-y-2 transition-colors duration-700 ${
            isLight
              ? "bg-[#FFFFFF] border-[#E4E4E7]"
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
                  "/workspace",
                  "กำลังเปิดศูนย์รวมโมดูล...",
                  "กำลังโหลดโมดูลและสิทธิ์การใช้งาน...",
                )
              }
              className={`flex items-center justify-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group cursor-pointer overflow-hidden ${
                isLight
                  ? "bg-[#FFFFFF] border-[#E4E4E7] text-[#222222] hover:bg-[#F4F4F5]"
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
                  ? "border-[#E4E4E7] bg-[#FFFFFF] text-[#2C2C2C] hover:bg-[#F4F4F5]"
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
              type="button"
              onClick={() =>
                isMinimized
                  ? handleToggleMinimize()
                  : setIsAccountOpen((open) => !open)
              }
              className={`flex items-center transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] overflow-hidden cursor-pointer ${
                isLight
                  ? "bg-[#FFFFFF] border-[#E4E4E7] text-[#222222] hover:bg-[#F4F4F5]"
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
                    ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]"
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
                    isLight ? "text-[#383838]" : "text-[#D4D4D8]"
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
                  } ${isLight ? "text-[#383838]" : "text-[#D4D4D8]"}`}
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
                        : "bg-[#282828] border-[#444444]"
                    }`}
                  >
                    <DropdownMenu
                      {...accountMenu}
                      onClose={() => setIsAccountOpen(false)}
                      variant="inline"
                      settingsPath="/settings"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Mobile Bottom Safe Area Inset */}
          <div className="pb-safe" />
        </div>
      </aside>

      {/* Floating Sub Sidebar for Audit Log when sidebar is minimized */}
      <AnimatePresence>
        {isMinimized && activePopupAudit && (
          <motion.div
            ref={popupRef}
            initial={{ opacity: 0, scale: 0.96, x: -6 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.96, x: -6 }}
            transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
            style={{
              position: "fixed",
              top: `${popupCoords.top}px`,
              left: `${popupCoords.left}px`,
              zIndex: 9999,
            }}
            className={`w-[210px] sm:w-[230px] rounded-2xl border shadow-2xl p-1.5 backdrop-blur-2xl select-none transition-colors ${
              isLight
                ? "bg-white/95 border-slate-200/90 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.14)]"
                : "bg-[#252525]/95 border-[#444444] text-white shadow-[0_25px_60px_rgba(0,0,0,0.7)]"
            }`}
          >
            <div className="space-y-1 max-h-[380px] overflow-y-auto no-scrollbar py-0.5">
              <div className="px-2.5 py-1 text-[11px] font-semibold text-slate-500 dark:text-zinc-400 border-b border-slate-200/60 dark:border-white/10 mb-1">
                {isThai ? "บันทึกการตรวจสอบ" : "Audit Log"}
              </div>
              {auditCategories.map((category) => {
                const key = getAuditCategoryKey(category);
                const isSubActive = isAuditRoute && selectedAuditCategory === key;

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => {
                      setActivePopupAudit(false);
                      onTabChange("audit");
                      router.push(`/controlpanel/audit-log/${key}`);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left border transition-colors duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] group/item cursor-pointer outline-none focus:outline-none select-none ${
                      isSubActive
                        ? isLight
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-[#383838] text-white border-[#555555] shadow-sm"
                        : isLight
                        ? "border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                        : "border-transparent text-[#E4E4E7] hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <span className="text-[13px] font-medium leading-tight truncate">
                      {getAuditCategoryLabel(category, isThai)}
                    </span>
                    <span
                      className={`w-[2px] h-[11px] rounded-full shrink-0 transition-all duration-300 ${
                        isSubActive
                          ? "bg-white opacity-100 scale-y-100"
                          : "opacity-0 scale-y-50 pointer-events-none"
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
