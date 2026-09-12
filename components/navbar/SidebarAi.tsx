"use client";

import React, { useEffect, useState } from "react";
import {
  Sparkles,
  Brain,
  TrendingUp,
  Activity,
  Layers,
  ShieldAlert,
  Boxes,
  CreditCard,
  BellRing,
  ChevronDown,
  GripVertical,
  Sliders,
  Cpu,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";

export interface NavbarsubAiProps {
  isMinimized?: boolean;
  lang?: "th" | "en";
  userRole?: string | null;
  onNavigate?: (path: string) => void;
}

interface SubMenuItem {
  label: string;
  path: string;
  subtitle?: string;
  icon?: React.ElementType;
  badge?: string | number;
  isRestricted?: boolean;
}

interface MenuGroup {
  id: string;
  title: string;
  icon: React.ElementType;
  path?: string;
  badge?: string | number;
  children?: SubMenuItem[];
}

export default function NavbarsubAi({
  isMinimized = false,
  lang: propLang,
  userRole: propUserRole,
  onNavigate,
}: NavbarsubAiProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === "light";

  const [localLang, setLocalLang] = useState<"th" | "en">("th");
  const [localRole, setLocalRole] = useState<string | null>(null);

  // State to track expanded sub-menu groups (default true to eliminate flicker/jumping on route change)
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    supplyChain: true,
    financeAi: true,
    alerts: true,
  });

  // State to track active flyout card in minimized mode
  const [activeFlyout, setActiveFlyout] = useState<string | null>(null);

  const activeLang = propLang ?? localLang;
  const activeRole = propUserRole !== undefined ? propUserRole : localRole;

  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("app_lang") as "th" | "en";
      if (savedLang) setLocalLang(savedLang);

      const savedRole = localStorage.getItem("current_user_role");
      if (savedRole) setLocalRole(savedRole.toLowerCase());
    }
  }, []);

  // Close flyout on outside click or route change
  useEffect(() => {
    setActiveFlyout(null);
  }, [pathname, isMinimized]);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-sidebar-flyout]")) {
        setActiveFlyout(null);
      }
    };
    if (activeFlyout) {
      document.addEventListener("mousedown", handleGlobalClick);
      return () => document.removeEventListener("mousedown", handleGlobalClick);
    }
  }, [activeFlyout]);

  // Auto-expand group containing active route
  useEffect(() => {
    menuItems.forEach((item) => {
      if (item.children?.some((child) => child.path === pathname)) {
        setExpandedGroups((prev) => ({ ...prev, [item.id]: true }));
      }
    });
  }, [pathname]);

  const toggleGroup = (groupId: string) => {
    if (isMinimized) {
      setActiveFlyout((prev) => (prev === groupId ? null : groupId));
      return;
    }
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const translations = {
    en: {
      overview: "AI Hub Overview",
      supplyChain: "Supply Chain & Stock AI",
      financeAi: "Financial & Credit Risk AI",
      predictiveAlerts: "Predictive Intelligence",
      demandForecast: "Demand Forecasting",
      demandForecastSub: "SKU Demand Prediction Curves",
      reorderOpt: "Optimal Reorder Points",
      reorderOptSub: "Safety Stock & Lead Time Matrix",
      defaultRisk: "Default Risk Predictions",
      defaultRiskSub: "Neural Repayment Trajectory",
      creditScoring: "Credit & Behavior Scoring",
      creditScoringSub: "Multi-factor Borrower Evaluation",
      anomalyDetection: "Anomaly Alarms",
      anomalyDetectionSub: "Real-time Threshold Deviations",
    },
    th: {
      overview: "ภาพรวมศูนย์วิเคราะห์ AI",
      supplyChain: "ปัญญาประดิษฐ์คลังสินค้า",
      financeAi: "ปัญญาประดิษฐ์การเงินและสัญญา",
      predictiveAlerts: "การแจ้งเตือนและการพยากรณ์",
      demandForecast: "พยากรณ์ความต้องการสต็อก",
      demandForecastSub: "กราฟและโมเดลทำนายความต้องการ SKU",
      reorderOpt: "วิเคราะห์จุดสั่งซื้อที่เหมาะสม",
      reorderOptSub: "คำนวณจุดสั่งซื้อและสต็อกปลอดภัย",
      defaultRisk: "คาดการณ์ความเสี่ยงผิดนัดชำระ",
      defaultRiskSub: "พยากรณ์พฤติกรรมการผ่อนชำระ",
      creditScoring: "คะแนนเครดิตและพฤติกรรมลูกค้า",
      creditScoringSub: "ประเมินความน่าเชื่อถือลูกหนี้",
      anomalyDetection: "ตรวจจับสิ่งผิดปกติอัจฉริยะ",
      anomalyDetectionSub: "แจ้งเตือนการเบี่ยงเบนและสต็อกวิกฤต",
    },
  };

  const normalizedLang = (activeLang?.toLowerCase() === "en" ? "en" : "th") as "en" | "th";
  const t = translations[normalizedLang] || translations.th;

  const menuItems: MenuGroup[] = [
    {
      id: "overview",
      title: t.overview,
      icon: Sparkles,
      path: "/ai",
    },
    {
      id: "supplyChain",
      title: t.supplyChain,
      icon: Boxes,
      children: [
        {
          label: t.demandForecast,
          subtitle: t.demandForecastSub,
          path: "/ai/warehouse-forecast",
          icon: TrendingUp,
        },
        {
          label: t.reorderOpt,
          subtitle: t.reorderOptSub,
          path: "/ai/warehouse-forecast#reorder",
          icon: Sliders,
        },
      ],
    },
    {
      id: "financeAi",
      title: t.financeAi,
      icon: Brain,
      children: [
        {
          label: t.defaultRisk,
          subtitle: t.defaultRiskSub,
          path: "/ai/financial-risk",
          icon: ShieldAlert,
        },
        {
          label: t.creditScoring,
          subtitle: t.creditScoringSub,
          path: "/ai/financial-risk#scoring",
          icon: CreditCard,
        },
      ],
    },
    {
      id: "alerts",
      title: t.predictiveAlerts,
      icon: Activity,
      children: [
        {
          label: t.anomalyDetection,
          subtitle: t.anomalyDetectionSub,
          path: "/ai/alerts",
          icon: BellRing,
          badge: "Live",
        },
      ],
    },
  ];

  const handleItemClick = (path: string) => {
    setActiveFlyout(null);
    if (onNavigate) {
      onNavigate(path);
    } else {
      router.push(path);
    }
  };

  return (
    <nav className="w-full space-y-1.5 py-2 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]">
      {menuItems.map((item) => {
        const Icon = item.icon;
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedGroups[item.id] ?? false;

        const isChildActive = item.children?.some(
          (child) => child.path.split("#")[0] === pathname
        );
        const isSelfActive = item.path === pathname && !activeFlyout;

        // Case 1: Single item without children
        if (!hasChildren && item.path) {
          const singleButtonClass = isSelfActive
            ? isMinimized
              ? isLight
                ? "bg-[#18181B] text-[#FFFFFF] border border-[#18181B] font-bold shadow-md"
                : "bg-[#FFFFFF] text-[#18181B] border border-[#FFFFFF] font-bold shadow-md"
              : isLight
              ? "bg-[#18181B] text-[#FFFFFF] font-bold border border-[#18181B] shadow-sm"
              : "bg-[#FFFFFF] text-[#18181B] font-bold border border-[#FFFFFF] shadow-sm"
            : isLight
            ? "text-[#383838] hover:bg-[#F4F4F5] hover:text-[#18181B] font-medium"
            : "text-[#D4D4D8] hover:bg-white/[0.08] hover:text-[#FFFFFF] font-medium";

          const singleIconClass = isSelfActive
            ? isLight
              ? "text-[#FFFFFF]"
              : "text-[#18181B]"
            : isLight
            ? "text-[#666666] group-hover:text-[#18181B]"
            : "text-[#A1A1AA] group-hover:text-[#FFFFFF]";

          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => handleItemClick(item.path!)}
              className={`group relative rounded-xl transition-all duration-150 flex items-center overflow-hidden cursor-pointer ${
                isMinimized
                  ? "w-10 h-10 aspect-square justify-center mx-auto p-0"
                  : "w-full h-10 px-2.5 gap-3"
              } ${singleButtonClass}`}
              title={isMinimized ? item.title : undefined}
            >
              <div className="w-5 h-5 flex items-center justify-center shrink-0">
                <Icon
                  size={19}
                  className={`${singleIconClass} shrink-0 transition-colors duration-150`}
                />
              </div>

              <span
                className={`text-[13.5px] leading-tight text-left whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                  isSelfActive
                    ? isLight
                      ? "font-bold text-[#FFFFFF]"
                      : "font-bold text-[#18181B]"
                    : isLight
                    ? "font-medium text-[#383838] group-hover:text-[#18181B]"
                    : "font-medium text-[#F4F4F5] group-hover:text-[#FFFFFF]"
                } ${
                  isMinimized
                    ? "max-w-0 opacity-0 -translate-x-2 pointer-events-none"
                    : "max-w-[170px] opacity-100 translate-x-0"
                }`}
              >
                {item.title}
              </span>

              {item.badge && !isMinimized && (
                <span
                  className={`ml-auto px-2 py-0.5 text-[10px] font-bold rounded-full ${
                    isSelfActive
                      ? isLight
                        ? "bg-white/20 text-white"
                        : "bg-black/15 text-black"
                      : isLight
                      ? "bg-[#F4F4F5] text-[#18181B] border border-[#E4E4E7]"
                      : "bg-[#282828] text-[#E4E4E7] border border-[#444444]"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </motion.button>
          );
        }

        // Case 2: Collapsible parent with children
        const isFlyoutOpen = isMinimized && activeFlyout === item.id;

        const parentButtonClass = isFlyoutOpen
          ? isLight
            ? "bg-[#18181B] text-[#FFFFFF] shadow-sm font-bold border border-[#18181B]"
            : "bg-[#FFFFFF] text-[#18181B] shadow-md font-bold border border-[#FFFFFF]"
          : isChildActive
          ? isMinimized
            ? isLight
              ? "bg-[#18181B] text-[#FFFFFF] border border-[#18181B] font-bold shadow-sm"
              : "bg-[#FFFFFF] text-[#18181B] border border-[#FFFFFF] font-bold shadow-sm"
            : isLight
            ? "bg-[#F4F4F5] text-[#18181B] font-semibold border border-[#E4E4E7]"
            : "bg-[#383838] text-[#FFFFFF] font-semibold border border-[#444444]"
          : isLight
          ? "text-[#383838] hover:bg-[#F4F4F5] hover:text-[#18181B] font-medium"
          : "text-[#D4D4D8] hover:bg-white/[0.08] hover:text-[#FFFFFF] font-medium";

        const parentIconClass = isFlyoutOpen
          ? isLight
            ? "text-[#FFFFFF]"
            : "text-[#18181B]"
          : isChildActive
          ? isMinimized
            ? isLight
              ? "text-[#FFFFFF]"
              : "text-[#18181B]"
            : isLight
            ? "text-[#18181B]"
            : "text-[#FFFFFF]"
          : isLight
          ? "text-[#666666] group-hover:text-[#18181B]"
          : "text-[#A1A1AA] group-hover:text-[#FFFFFF]";

        return (
          <div key={item.id} className="relative w-full flex flex-col" data-sidebar-flyout>
            {/* Parent Header Button */}
            <motion.button
              whileTap={{ scale: 0.96 }}
              type="button"
              onClick={() => toggleGroup(item.id)}
              className={`group relative rounded-xl transition-all duration-150 flex items-center justify-between overflow-hidden cursor-pointer ${
                isMinimized
                  ? "w-10 h-10 aspect-square justify-center mx-auto p-0"
                  : "w-full h-10 px-2.5 gap-3"
              } ${parentButtonClass}`}
              title={isMinimized ? item.title : undefined}
            >
              <div className={`flex items-center ${isMinimized ? "justify-center w-full" : "gap-3 min-w-0"}`}>
                <div className="w-5 h-5 flex items-center justify-center shrink-0">
                  <Icon
                    size={19}
                    className={`${parentIconClass} shrink-0 transition-colors duration-150`}
                  />
                </div>

                <span
                  className={`text-[13.5px] leading-tight text-left whitespace-nowrap overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
                    isChildActive
                      ? isLight
                        ? "font-semibold text-[#18181B]"
                        : "font-semibold text-[#FFFFFF]"
                      : isLight
                      ? "font-medium text-[#383838] group-hover:text-[#18181B]"
                      : "font-normal text-[#F4F4F5] group-hover:text-[#FFFFFF]"
                  } ${
                    isMinimized
                      ? "max-w-0 opacity-0 -translate-x-2 pointer-events-none"
                      : "max-w-[150px] opacity-100 translate-x-0"
                  }`}
                >
                  {item.title}
                </span>
              </div>

              {/* Chevron Arrow Indicator */}
              {!isMinimized && (
                <ChevronDown
                  size={16}
                  className={`shrink-0 transition-transform duration-200 ${
                    isChildActive
                      ? isLight
                        ? "text-[#18181B]"
                        : "text-[#FFFFFF]"
                      : isLight
                      ? "text-[#666666]"
                      : "text-[#A1A1AA]"
                  } ${isExpanded ? "rotate-180" : "rotate-0"}`}
                />
              )}
            </motion.button>

            {/* Minimized Animated Flyout Popup Card */}
            <AnimatePresence>
              {isMinimized && activeFlyout === item.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, x: -8 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.94, x: -6 }}
                  transition={{ duration: 0.16, ease: "easeOut" }}
                  className={`absolute left-[70px] top-0 z-50 min-w-[270px] max-w-[310px] p-2.5 rounded-2xl border shadow-2xl ${
                    isLight
                      ? "bg-[#FFFFFF] border-[#E4E4E7] text-[#18181B] shadow-xl"
                      : "bg-[#222222] border-[#383838] text-[#FFFFFF] shadow-black/90"
                  }`}
                >
                  <div className="flex flex-col gap-1.5">
                    {item.children?.map((child) => {
                      const SubIcon = child.icon || Icon;
                      const isActive = pathname === child.path.split("#")[0];

                      return (
                        <button
                          key={child.label}
                          type="button"
                          onClick={() => {
                            handleItemClick(child.path);
                            setActiveFlyout(null);
                          }}
                          className={`w-full flex items-center gap-3 px-2 py-2 rounded-xl text-left transition-colors duration-150 cursor-pointer group/item ${
                            isActive
                              ? isLight
                                ? "bg-[#18181B] text-[#FFFFFF] font-bold shadow-sm"
                                : "bg-[#FFFFFF] text-[#18181B] font-bold shadow-sm"
                              : isLight
                              ? "hover:bg-[#F8FAFC] text-[#383838]"
                              : "hover:bg-white/5 text-[#E4E4E7]"
                          }`}
                        >
                          {/* Drag Handle Dots */}
                          <GripVertical
                            size={15}
                            className={`shrink-0 opacity-40 group-hover/item:opacity-80 transition-opacity ${
                              isActive
                                ? isLight
                                  ? "text-white/60"
                                  : "text-black/60"
                                : isLight
                                ? "text-slate-400"
                                : "text-[#71717A]"
                            }`}
                          />

                          {/* Icon Thumbnail Pill Box */}
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-transform group-hover/item:scale-105 ${
                              isActive
                                ? isLight
                                  ? "bg-white text-[#18181B] border-white"
                                  : "bg-[#181818] text-[#FFFFFF] border-[#18181B]"
                                : isLight
                                ? "bg-[#F4F4F5] text-[#555555] border-[#E4E4E7]"
                                : "bg-[#181818] text-[#D4D4D8] border-[#383838]"
                            }`}
                          >
                            <SubIcon size={16} className="shrink-0" />
                          </div>

                          {/* Text: Title & Subtitle */}
                          <div className="flex flex-col min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[13px] leading-tight truncate ${
                                  isActive
                                    ? isLight
                                      ? "font-bold text-[#FFFFFF]"
                                      : "font-bold text-[#18181B]"
                                    : isLight
                                    ? "font-medium text-[#383838]"
                                    : "font-medium text-[#F4F4F5]"
                                }`}
                              >
                                {child.label}
                              </span>
                              {child.badge && (
                                <span
                                  className={`px-1.5 py-0.2 text-[9px] font-bold rounded-full ${
                                    typeof child.badge === "string" &&
                                    child.badge.toLowerCase() === "live"
                                      ? "bg-[#2EC4B6]/15 text-[#2EC4B6] border border-[#2EC4B6]/30 animate-pulse"
                                      : isActive
                                      ? isLight
                                        ? "bg-white/20 text-white"
                                        : "bg-black/15 text-black"
                                      : isLight
                                      ? "bg-[#18181B] text-[#FFFFFF]"
                                      : "bg-[#383838] text-[#FFFFFF]"
                                  }`}
                                >
                                  {child.badge}
                                </span>
                              )}
                            </div>
                            {child.subtitle && (
                              <span
                                className={`text-[11px] leading-tight mt-0.5 truncate ${
                                  isActive
                                    ? isLight
                                      ? "text-white/70"
                                      : "text-black/70"
                                    : isLight
                                    ? "text-[#666666]"
                                    : "text-[#888888]"
                                }`}
                              >
                                {child.subtitle}
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Sub-menu Items (Expanded Tree with Guide Line) */}
            {!isMinimized && (
              <div
                className={`grid transition-all duration-200 ease-in-out ${
                  isExpanded
                    ? "grid-rows-[1fr] opacity-100 mt-1 mb-1"
                    : "grid-rows-[0fr] opacity-0 mt-0 mb-0 pointer-events-none"
                }`}
              >
                <div className="overflow-hidden">
                  <div
                    className={`ml-5 pl-3.5 border-l space-y-1 py-1 transition-colors ${
                      isLight ? "border-[#E4E4E7]" : "border-[#444444]"
                    }`}
                  >
                    {item.children?.map((child) => {
                      const isActive = pathname === child.path.split("#")[0];

                      return (
                        <button
                          key={child.label}
                          type="button"
                          onClick={() => handleItemClick(child.path)}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-left transition-all duration-150 cursor-pointer ${
                            isActive
                              ? isLight
                                ? "bg-[#18181B] text-[#FFFFFF] font-bold shadow-sm border border-[#18181B]"
                                : "bg-[#FFFFFF] text-[#18181B] font-bold shadow-sm border border-[#FFFFFF]"
                              : isLight
                              ? "text-[#555555] hover:text-[#18181B] hover:bg-[#F4F4F5] font-normal"
                              : "text-[#A1A1AA] hover:text-[#FFFFFF] hover:bg-white/[0.08] font-normal"
                          }`}
                        >
                          <span className="text-[13px] leading-tight truncate">
                            {child.label}
                          </span>

                          {child.badge && (
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full ${
                                typeof child.badge === "string" &&
                                child.badge.toLowerCase() === "live"
                                  ? "bg-[#2EC4B6]/15 text-[#2EC4B6] border border-[#2EC4B6]/30 animate-pulse"
                                  : isActive
                                  ? isLight
                                    ? "bg-white/20 text-white"
                                    : "bg-black/15 text-black"
                                  : isLight
                                  ? "bg-[#F4F4F5] text-[#18181B] border border-[#E4E4E7]"
                                  : "bg-[#282828] text-[#FFFFFF] border border-[#555555]"
                              }`}
                            >
                              {child.badge}
                            </span>
                          )}
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
  );
}
