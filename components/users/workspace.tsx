"use client";

import React, { useEffect, useState } from "react";
import {
  Database,
  Box,
  FileText,
  Cpu,
  Lock,
  ArrowRight,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { checkProfileCompleteness, fetchAndStoreUserProfile } from "@/utils/auth";
import { useLoading } from "@/components/loading_screen";
import { HeaderNavbar, MobileNavbar } from "@/components/navbar";
import { ProfileGuardModal } from "@/components/auth";
import { EmployeeProfile } from "@/types/user";
import { useAppLanguage } from "@/utils/language";
import { getDawhLogo } from "@/config/brand";
import { useNotification } from "@/context/NotificationContext";

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
  const { theme } = useTheme();
  const { navigateWithLoading } = useLoading();
  const { notify } = useNotification();
  const isLight = theme === "light";

  const appLang = useAppLanguage();
  const activeLang: "en" | "th" = appLang.toLowerCase() as "en" | "th";
  const isThai = activeLang === "th";

  const [profile, setProfile] = useState<Partial<EmployeeProfile>>({});
  const [, setIsProfileComplete] = useState(true);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showGuardModal, setShowGuardModal] = useState(false);

  // Fetch real profile from Supabase Database on mount
  useEffect(() => {
    // 1. Instant Cache Check
    try {
      const cached = localStorage.getItem("dawh_user_profile");
      if (cached) {
        const employeeProfile = JSON.parse(cached);
        if (employeeProfile) {
          setProfile(employeeProfile);
          const { isComplete, missingFields: missing } = checkProfileCompleteness(employeeProfile);
          setIsProfileComplete(isComplete);
          setMissingFields(missing);
        }
      }
    } catch {
      // Non-blocking
    }

    const fetchUserProfile = async () => {
      try {
        const userId = typeof window !== "undefined" ? localStorage.getItem("current_user_id") : null;
        if (userId) {
          const employeeProfile = await fetchAndStoreUserProfile(userId, null, 1);
          if (employeeProfile) {
            setProfile(employeeProfile);
            const { isComplete, missingFields: missing } = checkProfileCompleteness(employeeProfile);
            setIsProfileComplete(isComplete);
            setMissingFields(missing);
          }
        }
      } catch (err) {
        console.error("Error loading user profile:", err);
      }
    };

    fetchUserProfile();
  }, []);

  const handleOpenAccount = () => {
    if (onNavigate) onNavigate("account");
    else navigateWithLoading("/account");
  };

  const handleCardClick = (card: WorkspaceCardItem) => {
    if (card.route) {
      if (onNavigate) {
        onNavigate(card.route.replace("/", ""));
      } else {
        navigateWithLoading(
          card.route,
          isThai ? `กำลังเปิดระบบ ${card.titleTh}...` : `Opening ${card.title}...`,
          isThai ? "กำลังเชื่อมต่อระบบและโหลดข้อมูล..." : "Connecting to workspace modules..."
        );
      }
    }
  };

  // 4 Cards configuration strictly following Figma specification
  const cardsRow1: WorkspaceCardItem[] = [
    {
      id: "workspace-card-0",
      title: "HP Datacenter",
      titleTh: "HP Datacenter",
      description: "Manage Hire-Purchase contracts, ledger controls, overdue recoveries, and customer profiles.",
      descriptionTh: "จัดการสัญญาเช่าซื้อ, บัญชีแยกประเภท, ติดตามหนี้ค้างชำระ และข้อมูลประวัติลูกค้า",
      icon: Database,
      statusText: "Active",
      statusTextTh: "Active",
      statusDotColor: "#2EC4B6",
      pillWidth: "w-[66px]",
      buttonText: "Enter Workspace",
      buttonTextTh: "Enter Workspace",
      buttonWidth: "w-[171px]",
      buttonIcon: ArrowRight,
      route: "/datacenter",
    },
    {
      id: "workspace-card-1",
      title: "Warehouse ERP",
      titleTh: "Warehouse ERP",
      description: "Stock items tracking, real-time SKU movements, stock allocation, and dispatch optimization.",
      descriptionTh: "ติดตามสินค้าคงคลัง, ความเคลื่อนไหว SKU แบบเรียลไทม์, จัดสรรสต็อก และเพิ่มประสิทธิภาพการจัดส่ง",
      icon: Box,
      statusText: "Active",
      statusTextTh: "Active",
      statusDotColor: "#2EC4B6",
      pillWidth: "w-[66px]",
      buttonText: "Enter Workspace",
      buttonTextTh: "Enter Workspace",
      buttonWidth: "w-[171px]",
      buttonIcon: ArrowRight,
      route: "/warehouse",
    },
  ];

  const cardsRow2: WorkspaceCardItem[] = [
    {
      id: "workspace-card-2",
      title: "Reports & Auditing",
      titleTh: "Reports & Auditing",
      description: "Generate monthly statements, performance statistics, system audit logs, and risk reports.",
      descriptionTh: "สร้างใบแจ้งยอดรายเดือน, สถิติประสิทธิภาพ, บันทึกการตรวจสอบระบบ และรายงานความเสี่ยง",
      icon: FileText,
      statusText: "Maintenance",
      statusTextTh: "Maintenance",
      statusDotColor: "#FF9F1C",
      pillWidth: "w-[101px]",
      buttonText: "Enter Workspace",
      buttonTextTh: "Enter Workspace",
      buttonWidth: "w-[171px]",
      buttonIcon: ArrowRight,
      isMaintenance: true,
      route: "/reports",
    },
    {
      id: "workspace-card-3",
      title: "Integration Services",
      titleTh: "Integration Services",
      description: "API keys, external payment gateways mapping, CRM syncing, and ERP connections.",
      descriptionTh: "คีย์ API, การแมปเกตเวย์การชำระเงินภายนอก, การซิงค์ CRM และการเชื่อมต่อระบบ ERP",
      icon: Cpu,
      statusText: "Locked",
      statusTextTh: "Locked",
      statusDotColor: "#999999",
      pillWidth: "w-[71px]",
      buttonText: "Locked Module",
      buttonTextTh: "Locked Module",
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
        className={`group box-border flex flex-1 flex-col items-start p-[28px] gap-[20px] rounded-[12px] border transition-all duration-200 select-none min-h-[233px] w-full lg:w-[662px] ${
          isLocked
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer"
        } ${
          isLight
            ? "bg-white/95 border-[#E2E8F0] shadow-[0px_4px_12px_rgba(0,0,0,0.06)] hover:border-[#0D99FF]/40 hover:shadow-[0px_8px_20px_rgba(0,0,0,0.12)]"
            : "bg-[#383838] border-[#444444] shadow-[0px_4px_12px_rgba(0,0,0,0.101961)] hover:border-[#555555] hover:shadow-[0px_8px_24px_rgba(0,0,0,0.28)]"
        }`}
      >
        {/* card-top-row */}
        <div className="flex flex-row justify-between items-center p-0 w-full h-[48px] self-stretch">
          {/* icon-wrapper */}
          <div
            className={`box-border flex flex-row justify-center items-center p-0 w-[48px] h-[48px] rounded-[10px] border transition-colors ${
              isLight
                ? "bg-[#F1F5F9] border-[#E2E8F0]"
                : "bg-[#222222] border-[#444444]"
            }`}
          >
            <IconComponent
              size={24}
              stroke="#0D99FF"
              strokeWidth={2}
              className="shrink-0"
            />
          </div>

          {/* status-pill */}
          <div
            className={`box-border flex flex-row items-center justify-center px-[10px] py-[4px] gap-[6px] h-[22px] ${
              card.pillWidth
            } min-w-fit rounded-[100px] bg-transparent border-[1.5px] transition-colors ${
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

        {/* card-mid-text */}
        <div className="flex flex-col items-start p-0 gap-[8px] w-full self-stretch">
          {/* Title */}
          <h2
            className={`font-bold text-[18px] leading-[23px] tracking-tight ${
              isLight ? "text-[#0F172A]" : "text-[#FFFFFF]"
            }`}
            style={{ fontFamily: "var(--font-outfit), sans-serif" }}
          >
            {isThai ? card.titleTh : card.title}
          </h2>

          {/* Description */}
          <p
            className={`font-normal text-[13px] leading-[150%] ${
              isLight ? "text-[#64748B]" : "text-[#999999]"
            }`}
            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
          >
            {isThai ? card.descriptionTh : card.description}
          </p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          tabIndex={isLocked ? -1 : 0}
          className={`box-border flex flex-row justify-center items-center px-[16px] py-[10px] gap-[8px] h-[38px] ${
            card.buttonWidth
          } min-w-fit rounded-[8px] border transition-all duration-200 mt-auto whitespace-nowrap ${
            isLocked
              ? "cursor-not-allowed"
              : isLight
              ? "bg-[#F8FAFC] border-[#E2E8F0] text-[#64748B] group-hover:bg-[#0D99FF] group-hover:text-white group-hover:border-[#0D99FF]"
              : "bg-[#383838] border-[#444444] text-[#999999] group-hover:bg-[#444444] group-hover:text-white group-hover:border-[#666666]"
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
          className="relative z-10 w-full max-w-[1440px] mx-auto flex flex-col items-start px-6 sm:px-12 py-10 sm:py-16 gap-10 flex-1 self-stretch"
        >
          {/* hub-title-block */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, delay: 0.05, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col items-start p-0 gap-2 max-w-[507px]"
          >
            {/* Select Workspace */}
            <h1
              className={`font-bold text-[32px] leading-[40px] tracking-tight ${
                isLight ? "text-[#0F172A]" : "text-[#FFFFFF]"
              }`}
              style={{ fontFamily: "var(--font-outfit), sans-serif" }}
            >
              {isThai ? "เลือกพื้นที่ทำงาน" : "Select Workspace"}
            </h1>

            {/* Subtitle */}
            <p
              className={`font-normal text-[16px] leading-[21px] ${
                isLight ? "text-[#64748B]" : "text-[#999999]"
              }`}
              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
            >
              {isThai
                ? "เลือกโมดูลเฉพาะทางเพื่อเริ่มต้นการทำงานสำหรับ Horizon Logistics"
                : "Choose a dedicated module to begin operations for Horizon Logistics."}
            </p>
          </motion.div>

          {/* workspace-grid */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="w-full max-w-[1344px] flex flex-col items-start p-0 gap-[20px] self-stretch"
          >
            {/* grid-row-1 */}
            <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-start p-0 gap-[20px] self-stretch">
              {cardsRow1.map((card, idx) => renderCard(card, idx))}
            </div>

            {/* grid-row-2 */}
            <div className="w-full flex flex-col lg:flex-row items-stretch lg:items-start p-0 gap-[20px] self-stretch">
              {cardsRow2.map((card, idx) => renderCard(card, idx + 2))}
            </div>
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
