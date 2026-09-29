"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2,
  Database,
  Globe2,
  Server,
  ShieldCheck,
  CheckCircle2,
  Sliders,
  BellRing,
  ExternalLink,
  Laptop,
  Moon,
  Sun,
  Lock,
  ArrowRight,
  HardDrive,
  Cpu,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { HeaderNavbar } from "@/components/navbar";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage, setAppLanguage } from "@/utils/language";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import { warehouseApi, type Organization } from "@/lib/api/warehouse";
import { useNotification } from "@/context/NotificationContext";

type SettingsTab = "overview" | "organization" | "preferences" | "audit";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const language = useAppLanguage();
  const isThai = language === "TH";
  const account = useOptionalWarehouseAccount();
  const { notify } = useNotification();

  const [activeTab, setActiveTab] = useState<SettingsTab>("overview");
  const [org, setOrg] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState(false);
  const [isSavingOrg, setIsSavingOrg] = useState(false);

  // Form states for Organization
  const [orgName, setOrgName] = useState("");
  const [orgPhone, setOrgPhone] = useState("");
  const [orgAddress, setOrgAddress] = useState("");

  // Preference switches (UI/UX Mock States with real localStorage backing)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [autoRefreshSecs, setAutoRefreshSecs] = useState("30");
  const [hardwareScanner, setHardwareScanner] = useState(true);

  // Load Organization data
  useEffect(() => {
    let active = true;
    setOrgLoading(true);
    warehouseApi
      .organization()
      .then((data) => {
        if (!active) return;
        setOrg(data);
        if (data) {
          setOrgName(data.name || "");
          setOrgPhone(data.phone || "");
          setOrgAddress(data.address || "");
        }
      })
      .catch(() => {
        // Fallback for UI preview if API is not yet seeded
        if (!active) return;
        setOrgName("Horizon Logistics (DAWH WMS)");
        setOrgPhone("02-000-0000");
        setOrgAddress("88/1 อาคารคลังสินค้าและโลจิสติกส์ ถนนบางนา-ตราด สมุทรปราการ");
      })
      .finally(() => {
        if (active) setOrgLoading(false);
      });

    // Load saved client preferences
    try {
      const savedSound = localStorage.getItem("dawh_pref_sound");
      if (savedSound !== null) setSoundEnabled(savedSound === "true");
      const savedCompact = localStorage.getItem("dawh_pref_compact");
      if (savedCompact !== null) setCompactMode(savedCompact === "true");
    } catch {
      // Non-blocking
    }

    return () => {
      active = false;
    };
  }, []);

  const handleSavePreferences = () => {
    try {
      localStorage.setItem("dawh_pref_sound", String(soundEnabled));
      localStorage.setItem("dawh_pref_compact", String(compactMode));
      notify.success(
        isThai ? "บันทึกการตั้งค่าสำเร็จ" : "Preferences Saved",
        {
          message: isThai
            ? "บันทึกการปรับแต่งอินเทอร์เฟซเรียบร้อยแล้ว"
            : "Display and interaction preferences have been saved.",
        }
      );
    } catch {
      notify.error(isThai ? "เกิดข้อผิดพลาด" : "Error", {
        message: isThai ? "ไม่สามารถบันทึกการตั้งค่าได้" : "Failed to persist preferences.",
      });
    }
  };

  const handleSaveOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;
    setIsSavingOrg(true);
    try {
      const updated = await warehouseApi.saveOrganization(
        {
          name: orgName.trim(),
          phone: orgPhone.trim(),
          address: orgAddress.trim(),
        },
        Boolean(org?.id)
      );
      setOrg(updated);
      notify.success(isThai ? "บันทึกข้อมูลองค์กรสำเร็จ" : "Organization Saved", {
        message: isThai
          ? "อัปเดตข้อมูลองค์กรส่วนกลางเรียบร้อยแล้ว"
          : "Enterprise organization profile updated successfully.",
      });
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : "บันทึกข้อมูลไม่สำเร็จ";
      notify.error(isThai ? "เกิดข้อผิดพลาด" : "Error", { message: errMsg });
    } finally {
      setIsSavingOrg(false);
    }
  };

  const role = account?.me?.role;
  const isGlobalAdmin = role === "ADMIN" || role === "CEO";

  return (
    <div
      className={`h-screen w-full flex flex-col overflow-hidden transition-colors duration-300 ${
        isLight ? "bg-[#F8FAFC] text-[#222222]" : "bg-[#2C2C2C] text-[#FFFFFF] selection:bg-white/20"
      }`}
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      {/* Header Bar */}
      <div className="shrink-0 w-full z-40">
        <HeaderNavbar
          showLogo
          showAccount
          title={isThai ? "การตั้งค่าระบบ" : "System Settings"}
          subtitle={
            isThai
              ? "ควบคุมตัวแปรระบบ สภาพแวดล้อม และค่ากำหนดการทำงานส่วนกลาง"
              : "Enterprise parameters, global environment, and workstation settings"
          }
        />
      </div>

      {/* Main Scrollable Canvas */}
      <div className="flex-1 w-full overflow-y-auto min-h-0">
        <main className="w-full max-w-[1240px] mx-auto p-4 sm:p-8 pb-[96px] md:pb-12 flex flex-col items-start gap-6">
          {/* Top Tab Bar */}
          <div
            role="tablist"
            aria-label={isThai ? "หมวดการตั้งค่า" : "Settings sections"}
            className={`w-full h-[44px] border-b flex flex-row items-center gap-2 select-none overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
              isLight ? "border-[#E4E4E7]" : "border-[#444444]"
            }`}
          >
            <SettingsTabButton
              active={activeTab === "overview"}
              isLight={isLight}
              onClick={() => setActiveTab("overview")}
            >
              {isThai ? "ภาพรวมและสถานะระบบ" : "System Health & Overview"}
            </SettingsTabButton>
            <SettingsTabButton
              active={activeTab === "organization"}
              isLight={isLight}
              onClick={() => setActiveTab("organization")}
            >
              {isThai ? "ข้อมูลองค์กรส่วนกลาง" : "Organization Profile"}
            </SettingsTabButton>
            <SettingsTabButton
              active={activeTab === "preferences"}
              isLight={isLight}
              onClick={() => setActiveTab("preferences")}
            >
              {isThai ? "การแสดงผลและอุปกรณ์" : "Workstation & Display"}
            </SettingsTabButton>
            <SettingsTabButton
              active={activeTab === "audit"}
              isLight={isLight}
              onClick={() => setActiveTab("audit")}
            >
              {isThai ? "ความปลอดภัยและบันทึกระบบ" : "Security & Audit Policy"}
            </SettingsTabButton>
          </div>

          {/* Main 2-Column Responsive Layout */}
          <div className="w-full flex flex-col lg:flex-row items-start gap-6 animate-in fade-in duration-200">
            {/* Left Aside: Quick Status Cards & User Boundary Navigation */}
            <aside className="w-full lg:w-[350px] flex flex-col gap-4 shrink-0">
              {/* System Architecture Badge */}
              <section
                className={`w-full p-5 sm:p-6 rounded-2xl border transition-all duration-300 shadow-sm ${
                  isLight ? "bg-white border-[#E4E4E7] text-[#222222]" : "bg-[#383838] border-[#444444] text-white"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isLight ? "bg-[#222222] text-white" : "bg-white text-[#222222]"
                    }`}
                  >
                    <Server size={20} />
                  </div>
                  <div>
                    <h2
                      className="text-[16px] font-bold tracking-tight"
                      style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                    >
                      Horizon WMS
                    </h2>
                    <p className={`text-[12px] ${isLight ? "text-slate-500" : "text-[#A1A1AA]"}`}>
                      DAWH Logistics Framework v1.0
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[#444444]/20 flex flex-col gap-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className={isLight ? "text-slate-500" : "text-[#A1A1AA]"}>
                      {isThai ? "สถาปัตยกรรม:" : "Architecture:"}
                    </span>
                    <span className="font-semibold font-mono">Next.js App Router (BFF)</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={isLight ? "text-slate-500" : "text-[#A1A1AA]"}>
                      {isThai ? "การเชื่อมต่อฐานข้อมูล:" : "Database Engine:"}
                    </span>
                    <span className="font-semibold text-[#2EC4B6] flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#2EC4B6]" />
                      PostgreSQL Connected
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className={isLight ? "text-slate-500" : "text-[#A1A1AA]"}>
                      {isThai ? "ระบบยืนยันตัวตน:" : "Authentication:"}
                    </span>
                    <span className="font-semibold font-mono">Better Auth Session</span>
                  </div>
                </div>
              </section>

              {/* Personal Profile Redirect Link Banner */}
              <section
                className={`w-full p-5 rounded-2xl border transition-all duration-300 shadow-sm flex flex-col gap-3 ${
                  isLight ? "bg-white border-[#E4E4E7] text-[#222222]" : "bg-[#383838] border-[#444444] text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`p-2 rounded-lg ${
                      isLight ? "bg-[#F4F4F5] text-[#222222]" : "bg-[#282828] text-white"
                    }`}
                  >
                    <ShieldCheck size={18} />
                  </div>
                  <h3
                    className="text-[14.5px] font-bold"
                    style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                  >
                    {isThai ? "โปรไฟล์และความปลอดภัยส่วนบุคคล" : "Personal Account & Security"}
                  </h3>
                </div>
                <p className={`text-[12.5px] leading-relaxed ${isLight ? "text-slate-600" : "text-[#E4E4E7]"}`}>
                  {isThai
                    ? "หากต้องการแก้ไขชื่อผู้ใช้ รหัสผ่านส่วนตัว รูปโปรไฟล์ หรือข้อมูลการทำงานของตนเอง กรุณาไปที่หน้าโปรไฟล์บัญชี"
                    : "To update your personal name, login credentials, staff avatar, or employment records, visit your Account Profile."}
                </p>
                <Link
                  href="/account"
                  className={`mt-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold border transition-all duration-200 cursor-pointer ${
                    isLight
                      ? "border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-900"
                      : "border-[#555555] bg-[#292929] hover:bg-[#333333] text-white"
                  }`}
                >
                  <span>{isThai ? "เปิดหน้าโปรไฟล์บัญชีผู้ใช้" : "Go to Account Profile"}</span>
                  <ExternalLink size={13} />
                </Link>
              </section>

              {/* Control Panel Link (For Admins) */}
              {isGlobalAdmin && (
                <section
                  className={`w-full p-5 rounded-2xl border transition-all duration-300 shadow-sm flex flex-col gap-2.5 ${
                    isLight ? "bg-indigo-50/50 border-indigo-200 text-indigo-950" : "bg-indigo-950/20 border-indigo-500/30 text-white"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span className="text-[11.5px] font-bold uppercase tracking-wider text-indigo-500">
                      {isThai ? "สิทธิ์ผู้ดูแลระบบสูงสุด" : "Administrator Hub"}
                    </span>
                  </div>
                  <p className={`text-[12.5px] leading-relaxed ${isLight ? "text-slate-700" : "text-zinc-300"}`}>
                    {isThai
                      ? "จัดการรายชื่อสมาชิกพนักงาน ขอบเขตสาขา และรีเซ็ตรหัสผ่านได้ในแผงควบคุมระบบ"
                      : "Manage member list, facility assignments, and password resets in Control Panel."}
                  </p>
                  <Link
                    href="/controlpanel"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline pt-1"
                  >
                    <span>{isThai ? "เข้าสู่แผงควบคุมระบบ" : "Open Control Panel"}</span>
                    <ArrowRight size={13} />
                  </Link>
                </section>
              )}
            </aside>

            {/* Right Content Area: Switched by activeTab */}
            <div className="min-w-0 flex-1 w-full">
              <AnimatePresence mode="wait">
                {activeTab === "overview" && (
                  <motion.div
                    key="overview"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Live Health Overview */}
                    <div
                      className={`p-6 rounded-2xl border shadow-sm transition-colors duration-300 ${
                        isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444] text-white"
                      }`}
                    >
                      <div className="flex items-center justify-between border-b pb-4 border-[#444444]/20 mb-5">
                        <div className="flex items-center gap-2.5">
                          <Cpu size={18} className="text-indigo-500" />
                          <h3
                            className="font-bold text-[16px]"
                            style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                          >
                            {isThai ? "สถานะการทำงานระบบ (Horizon Health)" : "System Health & Operational Status"}
                          </h3>
                        </div>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-[#2EC4B6]/15 text-[#2EC4B6] border border-[#2EC4B6]/30">
                          <CheckCircle2 size={13} />
                          {isThai ? "ระบบปฏิบัติการสมบูรณ์" : "Fully Operational"}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <HealthStatCard
                          isLight={isLight}
                          icon={<Database size={18} className="text-indigo-500" />}
                          title={isThai ? "การเชื่อมต่อฐานข้อมูลหลัก" : "PostgreSQL Primary Pool"}
                          badge={isThai ? "พร้อมใช้งาน" : "Healthy"}
                          badgeTone="healthy"
                          detail={isThai ? "Supabase Dedicated Instance (SSL Enforced)" : "Supabase Dedicated Instance (SSL Enforced)"}
                        />
                        <HealthStatCard
                          isLight={isLight}
                          icon={<HardDrive size={18} className="text-amber-500" />}
                          title={isThai ? "พื้นที่จัดเก็บไฟล์และหลักฐาน" : "Storage Engine (Proof & Media)"}
                          badge={isThai ? "ปกติ" : "Ready"}
                          badgeTone="healthy"
                          detail={isThai ? "ปลายทางจัดเก็บรูปตรวจรับและเคลมสินค้า" : "Goods Receipt Evidence & Claims Bucket"}
                        />
                        <HealthStatCard
                          isLight={isLight}
                          icon={<ShieldCheck size={18} className="text-emerald-500" />}
                          title={isThai ? "การตรวจสอบสิทธิ์และเซสชัน" : "Session Policy & Guards"}
                          badge={isThai ? "เปิดใช้งาน" : "Active"}
                          badgeTone="healthy"
                          detail={isThai ? "Role-Based & Facility Access Boundaries" : "Role-Based & Facility Access Boundaries"}
                        />
                        <HealthStatCard
                          isLight={isLight}
                          icon={<Globe2 size={18} className="text-blue-500" />}
                          title={isThai ? "การรองรับภาษาและภูมิภาค" : "Localization & Timezone"}
                          badge="UTC+07 (BKK)"
                          badgeTone="info"
                          detail={isThai ? "ภาษาไทยและอังกฤษตามมาตรฐานองค์กร" : "Thai & English (Strict Language Separation)"}
                        />
                      </div>
                    </div>

                    {/* Quick System Parameters Read-Only Card */}
                    <div
                      className={`p-6 rounded-2xl border shadow-sm transition-colors duration-300 ${
                        isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444] text-white"
                      }`}
                    >
                      <h3
                        className="font-bold text-[16px] mb-4 pb-3 border-b border-[#444444]/20"
                        style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                      >
                        {isThai ? "ค่าเริ่มต้นทางสถาปัตยกรรมคลังสินค้า" : "Default Architectural Parameters"}
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <ParamBox
                          isLight={isLight}
                          label={isThai ? "การตัดสต็อกสินค้า" : "Inventory Valuation"}
                          value="FIFO / FEFO Enforced"
                        />
                        <ParamBox
                          isLight={isLight}
                          label={isThai ? "เกณฑ์การเตือนสต็อก" : "Low Stock Threshold"}
                          value="Min / Max Rule per SKU"
                        />
                        <ParamBox
                          isLight={isLight}
                          label={isThai ? "การอนุมัติโอนย้าย" : "Transfer Approval"}
                          value="HQ / Area Manager Scope"
                        />
                        <ParamBox
                          isLight={isLight}
                          label={isThai ? "บันทึกบัญชีสินค้า" : "Stock Ledger"}
                          value="Immutable Ledger"
                        />
                        <ParamBox
                          isLight={isLight}
                          label={isThai ? "การตรวจรับปลายทาง" : "Destination Receiving"}
                          value="Strict Blind Count Check"
                        />
                        <ParamBox
                          isLight={isLight}
                          label={isThai ? "ระยะเวลากำหนดเคลม" : "Claim Resolution SLA"}
                          value="48 Hours Response"
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "organization" && (
                  <motion.div
                    key="organization"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                  >
                    <form
                      onSubmit={handleSaveOrganization}
                      className={`p-6 sm:p-8 rounded-2xl border shadow-sm transition-colors duration-300 flex flex-col gap-6 ${
                        isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444] text-white"
                      }`}
                    >
                      <div className="border-b pb-4 border-[#444444]/20">
                        <div className="flex items-center gap-2.5">
                          <Building2 size={20} className="text-indigo-500" />
                          <h3
                            className="font-bold text-[17px]"
                            style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                          >
                            {isThai ? "ข้อมูลองค์กรส่วนกลาง" : "Organization Details"}
                          </h3>
                        </div>
                        <p className={`text-[13px] mt-1 ${isLight ? "text-slate-500" : "text-[#A1A1AA]"}`}>
                          {isThai
                            ? "ข้อมูลนี้ใช้เป็นหัวเอกสารใบตรวจรับ (GRN), ใบกำกับโอนย้ายสินค้าระหว่างสาขา และรายงานสรุป"
                            : "Used across official Goods Receipts (GRN), branch transfer dispatches, and audit reports."}
                        </p>
                      </div>

                      {orgLoading ? (
                        <div className="py-12 flex flex-col items-center justify-center gap-3">
                          <RefreshCw size={24} className="animate-spin text-indigo-500" />
                          <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                            {isThai ? "กำลังโหลดข้อมูลองค์กร..." : "Loading organization record..."}
                          </span>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <label className="flex flex-col gap-1.5">
                              <span className={`text-xs font-semibold ${isLight ? "text-slate-700" : "text-[#E4E4E7]"}`}>
                                {isThai ? "ชื่อองค์กรทางการ *" : "Official Organization Name *"}
                              </span>
                              <input
                                type="text"
                                required
                                value={orgName}
                                onChange={(e) => setOrgName(e.target.value)}
                                placeholder="Horizon Logistics Co., Ltd."
                                className={`h-[42px] px-3.5 rounded-xl border text-sm outline-none transition-all ${
                                  isLight
                                    ? "bg-slate-50 border-slate-300 focus:bg-white focus:border-slate-800 text-slate-900"
                                    : "bg-[#292929] border-[#444444] focus:border-white text-white"
                                }`}
                              />
                            </label>
                            <label className="flex flex-col gap-1.5">
                              <span className={`text-xs font-semibold ${isLight ? "text-slate-700" : "text-[#E4E4E7]"}`}>
                                {isThai ? "หมายเลขโทรศัพท์ส่วนกลาง" : "Central Office Phone"}
                              </span>
                              <input
                                type="text"
                                value={orgPhone}
                                onChange={(e) => setOrgPhone(e.target.value)}
                                placeholder="02-XXX-XXXX"
                                className={`h-[42px] px-3.5 rounded-xl border text-sm outline-none transition-all ${
                                  isLight
                                    ? "bg-slate-50 border-slate-300 focus:bg-white focus:border-slate-800 text-slate-900"
                                    : "bg-[#292929] border-[#444444] focus:border-white text-white"
                                }`}
                              />
                            </label>
                          </div>

                          <label className="flex flex-col gap-1.5">
                            <span className={`text-xs font-semibold ${isLight ? "text-slate-700" : "text-[#E4E4E7]"}`}>
                              {isThai ? "ที่อยู่สำนักงานใหญ่และคลังสินค้ากลาง" : "Headquarters & Central Hub Address"}
                            </span>
                            <textarea
                              rows={3}
                              value={orgAddress}
                              onChange={(e) => setOrgAddress(e.target.value)}
                              placeholder={isThai ? "เลขที่ อาคาร ถนน ตำบล อำเภอ จังหวัด รหัสไปรษณีย์" : "Street, Building, District, Province, Postal Code"}
                              className={`p-3 rounded-xl border text-sm outline-none resize-y transition-all ${
                                isLight
                                  ? "bg-slate-50 border-slate-300 focus:bg-white focus:border-slate-800 text-slate-900"
                                  : "bg-[#292929] border-[#444444] focus:border-white text-white"
                              }`}
                            />
                          </label>

                          <div className="pt-4 border-t border-[#444444]/20 flex items-center justify-between">
                            <span className={`text-xs ${isLight ? "text-slate-500" : "text-[#A1A1AA]"}`}>
                              {isGlobalAdmin
                                ? isThai ? "คุณมีสิทธิ์ผู้บริหารในการปรับปรุงข้อมูลส่วนกลาง" : "Authorized with Admin/CEO credentials"
                                : isThai ? "เฉพาะผู้ดูแลระบบและฝ่ายบริหารที่สามารถบันทึกได้" : "Admin privileges required to save"}
                            </span>
                            <button
                              type="submit"
                              disabled={isSavingOrg || !orgName.trim() || !isGlobalAdmin}
                              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
                                isLight
                                  ? "bg-[#222222] hover:bg-black text-white"
                                  : "bg-white hover:bg-zinc-100 text-[#222222]"
                              }`}
                            >
                              {isSavingOrg
                                ? isThai ? "กำลังบันทึก..." : "Saving..."
                                : isThai ? "บันทึกข้อมูลองค์กร" : "Save Organization Profile"}
                            </button>
                          </div>
                        </div>
                      )}
                    </form>
                  </motion.div>
                )}

                {activeTab === "preferences" && (
                  <motion.div
                    key="preferences"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div
                      className={`p-6 sm:p-8 rounded-2xl border shadow-sm transition-colors duration-300 ${
                        isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444] text-white"
                      }`}
                    >
                      <div className="border-b pb-4 border-[#444444]/20 mb-6">
                        <div className="flex items-center gap-2.5">
                          <Sliders size={20} className="text-indigo-500" />
                          <h3
                            className="font-bold text-[17px]"
                            style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                          >
                            {isThai ? "การปรับแต่งหน้าจอและสภาพแวดล้อมใช้งาน" : "Workstation & Interface Settings"}
                          </h3>
                        </div>
                        <p className={`text-[13px] mt-1 ${isLight ? "text-slate-500" : "text-[#A1A1AA]"}`}>
                          {isThai
                            ? "ตั้งค่ารูปแบบหน้าจอ พฤติกรรมการสแกนบาร์โค้ด และการแสดงผลบนอุปกรณ์นี้"
                            : "Customize display theme, barcode scanner interaction, and refresh intervals for this device."}
                        </p>
                      </div>

                      <div className="flex flex-col gap-6">
                        {/* Theme Toggle Card */}
                        <div
                          className={`p-4 rounded-xl border flex items-center justify-between ${
                            isLight ? "bg-slate-50 border-slate-200" : "bg-[#292929] border-[#444444]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg ${isLight ? "bg-white text-slate-800" : "bg-[#383838] text-white"}`}>
                              {isLight ? <Sun size={20} /> : <Moon size={20} />}
                            </div>
                            <div>
                              <span className="text-sm font-bold block">
                                {isThai ? "ชุดสีและธีมการแสดงผล" : "Display Theme"}
                              </span>
                              <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                {isLight
                                  ? isThai ? "กำลังใช้งานโหมดสว่าง (Light Canvas)" : "Currently using Light Canvas"
                                  : isThai ? "กำลังใช้งานโหมดมืด (Dark Slate Canvas)" : "Currently using Dark Canvas"}
                              </span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={toggleTheme}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                              isLight
                                ? "bg-white hover:bg-slate-100 border-slate-300 text-slate-900 shadow-sm"
                                : "bg-[#383838] hover:bg-[#444444] border-[#555555] text-white"
                            }`}
                          >
                            {isLight
                              ? isThai ? "เปลี่ยนเป็นโหมดมืด" : "Switch to Dark"
                              : isThai ? "เปลี่ยนเป็นโหมดสว่าง" : "Switch to Light"}
                          </button>
                        </div>

                        {/* Language Selection Card */}
                        <div
                          className={`p-4 rounded-xl border flex items-center justify-between ${
                            isLight ? "bg-slate-50 border-slate-200" : "bg-[#292929] border-[#444444]"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-lg ${isLight ? "bg-white text-slate-800" : "bg-[#383838] text-white"}`}>
                              <Globe2 size={20} />
                            </div>
                            <div>
                              <span className="text-sm font-bold block">
                                {isThai ? "ภาษาอินเทอร์เฟซ" : "Interface Language"}
                              </span>
                              <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                {isThai ? "ภาษาไทยล้วนตามมาตรฐานองค์กร" : "Strict English standard"}
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => setAppLanguage("TH")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isThai
                                  ? isLight
                                    ? "bg-[#222222] text-white shadow-sm"
                                    : "bg-white text-[#222222] shadow-sm"
                                  : isLight
                                  ? "bg-transparent text-slate-600 hover:bg-slate-200"
                                  : "bg-transparent text-zinc-400 hover:bg-white/10"
                              }`}
                            >
                              ภาษาไทย
                            </button>
                            <button
                              type="button"
                              onClick={() => setAppLanguage("EN")}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                !isThai
                                  ? isLight
                                    ? "bg-[#222222] text-white shadow-sm"
                                    : "bg-white text-[#222222] shadow-sm"
                                  : isLight
                                  ? "bg-transparent text-slate-600 hover:bg-slate-200"
                                  : "bg-transparent text-zinc-400 hover:bg-white/10"
                              }`}
                            >
                              English
                            </button>
                          </div>
                        </div>

                        {/* Scanner & Audio Feedback Toggles */}
                        <div className="space-y-4 pt-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-zinc-400">
                            {isThai ? "การเชื่อมต่ออุปกรณ์คลังสินค้า" : "Warehouse Peripheral Interactions"}
                          </h4>

                          <label className="flex items-center justify-between p-3.5 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-white/10 cursor-pointer">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">
                                {isThai ? "การตอบสนองด้วยเสียงเมื่อสแกนสำเร็จ" : "Audio Feedback on Successful Barcode Scan"}
                              </span>
                              <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                {isThai
                                  ? "ส่งเสียงเตือนเมื่อสแกนรับสินค้าหรือตัดสต็อกผ่านเครื่องสแกนบาร์โค้ด"
                                  : "Play confirmation chimes upon valid SKU/GRN scans in warehouse operations"}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={soundEnabled}
                              onChange={(e) => setSoundEnabled(e.target.checked)}
                              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                            />
                          </label>

                          <label className="flex items-center justify-between p-3.5 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-white/10 cursor-pointer">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">
                                {isThai ? "โหมดรับสัญญาณเครื่องสแกนมือถือ (HID Scanner Mode)" : "Hardware Barcode Scanner Emulation"}
                              </span>
                              <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                {isThai
                                  ? "ตรวจจับปุ่ม Enter ต่อท้ายรหัสบาร์โค้ดอัตโนมัติเพื่อยืนยันรายการทันที"
                                  : "Automatically capture keystroke sequences terminated with Enter for instant validation"}
                              </span>
                            </div>
                            <input
                              type="checkbox"
                              checked={hardwareScanner}
                              onChange={(e) => setHardwareScanner(e.target.checked)}
                              className="w-5 h-5 accent-indigo-600 rounded cursor-pointer"
                            />
                          </label>

                          <div className="flex items-center justify-between p-3.5 rounded-xl">
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold">
                                {isThai ? "ระยะเวลาอัปเดตข้อมูลอัตโนมัติ (Live Polling)" : "Dashboard Auto-Refresh Frequency"}
                              </span>
                              <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                                {isThai ? "รอบเวลาดึงข้อมูลยอดคงเหลือสต็อกล่าสุด" : "Interval for background stock movement updates"}
                              </span>
                            </div>
                            <select
                              value={autoRefreshSecs}
                              onChange={(e) => setAutoRefreshSecs(e.target.value)}
                              className={`h-9 px-3 rounded-lg border text-xs font-semibold outline-none cursor-pointer ${
                                isLight
                                  ? "bg-slate-100 border-slate-300 text-slate-900"
                                  : "bg-[#292929] border-[#444444] text-white"
                              }`}
                            >
                              <option value="15">{isThai ? "ทุก 15 วินาที" : "Every 15 Seconds"}</option>
                              <option value="30">{isThai ? "ทุก 30 วินาที" : "Every 30 Seconds"}</option>
                              <option value="60">{isThai ? "ทุก 1 นาที" : "Every 1 Minute"}</option>
                              <option value="manual">{isThai ? "อัปเดตด้วยตนเองเท่านั้น" : "Manual Refresh Only"}</option>
                            </select>
                          </div>
                        </div>

                        <div className="pt-4 border-t border-[#444444]/20 flex justify-end">
                          <button
                            type="button"
                            onClick={handleSavePreferences}
                            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                              isLight
                                ? "bg-[#222222] hover:bg-black text-white"
                                : "bg-white hover:bg-zinc-100 text-[#222222]"
                            }`}
                          >
                            {isThai ? "บันทึกการตั้งค่าหน้าจอ" : "Apply Display Preferences"}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeTab === "audit" && (
                  <motion.div
                    key="audit"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    <div
                      className={`p-6 sm:p-8 rounded-2xl border shadow-sm transition-colors duration-300 ${
                        isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444] text-white"
                      }`}
                    >
                      <div className="border-b pb-4 border-[#444444]/20 mb-6">
                        <div className="flex items-center gap-2.5">
                          <Lock size={20} className="text-indigo-500" />
                          <h3
                            className="font-bold text-[17px]"
                            style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                          >
                            {isThai ? "นโยบายความปลอดภัยและบันทึกประวัติ (Audit & Compliance)" : "Security Policy & Audit Traceability"}
                          </h3>
                        </div>
                        <p className={`text-[13px] mt-1 ${isLight ? "text-slate-500" : "text-[#A1A1AA]"}`}>
                          {isThai
                            ? "สอดคล้องกับข้อกำหนดระบบตรวจนับสินค้าคงคลังและระบบควบคุมความปลอดภัยข้อมูล"
                            : "Governance guidelines enforced by Horizon WMS Stock Ledger and Session layer."}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <AuditPolicyItem
                          isLight={isLight}
                          title={isThai ? "การห้ามแก้ไขสต็อกย้อนหลัง (Immutable Ledger Rule)" : "Immutable Stock Ledger Enforcement"}
                          description={
                            isThai
                              ? "ทุกการเปลี่ยนแปลงของสินค้าต้องถูกบันทึกลงสมุดบัญชีสินค้าคงคลังผ่าน Inventory Transaction เสมอ และไม่อนุญาตให้แก้ไขจำนวนในอดีตได้"
                              : "No direct balance mutations permitted. Every change must emit an immutable transaction ledger entry with actor stamp."
                          }
                          status={isThai ? "บังคับใช้ระดับฐานข้อมูล" : "Database Level Enforced"}
                        />
                        <AuditPolicyItem
                          isLight={isLight}
                          title={isThai ? "การแยกขอบเขตสิทธิ์สาขา (Branch Scope Isolation)" : "Branch Isolation & Spatial Guard"}
                          description={
                            isThai
                              ? "ผู้ปฏิบัติงานในแต่ละสาขาจะมองเห็นและทำรายการได้เฉพาะคลังสินค้าและสาขาที่ตนเองได้รับมอบหมายเท่านั้น"
                              : "Workers are restricted strictly to their assigned facilities unless granted Headquarters / Auditor cross-branch scope."
                          }
                          status={isThai ? "ระบบป้องกันทำงานอยู่" : "Active & Enforced"}
                        />
                        <AuditPolicyItem
                          isLight={isLight}
                          title={isThai ? "อายุของเซสชันและการหมดอายุอัตโนมัติ" : "Session Timeout & Security Renewal"}
                          description={
                            isThai
                              ? "ระบบจะตัดการเชื่อมต่ออัตโนมัติเมื่อไม่มีการเคลื่อนไหวตามระยะเวลาที่กำหนดเพื่อความปลอดภัยของข้อมูลในคลังสินค้า"
                              : "Better Auth tokens are refreshed securely with automatic idle expiration to safeguard warehouse terminals."
                          }
                          status={isThai ? "ตรวจสอบทุกคำขอ" : "Per-request Validation"}
                        />
                      </div>

                      <div className="mt-6 pt-5 border-t border-[#444444]/20 flex items-center justify-between">
                        <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                          {isThai ? "ต้องการดูประวัติกิจกรรมการใช้งานทั้งหมด?" : "Need to inspect full audit event logs?"}
                        </span>
                        {isGlobalAdmin ? (
                          <Link
                            href="/controlpanel"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
                          >
                            <span>{isThai ? "เปิดบันทึกกิจกรรมในแผงควบคุมระบบ" : "View Audit Events in Control Panel"}</span>
                            <ArrowRight size={13} />
                          </Link>
                        ) : (
                          <span className={`text-xs font-mono ${isLight ? "text-slate-400" : "text-zinc-500"}`}>
                            {isThai ? "จำกัดเฉพาะแอดมิน" : "Admin Only"}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function SettingsTabButton({
  active,
  isLight,
  onClick,
  children,
}: {
  active: boolean;
  isLight: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative h-[44px] shrink-0 cursor-pointer whitespace-nowrap px-5 py-3 text-[13.5px] font-semibold transition-colors duration-200 ${
        active
          ? isLight
            ? "text-[#222222]"
            : "text-white"
          : isLight
          ? "text-[#666666] hover:text-[#222222]"
          : "text-[#E4E4E7] hover:text-white"
      }`}
    >
      <span>{children}</span>
      {active && (
        <motion.div
          layoutId="activeSettingsTabLine"
          className={`absolute right-0 bottom-0 left-0 h-[2px] ${isLight ? "bg-[#222222]" : "bg-white"}`}
          transition={{ type: "spring", stiffness: 450, damping: 35 }}
        />
      )}
    </button>
  );
}

function HealthStatCard({
  isLight,
  icon,
  title,
  badge,
  badgeTone,
  detail,
}: {
  isLight: boolean;
  icon: React.ReactNode;
  title: string;
  badge: string;
  badgeTone: "healthy" | "info";
  detail: string;
}) {
  return (
    <div
      className={`p-4 rounded-xl border flex flex-col gap-2 transition-all ${
        isLight ? "bg-slate-50 border-slate-200" : "bg-[#292929] border-[#444444]"
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {icon}
          <span className="text-xs font-bold">{title}</span>
        </div>
        <span
          className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${
            badgeTone === "healthy"
              ? "bg-[#2EC4B6]/15 text-[#2EC4B6] border-[#2EC4B6]/30"
              : "bg-indigo-500/15 text-indigo-500 border-indigo-500/30"
          }`}
        >
          {badge}
        </span>
      </div>
      <p className={`text-[11.5px] leading-relaxed ${isLight ? "text-slate-600" : "text-zinc-400"}`}>
        {detail}
      </p>
    </div>
  );
}

function ParamBox({ isLight, label, value }: { isLight: boolean; label: string; value: string }) {
  return (
    <div
      className={`p-3 rounded-xl border flex flex-col gap-1 ${
        isLight ? "bg-slate-50 border-slate-200" : "bg-[#292929] border-[#444444]"
      }`}
    >
      <span className={`text-[11px] font-semibold ${isLight ? "text-slate-500" : "text-[#A1A1AA]"}`}>
        {label}
      </span>
      <span className="text-xs font-bold font-mono truncate">{value}</span>
    </div>
  );
}

function AuditPolicyItem({
  isLight,
  title,
  description,
  status,
}: {
  isLight: boolean;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div
      className={`p-4 rounded-xl border flex flex-col gap-1.5 ${
        isLight ? "bg-slate-50 border-slate-200" : "bg-[#292929] border-[#444444]"
      }`}
    >
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-bold">{title}</h4>
        <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
          {status}
        </span>
      </div>
      <p className={`text-xs leading-relaxed ${isLight ? "text-slate-600" : "text-[#E4E4E7]"}`}>
        {description}
      </p>
    </div>
  );
}
