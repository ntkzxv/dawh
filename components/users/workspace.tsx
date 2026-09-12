"use client";

import React, { useEffect, useState } from "react";
import {
  Database,
  Box,
  FileText,
  Cpu,
  ArrowRight,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useLoading } from "@/components/loading_screen";
import { HeaderNavbar, MobileNavbar } from "@/components/navbar";
import { ProfileGuardModal } from "@/components/auth";
import { fetchAndStoreUserProfile, checkProfileCompleteness } from "@/utils/auth";
import { EmployeeProfile } from "@/types/user";

export interface WorkspaceViewProps {
  onNavigate?: (route: string) => void;
  lang?: "en" | "th";
}

interface WorkspaceCardItem {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor?: string;
  status: "active" | "maintenance" | "locked";
  statusLabel: string;
  statusColor: string;
  buttonText: string;
  isLocked?: boolean;
  opacityClass?: string;
  route?: string;
  loadingMessage?: string;
}

export default function WorkspaceView({ onNavigate }: WorkspaceViewProps) {
  const { theme } = useTheme();
  const { navigateWithLoading } = useLoading();
  const isLight = theme === "light";

  const [profile, setProfile] = useState<Partial<EmployeeProfile>>({});
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showGuardModal, setShowGuardModal] = useState(false);

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
        const userId =
          typeof window !== "undefined"
            ? localStorage.getItem("current_user_id")
            : null;
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

  const orgName = profile.department || "Horizon Logistics";

  const handleCardClick = (card: WorkspaceCardItem) => {
    if (card.isLocked) return;
    if (card.route) {
      if (onNavigate) {
        onNavigate(card.route);
      } else {
        navigateWithLoading(
          card.route,
          `Entering ${card.title}...`,
          "Connecting to workspace cluster"
        );
      }
    }
  };

  const cards: WorkspaceCardItem[] = [
    {
      id: "card-datacenter",
      title: "HP Datacenter",
      description:
        "Manage Hire-Purchase contracts, ledger controls, overdue recoveries, and customer profiles.",
      icon: Database,
      status: "active",
      statusLabel: "Active",
      statusColor: "#2EC4B6",
      buttonText: "Enter Workspace",
      route: "/datacenter",
    },
    {
      id: "card-warehouse",
      title: "Warehouse ERP",
      description:
        "Stock items tracking, real-time SKU movements, stock allocation, and dispatch optimization.",
      icon: Box,
      status: "active",
      statusLabel: "Active",
      statusColor: "#2EC4B6",
      buttonText: "Enter Workspace",
      route: "/warehouse",
    },
    {
      id: "card-reports",
      title: "Reports & Auditing",
      description:
        "Generate monthly statements, performance statistics, system audit logs, and risk reports.",
      icon: FileText,
      status: "maintenance",
      statusLabel: "Maintenance",
      statusColor: "#FF9F1C",
      buttonText: "Enter Workspace",
      route: "/reports",
    },
    {
      id: "card-integrations",
      title: "Integration Services",
      description:
        "API keys, external payment gateways mapping, CRM syncing, and ERP connections.",
      icon: Cpu,
      status: "locked",
      statusLabel: "Locked",
      statusColor: "#999999",
      buttonText: "Locked Module",
      isLocked: true,
      opacityClass: "opacity-50",
      route: "/integrations",
    },
  ];

  return (
    <div
      className={`relative min-h-dvh w-full flex flex-col justify-between overflow-x-hidden ${
        isLight
          ? "bg-[#F8FAFC] text-[#222222]"
          : "bg-[#2C2C2C] text-white"
      } transition-colors duration-300 font-sans select-none`}
    >
      {/* Top Official Navigation Headers from dawhold */}
      <HeaderNavbar showAccount={true} showLogo={true} />
      <MobileNavbar />

      {/* ================= PORTAL CONTENT BODY ================= */}
      <main className="flex-1 w-full max-w-[1440px] mx-auto flex flex-col justify-start items-start px-6 sm:px-12 py-10 sm:py-16 gap-10">
        {/* hub-title-block */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-start gap-2"
        >
          <h1
            className={`font-['Outfit'] font-bold text-[28px] sm:text-[32px] leading-[40px] ${
              isLight ? "text-[#222222]" : "text-white"
            }`}
          >
            Select Workspace
          </h1>
          <p className="font-['Geist'] font-normal text-[15px] sm:text-[16px] leading-[21px] text-[#999999]">
            Choose a dedicated module to begin operations for {orgName}.
          </p>
        </motion.div>

        {/* workspace-grid: 2 rows of 2 cards */}
        <div className="w-full flex flex-col items-stretch gap-5">
          {/* grid row 1 (HP Datacenter & Warehouse ERP) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            {cards.slice(0, 2).map((card, idx) => {
              const IconComponent = card.icon;
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  onClick={() => handleCardClick(card)}
                  className={`group relative flex flex-col justify-between p-7 rounded-[12px] border transition-all duration-200 cursor-pointer ${
                    card.opacityClass || ""
                  } ${
                    isLight
                      ? "bg-white border-[#E4E4E7] shadow-[0px_4px_12px_rgba(0,0,0,0.06)] hover:border-zinc-400"
                      : "bg-[#383838] border-[#444444] shadow-[0px_4px_12px_rgba(0,0,0,0.101961)] hover:border-zinc-500"
                  }`}
                  style={{ minHeight: "233px" }}
                >
                  {/* card-top-row */}
                  <div className="flex flex-row justify-between items-center w-full">
                    {/* icon-wrapper */}
                    <div
                      className={`w-12 h-12 rounded-[10px] border flex items-center justify-center shrink-0 ${
                        isLight
                          ? "bg-zinc-100 border-[#E4E4E7]"
                          : "bg-[#222222] border-[#444444]"
                      }`}
                    >
                      <IconComponent size={24} color="#0D99FF" />
                    </div>

                    {/* status-pill */}
                    <div
                      className={`flex flex-row items-center py-1 px-2.5 gap-1.5 rounded-full ${
                        isLight ? "bg-zinc-100" : "bg-[#222222]"
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: card.statusColor }}
                      />
                      <span
                        className={`font-['Geist'] font-semibold text-[11px] leading-[14px] ${
                          isLight ? "text-zinc-800" : "text-white"
                        }`}
                      >
                        {card.statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* card-mid-text */}
                  <div className="flex flex-col items-start gap-2 my-2">
                    <h2
                      className={`font-['Outfit'] font-bold text-[18px] leading-[23px] ${
                        isLight ? "text-[#222222]" : "text-white"
                      }`}
                    >
                      {card.title}
                    </h2>
                    <p className="font-['Geist'] font-normal text-[13px] leading-[150%] text-[#999999]">
                      {card.description}
                    </p>
                  </div>

                  {/* button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={card.isLocked}
                      className={`h-[38px] px-4 rounded-[8px] border flex flex-row items-center justify-center gap-2 font-['Geist'] font-semibold text-[14px] leading-[18px] text-[#999999] transition-all group-hover:text-white ${
                        isLight
                          ? "bg-zinc-50 border-[#E4E4E7] group-hover:bg-zinc-200 group-hover:text-[#222222]"
                          : "bg-[#383838] border-[#444444] group-hover:border-[#666666] group-hover:bg-[#404040]"
                      }`}
                    >
                      <ArrowRight
                        size={16}
                        className="text-[#999999] group-hover:translate-x-0.5 transition-transform"
                      />
                      <span>{card.buttonText}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* grid row 2 (Reports & Auditing & Integration Services) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full">
            {cards.slice(2, 4).map((card, idx) => {
              const IconComponent = card.icon;
              return (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.16 + idx * 0.08 }}
                  onClick={() => handleCardClick(card)}
                  className={`group relative flex flex-col justify-between p-7 rounded-[12px] border transition-all duration-200 ${
                    card.isLocked ? "cursor-not-allowed" : "cursor-pointer"
                  } ${card.opacityClass || ""} ${
                    isLight
                      ? "bg-white border-[#E4E4E7] shadow-[0px_4px_12px_rgba(0,0,0,0.06)] hover:border-zinc-400"
                      : "bg-[#383838] border-[#444444] shadow-[0px_4px_12px_rgba(0,0,0,0.101961)] hover:border-zinc-500"
                  }`}
                  style={{ minHeight: "233px" }}
                >
                  {/* card-top-row */}
                  <div className="flex flex-row justify-between items-center w-full">
                    {/* icon-wrapper */}
                    <div
                      className={`w-12 h-12 rounded-[10px] border flex items-center justify-center shrink-0 ${
                        isLight
                          ? "bg-zinc-100 border-[#E4E4E7]"
                          : "bg-[#222222] border-[#444444]"
                      }`}
                    >
                      <IconComponent size={24} color="#0D99FF" />
                    </div>

                    {/* status-pill */}
                    <div
                      className={`flex flex-row items-center py-1 px-2.5 gap-1.5 rounded-full ${
                        isLight ? "bg-zinc-100" : "bg-[#222222]"
                      }`}
                    >
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: card.statusColor }}
                      />
                      <span
                        className={`font-['Geist'] font-semibold text-[11px] leading-[14px] ${
                          isLight ? "text-zinc-800" : "text-white"
                        }`}
                      >
                        {card.statusLabel}
                      </span>
                    </div>
                  </div>

                  {/* card-mid-text */}
                  <div className="flex flex-col items-start gap-2 my-2">
                    <h2
                      className={`font-['Outfit'] font-bold text-[18px] leading-[23px] ${
                        isLight ? "text-[#222222]" : "text-white"
                      }`}
                    >
                      {card.title}
                    </h2>
                    <p className="font-['Geist'] font-normal text-[13px] leading-[150%] text-[#999999]">
                      {card.description}
                    </p>
                  </div>

                  {/* button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      disabled={card.isLocked}
                      className={`h-[38px] px-4 rounded-[8px] border flex flex-row items-center justify-center gap-2 font-['Geist'] font-semibold text-[14px] leading-[18px] text-[#999999] transition-all ${
                        card.isLocked
                          ? "opacity-80 cursor-not-allowed"
                          : isLight
                          ? "bg-zinc-50 border-[#E4E4E7] group-hover:bg-zinc-200 group-hover:text-[#222222]"
                          : "bg-[#383838] border-[#444444] group-hover:border-[#666666] group-hover:bg-[#404040] group-hover:text-white"
                      }`}
                    >
                      {card.isLocked ? (
                        <Lock size={16} className="text-[#999999]" />
                      ) : (
                        <ArrowRight
                          size={16}
                          className="text-[#999999] group-hover:translate-x-0.5 transition-transform"
                        />
                      )}
                      <span>{card.buttonText}</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ================= PORTAL FOOTER ================= */}
      <footer
        className={`w-full flex flex-row justify-center items-center py-6 px-4 border-t shrink-0 ${
          isLight ? "border-[#E4E4E7]" : "border-[#444444]"
        }`}
        style={{ minHeight: "64px" }}
      >
        <p className="font-['Geist'] font-normal text-[12px] leading-[16px] text-[#999999] text-center">
          dawh Premium ERP Platform © 2026. All operations secured with TLS 1.3 encryption.
        </p>
      </footer>

      {/* Profile Guard Modal if profile is incomplete */}
      <ProfileGuardModal
        isOpen={showGuardModal}
        missingFields={missingFields}
        onClose={() => setShowGuardModal(false)}
        onGoToSettings={() => {
          setShowGuardModal(false);
          if (onNavigate) onNavigate("account");
          else navigateWithLoading("/account");
        }}
      />
    </div>
  );
}
