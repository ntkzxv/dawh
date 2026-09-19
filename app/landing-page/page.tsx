"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from "framer-motion";
import { getCurrentSession } from "@/lib/auth-client";
import AuthLoadingScreen from "@/components/loading_screen/AuthLoadingScreen";
import { getDawhLogo } from "@/config/brand";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage, setAppLanguage } from "@/utils/language";
import { LANDING_TRANSLATIONS } from "./translations";
import {
  ArrowRight,
  TrendingUp,
  BarChart3,
  Users,
  CheckCircle2,
  Calendar,
  Zap,
  ChevronDown,
  Plus,
  Minus,
  Share2,
  Layers,
  ShieldCheck,
  Globe,
  MessageSquare,
  Heart,
  Eye,
  Flame,
  Clock,
  ArrowUpRight,
  Menu,
  X,
  Send,
  Check,
  Activity,
  Award,
  Moon,
  Sun,
  Database,
  Box,
  FileText,
  Building2,
  Lock,
  CreditCard,
} from "lucide-react";

// --- Custom Social SVG Icons for Brand Authenticity ---
function InstagramIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </svg>
  );
}

function TikTokIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.86.12V9.42a6.28 6.28 0 0 0-.86-.06A6.33 6.33 0 0 0 3 15.69a6.34 6.34 0 0 0 1082 4.48 6.27 6.27 0 0 0 1.94-4.5V8.84a8.21 8.21 0 0 0 4.83 1.55v-3.7z" />
    </svg>
  );
}

function XIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function YouTubeIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  );
}

function LinkedInIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
      <rect width="4" height="12" x="2" y="9" />
      <circle cx="4" cy="4" r="2" />
    </svg>
  );
}

