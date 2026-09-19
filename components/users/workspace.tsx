"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Database,
  Box,
  FileText,
  Cpu,
  Lock,
  ArrowRight,
  Users,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { checkProfileCompleteness, fetchAndStoreUserProfile, toEmployeeProfile } from "@/lib/user-profile";
import { getCurrentSession } from "@/lib/auth-client";
import { getAppMe } from "@/lib/api/session";
import { useLoading } from "@/components/loading_screen";
import { HeaderNavbar, MobileNavbar } from "@/components/navbar";
import { ProfileGuardModal } from "@/components/auth";
import { EmployeeProfile } from "@/types/user";
import { useAppLanguage } from "@/utils/language";
import { getDawhLogo } from "@/config/brand";
import { useNotification } from "@/context/NotificationContext";
import {
  DynamicWorkspaceLayout,
  WorkspacePlanType,
  PrimaryModuleId,
  ModuleStatus,
} from "./DynamicWorkspaceLayout";

export interface WorkspaceLayoutConfig {
  plan: WorkspacePlanType;
  selectedModules: PrimaryModuleId[];
}

export const DEFAULT_WORKSPACE_CONFIG: WorkspaceLayoutConfig = {
  plan: "plan2",
  selectedModules: ["warehouse", "datacenter"],
};

export interface WorkspaceViewProps {
  onNavigate?: (route: string) => void;
  lang?: "en" | "th";
}

interface WorkspaceCardItem {
  id: string;
  title: string;
  titleTh: string;
  description: string;
  descriptionTh: string;
  icon: React.ElementType;
  statusText: string;
  statusTextTh: string;
  statusDotColor: string;
  pillWidth: string;
  buttonText: string;
  buttonTextTh: string;
  buttonWidth: string;
  buttonIcon: React.ElementType;
  isLocked?: boolean;
  isMaintenance?: boolean;
  route?: string;
}

