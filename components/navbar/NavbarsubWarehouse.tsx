"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  LayoutDashboard,
  Activity,
  Box,
  Package,
  ArrowLeftRight,
  AlertTriangle,
  Boxes,
  Building2,
  Users,
  ArrowDownLeft,
  Sparkles,
  History,
  ChevronDown,
  Truck,
  Warehouse,
} from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import { motion, AnimatePresence } from "framer-motion";

export interface NavbarsubWarehouseProps {
  isMinimized?: boolean;
  lang?: "th" | "en";
  userRole?: string | null;
  onNavigate?: (path: string) => void;
  menuItems?: MenuGroup[];
}

export interface SubMenuItem {
  label: string;
  path: string;
  badge?: string | number;
  icon?: React.ElementType;
  isRestricted?: boolean;
}

export interface MenuGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  path?: string;
  badge?: string | number;
  children?: SubMenuItem[];
}

export default function NavbarsubWarehouse({
  isMinimized = false,
  lang: propLang,
  userRole: propUserRole,
  onNavigate,
  menuItems: providedMenuItems,
}: NavbarsubWarehouseProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();



  const translations = {
    en: {
      dashboard: "Dashboard",
      warehouseTab: "Warehouse",
      productMaster: "Product Master",
      productDetails: "Product Details",
      branches: "Branches",
      warehouses: "Warehouses",
      unitsMeasure: "Units of Measure",
      productGroups: "Product Groups",
      categories: "Categories",
      brands: "Brands",
      models: "Models",
      logisticsTab: "Logistics",
      wallets: "Wallets",
      p_master: "Product Master",
      stock: "Inventory Stock",
      receiving: "Goods Receiving",
      m_log: "Movement Log",
      b_warehouse: "Branch Warehouse",
      supplier: "Suppliers",
      transfer: "Stock Transfer",
      transfer_status: "Status & Audit Board",
    },
    th: {
      dashboard: "ภาพรวมคลังสินค้า",
      warehouseTab: "คลังสินค้า",
      productMaster: "ข้อมูลสินค้าหลัก",
      productDetails: "รายละเอียดสินค้า",
      branches: "สาขา",
      warehouses: "คลังสินค้า",
      unitsMeasure: "หน่วยนับสินค้า",
      productGroups: "กลุ่มสินค้า",
      categories: "หมวดสินค้า",
      brands: "ยี่ห้อ",
      models: "รุ่น",
      logisticsTab: "โลจิสติกส์",
      wallets: "กระเป๋าบัญชี",
      p_master: "ข้อมูลสินค้าหลัก",
      stock: "สต็อกคงเหลือ",
      receiving: "รับสินค้าเข้า",
      m_log: "ประวัติเคลื่อนไหว",
      b_warehouse: "คลังแยกสาขา",
      supplier: "ผู้ผลิต/คู่ค้า",
      transfer: "โอนย้ายสินค้า",
      transfer_status: "กระดานสถานะโอนย้าย",
    },
  };

  const normalizedLang = (propLang ?? (appLang?.toLowerCase() === "en" ? "en" : "th")) as "en" | "th";
  const t = translations[normalizedLang] || translations.th;
  const isPathActive = (path: string) => {
    const [targetPath, query] = path.split("?");
    if (targetPath !== pathname) return false;
    if (!query) return true;
    const params = new URLSearchParams(query);
    return Array.from(params.entries()).every(([key, value]) => searchParams.get(key) === value);
  };

  const warehouseMenuItems: MenuGroup[] = [
    {
      id: "dashboard",
      title: t.dashboard,
      icon: LayoutDashboard,
      path: "/warehouse",
    },
    {
      id: "warehouse",
      title: t.warehouseTab,
      icon: Warehouse,
      children: [
        {
          label: t.productMaster,
          path: "/warehouse/inventory?kind=products",
          icon: Box,
        },
        {
          label: t.branches,
          path: "/warehouse/inventory?kind=branches",
          icon: Building2,
        },
        {
          label: t.warehouses,
          path: "/warehouse/inventory?kind=warehouses",
          icon: Building2,
        },
        {
          label: t.supplier,
          path: "/warehouse/inventory?kind=suppliers",
          icon: Users,
        },
        {
          label: t.stock,
          path: "/warehouse/stock",
          icon: Boxes,
        },
      ],
    },
    {
      id: "product-details",
      title: t.productDetails,
      icon: Package,
      children: [
        {
          label: t.unitsMeasure,
          path: "/warehouse/inventory?kind=units",
          icon: Boxes,
        },
        {
          label: t.productGroups,
          path: "/warehouse/inventory?kind=product-groups",
          icon: Package,
        },
        {
          label: t.categories,
          path: "/warehouse/inventory?kind=product-categories",
          icon: Package,
        },
        {
          label: t.brands,
          path: "/warehouse/inventory?kind=brands",
          icon: Package,
        },
        {
          label: t.models,
          path: "/warehouse/inventory?kind=product-models",
          icon: Package,
        },
      ],
    },
    {
      id: "logistics",
      title: t.logisticsTab,
      icon: Truck,
      children: [
        {
          label: t.receiving,
          path: "/warehouse/receive",
          icon: ArrowDownLeft,
        },
        {
          label: t.transfer,
          path: "/warehouse/transfer",
          icon: ArrowLeftRight,
        },
        {
          label: t.transfer_status,
          path: "/warehouse/transfer/audit",
          icon: Activity,
        },
        {
          label: t.m_log,
          path: "/warehouse/movements",
          icon: History,
        },
      ],
    },
  ];
  const menuItems = providedMenuItems ?? warehouseMenuItems;

  // Track expanded groups for dropdown accordion
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    menuItems.forEach((group) => {
      if (group.children?.some((child) => isPathActive(child.path))) {
        initial[group.id] = true;
      }
    });
    return initial;
  });

  const [activePopupGroup, setActivePopupGroup] = useState<MenuGroup | null>(null);
  const [popupCoords, setPopupCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const popupRef = useRef<HTMLDivElement>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Auto-expand active group on route change
  useEffect(() => {
    menuItems.forEach((group) => {
      if (group.children?.some((child) => isPathActive(child.path))) {
        setExpandedGroups((prev) => ({ ...prev, [group.id]: true }));
      }
    });
  }, [pathname]);

  // Handle outside click, escape key, resize and scroll for minimized flyout
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (
        popupRef.current &&
        !popupRef.current.contains(target) &&
        !Object.values(buttonRefs.current).some((btn) => btn && btn.contains(target))
      ) {
        setActivePopupGroup(null);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setActivePopupGroup(null);
      }
    };

    const handleWindowChange = () => {
      setActivePopupGroup(null);
    };

    if (activePopupGroup) {
      document.addEventListener("mousedown", handleOutsideClick);
      document.addEventListener("keydown", handleKeyDown);
      window.addEventListener("resize", handleWindowChange);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", handleWindowChange);
    };
  }, [activePopupGroup]);

  const handleItemClick = (path: string) => {
    setActivePopupGroup(null);
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  };

  const handleGroupToggle = (item: MenuGroup, e: React.MouseEvent<HTMLButtonElement>) => {
    // If sidebar is minimized, open flyout dropdown
    if (isMinimized) {
      if (activePopupGroup?.id === item.id) {
        setActivePopupGroup(null);
        return;
      }

      const rect = e.currentTarget.getBoundingClientRect();
      const popupEstimatedHeight = (item.children?.length ?? 5) * 40 + 20;
      const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;

      let top = rect.top;
      if (top + popupEstimatedHeight > windowHeight - 16) {
        top = Math.max(16, windowHeight - popupEstimatedHeight - 16);
      }

      const left = rect.right + 10;
      setPopupCoords({ top, left });
      setActivePopupGroup(item);
      return;
    }

    // Normal expanded sidebar: toggle accordion dropdown
    setExpandedGroups((prev) => ({
      ...prev,
      [item.id]: !prev[item.id],
    }));
  };

  return (
    <>
      <nav className="w-full space-y-1.5 py-2 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const hasChildren = item.children && item.children.length > 0;
          const isChildActive = item.children?.some((child) => isPathActive(child.path));
          const isExpanded = expandedGroups[item.id] ?? false;
          const isPopupOpen = activePopupGroup?.id === item.id;
          const isSelfActive = item.path === pathname;

          // Case 1: Single item without children (Direct Route)
          if (!hasChildren && item.path) {
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item.path!)}
                className={`group relative rounded-xl border transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center overflow-hidden cursor-pointer outline-none focus:outline-none select-none ${
                  isMinimized
                    ? "w-12 h-12 justify-center mx-auto px-0"
                    : "w-full px-3.5 py-2.5 gap-3"
                } ${
                  isSelfActive
                    ? isLight
                      ? "bg-[#F4F4F5] text-[#222222] border-[#E4E4E7] font-semibold"
                      : "bg-[#383838]/80 text-[#FFFFFF] border-[#444444]/60 font-semibold"
                    : isLight
                    ? "border-transparent text-[#2C2C2C] hover:bg-[#F4F4F5] hover:text-[#222222]"
                    : "border-transparent text-[#F4F4F5] hover:bg-[#383838]/60 hover:text-[#FFFFFF]"
                }`}
                title={isMinimized ? item.title : undefined}
              >
                <Icon
                  size={18}
                  className={`${
                    isSelfActive
                      ? isLight
                        ? "text-[#222222]"
                        : "text-[#FFFFFF]"
                      : isLight
                      ? "text-[#2C2C2C] group-hover:text-[#222222]"
                      : "text-[#E4E4E7] group-hover:text-[#FFFFFF]"
                  } shrink-0 transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
                />

                <span
                  className={`text-[13.5px] font-medium leading-tight text-left whitespace-nowrap overflow-hidden transition-all ease-out ${
                    isSelfActive
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
                  {item.title}
                </span>

                {item.badge && !isMinimized && (
                  <span
                    className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      isLight
                        ? "bg-[#F4F4F5] text-[#222222] border border-[#E4E4E7]"
                        : "bg-[#282828] text-[#E4E4E7] border border-[#444444]"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}

                {/* Side line indicator when currently on dashboard page */}
                {!isMinimized && (
                  <div className="flex items-center justify-center w-4 shrink-0 ml-auto mr-[-3px]">
                    <span
                      className={`w-[2.5px] h-[13px] rounded-full shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                        isLight ? "bg-[#222222]" : "bg-white"
                      } ${
                        isSelfActive
                          ? "opacity-100 scale-y-100"
                          : "opacity-0 scale-y-50 pointer-events-none"
                      }`}
                    />
                  </div>
                )}
                {isMinimized && (
                  <span
                    className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-[2.5px] rounded-full shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      isLight ? "bg-[#222222]" : "bg-white"
                    } ${
                      isSelfActive
                        ? "opacity-100 scale-x-100"
                        : "opacity-0 scale-x-50 pointer-events-none"
                    }`}
                  />
                )}
              </button>
            );
          }

          // Case 2: Parent with Sub-items (Dropdown accordion in sidebar)
          return (
            <div key={item.id} className="w-full flex flex-col">
              <button
                ref={(el) => {
                  buttonRefs.current[item.id] = el;
                }}
                type="button"
                onClick={(e) => handleGroupToggle(item, e)}
                className={`group relative rounded-xl border transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] flex items-center justify-between overflow-hidden cursor-pointer outline-none focus:outline-none select-none ${
                  isMinimized
                    ? "w-12 h-12 justify-center mx-auto px-0"
                    : "w-full px-3.5 py-2.5 gap-3"
                } ${
                  isPopupOpen
                    ? isLight
                      ? "bg-[#E4E4E7] text-[#222222] border-[#D4D4D8]"
                      : "bg-[#383838] text-[#FFFFFF] border-[#555555]"
                    : isChildActive
                    ? isLight
                      ? "bg-[#F4F4F5] text-[#222222] border-[#E4E4E7]"
                      : "bg-[#383838]/80 text-[#FFFFFF] border-[#444444]/60"
                    : isLight
                    ? "border-transparent text-[#2C2C2C] hover:bg-[#F4F4F5] hover:text-[#222222]"
                    : "border-transparent text-[#F4F4F5] hover:bg-[#383838]/60 hover:text-[#FFFFFF]"
                }`}
                title={isMinimized ? item.title : undefined}
              >
                <div className={`flex items-center ${isMinimized ? "justify-center" : "gap-3"} min-w-0`}>
                  <Icon
                    size={18}
                    className={`${
                      isPopupOpen || isChildActive
                        ? isLight ? "text-slate-950" : "text-[#FFFFFF]"
                        : isLight
                        ? "text-slate-700 group-hover:text-slate-950"
                        : "text-[#E4E4E7] group-hover:text-[#FFFFFF]"
                    } shrink-0 transition-colors duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]`}
                  />

                  <span
                    className={`text-[13.5px] font-medium leading-tight text-left whitespace-nowrap overflow-hidden transition-all ease-out ${
                      isPopupOpen || isChildActive
                        ? isLight ? "text-slate-950 font-semibold" : "text-[#FFFFFF] font-semibold"
                        : isLight
                        ? "text-slate-800"
                        : "text-[#E4E4E7] group-hover:text-[#FFFFFF]"
                    } ${
                      isMinimized
                        ? "max-w-0 opacity-0 -translate-x-3 duration-200 pointer-events-none"
                        : "max-w-[150px] opacity-100 translate-x-0 duration-350 delay-100"
                    }`}
                  >
                    {item.title}
                  </span>
                </div>

                {/* Dropdown Chevron Arrow when expanded */}
                {!isMinimized && (
                  <div className="flex items-center gap-1.5 shrink-0">
                    {item.badge && (
                      <span
                        className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                          isLight
                            ? "bg-slate-200 text-slate-900"
                            : "bg-[#282828] text-[#E4E4E7] border border-[#444444]"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                    <ChevronDown
                      size={16}
                      className={`shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                        isLight ? "text-slate-600" : "text-[#E4E4E7]"
                      } ${isExpanded ? "rotate-180" : "rotate-0"}`}
                    />
                  </div>
                )}

                {/* Indicator when sidebar is minimized */}
                {isMinimized && (
                  <span
                    className={`absolute bottom-1.5 left-1/2 -translate-x-1/2 w-3.5 h-[2.5px] rounded-full shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                      isLight ? "bg-slate-900" : "bg-white"
                    } ${
                      isChildActive
                        ? "opacity-100 scale-x-100"
                        : "opacity-0 scale-x-50 pointer-events-none"
                    }`}
                  />
                )}
              </button>

              {/* Accordion Sub-items with smooth expansion and tree line guide */}
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
                        isLight ? "border-[#E4E4E7]" : "border-[#444444]"
                      }`}
                    >
                      {item.children?.map((child) => {
                        const isActive = isPathActive(child.path);
                        const ChildIcon = child.icon;

                        return (
                          <button
                            key={child.path}
                            type="button"
                            onClick={() => handleItemClick(child.path)}
                            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left border transition-all duration-200 cursor-pointer outline-none focus:outline-none select-none ${
                              isActive
                                ? isLight
                                  ? "bg-[#222222] text-[#FFFFFF] border-[#222222] shadow-sm font-semibold"
                                  : "bg-[#383838] text-white border-[#555555] shadow-sm font-semibold"
                                : isLight
                                ? "border-transparent text-[#2C2C2C] hover:text-[#222222] hover:bg-[#F4F4F5] font-normal"
                                : "border-transparent text-[#E4E4E7] hover:text-[#FFFFFF] hover:bg-white/5 font-normal"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              {ChildIcon && (
                                <ChildIcon
                                  size={16}
                                  className={`shrink-0 transition-colors ${
                                    isActive
                                      ? "text-white"
                                      : isLight
                                      ? "text-[#383838]"
                                      : "text-zinc-400"
                                  }`}
                                />
                              )}
                              <span className="text-[13px] font-medium leading-tight truncate">
                                {child.label}
                              </span>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0 ml-2">
                              {child.badge && (
                                <span
                                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                                    isActive
                                      ? "bg-white/20 text-white"
                                      : isLight
                                      ? "bg-[#E4E4E7] text-[#222222]"
                                      : "bg-[#383838] text-zinc-200 border border-[#555555]"
                                  }`}
                                >
                                  {child.badge}
                                </span>
                              )}
                              <span
                                className={`w-[2px] h-[11px] rounded-full shrink-0 transition-all duration-300 ${
                                  isActive
                                    ? isLight
                                      ? "bg-white opacity-100 scale-y-100"
                                      : "bg-white opacity-100 scale-y-100"
                                    : "opacity-0 scale-y-50 pointer-events-none"
                                }`}
                              />
                            </div>
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

      {/* Floating Sub Sidebar (Flyout only active when sidebar is minimized) */}
      <AnimatePresence>
        {isMinimized && activePopupGroup && (
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
              {activePopupGroup.children?.map((child) => {
                const isActive = isPathActive(child.path);
                const ChildIcon = child.icon;

                return (
                  <button
                    key={child.path}
                    type="button"
                    onClick={() => handleItemClick(child.path)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left border transition-colors duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] group/item cursor-pointer outline-none focus:outline-none select-none ${
                      isActive
                        ? isLight
                          ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                          : "bg-[#383838] text-white border-[#555555] shadow-sm"
                        : isLight
                        ? "border-transparent text-slate-700 hover:bg-slate-100 hover:text-slate-950"
                        : "border-transparent text-[#E4E4E7] hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      {ChildIcon && (
                        <ChildIcon
                          size={16}
                          className={`shrink-0 transition-colors duration-250 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                            isActive
                              ? "text-white"
                              : isLight
                              ? "text-slate-500 group-hover/item:text-slate-900"
                              : "text-zinc-400 group-hover/item:text-white"
                          }`}
                        />
                      )}
                      <span className="text-[13px] font-medium leading-tight truncate">
                        {child.label}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      {child.badge && (
                        <span
                          className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                            isActive
                              ? "bg-white/20 text-white"
                              : isLight
                              ? "bg-slate-200 text-slate-800"
                              : "bg-[#383838] text-zinc-200 border border-[#555555]"
                          }`}
                        >
                          {child.badge}
                        </span>
                      )}
                      <span
                        className={`w-[2px] h-[11px] rounded-full bg-white shrink-0 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                          isActive
                            ? "opacity-100 scale-y-100"
                            : "opacity-0 scale-y-50 pointer-events-none"
                        }`}
                      />
                    </div>
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
