"use client";

import React, { useEffect, useState } from "react";
import {
  UserCircle,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Code2,
  Cpu,
  Layers,
  Clock,
  KeyRound,
  Building2,
  Lock,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { supabase } from "@/utils/supabase";
import { checkProfileCompleteness, fetchAndStoreUserProfile } from "@/utils/auth";
import { useLoading } from "@/components/loading_screen";
import { HeaderNavbar, MobileNavbar } from "@/components/navbar";
import { ProfileGuardModal } from "@/components/auth";
import { EmployeeProfile } from "@/types/user";
import { useAppLanguage } from "@/utils/language";

export interface WorkspaceViewProps {
  onNavigate?: (route: string) => void;
  lang?: "en" | "th";
}

export type PortalViewProps = WorkspaceViewProps;

export default function WorkspaceView({ onNavigate }: WorkspaceViewProps) {
  const { theme } = useTheme();
  const { navigateWithLoading } = useLoading();
  const isLight = theme === "light";

  const appLang = useAppLanguage();
  const activeLang: "en" | "th" = appLang.toLowerCase() as "en" | "th";
  const isThai = activeLang === "th";

  const [profile, setProfile] = useState<Partial<EmployeeProfile>>({});
  const [isProfileComplete, setIsProfileComplete] = useState(true);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showGuardModal, setShowGuardModal] = useState(false);
  const [currentTime, setCurrentTime] = useState("");

  // Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(isThai ? "th-TH" : "en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, [isThai]);

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

  const displayName = profile.first_name_th
    ? `${profile.prefix || ""} ${profile.first_name_th} ${profile.last_name_th || ""}`.trim()
    : profile.first_name
    ? `${profile.first_name} ${profile.last_name || ""}`.trim()
    : profile.username || (isThai ? "ผู้ใช้งานระบบ" : "Authorized User");

  const roleDisplay = (profile.role || "staff").toUpperCase();
  const departmentDisplay = profile.department || (isThai ? "ฝ่ายปฏิบัติการทั่วไป" : "General Operations");
  const staffCodeDisplay = profile.staff_code || (profile.id ? `EMP-${profile.id.slice(0, 4).toUpperCase()}` : "EMP-1001");

  const handleOpenAccount = () => {
    if (onNavigate) onNavigate("account");
    else navigateWithLoading("/account");
  };

  return (
    <div
      className={`relative min-h-dvh w-full flex flex-col justify-between overflow-x-hidden ${
        isLight
          ? "bg-[#F8FAFC] text-[#222222]"
          : "bg-[#1E1E1E] text-white"
      } transition-colors duration-300 font-sans`}
    >
      {/* Top Navigation Headers */}
      <HeaderNavbar showAccount={true} showLogo={true} />
      <MobileNavbar />

      {/* Main Content Hub */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col justify-center">
        {/* Hero Greeting Section */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 md:mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-zinc-200 dark:border-zinc-800">
            <div>
              <div className="flex items-center gap-2.5 mb-2">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {isThai ? "ระบบพร้อมใช้งาน" : "System Online"}
                </span>
                <span className="text-xs font-mono text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                  <Clock size={12} />
                  {currentTime}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
                {isThai ? `สวัสดี, ${displayName}` : `Welcome back, ${displayName}`}
              </h1>
              <p className="mt-1 text-sm sm:text-base text-zinc-600 dark:text-zinc-400">
                {isThai
                  ? "ศูนย์ควบคุมระบบหลัก (DAWH Workspace Portal) — สภาพแวดล้อมพร้อมสำหรับการ Refactor ทั้งเว็บใหม่"
                  : "DAWH Enterprise Operations Hub — Workspace clean slate ready for application refactoring."}
              </p>
            </div>

            {/* Quick Profile Summary Badge */}
            <div className="flex items-center gap-3 p-3 rounded-2xl border bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm border-zinc-200 dark:border-zinc-800 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center font-bold text-sm">
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
                ) : (
                  <UserCircle size={24} className="text-zinc-500" />
                )}
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <span>{staffCodeDisplay}</span>
                  <span className="px-1.5 py-0.2 rounded text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-mono">
                    {roleDisplay}
                  </span>
                </div>
                <div className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate max-w-[160px]">
                  {departmentDisplay}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* 2 Core Feature Cards: Account & Architecture Status */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Card 1: Account Management (Prominent Action) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-5 flex flex-col justify-between p-6 sm:p-8 rounded-3xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-all group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-blue-500/10 via-transparent to-transparent rounded-bl-full pointer-events-none" />

            <div>
              <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5">
                <UserCircle size={26} />
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {isThai ? "การจัดการบัญชีผู้ใช้" : "Identity & Account"}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold mt-1 mb-2">
                {isThai ? "โปรไฟล์และการตั้งค่าบัญชี" : "Account & Security Profile"}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                {isThai
                  ? "จัดการข้อมูลพนักงาน, เลขบัตรประชาชน, ข้อมูลติดต่อฉุกเฉิน, สังกัดสาขา, และตั้งรหัส Quick PIN สำหรับเข้าใช้งานระบบอย่างปลอดภัย"
                  : "Manage personal records, national ID, emergency contacts, branch association, and configure Quick PIN credentials."}
              </p>

              {/* Status List */}
              <div className="space-y-2.5 mb-6 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                    <ShieldCheck size={15} className="text-emerald-500" />
                    {isThai ? "สถานะโปรไฟล์" : "Profile Completeness"}
                  </span>
                  <span className={`font-semibold ${isProfileComplete ? "text-emerald-600 dark:text-emerald-400" : "text-amber-500"}`}>
                    {isProfileComplete ? (isThai ? "สมบูรณ์ 100%" : "Complete") : (isThai ? "ต้องระบุข้อมูลเพิ่ม" : "Incomplete")}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                    <KeyRound size={15} className="text-blue-500" />
                    {isThai ? "รหัส Quick PIN 6 หลัก" : "Quick PIN Security"}
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {profile.is_pin_enabled ? (isThai ? "เปิดใช้งานแล้ว" : "Enabled") : (isThai ? "ยังไม่ได้ตั้งค่า" : "Not configured")}
                  </span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-100 dark:border-zinc-800">
                  <span className="text-zinc-600 dark:text-zinc-400 flex items-center gap-2">
                    <Building2 size={15} className="text-purple-500" />
                    {isThai ? "สาขาที่สังกัด" : "Assigned Branch"}
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-[140px]">
                    {profile.branch_name || "Headquarter (HQ-01)"}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleOpenAccount}
              className="w-full py-3 px-4 rounded-xl bg-zinc-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-100 text-white dark:text-zinc-900 font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm active:scale-[0.99] cursor-pointer"
            >
              <span>{isThai ? "เข้าสู่หน้าจัดการบัญชี" : "Open Account Settings"}</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>

          {/* Card 2: Restored Operational Ecosystem (Datacenter, Warehouse, Control Panel) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-7 flex flex-col justify-between p-6 sm:p-8 rounded-3xl border bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-blue-500/10 via-transparent to-transparent rounded-bl-full pointer-events-none" />

            <div>
              <div className="flex items-center justify-between gap-2 mb-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Cpu size={26} />
                </div>
                <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  ALL SYSTEMS ONLINE
                </span>
              </div>

              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                {isThai ? "ศูนย์รวมระบบปฏิบัติการหลัก" : "Enterprise Operations Hub"}
              </span>
              <h2 className="text-xl sm:text-2xl font-bold mt-1 mb-2">
                {isThai ? "โมดูลระบบถูกกู้คืนพร้อมใช้งานอย่างสมบูรณ์" : "Core Systems & Modules Fully Restored"}
              </h2>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                {isThai
                  ? "ระบบดาต้าเซ็นเตอร์สัญญาเช่าซื้อ คลังสินค้าและสินค้าคงคลัง และแผงควบคุมระบบ ได้รับการกู้คืนพร้อมเชื่อมต่อกับระบบฐานข้อมูลและความปลอดภัยแล้ว"
                  : "HP Datacenter Operations, Multi-Branch Warehouse ERP, and System Governance Control Panel are fully restored and connected."}
              </p>

              {/* 3 Operational Module Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                {/* Module 1: HP Datacenter */}
                <button
                  type="button"
                  onClick={() => navigateWithLoading("/datacenter", "กำลังเปิดระบบศูนย์ข้อมูล...", "กำลังเชื่อมต่อกับฐานข้อมูล Datacenter")}
                  className="p-4 rounded-2xl border bg-zinc-50/70 hover:bg-zinc-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/80 border-zinc-200/70 dark:border-zinc-700/60 text-left transition-all group/card cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3">
                    <Layers size={18} />
                  </div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1 flex items-center justify-between">
                    <span>{isThai ? "ศูนย์ข้อมูล HP" : "Datacenter"}</span>
                    <ArrowRight size={13} className="text-zinc-400 group-hover/card:translate-x-0.5 transition-transform" />
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                    {isThai ? "สัญญาเช่าซื้อ, ลูกค้า KYC, การเงิน และการติดตามหนี้" : "Hire-Purchase, CRM, Analytics & Risk"}
                  </p>
                </button>

                {/* Module 2: Warehouse ERP */}
                <button
                  type="button"
                  onClick={() => navigateWithLoading("/warehouse", "กำลังเปิดระบบคลังสินค้า...", "กำลังโหลดข้อมูลสินค้าและสต็อกคงคลัง")}
                  className="p-4 rounded-2xl border bg-zinc-50/70 hover:bg-zinc-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/80 border-zinc-200/70 dark:border-zinc-700/60 text-left transition-all group/card cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-3">
                    <Building2 size={18} />
                  </div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1 flex items-center justify-between">
                    <span>{isThai ? "คลังสินค้า ERP" : "Warehouse"}</span>
                    <ArrowRight size={13} className="text-zinc-400 group-hover/card:translate-x-0.5 transition-transform" />
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                    {isThai ? "สต็อกสินค้าคงคลัง, ตรวจรับ, โอนย้าย และประวัติ" : "Stock, Inbound, Transfers & Suppliers"}
                  </p>
                </button>

                {/* Module 3: Control Panel */}
                <button
                  type="button"
                  onClick={() => navigateWithLoading("/controlpanel", "กำลังเปิดแผงควบคุมระบบ...", "กำลังตรวจสอบสิทธิ์ RBAC")}
                  className="p-4 rounded-2xl border bg-zinc-50/70 hover:bg-zinc-100 dark:bg-zinc-800/40 dark:hover:bg-zinc-800/80 border-zinc-200/70 dark:border-zinc-700/60 text-left transition-all group/card cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
                    <Lock size={18} />
                  </div>
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-white mb-1 flex items-center justify-between">
                    <span>{isThai ? "แผงควบคุม" : "Control Panel"}</span>
                    <ArrowRight size={13} className="text-zinc-400 group-hover/card:translate-x-0.5 transition-transform" />
                  </h3>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-snug">
                    {isThai ? "จัดการสิทธิ์ RBAC, บทบาท และบันทึก Audit" : "RBAC Governance, Security & Logs"}
                  </p>
                </button>
              </div>
            </div>

            {/* Quick Status Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-100 dark:border-zinc-800 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="flex items-center gap-1.5 font-mono">
                <ShieldCheck size={14} className="text-emerald-500" />
                TLS 1.3 | RBAC Multi-Domain Protected
              </span>
              <span className="font-mono text-[11px]">
                DAWH Platform v2.0
              </span>
            </div>
          </motion.div>
        </div>
      </main>

      {/* Clean Footer */}
      <footer className="w-full border-t border-zinc-200 dark:border-zinc-800 py-6 px-4 text-center text-xs text-zinc-500 dark:text-zinc-400">
        <p>
          {isThai
            ? "ระบบบริหารจัดการ dawh Platform © 2026. พร้อมสำหรับการพัฒนาและ Refactor โครงสร้างใหม่"
            : "dawh Enterprise Platform © 2026. Clean architecture foundation ready for next-generation refactor."}
        </p>
      </footer>

      {/* Profile Guard Modal if profile is incomplete */}
      <ProfileGuardModal
        isOpen={showGuardModal}
        missingFields={missingFields}
        onClose={() => setShowGuardModal(false)}
        onGoToSettings={() => {
          setShowGuardModal(false);
        }}
      />
    </div>
  );
}

export { WorkspaceView, WorkspaceView as PortalView };
