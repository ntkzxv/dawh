"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Users,
  Shield,
  Building2,
  Building,
  Package,
  Activity,
  ShieldAlert,
  ScrollText,
  ChevronDown,
  Layers,
  Scale,
  FileQuestion,
  UserCheck,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import type {
  AdminTabKey,
  AuditLogCategoryKey,
  ProductSubTabKey,
  RoleSubTabKey,
} from "@/components/controlpanel/types";
import { motion, AnimatePresence } from "framer-motion";

export interface NavbarsubControlPanelProps {
  activeTab?: AdminTabKey;
  onTabChange?: (
    tab: AdminTabKey,
    category?: AuditLogCategoryKey | ProductSubTabKey | RoleSubTabKey
  ) => void;
  activeAuditCategory?: AuditLogCategoryKey;
  activeProductSubTab?: ProductSubTabKey;
  activeRoleSubTab?: RoleSubTabKey;
  isMinimized?: boolean;
  lang?: "th" | "en";
  counts?: Partial<Record<AdminTabKey, number>> & { audit_logs?: number };
  auditCategoryCounts?: Partial<Record<AuditLogCategoryKey, number>>;
  productCategoryCounts?: Partial<Record<ProductSubTabKey, number>>;
}

interface SubMenuItem {
  id: string;
  titleTh: string;
  titleEn: string;
  icon: React.ElementType;
}

interface MenuGroup {
  id: string;
  tabKey?: AdminTabKey;
  titleTh: string;
  titleEn: string;
  icon: React.ElementType;
  children?: SubMenuItem[];
}

const CONTROL_PANEL_ITEMS: MenuGroup[] = [
  {
    id: "users",
    tabKey: "users",
    titleTh: "การจัดการผู้ใช้",
    titleEn: "User Management",
    icon: Users,
  },
  {
    id: "roles",
    tabKey: "roles",
    titleTh: "บทบาทและสิทธิ์",
    titleEn: "Role Management",
    icon: Shield,
    children: [
      {
        id: "assignments",
        titleTh: "การมอบหมายบทบาท",
        titleEn: "Role Assignments",
        icon: UserCheck,
      },
      {
        id: "roles",
        titleTh: "บทบาทมาตรฐาน",
        titleEn: "Canonical Roles",
        icon: Shield,
      },
      {
        id: "matrix",
        titleTh: "ตารางสิทธิ์",
        titleEn: "Permission Matrix",
        icon: Scale,
      },
      {
        id: "history",
        titleTh: "ประวัติการมอบหมาย",
        titleEn: "Assignment History",
        icon: ScrollText,
      },
    ],
  },
  {
    id: "scopes",
    tabKey: "scopes",
    titleTh: "ขอบเขตสาขา",
    titleEn: "Facility Scope",
    icon: Building2,
  },
  {
    id: "organization",
    tabKey: "organization",
    titleTh: "สาขาและผังคลัง",
    titleEn: "Organization",
    icon: Building,
  },
  {
    id: "products",
    tabKey: "products",
    titleTh: "ข้อมูลสินค้าหลัก",
    titleEn: "Product Master",
    icon: Package,
    children: [
      {
        id: "products",
        titleTh: "ทะเบียนสินค้า",
        titleEn: "Products",
        icon: Package,
      },
      {
        id: "categories",
        titleTh: "หมวดหมู่สินค้า",
        titleEn: "Categories",
        icon: Layers,
      },
      {
        id: "brands_uoms",
        titleTh: "แบรนด์และหน่วยนับ",
        titleEn: "Brands & UOM",
        icon: Scale,
      },
      {
        id: "reasons",
        titleTh: "รหัสเหตุผล",
        titleEn: "Reason Codes",
        icon: FileQuestion,
      },
    ],
  },
  {
    id: "stock",
    tabKey: "stock",
    titleTh: "ติดตามสต็อก",
    titleEn: "Stock Monitoring",
    icon: Activity,
  },
  {
    id: "safety_stock",
    tabKey: "safety_stock",
    titleTh: "เกณฑ์สต็อกปลอดภัย",
    titleEn: "Safety Stock Rules",
    icon: ShieldAlert,
  },
  {
    id: "audit",
    tabKey: "audit_logs",
    titleTh: "บันทึกประวัติระบบ",
    titleEn: "Audit Trails",
    icon: ScrollText,
    children: [
      {
        id: "all",
        titleTh: "ทั้งหมด",
        titleEn: "All Activity",
        icon: ScrollText,
      },
      {
        id: "security",
        titleTh: "ความปลอดภัยและสิทธิ์",
        titleEn: "Security & RBAC",
        icon: Shield,
      },
      {
        id: "organization",
        titleTh: "โครงสร้างและผังคลัง",
        titleEn: "Facility & Topology",
        icon: Building,
      },
      {
        id: "products",
        titleTh: "สินค้าและข้อมูลหลัก",
        titleEn: "Product Master",
        icon: Package,
      },
      {
        id: "inventory",
        titleTh: "คลังและเกณฑ์สต็อก",
        titleEn: "Stock & Rules",
        icon: Activity,
      },
    ],
  },
];

