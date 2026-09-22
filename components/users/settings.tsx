"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Sun,
  Moon,
  ShieldCheck,
  Bell,
  Volume2,
  Volume1,
  VolumeX,
  User,
  ArrowRight,
  Sliders,
  Check,
  CheckCircle2,
  Laptop,
  Smartphone,
  LogOut,
  Loader2,
  Globe,
  ChevronDown,
  Wifi,
  RefreshCw,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useNotification } from "@/context/NotificationContext";
import { useLoading } from "@/components/loading_screen";
import { authClient, getCurrentSession } from "@/lib/auth-client";
import { fetchAndStoreUserProfile } from "@/lib/user-profile";
import { getAppMe, type AppMe } from "@/lib/api/session";
import { readPendingRegistrationProfile } from "@/lib/auth/pending-profile";
import type { EmployeeProfile } from "@/types/user";
import { HeaderNavbar, MobileNavbar } from "@/components/navbar";
import { useAppLanguage, setAppLanguage } from "@/utils/language";

export type SettingsTabType = "appearance" | "sessions" | "notifications";

export interface SettingsViewProps {
  onNavigate?: (target: string) => void;
  onBack?: () => void;
  initialTab?: SettingsTabType;
}

export default function SettingsView({
  onNavigate,
  onBack,
  initialTab = "appearance",
}: SettingsViewProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { notify } = useNotification();
  const { navigateWithLoading } = useLoading();
  const isLight = theme === "light";

  // Language State
  const lang = useAppLanguage();
  const isThai = lang === "TH";

  // Tab State: 'appearance' | 'sessions' | 'notifications'
  const [activeTab, setActiveTab] = useState<SettingsTabType>(() => {
    if (initialTab && initialTab !== ("security" as unknown as SettingsTabType)) return initialTab;
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("tab");
      if (param === "sessions" || param === "devices") {
        return "sessions";
      }
      if (param === "notifications" || param === "alerts") {
        return "notifications";
      }
    }
    return "appearance";
  });

  // Profile State
  const [profile, setProfile] = useState<Partial<EmployeeProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [appMe, setAppMe] = useState<AppMe | null>(null);

  // Notification Preferences State (stored in localStorage)
  const [toastDuration, setToastDuration] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dawh_toast_duration");
      if (saved) return parseInt(saved, 10);
    }
    return 5000;
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dawh_sound_enabled");
      if (saved !== null) return saved === "true";
    }
    return true;
  });

  const [soundVolume, setSoundVolume] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dawh_sound_volume");
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) return parsed;
      }
    }
    return 70;
  });

  /** Play a Web Audio API synthesized sound (Soft Bell preset) */
  const playSoundPreset = (preset: string = "bell", vol?: number) => {
    try {
      const actualVol = (vol !== undefined ? vol : (soundVolume / 100)) * 0.6;
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(actualVol, ctx.currentTime);
      gain.connect(ctx.destination);

      const play = (freq: number, start: number, dur: number, type: OscillatorType = "sine", endFreq?: number) => {
        const osc = ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime + start);
        if (endFreq !== undefined) {
          osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + start + dur);
        }
        const g = ctx.createGain();
        g.gain.setValueAtTime(actualVol, ctx.currentTime + start);
        g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
        osc.connect(g);
        g.connect(gain);
        osc.start(ctx.currentTime + start);
        osc.stop(ctx.currentTime + start + dur);
      };

      switch (preset) {
        case "bell":
          play(523, 0, 0.8);
          play(659, 0.05, 0.6);
          break;
        case "chime":
          play(880, 0, 0.4);
          play(1047, 0.12, 0.5);
          play(1319, 0.24, 0.6);
          break;
        case "ping":
          play(1760, 0, 0.5, "sine", 880);
          break;
        case "pop":
          play(200, 0, 0.06, "square", 80);
          play(400, 0.06, 0.08, "sine", 200);
          break;
        case "double":
          play(1000, 0, 0.12, "sine", 700);
          play(1000, 0.2, 0.12, "sine", 700);
          break;
        case "alert":
          play(440, 0, 0.15, "square");
          play(554, 0.18, 0.15, "square");
          play(659, 0.36, 0.25, "square");
          break;
        default:
          play(523, 0, 0.8);
          play(659, 0.05, 0.6);
      }

      setTimeout(() => ctx.close(), 2000);
    } catch {
      // Browser may block AudioContext without user gesture — silent fail
    }
  };

  const [securityAlertsEnabled, setSecurityAlertsEnabled] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dawh_security_alerts");
      if (saved !== null) return saved === "true";
    }
    return true;
  });

  // Table Preferences State (stored in localStorage)
  const [tablePageSize, setTablePageSize] = useState<number>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("dawh_table_page_size");
      if (saved) return parseInt(saved, 10);
    }
    return 10;
  });
  const [isTablePageSizeDropdownOpen, setIsTablePageSizeDropdownOpen] = useState(false);
  const tablePageSizeDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        tablePageSizeDropdownRef.current &&
        !tablePageSizeDropdownRef.current.contains(event.target as Node)
      ) {
        setIsTablePageSizeDropdownOpen(false);
      }
    }
    if (isTablePageSizeDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isTablePageSizeDropdownOpen]);

  // Active Sessions Management State
  const [isRevokingSessions, setIsRevokingSessions] = useState(false);
  const [otherSessionsTerminated, setOtherSessionsTerminated] = useState(false);

  // Real session list from Better Auth
  type BaSession = {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
    ipAddress?: string | null;
    userAgent?: string | null;
  };
  const [sessions, setSessions] = useState<BaSession[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  // Fetch real sessions whenever the sessions tab is active
  useEffect(() => {
    if (activeTab !== "sessions") return;
    let cancelled = false;

    async function loadSessions() {
      setSessionsLoading(true);
      try {
        // Get current session token so we can mark it as "current"
        const current = await getCurrentSession();
        if (!cancelled && current?.session?.token) {
          setCurrentToken(current.session.token);
        }
        // List all sessions
        const result = await authClient.listSessions();
        if (!cancelled && result?.data) {
          setSessions(result.data as BaSession[]);
        }
      } catch (err) {
        console.warn("Could not load sessions:", err);
      } finally {
        if (!cancelled) setSessionsLoading(false);
      }
    }

    loadSessions();
    return () => { cancelled = true; };
  }, [activeTab]);



  // Load user profile
  useEffect(() => {
    let cachedProfile: Partial<EmployeeProfile> | null = null;
    try {
      const cached = localStorage.getItem("dawh_user_profile");
      if (cached) {
        cachedProfile = JSON.parse(cached);
        if (cachedProfile) setProfile(cachedProfile);
      }
    } catch {
      // Non-blocking
    }

    async function loadUserProfile() {
      if (!cachedProfile) setIsLoading(true);
      try {
        try {
          const me = await getAppMe();
          if (me?.data) setAppMe(me.data);
        } catch {
          // non-blocking
        }

        const session = await getCurrentSession();
        const targetId = session?.user.id;
        const targetEmail = session?.user.email;

        if (targetId) {
          let fetched: EmployeeProfile | null = null;
          try {
            fetched = await fetchAndStoreUserProfile(targetId, targetEmail);
          } catch (profileError) {
            console.warn("Unable to load employee profile for settings:", profileError);
          }

          if (fetched) {
            setProfile(fetched);
            return;
          }

          const pending = readPendingRegistrationProfile();
          const pendingProfile: Partial<EmployeeProfile> = {
            id: targetId,
            email: targetEmail || "",
            username: pending?.username || "",
            first_name: pending?.firstName || session.user.name?.split(" ")[0] || "",
            last_name: pending?.lastName || session.user.name?.split(" ").slice(1).join(" ") || "",
            full_name: session.user.name || undefined,
          };
          setProfile(pendingProfile);
        }
      } catch (err) {
        console.error("Error loading user profile in settings:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserProfile();
  }, []);

  const fullName =
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.username ||
    profile.email ||
    "—";

  const initials =
    (profile.first_name?.[0] || profile.username?.[0] || (fullName !== "—" ? fullName.charAt(0) : "U")).toUpperCase() +
    (profile.last_name?.[0] || "").toUpperCase();

  const handleUpdateDuration = (duration: number) => {
    setToastDuration(duration);
    if (typeof window !== "undefined") {
      localStorage.setItem("dawh_toast_duration", duration.toString());
    }
    notify.info(
      isThai ? "บันทึกระยะเวลาแจ้งเตือนแล้ว" : "Notification Duration Updated",
      {
        message: isThai
          ? `ตั้งค่าให้แจ้งเตือนแสดงค้างไว้ ${duration / 1000} วินาที`
          : `Toast notifications will now show for ${duration / 1000}s`,
        duration: 3000,
      }
    );
  };

  const handleToggleSound = () => {
    const nextVal = !soundEnabled;
    setSoundEnabled(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("dawh_sound_enabled", String(nextVal));
    }
    if (nextVal) {
      // Play Soft Bell preview on enable
      setTimeout(() => playSoundPreset("bell"), 100);
      notify.success(
        isThai ? "เปิดใช้งานเสียงแจ้งเตือน" : "Sound Enabled",
        {
          message: isThai ? "ระบบจะส่งเสียงระฆังนุ่ม (Soft Bell) เมื่อมีการแจ้งเตือน" : "Soft Bell chime enabled for alerts",
          duration: 3000,
        }
      );
    } else {
      notify.normal(
        isThai ? "ปิดเสียงแจ้งเตือนแล้ว" : "Sound Muted",
        {
          message: isThai ? "ระบบจะทำงานในโหมดเงียบ" : "Alerts will now be silent",
          duration: 3000,
        }
      );
    }
  };

  const handleVolumeChange = (newVolume: number) => {
    setSoundVolume(newVolume);
    if (typeof window !== "undefined") {
      localStorage.setItem("dawh_sound_volume", String(newVolume));
    }
  };

  const handlePreviewSound = (volOverride?: number) => {
    playSoundPreset("bell", volOverride !== undefined ? volOverride / 100 : undefined);
  };

  const handleToggleSecurityAlerts = () => {
    const nextVal = !securityAlertsEnabled;
    setSecurityAlertsEnabled(nextVal);
    if (typeof window !== "undefined") {
      localStorage.setItem("dawh_security_alerts", String(nextVal));
    }
    notify.info(
      nextVal
        ? (isThai ? "เปิดการแจ้งเตือนความปลอดภัย" : "Security Alerts Enabled")
        : (isThai ? "ปิดการแจ้งเตือนความปลอดภัยชั่วคราว" : "Security Alerts Muted"),
      {
        duration: 3000,
      }
    );
  };

  const handleTestToast = () => {
    notify.success(
      isThai ? "ทดสอบการแจ้งเตือนระบบสำเร็จ" : "Toast Notification Preview",
      {
        message: isThai
          ? "นี่คือตัวอย่างกล่องแจ้งเตือนความสำเร็จตามระบบมาตรฐาน DAWH"
          : "This is a demonstration of the DAWH standard notification component.",
        duration: toastDuration,
      }
    );
  };

  const handleUpdatePageSize = (size: number) => {
    setTablePageSize(size);
    if (typeof window !== "undefined") {
      localStorage.setItem("dawh_table_page_size", size.toString());
    }
    notify.success(
      isThai ? "บันทึกจำนวนแถวเริ่มต้นแล้ว" : "Default Page Size Saved",
      {
        message: isThai
          ? `กำหนดให้ตารางแสดงผลเริ่มต้นหน้าละ ${size} แถว`
          : `Tables will now display ${size} rows per page by default.`,
        duration: 3000,
      }
    );
  };



  const handleRevokeOtherSessions = async () => {
    setIsRevokingSessions(true);
    try {
      const { error } = await authClient.revokeOtherSessions();
      if (error) throw new Error(error.message);

      // Update local session list — keep only the current session
      setSessions((prev) => prev.filter((s) => s.token === currentToken));
      setOtherSessionsTerminated(true);
      notify.success(
        isThai ? "ออกจากระบบอุปกรณ์อื่นสำเร็จ" : "Other Sessions Revoked",
        {
          message: isThai
            ? "ระบบได้ยกเลิกสิทธิ์การเข้าใช้งานจากอุปกรณ์และเบราว์เซอร์อื่นทั้งหมดแล้ว"
            : "All other sessions and devices have been logged out successfully.",
          duration: 4000,
        }
      );
    } catch (err) {
      const msg = (err instanceof Error ? err.message : null) ||
        (isThai ? "เกิดข้อผิดพลาดในการยกเลิกเซสชัน" : "Failed to revoke sessions");
      notify.error(msg);
    } finally {
      setIsRevokingSessions(false);
    }
  };

  const handleRevokeSession = async (token: string) => {
    try {
      const { error } = await authClient.revokeSession({ token });
      if (error) throw new Error(error.message);
      setSessions((prev) => prev.filter((s) => s.token !== token));
      notify.success(
        isThai ? "ยกเลิกเซสชันสำเร็จ" : "Session Revoked",
        { duration: 3000 }
      );
    } catch (err) {
      const msg = (err instanceof Error ? err.message : null) ||
        (isThai ? "ไม่สามารถยกเลิกเซสชันได้" : "Failed to revoke session");
      notify.error(msg);
    }
  };

  /** Parse a user-agent string into a human-readable label */
  function parseUserAgent(ua: string | null | undefined): { device: string; icon: "laptop" | "phone" | "globe" } {
    if (!ua) return { device: isThai ? "อุปกรณ์ไม่ทราบชนิด" : "Unknown Device", icon: "globe" };
    const lower = ua.toLowerCase();
    const isMobile = /mobile|android|iphone|ipad|ipod/.test(lower);
    const isTablet = /ipad|tablet/.test(lower);

    let browser = "Browser";
    if (/chrome/.test(lower) && !/chromium|edg/.test(lower)) browser = "Chrome";
    else if (/firefox/.test(lower)) browser = "Firefox";
    else if (/safari/.test(lower) && !/chrome/.test(lower)) browser = "Safari";
    else if (/edg/.test(lower)) browser = "Edge";
    else if (/opera|opr/.test(lower)) browser = "Opera";

    let os = "";
    if (/windows/.test(lower)) os = "Windows";
    else if (/macintosh|mac os x/.test(lower)) os = "Mac";
    else if (/iphone/.test(lower)) os = "iPhone";
    else if (/ipad/.test(lower)) os = "iPad";
    else if (/android/.test(lower)) os = "Android";
    else if (/linux/.test(lower)) os = "Linux";

    const device = os ? `${os} • ${browser}` : browser;
    const icon = isTablet ? "laptop" : isMobile ? "phone" : "laptop";
    return { device, icon };
  }

  function formatSessionTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date;
    const now = Date.now();
    const diff = now - d.getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return isThai ? "เพิ่งใช้งาน" : "Just now";
    if (minutes < 60) return isThai ? `${minutes} นาทีที่แล้ว` : `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return isThai ? `${hours} ชั่วโมงที่แล้ว` : `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return isThai ? `${days} วันที่แล้ว` : `${days} days ago`;
    return d.toLocaleDateString();
  }

  return (
    <div
      className={`h-screen w-full flex flex-col overflow-hidden transition-colors duration-300 ${
        isLight
          ? "bg-[#FFFFFF] text-[#222222]"
          : "bg-[#2C2C2C] text-[#FFFFFF] selection:bg-white/20"
      }`}
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      {/* 1. APP HEADER */}
      <div className="shrink-0 w-full z-40">
        <HeaderNavbar
          showLogo={true}
          showAccount={true}
          title={isThai ? "การตั้งค่าระบบและบัญชี" : "System & Account Settings"}
          subtitle={
            isThai
              ? "ปรับแต่งธีมการแสดงผล ภาษา ความปลอดภัย และการแจ้งเตือน"
              : "Customize appearance, language, security credentials, and alerts"
          }
          onNavigate={onNavigate}
          onBack={onBack}
          lang={lang}
          onLangChange={setAppLanguage}
        />
        <MobileNavbar />
      </div>

      {/* 2. MAIN BODY */}
      <div className="flex-1 w-full overflow-y-auto min-h-0">
        <main className="w-full max-w-[1200px] mx-auto p-4 sm:p-8 pb-[96px] md:pb-8 flex flex-col items-start gap-6">

          {/* ADMIN CREDENTIAL RESET BANNER */}
          {(profile.needs_password_reset ||
            profile.needs_pin_reset ||
            (typeof window !== "undefined" &&
              (localStorage.getItem("dawh_needs_password_reset") === "true" ||
                localStorage.getItem("dawh_needs_pin_reset") === "true"))) && (
            <div
              className={`w-full p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 ${
                isLight
                  ? "bg-[#FFF7ED] border-[#FDBA74] text-[#9A3412] shadow-sm"
                  : "bg-[#2D1B13] border-[#7C2D12] text-[#FFEDD5] shadow-lg"
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <h3 className="font-bold text-[15px] leading-tight">
                  {isThai
                    ? "ผู้ดูแลระบบได้ทำการรีเซ็ตข้อมูลความปลอดภัยของคุณ"
                    : "Your security credentials have been reset by Admin"}
                </h3>
                <p className="text-[12.5px] leading-normal opacity-85">
                  {isThai
                    ? "คุณสามารถตั้งรหัสผ่านหรือรหัส PIN 6 หลักใหม่ได้ทันทีที่นี่"
                    : "You can set your new password or PIN below."}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {(profile.needs_password_reset ||
                  (typeof window !== "undefined" &&
                    localStorage.getItem("dawh_needs_password_reset") === "true")) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) onNavigate("account");
                      else navigateWithLoading("/account");
                    }}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer ${
                      isLight
                        ? "bg-[#EA580C] hover:bg-[#C2410C] text-white"
                        : "bg-[#FB923C] hover:bg-[#F97316] text-[#222222]"
                    }`}
                  >
                    <span>{isThai ? "ไปตั้งรหัสผ่านใหม่" : "Set New Password"}</span>
                  </button>
                )}

                {(profile.needs_pin_reset ||
                  (typeof window !== "undefined" &&
                    localStorage.getItem("dawh_needs_pin_reset") === "true")) && (
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigate) onNavigate("account");
                      else navigateWithLoading("/account");
                    }}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer ${
                      isLight
                        ? "bg-[#222222] hover:bg-black text-white"
                        : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#222222]"
                    }`}
                  >
                    <span>{isThai ? "ไปตั้งรหัส PIN ใหม่" : "Set New PIN"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* QUICK PROMPT TO ACCOUNT PROFILE */}
          <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-1 transition-all duration-300">
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`w-11 h-11 rounded-full border overflow-hidden flex items-center justify-center shrink-0 select-none ${
                  isLight ? "bg-[#F5F5F5] border-[#E5E5E5]" : "bg-[#282828] border-[#444444]"
                }`}
              >
                {profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatar_url} alt={fullName} className="w-full h-full object-cover" />
                ) : (
                  <span className={`font-bold text-[18px] ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                    {initials}
                  </span>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="font-bold text-[14.5px] leading-tight truncate">
                  {fullName}
                </span>
                <span className={`text-[12px] truncate ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                  {profile.email || "—"} • {profile.department || (isThai ? "ฝ่ายปฏิบัติการ" : "Operations")}
                </span>
              </div>
            </div>
          </div>

          {/* TABS NAVIGATION */}
          <div
            className={`w-full h-[42px] border-b flex flex-row items-start gap-2 select-none overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
              isLight ? "border-[#E4E4E7]" : "border-[#444444]"
            }`}
          >
            {/* Tab 1: Appearance & Display */}
            <button
              type="button"
              onClick={() => setActiveTab("appearance")}
              className={`relative px-6 py-3 h-[42px] text-[14px] leading-[18px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === "appearance"
                  ? isLight
                    ? "text-[#222222]"
                    : "text-[#FFFFFF]"
                  : isLight
                  ? "text-[#666666] hover:text-[#222222]"
                  : "text-[#E4E4E7] hover:text-[#FFFFFF]"
              }`}
            >
              <Sliders size={16} />
              <span>{isThai ? "รูปลักษณ์และระบบ" : "Appearance & System"}</span>
              {activeTab === "appearance" && (
                <motion.div
                  layoutId="activePlatformSettingsTabUnderline"
                  className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                    isLight ? "bg-[#222222]" : "bg-white"
                  }`}
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 35,
                  }}
                />
              )}
            </button>

            {/* Tab 2: Active Sessions & Connected Devices */}
            <button
              type="button"
              onClick={() => setActiveTab("sessions")}
              className={`relative px-6 py-3 h-[42px] text-[14px] leading-[18px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === "sessions"
                  ? isLight
                    ? "text-[#222222]"
                    : "text-[#FFFFFF]"
                  : isLight
                  ? "text-[#666666] hover:text-[#222222]"
                  : "text-[#E4E4E7] hover:text-[#FFFFFF]"
              }`}
            >
              <Laptop size={16} />
              <span>{isThai ? "อุปกรณ์และเซสชัน" : "Active Sessions"}</span>
              {activeTab === "sessions" && (
                <motion.div
                  layoutId="activePlatformSettingsTabUnderline"
                  className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                    isLight ? "bg-[#222222]" : "bg-white"
                  }`}
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 35,
                  }}
                />
              )}
            </button>

            {/* Tab 4: Notifications & Sound */}
            <button
              type="button"
              onClick={() => setActiveTab("notifications")}
              className={`relative px-6 py-3 h-[42px] text-[14px] leading-[18px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
                activeTab === "notifications"
                  ? isLight
                    ? "text-[#222222]"
                    : "text-[#FFFFFF]"
                  : isLight
                  ? "text-[#666666] hover:text-[#222222]"
                  : "text-[#E4E4E7] hover:text-[#FFFFFF]"
              }`}
            >
              <Bell size={16} />
              <span>{isThai ? "การแจ้งเตือน" : "Notifications"}</span>
              {activeTab === "notifications" && (
                <motion.div
                  layoutId="activePlatformSettingsTabUnderline"
                  className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                    isLight ? "bg-[#222222]" : "bg-white"
                  }`}
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 35,
                  }}
                />
              )}
            </button>
          </div>

          {/* TAB 1 CONTENT: APPEARANCE & SYSTEM */}
          {activeTab === "appearance" && (
            <div className="w-full flex flex-col gap-8 animate-in fade-in duration-200">
              
              {/* THEME SELECTION SECTION */}
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="font-bold text-[16px] leading-tight">
                    <span>{isThai ? "โหมดการแสดงผลของธีม (Theme Appearance)" : "Theme Appearance"}</span>
                  </h3>
                  <p className={`text-[13px] mt-1 ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                    {isThai
                      ? "เลือกระหว่างโหมดมืด (Dark Obsidian) และโหมดสว่าง (Clean Light) ระบบจะบันทึกค่าไว้โดยอัตโนมัติ"
                      : "Choose between Dark Obsidian mode and Clean Light mode. Preferences are saved automatically."}
                  </p>
                </div>

                {/* THEME SELECTION CARDS (Clean & Flat, no inner mockup box) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Card Light Mode */}
                  <div
                    onClick={() => setTheme("light")}
                    className={`relative p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between ${
                      isLight
                        ? "border-[#222222] bg-[#FFFFFF] shadow-sm ring-1 ring-[#222222]/15"
                        : "border-[#444444] bg-[#383838] hover:border-[#666666]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shadow-xs shrink-0 ${
                        isLight
                          ? "bg-[#222222] text-white border-[#222222]"
                          : "bg-[#282828] text-white border-[#444444]"
                      }`}>
                        <Sun size={20} />
                      </div>
                      <div>
                        <h4 className={`font-bold text-[14.5px] ${isLight ? "text-[#222222]" : "text-white"}`}>
                          {isThai ? "โหมดสว่าง (Light Mode)" : "Light Mode"}
                        </h4>
                        <span className={`text-[12px] ${isLight ? "text-slate-500" : "text-slate-400"}`}>
                          {isThai ? "โทนสว่าง สะอาดตา" : "Clean White"}
                        </span>
                      </div>
                    </div>
                    {isLight && (
                      <div className="w-6 h-6 rounded-full bg-[#222222] text-white flex items-center justify-center shadow-sm shrink-0">
                        <Check size={14} />
                      </div>
                    )}
                  </div>

                  {/* Card Dark Mode */}
                  <div
                    onClick={() => setTheme("dark")}
                    className={`relative p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between ${
                      !isLight
                        ? "border-white bg-[#383838] shadow-sm ring-1 ring-white/20"
                        : "border-[#E4E4E7] bg-[#FFFFFF] hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-100 shadow-xs shrink-0">
                        <Moon size={20} />
                      </div>
                      <div>
                        <h4 className={`font-bold text-[14.5px] ${!isLight ? "text-white" : "text-[#222222]"}`}>
                          {isThai ? "โหมดมืด (Dark Mode)" : "Dark Mode"}
                        </h4>
                        <span className={`text-[12px] ${!isLight ? "text-zinc-400" : "text-zinc-500"}`}>
                          {isThai ? "โทนมืด สบายตา" : "Obsidian Zinc"}
                        </span>
                      </div>
                    </div>
                    {!isLight && (
                      <div className="w-6 h-6 rounded-full bg-white text-[#222222] flex items-center justify-center shadow-sm shrink-0">
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* LANGUAGE SELECTION SECTION */}
              <div className="pt-6 border-t border-[#E4E4E7] dark:border-[#444444] flex flex-col gap-4">
                <div>
                  <h3 className="font-bold text-[16px] leading-tight">
                    <span>{isThai ? "ภาษาและภูมิภาค (Language & Region)" : "Language & Region"}</span>
                  </h3>
                  <p className={`text-[13px] mt-1 ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                    {isThai
                      ? "กำหนดภาษาหลักที่ใช้ในการแสดงผลเมนู ฟอร์ม และการแจ้งเตือน"
                      : "Choose the primary language for interface menus, forms, and messages."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  {/* Thai Language Option */}
                  <div
                    onClick={() => {
                      setAppLanguage("TH");
                      notify.success(
                        "เปลี่ยนภาษาเป็น ภาษาไทย เรียบร้อยแล้ว",
                        { duration: 2500 }
                      );
                    }}
                    className={`relative p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between ${
                      isThai
                        ? isLight
                          ? "border-[#222222] bg-[#FFFFFF] shadow-sm ring-1 ring-[#222222]/15"
                          : "border-white bg-[#383838] shadow-sm ring-1 ring-white/20"
                        : isLight
                        ? "border-[#E4E4E7] bg-[#FFFFFF] hover:border-slate-300"
                        : "border-[#444444] bg-[#2C2C2C] hover:border-[#666666]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs shadow-xs shrink-0 ${
                        isThai
                          ? isLight
                            ? "bg-[#222222] text-white border-[#222222]"
                            : "bg-white text-[#222222] border-white"
                          : isLight
                          ? "bg-slate-100 text-slate-700 border-slate-200"
                          : "bg-[#282828] text-zinc-300 border-[#444444]"
                      }`}>
                        TH
                      </div>
                      <div>
                        <h4 className="font-bold text-[15px] leading-tight">ภาษาไทย</h4>
                        <span className={`text-[12px] ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                          Thai (Default)
                        </span>
                      </div>
                    </div>
                    {isThai && (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm shrink-0 ${
                        isLight ? "bg-[#222222] text-white" : "bg-white text-[#222222]"
                      }`}>
                        <Check size={14} />
                      </div>
                    )}
                  </div>

                  {/* English Language Option */}
                  <div
                    onClick={() => {
                      setAppLanguage("EN");
                      notify.success(
                        "Language changed to English successfully",
                        { duration: 2500 }
                      );
                    }}
                    className={`relative p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between ${
                      !isThai
                        ? isLight
                          ? "border-[#222222] bg-[#FFFFFF] shadow-sm ring-1 ring-[#222222]/15"
                          : "border-white bg-[#383838] shadow-sm ring-1 ring-white/20"
                        : isLight
                        ? "border-[#E4E4E7] bg-[#FFFFFF] hover:border-slate-300"
                        : "border-[#444444] bg-[#2C2C2C] hover:border-[#666666]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl border flex items-center justify-center font-bold text-xs shadow-xs shrink-0 ${
                        !isThai
                          ? isLight
                            ? "bg-[#222222] text-white border-[#222222]"
                            : "bg-white text-[#222222] border-white"
                          : isLight
                          ? "bg-slate-100 text-slate-700 border-slate-200"
                          : "bg-[#282828] text-zinc-300 border-[#444444]"
                      }`}>
                        EN
                      </div>
                      <div>
                        <h4 className="font-bold text-[15px] leading-tight">English</h4>
                        <span className={`text-[12px] ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                          International English
                        </span>
                      </div>
                    </div>
                    {!isThai && (
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shadow-sm shrink-0 ${
                        isLight ? "bg-[#222222] text-white" : "bg-white text-[#222222]"
                      }`}>
                        <Check size={14} />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* DATA & TABLE PREFERENCES SECTION */}
              <div className="pt-6 border-t border-[#E4E4E7] dark:border-[#444444] flex flex-col gap-4">
                <div>
                  <h3 className="font-bold text-[16px] leading-tight">
                    <span>{isThai ? "การแสดงผลข้อมูลตาราง (Data & Table Preferences)" : "Data & Table Preferences"}</span>
                  </h3>
                  <p className={`text-[13px] mt-1 ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                    {isThai
                      ? "ปรับแต่งจำนวนแถวเริ่มต้นต่อหน้าเพื่อความสะดวกในการจัดการข้อมูลสินค้าและสต็อก"
                      : "Configure default rows per page for data tables across the platform."}
                  </p>
                </div>

                {/* Default Page Size Dropdown */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 max-w-lg">
                  <div className="flex flex-col">
                    <span className={`text-xs font-bold ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "จำนวนแถวเริ่มต้นต่อหน้า (Default Rows Per Page)" : "Default Rows Per Page"}
                    </span>
                    <span className={`text-[11.5px] mt-0.5 ${isLight ? "text-slate-400" : "text-zinc-500"}`}>
                      {isThai ? "ใช้กับการแสดงรายการสินค้า สต็อก และประวัติ" : "Applies to product, stock, and audit tables"}
                    </span>
                  </div>
                  
                  {/* Custom Styled Dropdown Component */}
                  <div className="relative w-full sm:w-56 shrink-0" ref={tablePageSizeDropdownRef}>
                    <button
                      type="button"
                      onClick={() => setIsTablePageSizeDropdownOpen((prev) => !prev)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-between shadow-xs cursor-pointer ${
                        isLight
                          ? "bg-[#FFFFFF] border-[#E4E4E7] text-[#222222] hover:border-zinc-400 focus:border-[#222222]"
                          : "bg-[#383838] border-[#444444] text-[#FFFFFF] hover:border-zinc-400 focus:border-white"
                      } ${isTablePageSizeDropdownOpen ? (isLight ? "ring-2 ring-[#222222]/10 border-[#222222]" : "ring-2 ring-white/10 border-white") : ""}`}
                    >
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${isLight ? "bg-[#222222]" : "bg-white"}`} />
                        <span>{tablePageSize} {isThai ? "แถว / หน้า" : "rows / page"}</span>
                      </div>
                      <ChevronDown
                        size={15}
                        className={`transition-transform duration-200 text-zinc-400 ${
                          isTablePageSizeDropdownOpen ? "rotate-180 text-zinc-700 dark:text-zinc-200" : ""
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu Popup */}
                    <AnimatePresence>
                      {isTablePageSizeDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 4, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.15, ease: "easeOut" }}
                          className={`absolute left-0 right-0 z-50 p-1.5 rounded-2xl border shadow-xl backdrop-blur-md ${
                            isLight
                              ? "bg-white/95 border-[#E4E4E7] text-[#222222]"
                              : "bg-[#2C2C2C]/95 border-[#444444] text-[#FFFFFF]"
                          }`}
                        >
                          {[10, 25, 50, 100].map((size) => {
                            const isSelected = tablePageSize === size;
                            return (
                              <button
                                key={size}
                                type="button"
                                onClick={() => {
                                  handleUpdatePageSize(size);
                                  setIsTablePageSizeDropdownOpen(false);
                                }}
                                className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                                  isSelected
                                    ? isLight
                                      ? "bg-[#222222] text-white font-bold"
                                      : "bg-white text-[#222222] font-bold"
                                    : isLight
                                    ? "hover:bg-slate-100 text-slate-700"
                                    : "hover:bg-[#383838] text-zinc-300"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  <span className="font-mono text-[11px] opacity-70">
                                    {size.toString().padStart(3, " ")}
                                  </span>
                                  <span>{size} {isThai ? "แถวต่อหน้า" : "rows per page"}</span>
                                </div>
                                {isSelected && <Check size={14} className="shrink-0" />}
                              </button>
                            );
                          })}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2 CONTENT: ACTIVE SESSIONS & CONNECTED DEVICES */}
          {activeTab === "sessions" && (
            <div className="w-full flex flex-col gap-6 animate-in fade-in duration-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[16px] leading-tight">
                    <span>{isThai ? "อุปกรณ์และเซสชันที่ใช้งานอยู่" : "Active Sessions & Connected Devices"}</span>
                  </h3>
                  <p className={`text-[13px] mt-1 ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                    {isThai
                      ? "ตรวจสอบอุปกรณ์และเบราว์เซอร์ที่กำลังลงชื่อเข้าใช้บัญชีของคุณอยู่ในขณะนี้"
                      : "Monitor devices and active browser sessions currently authenticated with your account."}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* Refresh button */}
                  <button
                    type="button"
                    disabled={sessionsLoading}
                    onClick={async () => {
                      setSessionsLoading(true);
                      try {
                        const result = await authClient.listSessions();
                        if (result?.data) setSessions(result.data as BaSession[]);
                      } catch {}
                      finally { setSessionsLoading(false); }
                    }}
                    className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                      isLight
                        ? "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        : "bg-[#383838] hover:bg-[#444444] text-zinc-300"
                    }`}
                  >
                    <RefreshCw size={13} className={sessionsLoading ? "animate-spin" : ""} />
                  </button>

                  {/* Revoke others */}
                  {!otherSessionsTerminated && sessions.filter(s => s.token !== currentToken).length > 0 && (
                    <button
                      type="button"
                      disabled={isRevokingSessions}
                      onClick={handleRevokeOtherSessions}
                      className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer ${
                        isLight
                          ? "bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200"
                          : "bg-rose-950/40 hover:bg-rose-950/70 text-rose-300 border border-rose-800/60"
                      }`}
                    >
                      {isRevokingSessions ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <LogOut size={13} />
                      )}
                      <span>{isThai ? "ออกจากระบบอุปกรณ์อื่นทั้งหมด" : "Sign Out Other Devices"}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Session list */}
              <div className="flex flex-col gap-3">
                {/* Loading skeleton */}
                {sessionsLoading && sessions.length === 0 && (
                  <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                    isLight ? "border-[#E4E4E7]" : "border-[#444444]"
                  }`}>
                    <Loader2 size={18} className="animate-spin shrink-0 text-zinc-400" />
                    <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                      {isThai ? "กำลังโหลดข้อมูลเซสชัน..." : "Loading session data..."}
                    </span>
                  </div>
                )}

                {/* Render real sessions */}
                {sessions.map((session) => {
                  const isCurrent = session.token === currentToken;
                  const { device, icon } = parseUserAgent(session.userAgent);
                  const timeAgo = formatSessionTime(session.updatedAt);
                  const ip = session.ipAddress || "—";

                  return (
                    <div
                      key={session.id}
                      className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 ${
                        isCurrent
                          ? isLight
                            ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-xs"
                            : "bg-[#383838] border-[#444444]"
                          : isLight
                          ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-xs"
                          : "bg-[#383838] border-[#444444]"
                      }`}
                    >
                      <div className="flex items-start gap-3.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                          isCurrent
                            ? "bg-[#2EC4B6]/15 text-[#2EC4B6] border border-[#2EC4B6]/30"
                            : isLight
                            ? "bg-slate-100 text-slate-600"
                            : "bg-[#282828] text-zinc-300"
                        }`}>
                          {icon === "phone" ? <Smartphone size={20} /> : icon === "globe" ? <Globe size={20} /> : <Laptop size={20} />}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-[14px] leading-tight">{device}</span>
                            {isCurrent && (
                              <span className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-[#2EC4B6]/15 text-[#2EC4B6] border border-[#2EC4B6]/30 flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#2EC4B6] animate-pulse" />
                                <span>{isThai ? "เซสชันปัจจุบัน" : "Current"}</span>
                              </span>
                            )}
                          </div>
                          <span className={`text-[12px] mt-1 flex items-center gap-2 flex-wrap ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                            {ip !== "—" && <span>IP: {ip}</span>}
                            {ip !== "—" && <span>•</span>}
                            <span>{isCurrent ? (isThai ? "กำลังใช้งาน" : "Active now") : timeAgo}</span>
                          </span>
                        </div>
                      </div>

                      {/* Revoke single session (only for non-current sessions) */}
                      {!isCurrent && (
                        <button
                          type="button"
                          onClick={() => handleRevokeSession(session.token)}
                          className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer shrink-0 ${
                            isLight
                              ? "border border-rose-200 text-rose-600 hover:bg-rose-50"
                              : "border border-rose-800/60 text-rose-300 hover:bg-rose-950/40"
                          }`}
                        >
                          {isThai ? "ยกเลิก" : "Revoke"}
                        </button>
                      )}
                    </div>
                  );
                })}

                {/* Empty state */}
                {!sessionsLoading && sessions.length === 0 && (
                  <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                    isLight ? "bg-[#FFFFFF] border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
                  }`}>
                    <Wifi size={18} className="shrink-0 text-zinc-400" />
                    <span className={`text-xs ${isLight ? "text-slate-500" : "text-zinc-400"}`}>
                      {isThai ? "ไม่พบข้อมูลเซสชัน" : "No sessions found"}
                    </span>
                  </div>
                )}

                {/* All-clear banner after revoking */}
                {otherSessionsTerminated && sessions.filter(s => s.token !== currentToken).length === 0 && (
                  <div className={`p-4 rounded-xl border flex items-center gap-3 ${
                    isLight ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-emerald-950/30 border-emerald-800/40 text-emerald-300"
                  }`}>
                    <CheckCircle2 size={18} className="shrink-0 text-[#2EC4B6]" />
                    <span className="text-xs font-semibold">
                      {isThai
                        ? "ออกจากระบบอุปกรณ์อื่นเรียบร้อยแล้ว มีเพียงเซสชันปัจจุบันเท่านั้น"
                        : "Signed out of all other devices. Only your current session remains active."}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3 CONTENT: NOTIFICATIONS & SOUND */}
          {activeTab === "notifications" && (
            <div className="w-full flex flex-col gap-8 animate-in fade-in duration-200">

              {/* TOAST DURATION SETTINGS */}
              <div className="flex flex-col gap-4">
                <div>
                  <h3 className="font-bold text-[16px] leading-tight">
                    <span>{isThai ? "ระยะเวลาแสดงการแจ้งเตือน (Toast Notification Duration)" : "Toast Notification Duration"}</span>
                  </h3>
                  <p className={`text-[13px] mt-1 ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                    {isThai
                      ? "กำหนดระยะเวลาที่กล่องแจ้งเตือน (Toast) จะแสดงผลบนหน้าจอก่อนจะปิดอัตโนมัติ"
                      : "Control how long notification popups stay visible on screen before auto-dismissing."}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { label: isThai ? "เร็ว (3 วินาที)" : "Fast (3s)", ms: 3000 },
                    { label: isThai ? "มาตรฐาน (5 วินาที)" : "Default (5s)", ms: 5000 },
                    { label: isThai ? "นาน (8 วินาที)" : "Extended (8s)", ms: 8000 },
                  ].map((item) => {
                    const isSelected = toastDuration === item.ms;
                    return (
                      <div
                        key={item.ms}
                        onClick={() => handleUpdateDuration(item.ms)}
                        className={`relative p-4 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex items-center justify-between ${
                          isSelected
                            ? isLight
                              ? "border-[#222222] bg-[#FFFFFF] shadow-sm ring-1 ring-[#222222]/15"
                              : "border-white bg-[#383838] shadow-sm ring-1 ring-white/20"
                            : isLight
                            ? "border-[#E4E4E7] bg-[#FFFFFF] hover:border-slate-300"
                            : "border-[#444444] bg-[#2C2C2C] hover:border-[#666666]"
                        }`}
                      >
                        <span className={`text-[13px] font-bold ${
                          isSelected
                            ? isLight ? "text-[#222222]" : "text-white"
                            : isLight ? "text-slate-700" : "text-zinc-300"
                        }`}>
                          {item.label}
                        </span>
                        {isSelected && (
                          <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center shadow-xs shrink-0 ${
                            isLight ? "bg-[#222222] text-white" : "bg-white text-[#222222]"
                          }`}>
                            <Check size={13} strokeWidth={2.5} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* SOUND EFFECT TOGGLE & VOLUME CONTROL */}
              <div className="pt-6 border-t border-[#E4E4E7] dark:border-[#444444] flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-start gap-3">
                    <div>
                      <h3 className="font-bold text-[15.5px] leading-tight">
                        {isThai ? "เสียงแจ้งเตือน (Notification Sound Effects)" : "Notification Sound Effects"}
                      </h3>
                      <p className={`text-[12.5px] mt-1 ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                        {isThai
                          ? "ส่งสัญญาณเสียงระฆังนุ่ม (Soft Bell) เมื่อมีการทำรายการหรือแจ้งเตือนข้อผิดพลาดสำคัญ"
                          : "Play a subtle Soft Bell chime when operations succeed or critical alerts arrive."}
                      </p>
                    </div>
                  </div>

                  {/* Toggle Switch */}
                  <button
                    type="button"
                    onClick={handleToggleSound}
                    className={`w-12 h-6.5 rounded-full p-0.5 transition-colors cursor-pointer relative shrink-0 ${
                      soundEnabled ? "bg-[#2EC4B6]" : isLight ? "bg-slate-300" : "bg-[#444444]"
                    }`}
                  >
                    <div
                      className={`w-5.5 h-5.5 rounded-full bg-white shadow-sm transition-transform ${
                        soundEnabled ? "translate-x-5.5" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                {/* VOLUME SLIDER & PRESETS (visible when sound is enabled) */}
                <AnimatePresence>
                  {soundEnabled && (
                    <motion.div
                      key="volume-control-panel"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.18, ease: "easeOut" }}
                      className="overflow-hidden"
                    >
                      <div className={`p-4 rounded-2xl border flex flex-col gap-3.5 ${
                        isLight
                          ? "bg-[#F8F9FA] border-[#E4E4E7]"
                          : "bg-[#2A2A2A] border-[#3E3E3E]"
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                              {isThai ? "ระดับเสียง (Volume Level)" : "Volume Level"}
                            </span>
                            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md ${
                              isLight ? "bg-white border border-slate-200 text-[#222222]" : "bg-[#383838] text-white"
                            }`}>
                              {soundVolume}%
                            </span>
                          </div>

                          {/* Quick Volume Level Chips */}
                          <div className="flex items-center gap-1.5">
                            {[25, 50, 75, 100].map((presetVol) => (
                              <button
                                key={presetVol}
                                type="button"
                                onClick={() => {
                                  handleVolumeChange(presetVol);
                                  handlePreviewSound(presetVol);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                  soundVolume === presetVol
                                    ? isLight
                                      ? "bg-[#222222] text-white"
                                      : "bg-white text-[#222222]"
                                    : isLight
                                    ? "bg-white text-slate-600 hover:bg-slate-200 border border-slate-200"
                                    : "bg-[#383838] text-zinc-300 hover:bg-[#484848] border border-[#444444]"
                                }`}
                              >
                                {presetVol}%
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Slider and Test Play button */}
                        <div className="flex items-center gap-3">
                          <VolumeX
                            size={16}
                            className={`shrink-0 cursor-pointer ${
                              soundVolume === 0
                                ? "text-rose-500"
                                : isLight ? "text-slate-400 hover:text-slate-600" : "text-zinc-500 hover:text-zinc-300"
                            }`}
                            onClick={() => handleVolumeChange(0)}
                          />
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={soundVolume}
                            onChange={(e) => handleVolumeChange(parseInt(e.target.value, 10))}
                            onMouseUp={() => handlePreviewSound()}
                            onTouchEnd={() => handlePreviewSound()}
                            className="w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-[#2EC4B6] bg-slate-200 dark:bg-zinc-700"
                          />
                          <Volume2
                            size={16}
                            className={`shrink-0 cursor-pointer ${
                              soundVolume === 100
                                ? "text-[#2EC4B6]"
                                : isLight ? "text-slate-400 hover:text-slate-600" : "text-zinc-500 hover:text-zinc-300"
                            }`}
                            onClick={() => {
                              handleVolumeChange(100);
                              handlePreviewSound(100);
                            }}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* SECURITY ALERTS TOGGLE */}
              <div className="pt-6 border-t border-[#E4E4E7] dark:border-[#444444] flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div>
                    <h3 className="font-bold text-[15.5px] leading-tight">
                      {isThai ? "การแจ้งเตือนความปลอดภัยของระบบ (Security & Login Alerts)" : "Security & Login Alerts"}
                    </h3>
                    <p className={`text-[12.5px] mt-1 ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                      {isThai
                        ? "แจ้งเตือนเมื่อมีการเข้าสู่ระบบจากอุปกรณ์ใหม่หรือเมื่อมีการเปลี่ยนรหัสผ่าน"
                        : "Receive in-app alerts when logins occur from new devices or credentials change."}
                    </p>
                  </div>
                </div>

                {/* Toggle Switch */}
                <button
                  type="button"
                  onClick={handleToggleSecurityAlerts}
                  className={`w-12 h-6.5 rounded-full p-0.5 transition-colors cursor-pointer relative shrink-0 ${
                    securityAlertsEnabled
                      ? isLight
                        ? "bg-[#222222]"
                        : "bg-white"
                      : isLight
                      ? "bg-slate-300"
                      : "bg-[#444444]"
                  }`}
                >
                  <div
                    className={`w-5.5 h-5.5 rounded-full shadow-sm transition-transform ${
                      securityAlertsEnabled
                        ? isLight
                          ? "translate-x-5.5 bg-white"
                          : "translate-x-5.5 bg-[#222222]"
                        : "translate-x-0 bg-white"
                    }`}
                  />
                </button>
              </div>

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