export default function WorkspaceView({ onNavigate }: WorkspaceViewProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const { navigateWithLoading } = useLoading();
  const { notify } = useNotification();
  const isLight = theme === "light";

  const appLang = useAppLanguage();
  const activeLang: "en" | "th" = appLang.toLowerCase() as "en" | "th";
  const isThai = activeLang === "th";

  const [profile, setProfile] = useState<Partial<EmployeeProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showGuardModal, setShowGuardModal] = useState(false);
  const [layoutConfig, setLayoutConfig] = useState<WorkspaceLayoutConfig>(DEFAULT_WORKSPACE_CONFIG);
  const [moduleStatuses, setModuleStatuses] = useState<Record<string, ModuleStatus>>({
    warehouse: "active",
    datacenter: "active",
    employee: "active",
    reports: "active",
  });
  const [recentModuleId, setRecentModuleId] = useState<string | null>(null);

  // Load layout plan selection, statuses, and recent module from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("dawh_workspace_layout_config");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.plan && Array.isArray(parsed.selectedModules)) {
          setLayoutConfig(parsed);
        }
      }
      const savedStatuses = localStorage.getItem("dawh_module_statuses");
      if (savedStatuses) {
        setModuleStatuses(JSON.parse(savedStatuses));
      }
      const savedRecent = localStorage.getItem("dawh_recent_module");
      if (savedRecent) {
        setRecentModuleId(savedRecent);
      }
    } catch {
      // Non-blocking fallback
    }
  }, []);

  // Fetch the canonical profile through the application API on mount.
  useEffect(() => {
    let cachedProfile: Partial<EmployeeProfile> | null = null;
    // 1. Instant Cache Check
    try {
      const cached = localStorage.getItem("dawh_user_profile");
      if (cached) {
        cachedProfile = JSON.parse(cached);
        if (cachedProfile) {
          setProfile(cachedProfile);
          const { isComplete, missingFields: missing } = checkProfileCompleteness(cachedProfile);
          setIsProfileComplete(isComplete);
          setMissingFields(missing);
        }
      } else {
        setIsProfileComplete(false);
      }
    } catch {
      // Non-blocking
    }

    // Check for ?incomplete=true query param
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("incomplete") === "true") {
        setShowGuardModal(true);
        notify.warning(
          isThai ? "ต้องกรอกข้อมูลให้ครบถ้วนก่อน" : "Incomplete Profile Information",
          {
            message: isThai
              ? "กรุณากรอกข้อมูลส่วนตัวในหน้าตั้งค่าก่อนเข้าใช้งานโมดูลงาน"
              : "Please complete your employee profile in Settings before accessing system modules.",
            duration: 5000,
          }
        );
      }
    }

    const fetchUserProfile = async () => {
      try {
        const me = await getAppMe();
        const session = await getCurrentSession();
        const userId = session?.user.id || null;
        if (userId) {
          const employeeProfile = me.data.profile
            ? toEmployeeProfile(me.data.profile)
            : await fetchAndStoreUserProfile(userId, null);
          if (employeeProfile) {
            setProfile(employeeProfile);
            const { isComplete, missingFields: missing } = checkProfileCompleteness(employeeProfile);
            setIsProfileComplete(me.data.profileComplete && isComplete);
            setMissingFields(missing);
          } else {
            // User is authenticated via Better Auth, but has not completed employee profile yet
            setProfile({});
            setIsProfileComplete(false);
            setMissingFields(["profile_completion"]);
          }
        } else {
          setIsProfileComplete(false);
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserProfile();

    const handleProfileUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<EmployeeProfile>>;
      if (customEvent.detail) {
        setProfile((prev) => {
          const merged = { ...prev, ...customEvent.detail };
          const { isComplete, missingFields: missing } = checkProfileCompleteness(merged);
          setIsProfileComplete(isComplete);
          setMissingFields(missing);
          return merged;
        });
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("dawh_profile_updated", handleProfileUpdated);
      return () => {
        window.removeEventListener("dawh_profile_updated", handleProfileUpdated);
      };
    }
  }, [router, isThai, notify]);

  const handleOpenAccount = () => {
    if (onNavigate) onNavigate("settings");
    else navigateWithLoading("/settings");
  };

  const handleDynamicNavigate = (route: string) => {
    // If profile is incomplete and user tries to access a module (not settings/account), block and show guard modal
    if (!isProfileComplete && !route.startsWith("/settings") && !route.startsWith("/account")) {
      setShowGuardModal(true);
      notify.warning(
        isThai ? "ต้องกรอกข้อมูลให้ครบถ้วนก่อน" : "Incomplete Profile Information",
        {
          message: isThai
            ? "กรุณากรอกข้อมูลส่วนตัวในหน้าตั้งค่าก่อนเข้าใช้งานโมดูลงาน"
            : "Please complete your employee profile in Settings before accessing system modules.",
          duration: 5000,
        }
      );
      return;
    }

    if (route.startsWith("/maintenance")) {
      router.push(route);
      return;
    }
    if (onNavigate) {
      onNavigate(route.replace("/", ""));
    } else {
      navigateWithLoading(route);
    }
  };

  const handleCardClick = (card: WorkspaceCardItem) => {
    if (card.route) {
      if (!isProfileComplete && !card.route.startsWith("/settings") && !card.route.startsWith("/account")) {
        setShowGuardModal(true);
        notify.warning(
          isThai ? "ต้องกรอกข้อมูลให้ครบถ้วนก่อน" : "Incomplete Profile Information",
          {
            message: isThai
              ? "กรุณากรอกข้อมูลส่วนตัวในหน้าตั้งค่าก่อนเข้าใช้งานโมดูลงาน"
              : "Please complete your employee profile in Settings before accessing system modules.",
            duration: 5000,
          }
        );
        return;
      }

      if (onNavigate) {
        onNavigate(card.route.replace("/", ""));
      } else {
        navigateWithLoading(card.route);
      }
    }
  };

  // 4 Cards configuration strictly following Figma specification
  const cardsRow1: WorkspaceCardItem[] = [
    {
      id: "workspace-card-0",
      title: "HP Datacenter",
      titleTh: "สัญญาเช่าซื้อ",
      description: "Manage Hire-Purchase contracts, ledger controls, overdue recoveries, and customer profiles.",
      descriptionTh: "จัดการสัญญาเช่าซื้อ, บัญชีแยกประเภท, ติดตามหนี้ค้างชำระ และข้อมูลประวัติลูกค้า",
      icon: Database,
      statusText: "Active",
      statusTextTh: "เปิดใช้งาน",
      statusDotColor: "#10B981",
      pillWidth: "w-[80px]",
      buttonText: "Enter Workspace",
      buttonTextTh: "เข้าสู่ระบบ",
      buttonWidth: "w-[171px]",
      buttonIcon: ArrowRight,
      route: "/datacenter",
    },
    {
      id: "workspace-card-1",
      title: "Warehouse ERP",
      titleTh: "จัดการคลังสินค้า",
      description: "Stock items tracking, real-time SKU movements, stock allocation, and dispatch optimization.",
      descriptionTh: "ติดตามสินค้าคงคลัง, ความเคลื่อนไหว SKU แบบเรียลไทม์, จัดสรรสต็อก และเพิ่มประสิทธิภาพการจัดส่ง",
      icon: Box,
      statusText: "Active",
      statusTextTh: "เปิดใช้งาน",
      statusDotColor: "#10B981",
      pillWidth: "w-[80px]",
      buttonText: "Enter Workspace",
      buttonTextTh: "เข้าสู่ระบบ",
      buttonWidth: "w-[171px]",
      buttonIcon: ArrowRight,
      route: "/warehouse",
    },
  ];

  const cardsRow2: WorkspaceCardItem[] = [
    {
      id: "workspace-card-2",
      title: "Reports & Auditing",
      titleTh: "รายงานและตรวจสอบ",
      description: "Generate monthly statements, performance statistics, system audit logs, and risk reports.",
      descriptionTh: "สร้างใบแจ้งยอดรายเดือน, สถิติประสิทธิภาพ, บันทึกการตรวจสอบระบบ และรายงานความเสี่ยง",
      icon: FileText,
      statusText: "Maintenance",
      statusTextTh: "ปิดปรับปรุง",
      statusDotColor: "#F59E0B",
      pillWidth: "w-[88px]",
      buttonText: "Enter Workspace",
      buttonTextTh: "เข้าสู่ระบบ",
      buttonWidth: "w-[171px]",
      buttonIcon: ArrowRight,
      isMaintenance: true,
      route: "/reports",
    },
    {
      id: "workspace-card-3",
      title: "Integration Services",
      titleTh: "บริการเชื่อมต่อ",
      description: "API keys, external payment gateways mapping, CRM syncing, and ERP connections.",
      descriptionTh: "คีย์ API, การแมปเกตเวย์การชำระเงินภายนอก, การซิงค์ CRM และการเชื่อมต่อระบบ ERP",
      icon: Cpu,
      statusText: "Locked",
      statusTextTh: "ปิดใช้งาน",
      statusDotColor: "#EF4444",
      pillWidth: "w-[80px]",
      buttonText: "Locked Module",
      buttonTextTh: "ปิดใช้งาน",
      buttonWidth: "w-[158px]",
      buttonIcon: Lock,
      isLocked: true,
      route: "/integration",
    },
  ];

  const renderCard = (card: WorkspaceCardItem, index: number) => {
    const IconComponent = card.icon;
    const ButtonIconComponent = card.buttonIcon;
    const isLocked = card.isLocked;

    return (
      <motion.div
        key={card.id}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: isLocked ? 0.5 : 1, y: 0 }}
        exit={{ opacity: 0, y: -12, transition: { duration: 0.2 } }}
        transition={{
          duration: 0.45,
          delay: 0.06 + index * 0.07,
          ease: [0.4, 0, 0.2, 1],
        }}
        whileHover={
          !isLocked
            ? {
                y: -3,
                transition: { duration: 0.2, ease: "easeOut" },
              }
            : undefined
        }
        whileTap={!isLocked ? { scale: 0.99 } : undefined}
        onClick={() => handleCardClick(card)}
        className={`group box-border flex flex-1 flex-col items-start p-[32px] gap-[24px] rounded-[14px] border transition-all duration-200 select-none min-h-[270px] w-full lg:w-[662px] ${
          isLocked
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        } ${
          isLight
            ? "bg-white/95 border-[#E2E8F0] shadow-[0px_4px_12px_rgba(0,0,0,0.06)] hover:border-slate-400 hover:shadow-[0px_8px_20px_rgba(0,0,0,0.12)]"
            : "bg-[#383838] border-[#444444] shadow-[0px_4px_12px_rgba(0,0,0,0.101961)] hover:border-[#666666] hover:shadow-[0px_8px_24px_rgba(0,0,0,0.28)]"
        }`}
      >
        {/* card-top-row: Icon + Title on the left, Status Pill on the right */}
        <div className="flex flex-row justify-between items-center p-0 w-full min-h-[48px] self-stretch gap-3">
          {/* Left: Icon & Title Header */}
          <div className="flex flex-row items-center gap-3.5 min-w-0 flex-1">
            {/* icon-wrapper */}
            <div
              className={`box-border flex flex-row justify-center items-center p-0 w-[48px] h-[48px] rounded-[10px] border transition-colors shrink-0 ${
                isLight
                  ? "bg-[#F1F5F9] border-[#E2E8F0] text-slate-900"
                  : "bg-[#222222] border-[#444444] text-white"
              }`}
            >
              <IconComponent
                size={22}
                stroke="currentColor"
                strokeWidth={2}
                className="shrink-0"
              />
            </div>

            {/* Title (moved next to icon & increased size) */}
            <h2
              className={`font-bold text-[20px] sm:text-[21px] leading-[26px] tracking-tight truncate ${
                isLight ? "text-[#0F172A]" : "text-[#FFFFFF]"
              }`}
              style={{ fontFamily: "var(--font-outfit), sans-serif" }}
            >
              {isThai ? card.titleTh : card.title}
            </h2>
          </div>

          {/* status-pill */}
          <div
            className={`box-border flex flex-row items-center justify-center px-[10px] py-[4px] gap-[6px] h-[22px] ${
              card.pillWidth
            } min-w-fit rounded-[100px] bg-transparent border-[1.5px] transition-colors shrink-0 ${
              isLight
                ? "border-[#E2E8F0]"
                : "border-[#444444]"
            }`}
          >
            {/* status-dot */}
            <span
              className="w-[6px] h-[6px] rounded-full shrink-0"
              style={{ backgroundColor: card.statusDotColor }}
            />
            {/* text */}
            <span
              className={`font-semibold text-[11px] leading-[14px] whitespace-nowrap ${
                isLight ? "text-[#1E293B]" : "text-[#FFFFFF]"
              }`}
              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
            >
              {isThai ? card.statusTextTh : card.statusText}
            </span>
          </div>
        </div>

        {/* card-mid-text: Description */}
        <div className="flex flex-col items-start p-0 w-full self-stretch flex-1">
          <p
            className={`font-normal text-[13.5px] leading-[155%] ${
              isLight ? "text-[#64748B]" : "text-[#999999]"
            }`}
            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
          >
            {isThai ? card.descriptionTh : card.description}
          </p>
        </div>

        {/* Action Button (Aligned to the right) */}
        <div className="w-full flex justify-end items-center mt-auto pt-2">
          <button
            type="button"
            tabIndex={isLocked ? -1 : 0}
            className={`box-border flex flex-row justify-center items-center px-[16px] py-[10px] gap-[8px] h-[38px] ${
              card.buttonWidth
            } min-w-fit rounded-[8px] border transition-all duration-200 whitespace-nowrap ${
              isLocked
                ? "cursor-not-allowed"
                : isLight
                ? "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] group-hover:bg-slate-900 group-hover:text-white group-hover:border-slate-900"
                : "bg-[#383838] border-[#444444] text-[#999999] group-hover:bg-[#4A4A4A] group-hover:text-white group-hover:border-[#666666]"
            }`}
            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
          >
            <ButtonIconComponent
              size={16}
              className={`shrink-0 transition-colors ${
                isLocked
                  ? "text-[#999999]"
                  : isLight
                  ? "text-[#64748B] group-hover:text-white"
                  : "text-[#999999] group-hover:text-white"
              }`}
            />
            <span className="font-semibold text-[14px] leading-[18px] whitespace-nowrap">
              {isThai ? card.buttonTextTh : card.buttonText}
            </span>
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="workspace-view"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.25 } }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className={`relative min-h-dvh w-full flex flex-col justify-between overflow-x-hidden ${
          isLight
            ? "bg-[#F8FAFC] text-slate-900 selection:bg-[#222222] selection:text-white"
            : "bg-[#222222] text-white selection:bg-white/25 selection:text-white"
        } transition-colors duration-300 font-sans`}
      >
        {/* 1. TWO-TONE SPLIT BACKGROUND (Login Page Theme Background) */}
        <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
          <div
            className={`w-full h-[52%] relative overflow-hidden transition-colors duration-300 ${
              isLight ? "bg-[#EEF2F6]" : "bg-[#1A1A1A]"
            }`}
          >
            <div className="absolute inset-0 pointer-events-none select-none">
              <div className="absolute -top-4 -left-24 sm:-left-36 md:-left-48 h-1/2 aspect-[1580/528] relative">
                <div
                  className="w-full h-full transition-colors duration-300"
                  style={{
                    backgroundColor: isLight ? "#FFFFFF" : "#282828",
                    WebkitMaskImage: `url(${getDawhLogo(theme, "longNoSpace")})`,
                    maskImage: `url(${getDawhLogo(theme, "longNoSpace")})`,
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    transform: "rotate(-180deg)",
                  }}
                />
                <div
                  className={`absolute top-[61.2%] h-[150vh] left-[76.2%] w-[7%] transition-colors duration-300 ${
                    isLight ? "bg-[#FFFFFF]" : "bg-[#282828]"
                  }`}
                />
              </div>
            </div>
          </div>

          <div
            className={`w-full flex-1 relative overflow-hidden transition-colors duration-300 ${
              isLight ? "bg-[#FFFFFF]" : "bg-[#282828]"
            }`}
          >
            <div
              className="absolute bottom-0 right-0 h-full w-full pointer-events-none select-none transition-colors duration-300"
              style={{
                backgroundColor: isLight ? "#EEF2F6" : "#1A1A1A",
                WebkitMaskImage: `url(${getDawhLogo(theme, "longNoSpace")})`,
                maskImage: `url(${getDawhLogo(theme, "longNoSpace")})`,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "right bottom",
                maskPosition: "right bottom",
              }}
            />
          </div>
        </div>

        {/* Top Navigation Headers */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        >
          <HeaderNavbar showAccount={true} showLogo={true} />
          <MobileNavbar />
        </motion.div>

        {/* portal-content-body */}
        <motion.main
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 w-full max-w-[1344px] mx-auto flex flex-col justify-center items-start px-4 sm:px-8 py-8 sm:py-10 gap-6 sm:gap-7 flex-1 self-stretch"
        >
          {/* hub-title-block */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-start p-0 gap-1.5 max-w-[507px]"
          >
            {/* Select Workspace */}
            <h1
              className={`font-bold text-[30px] sm:text-[32px] leading-[38px] tracking-tight ${
                isLight ? "text-[#0F172A]" : "text-[#FFFFFF]"
              }`}
              style={{ fontFamily: "var(--font-outfit), sans-serif" }}
            >
              {isThai ? "เลือกพื้นที่ทำงาน" : "Select Workspace"}
            </h1>

            {/* Subtitle */}
            <p
              className={`font-normal text-[15px] sm:text-[16px] leading-[22px] ${
                isLight ? "text-[#64748B]" : "text-[#999999]"
              }`}
              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
            >
              {isThai
                ? "เลือกโมดูลเฉพาะทางเพื่อเริ่มต้นการทำงานสำหรับ Horizon Logistics"
                : "Choose a dedicated module to begin operations for Horizon Logistics."}
            </p>
          </motion.div>

          {/* workspace dynamic layout */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full flex flex-col items-start p-0 self-stretch"
          >
            <DynamicWorkspaceLayout
              plan={layoutConfig.plan}
              selectedModules={layoutConfig.selectedModules}
              moduleStatuses={moduleStatuses}
              recentModuleId={recentModuleId}
              onNavigate={handleDynamicNavigate}
              isLight={isLight}
              isThai={isThai}
            />
          </motion.div>
        </motion.main>

        {/* Clean Footer */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="relative z-10 w-full border-t border-zinc-200/40 dark:border-zinc-800/60 py-5 px-6 text-center text-xs text-zinc-500 dark:text-zinc-400"
        >
          <p style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}>
            {isThai
              ? "ระบบบริหารจัดการ dawh Platform © 2026. Horizon Logistics Operations Hub."
              : "dawh Enterprise Platform © 2026. Horizon Logistics Operations Hub."}
          </p>
        </motion.footer>

        {/* Profile Guard Modal if profile is incomplete */}
        <ProfileGuardModal
          isOpen={showGuardModal}
          missingFields={missingFields}
          onClose={() => setShowGuardModal(false)}
          onGoToSettings={() => {
            setShowGuardModal(false);
            handleOpenAccount();
          }}
        />
      </motion.div>
    </AnimatePresence>
  );
}