export default function NavbarsubControlPanel({
  activeTab = "users",
  onTabChange,
  activeAuditCategory = "all",
  activeProductSubTab = "products",
  activeRoleSubTab = "assignments",
  isMinimized = false,
  lang: propLang,
  counts = {},
  auditCategoryCounts = {},
  productCategoryCounts = {},
}: NavbarsubControlPanelProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const normalizedLang = (propLang ?? (appLang?.toLowerCase() === "en" ? "en" : "th")) as "en" | "th";
  const isThai = normalizedLang === "th";

  // Track accordion expand state for dropdown groups
  const [expandedDropdowns, setExpandedDropdowns] = useState<Record<string, boolean>>({
    roles: activeTab === "roles",
    products: activeTab === "products",
    audit: activeTab === "audit_logs",
  });

  // Track active popup for minimized sidebar
  const [activePopupId, setActivePopupId] = useState<string | null>(null);
  const [popupCoords, setPopupCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const popupRef = useRef<HTMLDivElement | null>(null);

  // Auto-expand accordion when activeTab changes
  useEffect(() => {
    if (activeTab === "roles") {
      setExpandedDropdowns((prev) => ({ ...prev, roles: true }));
    } else if (activeTab === "products") {
      setExpandedDropdowns((prev) => ({ ...prev, products: true }));
    } else if (activeTab === "audit_logs") {
      setExpandedDropdowns((prev) => ({ ...prev, audit: true }));
    }
  }, [activeTab]);

  // Handle outside click to close minimized flyout popup
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        popupRef.current &&
        !popupRef.current.contains(target) &&
        activePopupId &&
        triggerRefs.current[activePopupId] &&
        !triggerRefs.current[activePopupId]?.contains(target)
      ) {
        setActivePopupId(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePopupId(null);
      }
    };

    if (activePopupId) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("touchstart", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activePopupId]);

  const handleDropdownToggle = (itemId: string, itemTabKey?: AdminTabKey) => {
    if (isMinimized) {
      const btn = triggerRefs.current[itemId];
      if (btn) {
        const rect = btn.getBoundingClientRect();
        setPopupCoords({
          top: Math.max(10, rect.top - 10),
          left: rect.right + 10,
        });
      }
      setActivePopupId((prev) => (prev === itemId ? null : itemId));
    } else {
      setExpandedDropdowns((prev) => ({
        ...prev,
        [itemId]: !prev[itemId],
      }));
      if (itemTabKey && activeTab !== itemTabKey) {
        if (itemTabKey === "roles") {
          onTabChange?.("roles", activeRoleSubTab ?? "assignments");
        } else if (itemTabKey === "products") {
          onTabChange?.("products", activeProductSubTab);
        } else if (itemTabKey === "audit_logs") {
          onTabChange?.("audit_logs", activeAuditCategory);
        } else {
          onTabChange?.(itemTabKey);
        }
      }
    }
  };

  const handleSubItemClick = (groupId: string, subId: string) => {
    if (groupId === "roles") {
      onTabChange?.("roles", subId as RoleSubTabKey);
    } else if (groupId === "products") {
      onTabChange?.("products", subId as ProductSubTabKey);
    } else if (groupId === "audit") {
      onTabChange?.("audit_logs", subId as AuditLogCategoryKey);
    }
    setActivePopupId(null);
  };

  const isSubItemActive = (groupId: string, subId: string): boolean => {
    if (groupId === "roles") {
      return activeTab === "roles" && (activeRoleSubTab ?? "assignments") === subId;
    }
    if (groupId === "products") {
      return activeTab === "products" && activeProductSubTab === subId;
    }
    if (groupId === "audit") {
      return activeTab === "audit_logs" && activeAuditCategory === subId;
    }
    return false;
  };

  return (
    <>
      <nav className="w-full space-y-1.5 py-2 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]">
        {CONTROL_PANEL_ITEMS.map((item) => {
          const Icon = item.icon;
          const hasChildren = Boolean(item.children && item.children.length > 0);
          const isItemActive = item.tabKey === activeTab;
          const title = isThai ? item.titleTh : item.titleEn;
          const count = item.tabKey ? counts[item.tabKey] : undefined;
          const isExpanded = Boolean(expandedDropdowns[item.id]);
          const isPopupOpen = activePopupId === item.id;

          // Case 1: Flat item without children
          if (!hasChildren && item.tabKey) {
            const currentTabKey = item.tabKey;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onTabChange?.(currentTabKey)}
                className={`group relative rounded-xl border transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center overflow-hidden cursor-pointer outline-none focus:outline-none select-none ${
                  isMinimized
                    ? "w-12 h-12 justify-center mx-auto px-0"
                    : "w-full px-3.5 py-2.5 gap-3"
                } ${
                  isItemActive
                    ? isLight
                      ? "bg-slate-100 text-slate-950 border-slate-200"
                      : "bg-[#383838]/80 text-[#FFFFFF] border-[#444444]/60"
                    : isLight
                    ? "border-transparent text-slate-700 hover:bg-[#F4F4F5] hover:text-slate-950"
                    : "border-transparent text-[#F4F4F5] hover:bg-[#383838]/60 hover:text-[#FFFFFF]"
                }`}
                title={isMinimized ? title : undefined}
              >
                <div className={`flex items-center ${isMinimized ? "justify-center" : "gap-3"} min-w-0`}>
                  <Icon
                    size={18}
                    className={`${
                      isItemActive
                        ? isLight
                          ? "text-slate-950"
                          : "text-[#FFFFFF]"
                        : isLight
                        ? "text-slate-700 group-hover:text-slate-950"
                        : "text-[#E4E4E7] group-hover:text-[#FFFFFF]"
                    } shrink-0 transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
                  />

                  <span
                    className={`text-[13.5px] font-medium leading-tight text-left whitespace-nowrap overflow-hidden transition-all ease-out ${
                      isItemActive
                        ? isLight
                          ? "text-slate-950 font-semibold"
                          : "text-[#FFFFFF] font-semibold"
                        : isLight
                        ? "text-slate-800"
                        : "text-[#E4E4E7] group-hover:text-[#FFFFFF]"
                    } ${
                      isMinimized
                        ? "max-w-0 opacity-0 -translate-x-3 duration-200 pointer-events-none"
                        : "max-w-[150px] opacity-100 translate-x-0 duration-350 delay-100"
                    }`}
                  >
                    {title}
                  </span>
                </div>

                {/* Active Indicator bar */}
                {!isMinimized && (
                  <div className="flex items-center justify-center w-4 shrink-0 ml-auto mr-[-3px]">
                    <span
                      className={`w-[2.5px] h-[13px] rounded-full shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                        isLight ? "bg-slate-900" : "bg-white"
                      } ${
                        isItemActive
                          ? "opacity-100 scale-y-100"
                          : "opacity-0 scale-y-50 pointer-events-none"
                      }`}
                    />
                  </div>
                )}

                {/* Bottom dot/pill indicator when minimized */}
                {isMinimized && (
                  <span
                    className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-[2.5px] rounded-full shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      isLight ? "bg-slate-900" : "bg-white"
                    } ${
                      isItemActive
                        ? "opacity-100 scale-x-100"
                        : "opacity-0 scale-x-50 pointer-events-none"
                    }`}
                  />
                )}
              </button>
            );
          }

          // Case 2: Dropdown accordion group (Product Master & Audit Trails)
          return (
            <div key={item.id} className="w-full flex flex-col">
              <button
                ref={(el) => {
                  triggerRefs.current[item.id] = el;
                }}
                type="button"
                onClick={() => handleDropdownToggle(item.id, item.tabKey)}
                className={`group relative rounded-xl border transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center justify-between overflow-hidden cursor-pointer outline-none focus:outline-none select-none ${
                  isMinimized
                    ? "w-12 h-12 justify-center mx-auto px-0"
                    : "w-full px-3.5 py-2.5 gap-3"
                } ${
                  isPopupOpen
                    ? isLight
                      ? "bg-slate-200/90 text-slate-950 border-slate-300 shadow-inner"
                      : "bg-[#383838] text-[#FFFFFF] border-[#555555]"
                    : isItemActive
                    ? isLight
                      ? "bg-slate-100 text-slate-950 border-slate-200"
                      : "bg-[#383838]/80 text-[#FFFFFF] border-[#444444]/60"
                    : isLight
                    ? "border-transparent text-slate-700 hover:bg-[#F4F4F5] hover:text-slate-950"
                    : "border-transparent text-[#F4F4F5] hover:bg-[#383838]/60 hover:text-[#FFFFFF]"
                }`}
                title={isMinimized ? title : undefined}
              >
                <div className={`flex items-center ${isMinimized ? "justify-center" : "gap-3"} min-w-0`}>
                  <Icon
                    size={18}
                    className={`${
                      isPopupOpen || isItemActive
                        ? isLight
                          ? "text-slate-950"
                          : "text-[#FFFFFF]"
                        : isLight
                        ? "text-slate-700 group-hover:text-slate-950"
                        : "text-[#E4E4E7] group-hover:text-[#FFFFFF]"
                    } shrink-0 transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
                  />

                  <span
                    className={`text-[13.5px] font-medium leading-tight text-left whitespace-nowrap overflow-hidden transition-all ease-out ${
                      isPopupOpen || isItemActive
                        ? isLight
                          ? "text-slate-950 font-semibold"
                          : "text-[#FFFFFF] font-semibold"
                        : isLight
                        ? "text-slate-800"
                        : "text-[#E4E4E7] group-hover:text-[#FFFFFF]"
                    } ${
                      isMinimized
                        ? "max-w-0 opacity-0 -translate-x-3 duration-200 pointer-events-none"
                        : "max-w-[150px] opacity-100 translate-x-0 duration-350 delay-100"
                    }`}
                  >
                    {title}
                  </span>
                </div>

                {/* Chevron Down / Up indicator when expanded */}
                {!isMinimized && (
                  <div className="flex items-center gap-1.5 shrink-0 ml-auto">
                    <ChevronDown
                      size={15}
                      className={`shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                        isLight ? "text-slate-600" : "text-[#E4E4E7]"
                      } ${isExpanded ? "rotate-180" : "rotate-0"}`}
                    />
                  </div>
                )}

                {/* Indicator when minimized */}
                {isMinimized && (
                  <span
                    className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-[2.5px] rounded-full shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      isLight ? "bg-slate-900" : "bg-white"
                    } ${
                      isItemActive
                        ? "opacity-100 scale-x-100"
                        : "opacity-0 scale-x-50 pointer-events-none"
                    }`}
                  />
                )}
              </button>

              {/* Accordion Sub-items in Sidebar */}
              {!isMinimized && (
                <div
                  className={`grid transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isExpanded
                      ? "grid-rows-[1fr] opacity-100 mt-1 mb-1"
                      : "grid-rows-[0fr] opacity-0 mt-0 mb-0 pointer-events-none"
                  }`}
                >
                  <div className="overflow-hidden">
                    <div
                      className={`ml-5 pl-3 border-l space-y-1 py-1 transition-colors ${
                        isLight ? "border-slate-300" : "border-[#444444]"
                      }`}
                    >
                      {item.children?.map((child) => {
                        const isSubActive = isSubItemActive(item.id, child.id);
                        const ChildIcon = child.icon;

                        return (
                          <button
                            key={child.id}
                            type="button"
                            onClick={() => handleSubItemClick(item.id, child.id)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left border transition-all duration-200 cursor-pointer outline-none focus:outline-none select-none ${
                              isSubActive
                                ? isLight
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm font-semibold"
                                : "bg-[#383838] text-white border-[#555555] shadow-sm font-semibold"
                                : isLight
                                ? "border-transparent text-slate-600 hover:text-slate-950 hover:bg-slate-100 font-normal"
                                : "border-transparent text-[#E4E4E7] hover:text-[#FFFFFF] hover:bg-white/5 font-normal"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <ChildIcon
                                size={15}
                                className={`shrink-0 transition-colors ${
                                  isSubActive
                                    ? "text-white"
                                    : isLight
                                    ? "text-slate-500"
                                    : "text-zinc-400"
                                }`}
                              />
                              <span className="text-[12.5px] leading-tight truncate">
                                {isThai ? child.titleTh : child.titleEn}
                              </span>
                            </div>

                            {/* Active dot indicator */}
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
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Floating Sub Sidebar (Flyout active when sidebar is minimized) */}
      <AnimatePresence>
        {isMinimized && activePopupId && (
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
            className={`w-[220px] rounded-2xl border shadow-2xl p-1.5 backdrop-blur-2xl select-none transition-colors ${
              isLight
                ? "bg-white/95 border-slate-200/90 text-slate-900 shadow-[0_20px_50px_rgba(0,0,0,0.14)]"
                : "bg-[#252525]/95 border-[#444444] text-white shadow-[0_25px_60px_rgba(0,0,0,0.7)]"
            }`}
          >
            {(() => {
              const currentItem = CONTROL_PANEL_ITEMS.find((i) => i.id === activePopupId);
              if (!currentItem) return null;

              return (
                <>
                  <div className="px-3 py-1.5 border-b border-zinc-200/60 dark:border-zinc-700/60 mb-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 block">
                      {isThai ? currentItem.titleTh : currentItem.titleEn}
                    </span>
                  </div>
                  <div className="space-y-0.5">
                    {currentItem.children?.map((child) => {
                      const isSubActive = isSubItemActive(currentItem.id, child.id);
                      const ChildIcon = child.icon;

                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => handleSubItemClick(currentItem.id, child.id)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left border transition-colors duration-200 cursor-pointer outline-none focus:outline-none select-none ${
                            isSubActive
                              ? isLight
                                ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                                : "bg-[#383838] text-white border-[#555555] shadow-sm"
                              : isLight
                              ? "border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                              : "border-transparent text-[#E4E4E7] hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <ChildIcon
                              size={15}
                              className={`shrink-0 ${
                                isSubActive
                                  ? "text-white"
                                  : isLight
                                  ? "text-slate-500"
                                  : "text-zinc-400"
                              }`}
                            />
                            <span className="text-[12.5px] font-medium leading-tight truncate">
                              {isThai ? child.titleTh : child.titleEn}
                            </span>
                          </div>

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
                </>
              );
            })()}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