// Reusable animated container for section cards that fades in cleanly once
function ScrollFadeCard({
  children,
  className = "",
  style = {},
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  exitScale?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      style={style}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// --- Main Landing Page Component ---
export default function DawhLandingPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";
  const t = LANDING_TRANSLATIONS[appLang] || LANDING_TRANSLATIONS.TH;

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<"overview" | "warehouse" | "datacenter" | "audit">("overview");
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const router = useRouter();

  const [showSessionLoader, setShowSessionLoader] = useState(false);

  // หากมี session หรือ login อยู่แล้ว ให้แสดง loading screen แล้วนำทางเข้าสู่ workspace ตามปกติ
  useEffect(() => {
    let isMounted = true;
    async function verifyExistingAuth() {
      try {
        const session = await getCurrentSession();
        if (isMounted && session?.user) {
          setShowSessionLoader(true);
          router.prefetch("/workspace");
          setTimeout(() => {
            router.replace("/workspace");
          }, 1600);
        }
      } catch {
        // Guest user, remain on landing page without loading screen
      }
    }
    verifyExistingAuth();
    return () => {
      isMounted = false;
    };
  }, [router]);

  // หากตรวจพบว่ามี session ให้แสดง Loading Screen ก่อนพาเข้า workspace
  if (showSessionLoader) {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#181818]">
        <AuthLoadingScreen
          duration={1.6}
          onFilled={() => {
            router.replace("/workspace");
          }}
        />
      </div>
    );
  }

  const { scrollY } = useScroll();

  // Physics-based spring smoothing to turn chunky scroll steps into silky momentum
  const smoothScrollY = useSpring(scrollY, {
    stiffness: 110,
    damping: 24,
    mass: 0.6,
  });

  // Topbar spread/collapse: At scroll = 0 (ไม่กาง/ปกติ), when scroll > 1 (กางออกด้านข้าง เพิ่มระยะห่างจาก Island)
  const topbarSpread = useTransform(smoothScrollY, [0, 60], [0, 1]);
  const topbarMaxWidth = useTransform(topbarSpread, [0, 1], ["1280px", "1536px"]);
  const logoX = useTransform(topbarSpread, [0, 1], [0, -32]);
  const actionsX = useTransform(topbarSpread, [0, 1], [0, 32]);

  // Scroll-driven collision animations: Disappear completely BEFORE reaching the floating island
  // 1. Line 1 (Enterprise Operations): Finishes horizontal straight line wipe completely before reaching island (done at scrollY: 65px)
  const line1Progress = useTransform(smoothScrollY, [10, 65], [0, 100]);
  const line1Y = useTransform(line1Progress, [0, 100], [0, -20]);
  const line1Clip = useTransform(line1Progress, (val) => `inset(0% 0% ${val}% 0%)`);

  // 2. Line 2 (Simplified Control): Follows immediately and finishes wiping completely before reaching island (done at scrollY: 105px)
  const line2Progress = useTransform(smoothScrollY, [30, 105], [0, 100]);
  const line2Y = useTransform(line2Progress, [0, 100], [0, -20]);
  const line2Clip = useTransform(line2Progress, (val) => `inset(0% 0% ${val}% 0%)`);

  // 3. CTA Buttons (Start Free Trial & Create Free Account):
  // Synchronized fast zoom out + horizontal clip wipe + slide up exit
  const btnScale = useTransform(smoothScrollY, [15, 75, 120], [1, 0.7, 0.7]);
  const btnProgress = useTransform(smoothScrollY, [35, 115], [0, 100]);
  const btnY = useTransform(btnProgress, [0, 100], [0, -20]);
  const btnClip = useTransform(btnProgress, (val) => (val <= 0 ? "none" : `inset(0% -40px ${val}% -40px)`));

  const ctaPointerEvents = useTransform(smoothScrollY, (val) => (val >= 115 ? "none" : "auto"));

  // 4. Hero Dashboard Showcase Card: Aceternity-style 3D Container Scroll (Fixed Width, No Expansion)
  // Stage 1 (0px - 180px / 3 scrolls): Starts at 15deg tilt and un-tilts to 0deg (scale 0.96 -> 1)
  // Stage 2 (180px - 320px): Holds completely intact at 0deg (0% cut) so users can view the full dashboard
  // Stage 3 (320px - 560px): Slows down cut speed by more than half (spread over 240px) for a gentle, gradual wipe
  const cardRotateX = useTransform(smoothScrollY, [0, 180, 320], [15, 0, 0]);
  const cardScale = useTransform(smoothScrollY, [0, 180, 320, 560], [0.96, 1, 1, 0.96]);
  const cardTranslateY = useTransform(smoothScrollY, [0, 180, 320, 560], [0, -20, -20, -50]);

  const cardOutProgress = useTransform(smoothScrollY, [320, 560], [0, 100]);
  const cardClip = useTransform(cardOutProgress, (val) => (val <= 0 ? "none" : `inset(0% -60px ${val}% -60px)`));
  const cardOpacity = useTransform(smoothScrollY, [530, 560], [1, 0]);
  const cardPointerEvents = useTransform(smoothScrollY, (val) => (val >= 560 ? "none" : "auto"));

  // 5. Analytics & Content Flow: Glides up with balanced spacing below the floating island
  const analyticsY = useTransform(smoothScrollY, [0, 320, 560, 9999], [0, 0, -465, -465]);
  const headingOpacity = useTransform(smoothScrollY, [370, 520], [0, 1]);
  const headingY = useTransform(smoothScrollY, [370, 520], [25, 0]);

  return (
    <div className={`w-full min-h-screen transition-colors duration-300 relative overflow-x-clip font-sans ${
      isDark ? "bg-[#181818] text-white selection:bg-white/25 selection:text-white" : "bg-[#F8FAFC] text-slate-900 selection:bg-[#222222] selection:text-white"
    }`}>
      {/* Background Subtle Gradient Blobs (Theme-aligned with DAWH canvas) */}
      <div className={`absolute inset-0 overflow-hidden pointer-events-none -z-10 transition-opacity duration-300 ${
        isDark ? "opacity-25" : "opacity-50"
      }`}>
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-[1100px] h-[600px] blur-[130px] rounded-full ${
          isDark ? "bg-zinc-800/25" : "bg-slate-200/50"
        }`} />
        <div className={`absolute top-[1200px] -left-[200px] w-[650px] h-[650px] blur-[140px] rounded-full ${
          isDark ? "bg-neutral-800/30" : "bg-slate-100/60"
        }`} />
        <div className={`absolute top-[2800px] -right-[150px] w-[700px] h-[700px] blur-[150px] rounded-full ${
          isDark ? "bg-zinc-800/20" : "bg-slate-200/40"
        }`} />
      </div>

      {/* ========================================================= */}
      {/* 1. TRANSPARENT TOPBAR WITH SEPARATE ISLANDS               */}
      {/* ========================================================= */}
      <motion.header 
        style={{ maxWidth: topbarMaxWidth }}
        className="fixed top-4 sm:top-6 left-0 right-0 z-50 px-4 sm:px-8 mx-auto w-full pointer-events-none"
      >
        <div className="relative flex items-center justify-between gap-4 w-full pointer-events-auto">
          {/* Left: Brand Logo (Outside Island, enlarged by 2/3) */}
          <motion.a 
            href="#" 
            style={{ x: logoX }}
            className="flex items-center group py-1 shrink-0 z-10"
          >
            <img
              src={getDawhLogo(theme, "horizontal")}
              alt="DAWH"
              className="h-10 sm:h-12 md:h-13 w-auto object-contain transition-transform group-hover:scale-105 duration-200"
            />
          </motion.a>

          {/* Center: Navigation Tabs (Centered) */}
          <div className="hidden lg:flex absolute left-1/2 -translate-x-1/2 z-10">
            <nav className={`hidden lg:flex items-center gap-1 backdrop-blur-md p-1 rounded-full border transition-colors ${
              isDark ? "bg-[#222222]/90 border-[#444444] text-[#E4E4E7]" : "bg-white/90 border-slate-200/90 text-slate-700 shadow-xs"
            }`}>
              <a href="#features" className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                isDark ? "hover:text-white hover:bg-white/10" : "hover:text-slate-900 hover:bg-slate-100"
              }`}>{t.nav.features}</a>
              <a href="#analytics" className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                isDark ? "hover:text-white hover:bg-white/10" : "hover:text-slate-900 hover:bg-slate-100"
              }`}>{t.nav.analytics}</a>
              <a href="#pricing" className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                isDark ? "hover:text-white hover:bg-white/10" : "hover:text-slate-900 hover:bg-slate-100"
              }`}>{t.nav.pricing}</a>
              <a href="#faq" className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                isDark ? "hover:text-white hover:bg-white/10" : "hover:text-slate-900 hover:bg-slate-100"
              }`}>{t.nav.faq}</a>
              <a href="#contact" className={`px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold transition-all duration-200 ${
                isDark ? "hover:text-white hover:bg-white/10" : "hover:text-slate-900 hover:bg-slate-100"
              }`}>{t.nav.contact}</a>
            </nav>
          </div>

          {/* Right: Actions (Login + Start Free Trial) */}
          <motion.div 
            style={{ x: actionsX }}
            className="flex items-center gap-2 sm:gap-3 z-10 bg-transparent"
          >
            <Link 
              href="/auth/login" 
              className={`text-xs sm:text-sm font-bold transition-colors px-3 py-1.5 cursor-pointer ${
                isDark ? "text-[#F4F4F5] hover:text-white" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              {t.nav.login}
            </Link>
            <Link 
              href="/auth/login" 
              className={`rounded-full font-bold text-xs sm:text-sm px-4 sm:px-5 py-2 transition-all active:scale-95 shrink-0 cursor-pointer shadow-sm ${
                isDark ? "bg-white hover:bg-zinc-200 text-[#181818]" : "bg-[#222222] hover:bg-black text-white"
              }`}
            >
              {t.nav.startTrial}
            </Link>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`lg:hidden p-1.5 rounded-full transition-colors ${
                isDark ? "text-neutral-300 hover:bg-[#282828]" : "text-slate-700 hover:bg-slate-100"
              }`}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </motion.div>
        </div>

        {/* Floating Mobile Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.98 }}
              transition={{ duration: 0.2 }}
              className={`lg:hidden mt-3 rounded-[28px] backdrop-blur-xl border shadow-2xl p-5 flex flex-col gap-3 pointer-events-auto ${
                isDark ? "bg-[#222222]/95 border-[#444444]" : "bg-white/95 border-slate-200 shadow-xl"
              }`}
            >
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-2.5 rounded-2xl font-semibold text-sm ${isDark ? "text-[#F4F4F5] hover:bg-[#282828]" : "text-slate-800 hover:bg-slate-100"}`}>{t.nav.features}</a>
              <a href="#analytics" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-2.5 rounded-2xl font-semibold text-sm ${isDark ? "text-[#F4F4F5] hover:bg-[#282828]" : "text-slate-800 hover:bg-slate-100"}`}>{t.nav.analytics}</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-2.5 rounded-2xl font-semibold text-sm ${isDark ? "text-[#F4F4F5] hover:bg-[#282828]" : "text-slate-800 hover:bg-slate-100"}`}>{t.nav.pricing}</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-2.5 rounded-2xl font-semibold text-sm ${isDark ? "text-[#F4F4F5] hover:bg-[#282828]" : "text-slate-800 hover:bg-slate-100"}`}>{t.nav.faq}</a>
              <a href="#contact" onClick={() => setMobileMenuOpen(false)} className={`px-4 py-2.5 rounded-2xl font-semibold text-sm ${isDark ? "text-[#F4F4F5] hover:bg-[#282828]" : "text-slate-800 hover:bg-slate-100"}`}>{t.nav.contact}</a>
              
              <div className={`pt-2 border-t flex flex-col gap-2 ${isDark ? "border-[#444444]" : "border-slate-200"}`}>
                <Link 
                  href="/auth/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full py-2.5 rounded-2xl font-bold text-sm text-center cursor-pointer ${
                    isDark ? "bg-white hover:bg-zinc-200 text-[#181818]" : "bg-[#222222] hover:bg-black text-white"
                  }`}
                >
                  {t.nav.startTrial}
                </Link>
                <Link 
                  href="/auth/login" 
                  onClick={() => setMobileMenuOpen(false)}
                  className={`w-full py-2.5 rounded-2xl font-bold text-sm text-center cursor-pointer ${isDark ? "text-[#F4F4F5] hover:bg-[#282828]" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  {t.nav.login}
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ========================================================= */}
      {/* 2. HERO SECTION                                           */}
      {/* ========================================================= */}
      <section className="relative pt-32 pb-10 md:pt-44 md:pb-14 overflow-visible">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-4xl mx-auto flex flex-col items-center">
            {/* Main Headline (2 Separate Animated Lines with Same Color) */}
            <h1 
              style={{ fontFamily: "var(--font-outfit), sans-serif" }}
              className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.08] mb-8 sm:mb-10 text-center flex flex-col items-center"
            >
              {/* Line 1: Enterprise Operations (Animates First) */}
              <motion.div
                style={{ y: line1Y, clipPath: line1Clip }}
                className="w-full flex justify-center"
              >
                <motion.span
                  initial={{ opacity: 0, y: 26 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.06, ease: [0.16, 1, 0.3, 1] }}
                  className={`block ${isDark ? "text-white" : "text-[#222222]"}`}
                >
                  {t.hero.line1}
                </motion.span>
              </motion.div>

              {/* Line 2: Simplified Control (Follows closely right as Line 1 starts moving) */}
              <motion.div
                style={{ y: line2Y, clipPath: line2Clip }}
                className="w-full flex justify-center"
              >
                <motion.span
                  initial={{ opacity: 0, y: 26 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.75, delay: 0.13, ease: [0.16, 1, 0.3, 1] }}
                  className={`block ${isDark ? "text-white" : "text-[#222222]"}`}
                >
                  {t.hero.line2}
                </motion.span>
              </motion.div>
            </h1>

            {/* CTA Group: Both buttons exit simultaneously with scale-down and clipPath wipe */}
            <motion.div
              style={{ pointerEvents: ctaPointerEvents }}
              className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center mb-8"
            >
              {/* Button 1: Start Enterprise Pilot */}
              <motion.div
                style={{ y: btnY, scale: btnScale, clipPath: btnClip }}
                className="w-full sm:w-auto flex justify-center"
              >
                <Link
                  href="/auth/login"
                  className={`w-full sm:w-auto px-8 py-4 rounded-full font-bold text-base active:scale-[0.98] transition-all flex items-center justify-center gap-2 group shadow-sm cursor-pointer ${
                    isDark ? "bg-white hover:bg-zinc-200 text-[#181818]" : "bg-[#222222] hover:bg-black text-white"
                  }`}
                >
                  <span>{t.hero.startPilot}</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              {/* Button 2: Request System Demo */}
              <motion.div
                style={{ y: btnY, scale: btnScale, clipPath: btnClip }}
                className="w-full sm:w-auto flex justify-center"
              >
                <a
                  href="#features"
                  className={`w-full sm:w-auto px-8 py-4 rounded-full font-semibold text-base shadow-xs transition-all flex items-center justify-center gap-2 ${
                    isDark
                      ? "bg-[#282828] border border-[#444444] text-white hover:bg-[#383838]"
                      : "bg-white border border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300 shadow-xs"
                  }`}
                >
                  <span>{t.hero.exploreArch}</span>
                </a>
              </motion.div>
            </motion.div>
          </div>
        </div>

        {/* Dynamic Floating Hero Dashboard Showcase (Aceternity-style 3D Container Scroll) */}
        <div 
          className="relative mt-8 sm:mt-14 w-full flex justify-center overflow-visible px-4 sm:px-6 lg:px-8"
          style={{ perspective: "1000px" }}
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="relative flex justify-center w-full"
            style={{ transformStyle: "preserve-3d" }}
          >
            {/* Main Dashboard Card Container: Aceternity-style 3D Container Scroll */}
            <motion.div
              style={{
                rotateX: cardRotateX,
                scale: cardScale,
                y: cardTranslateY,
                clipPath: cardClip,
                opacity: cardOpacity,
                pointerEvents: cardPointerEvents,
                transformOrigin: "center top",
                transformStyle: "preserve-3d",
              }}
              className={`relative w-full max-w-5xl min-h-[580px] md:min-h-[640px] rounded-[32px] sm:rounded-[36px] p-6 sm:p-8 md:p-10 overflow-hidden flex flex-col justify-between transition-colors ${
                isDark
                  ? "bg-[#222222] border border-[#444444] shadow-[0_24px_70px_-15px_rgba(0,0,0,0.7)]"
                  : "bg-white border border-slate-200/90 shadow-[0_24px_70px_-15px_rgba(0,0,0,0.06)]"
              }`}
            >
              <div className="w-full max-w-6xl mx-auto flex flex-col justify-between flex-1 relative">
                {/* Subtle Internal Ambient Motion Glows */}
                <motion.div
                  animate={{
                    opacity: [0.10, 0.18, 0.10],
                    scale: [1, 1.08, 1],
                  }}
                  transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute -top-16 -right-16 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10"
                />

                {/* Mock Dashboard Header */}
                <div className={`flex flex-wrap items-center justify-between pb-5 border-b gap-4 ${
                  isDark ? "border-[#444444]" : "border-slate-100"
                }`}>
                  <div className="flex items-center gap-3">
                    <motion.div 
                      animate={{ y: [0, -3, 0] }}
                      transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                      className={`w-11 h-11 rounded-2xl border p-0.5 shadow-xs flex items-center justify-center ${
                        isDark ? "bg-blue-950/50 border-blue-800/40 text-blue-300" : "bg-blue-50 border-blue-200/60 text-blue-700"
                      }`}
                    >
                      <Building2 className="w-5 h-5" />
                    </motion.div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isDark ? "text-white" : "text-slate-900"}`}>{t.dashboard.hubTitle}</span>
                        <span className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          isDark ? "bg-blue-950/80 text-blue-300 border border-blue-800/40" : "bg-blue-100 text-blue-700"
                        }`}>
                          <span className="relative flex h-1.5 w-1.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                          </span>
                          {t.dashboard.roleBadge}
                        </span>
                      </div>
                      <span className="text-xs text-neutral-400">{t.dashboard.portfolioSub}</span>
                    </div>
                  </div>

                  {/* Core Module Switcher Chips */}
                  <div className={`flex items-center gap-1.5 sm:gap-2 p-1.5 rounded-2xl border ${
                    isDark ? "bg-[#181818] border-[#444444]" : "bg-slate-50 border-slate-200/80"
                  }`}>
                    <span className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 ${
                      isDark ? "bg-[#383838] text-white shadow-xs border border-[#555555]" : "bg-white shadow-xs text-slate-800 border border-slate-200/70"
                    }`}>
                      <Box className="w-3.5 h-3.5 text-blue-500" />
                      <span>{t.dashboard.modules.erp}</span>
                    </span>
                    <span className={`px-3 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                      isDark ? "text-[#A1A1AA] hover:text-white" : "text-slate-500 hover:text-slate-800"
                    }`}>
                      <Database className="w-3.5 h-3.5" />
                      <span>{t.dashboard.modules.hp}</span>
                    </span>
                    <span className={`px-3 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                      isDark ? "text-[#A1A1AA] hover:text-white" : "text-slate-500 hover:text-slate-800"
                    }`}>
                      <FileText className="w-3.5 h-3.5" />
                      <span>{t.dashboard.modules.reports}</span>
                    </span>
                    <span className={`px-3 py-1 rounded-xl text-xs font-medium flex items-center gap-1.5 cursor-pointer transition-colors ${
                      isDark ? "text-[#A1A1AA] hover:text-white" : "text-slate-500 hover:text-slate-800"
                    }`}>
                      <Zap className="w-3.5 h-3.5" />
                      <span>{t.dashboard.modules.api}</span>
                    </span>
                  </div>
                </div>

                {/* Dashboard Content Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-6 flex-1">
                  {/* Left 2 Cols: Real-time Capital & Inventory Velocity Chart */}
                  <div className={`lg:col-span-2 rounded-3xl p-6 border flex flex-col justify-between ${
                    isDark ? "bg-[#181818] border-[#444444]" : "bg-[#F8FAFC] border-slate-200/80"
                  }`}>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold uppercase tracking-wider text-neutral-400">{t.dashboard.chart.title}</span>
                          <span className="flex items-center gap-1 text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                            </span>
                            <TrendingUp className="w-3 h-3" /> +148.4%
                          </span>
                        </div>
                        <div className={`text-3xl font-extrabold mt-1 ${isDark ? "text-white" : "text-slate-900"}`}>
                          {t.dashboard.chart.stat} <span className="text-sm font-normal text-neutral-400">{t.dashboard.chart.statLabel}</span>
                        </div>
                      </div>
                      <div className={`flex items-center gap-1 text-xs font-semibold p-1 rounded-xl border shadow-xs ${
                        isDark ? "bg-[#282828] border-[#444444] text-[#A1A1AA]" : "bg-white border-slate-200/80"
                      }`}>
                        <span className="px-2.5 py-1 rounded-lg bg-blue-600 text-white">{t.dashboard.chart.tab7d}</span>
                        <span className="px-2.5 py-1 rounded-lg hover:text-blue-400 cursor-pointer transition-colors">{t.dashboard.chart.tab30d}</span>
                        <span className="px-2.5 py-1 rounded-lg hover:text-blue-400 cursor-pointer transition-colors">{t.dashboard.chart.tabFy}</span>
                      </div>
                    </div>

                    {/* SVG Area Curve Graphic (Harmonious brand tones, animated glow wave, dots removed) */}
                    <div className="relative h-56 sm:h-64 w-full mt-3">
                      <svg className="w-full h-full overflow-visible" viewBox="0 0 500 150" preserveAspectRatio="none">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
                            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                          </linearGradient>
                          <linearGradient id="lineGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#3B82F6" />
                            <stop offset="100%" stopColor="#60A5FA" />
                          </linearGradient>
                        </defs>
                        {/* Background Grid Lines */}
                        <line x1="0" y1="30" x2="500" y2="30" stroke={isDark ? "#2C2C2C" : "#E2E8F0"} strokeDasharray="4 4" />
                        <line x1="0" y1="75" x2="500" y2="75" stroke={isDark ? "#2C2C2C" : "#E2E8F0"} strokeDasharray="4 4" />
                        <line x1="0" y1="120" x2="500" y2="120" stroke={isDark ? "#2C2C2C" : "#E2E8F0"} strokeDasharray="4 4" />

                        {/* Animated Gradient Fill */}
                        <motion.path
                          d="M 0,130 Q 80,105 140,85 T 260,65 T 380,30 T 500,10 L 500,150 L 0,150 Z"
                          fill="url(#chartGradient)"
                          animate={{ opacity: [0.75, 1, 0.75] }}
                          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
                        />

                        {/* Real-time Vertical Telemetry Scan Line */}
                        <motion.g
                          animate={{ x: [15, 485, 15] }}
                          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        >
                          <line
                            y1="10"
                            y2="145"
                            stroke="#3B82F6"
                            strokeWidth="1.5"
                            strokeDasharray="3 3"
                            strokeOpacity="0.4"
                          />
                          <line
                            y1="25"
                            y2="85"
                            stroke="#60A5FA"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeOpacity="0.8"
                          />
                        </motion.g>

                        {/* Animated Glowing Stroke Line */}
                        <motion.path
                          d="M 0,130 Q 80,105 140,85 T 260,65 T 380,30 T 500,10"
                          fill="none"
                          stroke="url(#lineGradient)"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          animate={{ opacity: [0.85, 1, 0.85] }}
                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        />
                      </svg>
                    </div>

                    {/* Day Markers */}
                    <div className="flex justify-between text-[11px] font-semibold mt-2 px-1">
                      {t.dashboard.chart.days.map((dayText, idx) => (
                        <span
                          key={idx}
                          className={
                            idx === t.dashboard.chart.days.length - 1
                              ? "text-blue-500 font-bold"
                              : isDark
                              ? "text-[#A1A1AA]"
                              : "text-slate-400"
                          }
                        >
                          {dayText}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Col: Enterprise Operations Queue */}
                  <div className={`rounded-3xl p-5 border flex flex-col justify-between shadow-xs ${
                    isDark ? "bg-[#181818] border-[#444444]" : "bg-white border-slate-200/80 shadow-xs"
                  }`}>
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">{t.dashboard.queue.title}</span>
                        <span className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isDark ? "bg-emerald-950/60 text-emerald-300 border border-emerald-800/40" : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                        }`}>
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          {t.dashboard.queue.auditedBadge}
                        </span>
                      </div>

                      {/* Scheduled Operations List */}
                      <div className="space-y-3">
                        <motion.div 
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className={`p-3 rounded-2xl transition-all border flex items-center gap-3 ${
                            isDark ? "bg-[#282828] hover:bg-[#383838] border-[#444444]" : "bg-slate-50 hover:bg-slate-100/70 border-slate-100"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isDark ? "bg-[#181818] text-white" : "bg-white text-slate-700 shadow-2xs"
                          }`}>
                            <Box className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-slate-800"}`}>{t.dashboard.queue.item1Title}</p>
                            <p className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-neutral-400" /> {t.dashboard.queue.item1Sub}
                            </p>
                          </div>
                          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                            {t.dashboard.queue.item1Tag}
                          </span>
                        </motion.div>

                        <motion.div 
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className={`p-3 rounded-2xl transition-all border flex items-center gap-3 ${
                            isDark ? "bg-[#282828] hover:bg-[#383838] border-[#444444]" : "bg-slate-50 hover:bg-slate-100/70 border-slate-100"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isDark ? "bg-[#181818] text-white" : "bg-white text-slate-700 shadow-2xs"
                          }`}>
                            <Database className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-slate-800"}`}>{t.dashboard.queue.item2Title}</p>
                            <p className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-neutral-400" /> {t.dashboard.queue.item2Sub}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-200/60 dark:bg-white/10 px-2 py-0.5 rounded-md">{t.dashboard.queue.item2Tag}</span>
                        </motion.div>

                        <motion.div 
                          whileHover={{ x: 4 }}
                          transition={{ type: "spring", stiffness: 400, damping: 25 }}
                          className={`p-3 rounded-2xl transition-all border flex items-center gap-3 ${
                            isDark ? "bg-[#282828] hover:bg-[#383838] border-[#444444]" : "bg-slate-50 hover:bg-slate-100/70 border-slate-100"
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            isDark ? "bg-[#181818] text-white" : "bg-white text-slate-700 shadow-2xs"
                          }`}>
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className={`text-xs font-bold truncate ${isDark ? "text-white" : "text-slate-800"}`}>{t.dashboard.queue.item3Title}</p>
                            <p className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3 text-neutral-400" /> {t.dashboard.queue.item3Sub}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-neutral-600 dark:text-neutral-300 bg-neutral-200/60 dark:bg-white/10 px-2 py-0.5 rounded-md">{t.dashboard.queue.item3Tag}</span>
                        </motion.div>
                      </div>
                    </div>

                    <div className={`pt-4 mt-2 border-t flex items-center justify-between text-xs ${
                      isDark ? "border-white/10" : "border-neutral-100"
                    }`}>
                      <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <span className="text-neutral-500 font-medium">{t.dashboard.queue.engineActive}</span>
                      </div>
                      <motion.a 
                        href="#features" 
                        whileHover={{ x: 3 }}
                        className="font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1 group"
                      >
                        {t.dashboard.queue.inspectQueue} <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
                      </motion.a>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

        </motion.div>
      </div>
    </section>

      {/* ========================================================= */}
      {/* 3. ANALYTICS & METRICS SECTION (Rises up to Enterprise Operations position) */}
      {/* ========================================================= */}
      <motion.section id="analytics" style={{ marginTop: analyticsY }} className="pt-6 md:pt-8 pb-20 relative">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Section Heading: Appears slower and later, gracefully fading in as card finishes cut */}
            <div className="text-center max-w-2xl mx-auto mb-16">
              <motion.h2 
                style={{ opacity: headingOpacity, y: headingY }}
                className={`text-3xl sm:text-5xl font-extrabold tracking-tight mb-3 ${
                  isDark ? "text-white" : "text-neutral-900"
                }`}
              >
                {t.analytics.heading}
              </motion.h2>
              <motion.p 
                initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
                whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
                viewport={{ once: false, amount: 0.25, margin: "-75px 0px -40px 0px" }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className={`text-base sm:text-lg ${
                  isDark ? "text-neutral-400" : "text-neutral-500"
                }`}
              >
                {t.analytics.subtitle}
              </motion.p>
            </div>

            {/* 4 KPI Grid Cards (Harmonious theme styling) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-14">
            {/* KPI 1 */}
            <ScrollFadeCard 
              className={`p-7 rounded-3xl border shadow-xs hover:shadow-md hover:-translate-y-1 transition-all ${
                isDark ? "bg-[#222222] border-[#444444] text-white" : "bg-white border-slate-200/90 text-slate-900 shadow-xs"
              }`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 font-bold ${
                isDark ? "bg-[#282828] text-white border border-[#444444]" : "bg-slate-100 text-slate-800 border border-slate-200/60"
              }`}>
                <TrendingUp className="w-5 h-5" />
              </div>
              <div className={`text-4xl font-extrabold tracking-tight mb-1 ${
                isDark ? "text-white" : "text-slate-900"
              }`}>{t.analytics.kpi1Val}</div>
              <div className={`text-sm font-semibold mb-1 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>{t.analytics.kpi1Title}</div>
              <p className={`text-xs ${isDark ? "text-[#E4E4E7]" : "text-slate-500"}`}>{t.analytics.kpi1Desc}</p>
            </ScrollFadeCard>

            {/* KPI 2 */}
            <ScrollFadeCard 
              className={`p-7 rounded-3xl border shadow-xs hover:shadow-md hover:-translate-y-1 transition-all ${
                isDark ? "bg-[#222222] border-[#444444] text-white" : "bg-white border-slate-200/90 text-slate-900 shadow-xs"
              }`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 font-bold ${
                isDark ? "bg-[#282828] text-white border border-[#444444]" : "bg-slate-100 text-slate-800 border border-slate-200/60"
              }`}>
                <Box className="w-5 h-5" />
              </div>
              <div className={`text-4xl font-extrabold tracking-tight mb-1 ${
                isDark ? "text-white" : "text-slate-900"
              }`}>{t.analytics.kpi2Val}</div>
              <div className={`text-sm font-semibold mb-1 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>{t.analytics.kpi2Title}</div>
              <p className={`text-xs ${isDark ? "text-[#E4E4E7]" : "text-slate-500"}`}>{t.analytics.kpi2Desc}</p>
            </ScrollFadeCard>

            {/* KPI 3 */}
            <ScrollFadeCard 
              className={`p-7 rounded-3xl border shadow-xs hover:shadow-md hover:-translate-y-1 transition-all ${
                isDark ? "bg-[#222222] border-[#444444] text-white" : "bg-white border-slate-200/90 text-slate-900 shadow-xs"
              }`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 font-bold ${
                isDark ? "bg-[#282828] text-white border border-[#444444]" : "bg-slate-100 text-slate-800 border border-slate-200/60"
              }`}>
                <Activity className="w-5 h-5" />
              </div>
              <div className={`text-4xl font-extrabold tracking-tight mb-1 ${
                isDark ? "text-white" : "text-slate-900"
              }`}>{t.analytics.kpi3Val}</div>
              <div className={`text-sm font-semibold mb-1 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>{t.analytics.kpi3Title}</div>
              <p className={`text-xs ${isDark ? "text-[#E4E4E7]" : "text-slate-500"}`}>{t.analytics.kpi3Desc}</p>
            </ScrollFadeCard>

            {/* KPI 4 */}
            <ScrollFadeCard 
              className={`p-7 rounded-3xl border shadow-xs hover:shadow-md hover:-translate-y-1 transition-all ${
                isDark ? "bg-[#222222] border-[#444444] text-white" : "bg-white border-slate-200/90 text-slate-900 shadow-xs"
              }`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center mb-4 font-bold ${
                isDark ? "bg-[#282828] text-white border border-[#444444]" : "bg-slate-100 text-slate-800 border border-slate-200/60"
              }`}>
                <Clock className="w-5 h-5" />
              </div>
              <div className={`text-4xl font-extrabold tracking-tight mb-1 ${
                isDark ? "text-white" : "text-slate-900"
              }`}>{t.analytics.kpi4Val}</div>
              <div className={`text-sm font-semibold mb-1 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>{t.analytics.kpi4Title}</div>
              <p className={`text-xs ${isDark ? "text-[#E4E4E7]" : "text-slate-500"}`}>{t.analytics.kpi4Desc}</p>
            </ScrollFadeCard>
          </div>

          {/* Interactive Deep Analytics Breakdown */}
          <ScrollFadeCard 
            className={`rounded-3xl p-6 sm:p-9 border transition-all ${
              isDark ? "bg-[#222222] border-[#444444] text-white shadow-xs" : "bg-white border-slate-200/90 text-slate-900 shadow-xs"
            }`}
          >
            <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between pb-6 border-b gap-4 ${
              isDark ? "border-[#444444]" : "border-slate-100"
            }`}>
              <div>
                <h3 className={`text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{t.analytics.breakdownTitle}</h3>
                <p className={`text-xs mt-0.5 ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>{t.analytics.breakdownSub}</p>
              </div>

              {/* Tab Selector */}
              <div className={`flex items-center gap-1.5 p-1 rounded-2xl border shadow-xs ${
                isDark ? "bg-[#181818] border-[#444444]" : "bg-slate-100/80 border-slate-200/80"
              }`}>
                {(["overview", "warehouse", "datacenter", "audit"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveAnalyticsTab(tab)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      activeAnalyticsTab === tab
                        ? isDark ? "bg-[#383838] text-white shadow-xs border border-[#555555]" : "bg-white text-slate-900 shadow-xs"
                        : isDark
                        ? "text-[#A1A1AA] hover:text-white"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {t.analytics.tabs[tab]}
                  </button>
                ))}
              </div>
            </div>

            {/* Progress Bars & Metric Distribution (Cohesive theme, no multi-color carnival) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-6">
              {activeAnalyticsTab === "overview" && (
                <>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className={`flex items-center gap-1.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>
                        <Building2 className="w-3.5 h-3.5 text-neutral-400" /> {t.analytics.overview.bkkTitle}
                      </span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>48%</span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? "bg-[#282828]" : "bg-slate-100"}`}>
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[48%]" />
                    </div>
                    <span className={`text-[11px] mt-1 block ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>{t.analytics.overview.bkkSub}</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className={`flex items-center gap-1.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>
                        <Building2 className="w-3.5 h-3.5 text-neutral-400" /> {t.analytics.overview.cnxTitle}
                      </span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>28%</span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? "bg-[#282828]" : "bg-slate-100"}`}>
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[28%]" />
                    </div>
                    <span className={`text-[11px] mt-1 block ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>{t.analytics.overview.cnxSub}</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className={`flex items-center gap-1.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>
                        <Building2 className="w-3.5 h-3.5 text-neutral-400" /> {t.analytics.overview.hdyTitle}
                      </span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>18%</span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? "bg-[#282828]" : "bg-slate-100"}`}>
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[18%]" />
                    </div>
                    <span className={`text-[11px] mt-1 block ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>{t.analytics.overview.hdySub}</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className={`flex items-center gap-1.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>
                        <Building2 className="w-3.5 h-3.5 text-neutral-400" /> {t.analytics.overview.eecTitle}
                      </span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>6%</span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? "bg-[#282828]" : "bg-slate-100"}`}>
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[6%]" />
                    </div>
                    <span className={`text-[11px] mt-1 block ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>{t.analytics.overview.eecSub}</span>
                  </div>
                </>
              )}

              {activeAnalyticsTab === "warehouse" && (
                <>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className={`flex items-center gap-1.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>
                        <Box className="w-3.5 h-3.5 text-neutral-400" /> {t.analytics.warehouse.fmcgTitle}
                      </span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>44%</span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? "bg-[#282828]" : "bg-slate-100"}`}>
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[44%]" />
                    </div>
                    <span className={`text-[11px] mt-1 block ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>{t.analytics.warehouse.fmcgSub}</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className={`flex items-center gap-1.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>
                        <Box className="w-3.5 h-3.5 text-neutral-400" /> {t.analytics.warehouse.machineryTitle}
                      </span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>28%</span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? "bg-[#282828]" : "bg-slate-100"}`}>
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[28%]" />
                    </div>
                    <span className={`text-[11px] mt-1 block ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>{t.analytics.warehouse.machinerySub}</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className={`flex items-center gap-1.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>
                        <Box className="w-3.5 h-3.5 text-neutral-400" /> {t.analytics.warehouse.techTitle}
                      </span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>20%</span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? "bg-[#282828]" : "bg-slate-100"}`}>
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[20%]" />
                    </div>
                    <span className={`text-[11px] mt-1 block ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>{t.analytics.warehouse.techSub}</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className={`flex items-center gap-1.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>
                        <Box className="w-3.5 h-3.5 text-neutral-400" /> {t.analytics.warehouse.transitTitle}
                      </span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>8%</span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? "bg-[#282828]" : "bg-slate-100"}`}>
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[8%]" />
                    </div>
                    <span className={`text-[11px] mt-1 block ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>{t.analytics.warehouse.transitSub}</span>
                  </div>
                </>
              )}

              {activeAnalyticsTab === "datacenter" && (
                <>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className={`flex items-center gap-1.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>
                        <Database className="w-3.5 h-3.5 text-neutral-400" /> {t.analytics.datacenter.activeTitle}
                      </span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>76%</span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? "bg-[#282828]" : "bg-slate-100"}`}>
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[76%]" />
                    </div>
                    <span className={`text-[11px] mt-1 block ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>{t.analytics.datacenter.activeSub}</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className={`flex items-center gap-1.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>
                        <Database className="w-3.5 h-3.5 text-neutral-400" /> {t.analytics.datacenter.settleTitle}
                      </span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>14%</span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? "bg-[#282828]" : "bg-slate-100"}`}>
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[14%]" />
                    </div>
                    <span className={`text-[11px] mt-1 block ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>{t.analytics.datacenter.settleSub}</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className={`flex items-center gap-1.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>
                        <Database className="w-3.5 h-3.5 text-neutral-400" /> {t.analytics.datacenter.reminderTitle}
                      </span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>7%</span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? "bg-[#282828]" : "bg-slate-100"}`}>
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[7%]" />
                    </div>
                    <span className={`text-[11px] mt-1 block ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>{t.analytics.datacenter.reminderSub}</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className={`flex items-center gap-1.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>
                        <Database className="w-3.5 h-3.5 text-neutral-400" /> {t.analytics.datacenter.recoveryTitle}
                      </span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>3%</span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? "bg-[#282828]" : "bg-slate-100"}`}>
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[3%]" />
                    </div>
                    <span className={`text-[11px] mt-1 block ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>{t.analytics.datacenter.recoverySub}</span>
                  </div>
                </>
              )}

              {activeAnalyticsTab === "audit" && (
                <>
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className={`flex items-center gap-1.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>
                        <ShieldCheck className="w-3.5 h-3.5 text-neutral-400" /> {t.analytics.audit.ledgerTitle}
                      </span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>100%</span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? "bg-[#282828]" : "bg-slate-100"}`}>
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[100%]" />
                    </div>
                    <span className={`text-[11px] mt-1 block ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>{t.analytics.audit.ledgerSub}</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className={`flex items-center gap-1.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>
                        <FileText className="w-3.5 h-3.5 text-neutral-400" /> {t.analytics.audit.etaxTitle}
                      </span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>99.4%</span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? "bg-[#282828]" : "bg-slate-100"}`}>
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[99%]" />
                    </div>
                    <span className={`text-[11px] mt-1 block ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>{t.analytics.audit.etaxSub}</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className={`flex items-center gap-1.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>
                        <Lock className="w-3.5 h-3.5 text-neutral-400" /> {t.analytics.audit.cryptoTitle}
                      </span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>100%</span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? "bg-[#282828]" : "bg-slate-100"}`}>
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[100%]" />
                    </div>
                    <span className={`text-[11px] mt-1 block ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>{t.analytics.audit.cryptoSub}</span>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1.5">
                      <span className={`flex items-center gap-1.5 ${isDark ? "text-[#F4F4F5]" : "text-slate-700"}`}>
                        <CreditCard className="w-3.5 h-3.5 text-neutral-400" /> {t.analytics.audit.bankTitle}
                      </span>
                      <span className={`font-bold ${isDark ? "text-white" : "text-slate-900"}`}>98.9%</span>
                    </div>
                    <div className={`h-2.5 w-full rounded-full overflow-hidden ${isDark ? "bg-[#282828]" : "bg-slate-100"}`}>
                      <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 rounded-full w-[98%]" />
                    </div>
                    <span className={`text-[11px] mt-1 block ${isDark ? "text-[#A1A1AA]" : "text-slate-400"}`}>{t.analytics.audit.bankSub}</span>
                  </div>
                </>
              )}
            </div>
          </ScrollFadeCard>
        </div>
      </motion.section>

      {/* ========================================================= */}
      {/* 4. FEATURES BENTO GRID                                    */}
      {/* ========================================================= */}
      <section id="features" className="py-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: "var(--font-outfit), sans-serif" }}
            className={`text-3xl sm:text-5xl font-extrabold tracking-tight mb-3 ${
              isDark ? "text-white" : "text-[#222222]"
            }`}
          >
            {t.features.heading}
          </motion.h2>
          <motion.p 
            initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
            whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
            viewport={{ once: false, amount: 0.25, margin: "-75px 0px -40px 0px" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={`text-base sm:text-lg ${
              isDark ? "text-[#E4E4E7]" : "text-slate-600"
            }`}
          >
            {t.features.subtitle}
          </motion.p>
        </div>

        {/* Bento Grid Layout (Cohesive theme, reduced flashy colors) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4.5 sm:gap-5">
          {/* Card 01 (Large 2-column span - Theme Aligned) */}
          <ScrollFadeCard 
            className={`md:col-span-2 rounded-[24px] border p-6 sm:p-7.5 relative overflow-hidden flex flex-col justify-between group transition-all duration-300 ${
              isDark
                ? "bg-[#222222] border-[#444444] text-white shadow-xs hover:shadow-md"
                : "bg-white border-slate-200/90 text-slate-900 shadow-xs hover:shadow-md"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <span className={`text-[11px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full ${
                  isDark ? "bg-blue-950/80 text-blue-300 border border-blue-800/40" : "bg-blue-100 text-blue-700"
                }`}>
                  {t.features.card1Badge}
                </span>
                <span className={`text-2xl font-extrabold ${isDark ? "text-white/20" : "text-slate-300"}`}>01</span>
              </div>
              <h3 className={`text-xl sm:text-2xl font-extrabold mb-2.5 tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}>
                {t.features.card1Title}
              </h3>
              <p className={`text-xs sm:text-sm max-w-lg leading-relaxed mb-6 ${
                isDark ? "text-[#A1A1AA]" : "text-slate-500"
              }`}>
                {t.features.card1Desc}
              </p>
            </div>

            {/* Visual Interactive Preview */}
            <div className={`rounded-xl p-3 border grid grid-cols-2 sm:grid-cols-4 gap-2.5 ${
              isDark ? "bg-[#181818] border-[#444444]" : "bg-slate-50 border-slate-200/80"
            }`}>
              <div className={`rounded-lg p-2.5 text-center border transition-colors ${
                isDark ? "bg-[#282828] border-[#444444] hover:bg-[#383838]" : "bg-white border-slate-200/60 shadow-2xs hover:bg-slate-50"
              }`}>
                <Database className="w-4 h-4 text-neutral-400 mx-auto mb-1" />
                <div className={`text-[10px] font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{t.features.card1P1}</div>
                <span className="text-[8px] text-emerald-500 dark:text-emerald-400">{t.features.statusActive}</span>
              </div>
              <div className={`rounded-lg p-2.5 text-center border transition-colors ${
                isDark ? "bg-[#282828] border-[#444444] hover:bg-[#383838]" : "bg-white border-slate-200/60 shadow-2xs hover:bg-slate-50"
              }`}>
                <Activity className="w-4 h-4 text-neutral-400 mx-auto mb-1" />
                <div className={`text-[10px] font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{t.features.card1P2}</div>
                <span className="text-[8px] text-emerald-500 dark:text-emerald-400">{t.features.statusSynced}</span>
              </div>
              <div className={`rounded-lg p-2.5 text-center border transition-colors ${
                isDark ? "bg-[#282828] border-[#444444] hover:bg-[#383838]" : "bg-white border-slate-200/60 shadow-2xs hover:bg-slate-50"
              }`}>
                <CreditCard className="w-4 h-4 text-neutral-400 mx-auto mb-1" />
                <div className={`text-[10px] font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{t.features.card1P3}</div>
                <span className="text-[8px] text-emerald-500 dark:text-emerald-400">{t.features.statusRealtime}</span>
              </div>
              <div className={`rounded-lg p-2.5 text-center border transition-colors ${
                isDark ? "bg-[#282828] border-[#444444] hover:bg-[#383838]" : "bg-white border-slate-200/60 shadow-2xs hover:bg-slate-50"
              }`}>
                <ShieldCheck className="w-4 h-4 text-neutral-400 mx-auto mb-1" />
                <div className={`text-[10px] font-bold ${isDark ? "text-white" : "text-slate-800"}`}>{t.features.card1P4}</div>
                <span className="text-[8px] text-emerald-500 dark:text-emerald-400">{t.features.statusVerified}</span>
              </div>
            </div>
          </ScrollFadeCard>

          {/* Card 02 (Medium 1-col - Theme Aligned) */}
          <ScrollFadeCard 
            className={`rounded-[24px] border p-6 sm:p-7.5 relative overflow-hidden flex flex-col justify-between group transition-all duration-300 ${
              isDark
                ? "bg-[#222222] border-[#444444] text-white shadow-xs hover:shadow-md"
                : "bg-white border-slate-200/90 text-slate-900 shadow-xs hover:shadow-md"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <span className={`text-[11px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full ${
                  isDark ? "bg-blue-950/80 text-blue-300 border border-blue-800/40" : "bg-blue-100 text-blue-700"
                }`}>
                  {t.features.card2Badge}
                </span>
                <span className={`text-2xl font-extrabold ${isDark ? "text-white/20" : "text-slate-300"}`}>02</span>
              </div>
              <h3 className={`text-lg sm:text-xl font-extrabold mb-2 tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}>
                {t.features.card2Title}
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed mb-4 ${
                isDark ? "text-[#A1A1AA]" : "text-slate-500"
              }`}>
                {t.features.card2Desc}
              </p>
            </div>

            {/* Visual Gauge Preview */}
            <div className={`rounded-xl p-3 border flex items-center justify-between ${
              isDark ? "bg-[#181818] border-[#444444]" : "bg-slate-50 border-slate-200/80"
            }`}>
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${
                  isDark ? "text-[#A1A1AA]" : "text-slate-500"
                }`}>{t.features.card2GaugeLabel}</span>
                <div className={`text-2xl font-black ${isDark ? "text-white" : "text-slate-900"}`}>99.8<span className="text-xs font-normal text-neutral-400">%</span></div>
              </div>
              <div className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${
                isDark ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/40" : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
              }`}>
                {t.features.card2GaugeBadge}
              </div>
            </div>
          </ScrollFadeCard>

          {/* Card 03 (Medium 1-col - Theme Aligned) */}
          <ScrollFadeCard 
            className={`rounded-[24px] border p-6 sm:p-7.5 relative overflow-hidden flex flex-col justify-between group transition-all duration-300 ${
              isDark
                ? "bg-[#222222] border-[#444444] text-white shadow-xs hover:shadow-md"
                : "bg-white border-slate-200/90 text-slate-900 shadow-xs hover:shadow-md"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <span className={`text-[11px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full ${
                  isDark ? "bg-blue-950/80 text-blue-300 border border-blue-800/40" : "bg-blue-100 text-blue-700"
                }`}>
                  {t.features.card3Badge}
                </span>
                <span className={`text-2xl font-extrabold ${isDark ? "text-white/20" : "text-slate-300"}`}>03</span>
              </div>
              <h3 className={`text-lg sm:text-xl font-extrabold mb-2 tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}>
                {t.features.card3Title}
              </h3>
              <p className={`text-xs sm:text-sm leading-relaxed mb-4 ${
                isDark ? "text-[#A1A1AA]" : "text-slate-500"
              }`}>
                {t.features.card3Desc}
              </p>
            </div>

            {/* Audit Log Preview */}
            <div className={`rounded-xl p-3 border space-y-1.5 text-[11px] ${
              isDark ? "bg-[#181818] border-[#444444]" : "bg-slate-50 border-slate-200/80"
            }`}>
              <div className={`p-2 rounded-lg truncate border ${
                isDark ? "bg-[#282828] border-[#444444] text-[#F4F4F5]" : "bg-white border-slate-200/60 text-slate-700 shadow-2xs"
              }`}>
                {t.features.card3Log1}
              </div>
              <div className={`p-2 rounded-lg truncate border ${
                isDark ? "bg-[#282828] border-[#444444] text-white" : "bg-white border-slate-200/60 text-slate-900 font-medium shadow-2xs"
              }`}>
                {t.features.card3Log2}
              </div>
            </div>
          </ScrollFadeCard>

          {/* Card 04 (Large 2-column span - Theme Aligned) */}
          <ScrollFadeCard 
            className={`md:col-span-2 rounded-[24px] border p-6 sm:p-7.5 relative overflow-hidden flex flex-col justify-between group transition-all duration-300 ${
              isDark
                ? "bg-[#222222] border-[#444444] text-white shadow-xs hover:shadow-md"
                : "bg-white border-slate-200/90 text-slate-900 shadow-xs hover:shadow-md"
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-5 sm:mb-6">
                <span className={`text-[11px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full ${
                  isDark ? "bg-blue-950/80 text-blue-300 border border-blue-800/40" : "bg-blue-100 text-blue-700"
                }`}>
                  {t.features.card4Badge}
                </span>
                <span className={`text-2xl font-extrabold ${isDark ? "text-white/20" : "text-slate-300"}`}>04</span>
              </div>
              <h3 className={`text-xl sm:text-2xl font-extrabold mb-2 tracking-tight ${
                isDark ? "text-white" : "text-slate-900"
              }`}>
                {t.features.card4Title}
              </h3>
              <p className={`text-xs sm:text-sm max-w-xl leading-relaxed mb-6 ${
                isDark ? "text-[#A1A1AA]" : "text-slate-500"
              }`}>
                {t.features.card4Desc}
              </p>
            </div>

            {/* Visual Time Slot Heatmap */}
            <div className={`rounded-xl p-4 border flex flex-wrap items-center justify-between gap-3 ${
              isDark ? "bg-[#181818] border-[#444444]" : "bg-slate-50 border-slate-200/80"
            }`}>
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
                  isDark ? "bg-[#282828] text-white" : "bg-[#222222] text-white"
                }`}>
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <div className={`text-xs sm:text-sm font-bold ${isDark ? "text-white" : "text-slate-900"}`}>{t.features.card4TitleBox}</div>
                  <div className={`text-[11px] ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>{t.features.card4SubBox}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-1 rounded-lg font-bold text-[11px] border ${
                  isDark
                    ? "bg-emerald-950/60 text-emerald-300 border-emerald-800/40"
                    : "bg-emerald-50 text-emerald-700 border-emerald-200/60"
                }`}>
                  {t.features.card4BadgeBox}
                </span>
              </div>
            </div>
          </ScrollFadeCard>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. FAQ SECTION (Accordion)                                */}
      {/* ========================================================= */}
      <section id="faq" className="py-24 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <motion.h2 
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className={`text-3xl sm:text-5xl font-extrabold tracking-tight mb-3 ${
              isDark ? "text-white" : "text-neutral-900"
            }`}
          >
            {t.faq.heading}
          </motion.h2>
          <motion.p 
            initial={{ clipPath: "inset(0% 0% 100% 0%)" }}
            whileInView={{ clipPath: "inset(0% 0% 0% 0%)" }}
            viewport={{ once: false, amount: 0.25, margin: "-75px 0px -40px 0px" }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className={`text-base sm:text-lg ${
              isDark ? "text-neutral-400" : "text-neutral-500"
            }`}
          >
            {t.faq.subtitle}
          </motion.p>
        </div>

        {/* Accordion List */}
        <div className="space-y-4">
          {t.faq.items.map((faq, index) => {
            const isOpen = activeFaq === index;
            return (
              <ScrollFadeCard
                key={index}
                className={`rounded-3xl border overflow-hidden shadow-xs transition-all ${
                  isDark ? "bg-[#222222] border-[#444444]" : "bg-white border-slate-200/90 shadow-xs"
                }`}
              >
                <button
                  onClick={() => setActiveFaq(isOpen ? null : index)}
                  className={`w-full text-left p-6 sm:p-7 flex items-center justify-between gap-4 font-bold text-base sm:text-lg transition-colors ${
                    isDark ? "text-white hover:text-blue-400" : "text-slate-900 hover:text-blue-600"
                  }`}
                >
                  <span>{faq.q}</span>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    isOpen ? "bg-blue-600 text-white" : isDark ? "bg-[#282828] text-[#E4E4E7]" : "bg-slate-100 text-slate-600"
                  }`}>
                    {isOpen ? <Minus className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                  </div>
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                      <div className={`px-6 sm:px-7 pb-6 sm:pb-7 text-sm sm:text-base leading-relaxed border-t pt-4 ${
                        isDark ? "text-[#E4E4E7] border-[#444444]" : "text-slate-600 border-slate-100"
                      }`}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </ScrollFadeCard>
            );
          })}
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. FINAL CTA BANNER                                       */}
      {/* ========================================================= */}
      <section className="pt-5 pb-[74px] px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto">
        {/* Large Rounded CTA Banner (Reduced by 1/8, half spacing & half shadow) */}
        <motion.div 
          initial={{ opacity: 0, y: 36, scale: 0.97 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-[32px] sm:rounded-[42px] bg-gradient-to-br from-[#1E3A8A] via-[#2563EB] to-[#3B82F6] text-white p-7 sm:p-14 overflow-hidden shadow-xl"
        >
          {/* Ambient Glowing Blobs */}
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-5 leading-tight">
              {t.cta.heading}
            </h2>
            <p className="text-sm sm:text-lg text-blue-100 mb-8 max-w-xl mx-auto leading-relaxed">
              {t.cta.subtitle}
            </p>

            {/* Corporate Email Input CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto mb-5">
              <input
                type="email"
                placeholder={t.cta.placeholder}
                className="w-full px-4.5 py-3.5 rounded-full bg-white/20 backdrop-blur-md text-white placeholder-white/70 border border-white/30 focus:outline-none focus:ring-2 focus:ring-white text-xs sm:text-sm"
              />
              <Link
                href="/auth/login"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-white text-blue-700 font-extrabold text-xs sm:text-sm hover:bg-neutral-100 hover:scale-105 active:scale-95 transition-all shrink-0 shadow-md text-center cursor-pointer"
              >
                {t.cta.button}
              </Link>
            </div>

            {/* Guarantee Bullets */}
            <div className="flex flex-wrap items-center justify-center gap-5 text-[11px] sm:text-xs text-blue-200">
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-300" /> {t.cta.bullet1}</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-300" /> {t.cta.bullet2}</span>
              <span className="flex items-center gap-1.5"><Check className="w-3.5 h-3.5 text-emerald-300" /> {t.cta.bullet3}</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ========================================================= */}
      {/* 7. GLOBAL FOOTER (LOCKED AT THE VERY BOTTOM OF PAGE)      */}
      {/* ========================================================= */}
      <footer className={`w-full border-t pt-12 pb-12 px-4 sm:px-6 lg:px-8 mt-auto transition-colors ${
        isDark ? "border-[#444444] bg-[#181818]" : "border-slate-200 bg-white/80 backdrop-blur-md"
      }`}>
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            {/* Col 1: Brand Info */}
            <div className="col-span-2">
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={getDawhLogo(theme, "horizontal")}
                  alt="DAWH"
                  className="h-7 sm:h-8 w-auto object-contain"
                />
              </div>
              <p className={`text-sm max-w-sm leading-relaxed mb-6 ${
                isDark ? "text-[#A1A1AA]" : "text-slate-500"
              }`}>
                {t.footer.desc}
              </p>
              <div className="flex items-center gap-3">
                <a href="#instagram" className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isDark ? "bg-[#282828] hover:bg-[#383838] text-[#E4E4E7] hover:text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                }`}>
                  <InstagramIcon className="w-4 h-4" />
                </a>
                <a href="#tiktok" className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isDark ? "bg-[#282828] hover:bg-[#383838] text-[#E4E4E7] hover:text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                }`}>
                  <TikTokIcon className="w-4 h-4" />
                </a>
                <a href="#youtube" className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isDark ? "bg-[#282828] hover:bg-[#383838] text-[#E4E4E7] hover:text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                }`}>
                  <YouTubeIcon className="w-4 h-4" />
                </a>
                <a href="#x" className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isDark ? "bg-[#282828] hover:bg-[#383838] text-[#E4E4E7] hover:text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                }`}>
                  <XIcon className="w-4 h-4" />
                </a>
                <a href="#linkedin" className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                  isDark ? "bg-[#282828] hover:bg-[#383838] text-[#E4E4E7] hover:text-white" : "bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900"
                }`}>
                  <LinkedInIcon className="w-4 h-4" />
                </a>
              </div>
            </div>

            {/* Col 2: Product */}
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>{t.footer.colProduct}</h4>
              <ul className={`space-y-2.5 text-sm ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>
                <li><a href="#features" className="hover:text-blue-500 transition-colors">HP Datacenter</a></li>
                <li><a href="#features" className="hover:text-blue-500 transition-colors">Warehouse ERP</a></li>
                <li><a href="#analytics" className="hover:text-blue-500 transition-colors">Reports & Auditing</a></li>
                <li><a href="#features" className="hover:text-blue-500 transition-colors">API Gateway</a></li>
                <li><a href="#pricing" className="hover:text-blue-500 transition-colors">Enterprise Security</a></li>
              </ul>
            </div>

            {/* Col 3: Organization */}
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>{t.footer.colOrg}</h4>
              <ul className={`space-y-2.5 text-sm ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>
                <li><a href="#about" className="hover:text-blue-500 transition-colors">{t.footer.aboutUs}</a></li>
                <li>
                  <a href="#careers" className="hover:text-blue-500 transition-colors flex items-center gap-1.5">
                    {t.footer.careers}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isDark ? "bg-blue-950/80 text-blue-300" : "bg-blue-100 text-blue-700"
                    }`}>
                      {t.footer.hiring}
                    </span>
                  </a>
                </li>
                <li><a href="#press" className="hover:text-blue-500 transition-colors">{t.footer.network}</a></li>
                <li><a href="#blog" className="hover:text-blue-500 transition-colors">{t.footer.caseStudies}</a></li>
                <li><a href="#contact" className="hover:text-blue-500 transition-colors">{t.footer.contactSales}</a></li>
              </ul>
            </div>

            {/* Col 4: Legal & Trust */}
            <div>
              <h4 className={`text-xs font-bold uppercase tracking-wider mb-4 ${isDark ? "text-[#A1A1AA]" : "text-slate-500"}`}>{t.footer.colLegal}</h4>
              <ul className={`space-y-2.5 text-sm ${isDark ? "text-[#A1A1AA]" : "text-slate-600"}`}>
                <li><a href="#privacy" className="hover:text-blue-500 transition-colors">{t.footer.privacy}</a></li>
                <li><a href="#terms" className="hover:text-blue-500 transition-colors">{t.footer.terms}</a></li>
                <li><a href="#security" className="hover:text-blue-500 transition-colors">{t.footer.security}</a></li>
                <li><a href="#api" className="hover:text-blue-500 transition-colors">{t.footer.status}</a></li>
                <li><a href="#cookie" className="hover:text-blue-500 transition-colors">{t.footer.compliance}</a></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className={`pt-8 border-t flex flex-col sm:flex-row items-center justify-between text-xs gap-3 ${
            isDark ? "border-[#444444] text-[#A1A1AA]" : "border-slate-200 text-slate-400"
          }`}>
            <p>© {new Date().getFullYear()} DAWH Platform Inc. {t.footer.copyright}</p>
            <p>{t.footer.tagline}</p>
          </div>
        </div>
      </footer>

      {/* Bottom-Right Floating Island: Theme & Language Buttons (Lighter Elevated Island) */}
      <div className={`fixed bottom-5 sm:bottom-6 right-5 sm:right-6 z-50 flex items-center gap-1 p-1.5 rounded-full backdrop-blur-xl border shadow-xl transition-all ${
        isDark
          ? "bg-[#333333]/95 border-[#4A4A4A] text-white shadow-black/40 hover:border-[#606060]"
          : "bg-white/95 border-slate-200 text-slate-800 shadow-slate-300/40 hover:border-slate-300"
      }`}>
        {/* Theme Button */}
        <button
          type="button"
          onClick={toggleTheme}
          className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors active:scale-95 ${
            isDark
              ? "text-white/85 hover:text-white hover:bg-white/10"
              : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
          }`}
          title={isThai ? (isDark ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดมืด") : (isDark ? "Switch to Light Mode" : "Switch to Dark Mode")}
          aria-label="Theme toggle"
        >
          {isDark ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-slate-800" />}
        </button>

        <div className={`w-[1px] h-4 ${isDark ? "bg-white/20" : "bg-slate-200"}`} />

        {/* Language Button */}
        <button
          type="button"
          onClick={() => setAppLanguage(isThai ? "EN" : "TH")}
          className={`flex items-center gap-1.5 px-3 h-9 rounded-full text-xs font-semibold transition-colors active:scale-95 ${
            isDark
              ? "text-white/85 hover:text-white hover:bg-white/10"
              : "text-slate-700 hover:text-slate-950 hover:bg-slate-100"
          }`}
          title={isThai ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
          aria-label="Language selector"
        >
          <Globe className={`w-4 h-4 ${isDark ? "text-white" : "text-slate-800"}`} />
          <span className={`font-medium ${isDark ? "text-white" : "text-slate-900"}`}>{appLang}</span>
        </button>
      </div>
    </div>
  );
}
