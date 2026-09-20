"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppLanguage } from "@/utils/language";
import { useLoading } from "@/components/loading_screen";
import { useTheme } from "@/context/ThemeContext";
import { getDawhLogo, DAWH_LONGNOSPACE_DATA_URI } from "@/config/brand";

import { Wrench, Sparkles } from "lucide-react";

export interface PlaceholderBlockerViewProps {
  numeral?: string | null;
  icon?: React.ReactNode;
  code?: string | number;
  heading?: string;
  headingTh?: string;
  headingEn?: string;
  subtext?: string;
  subtextTh?: string;
  subtextEn?: string;
  badge?: string;
  badgeTh?: string;
  badgeEn?: string;
  returnPath?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export default function PlaceholderBlockerView({
  numeral,
  icon,
  code,
  heading,
  headingTh,
  headingEn,
  subtext,
  subtextTh,
  subtextEn,
  badge,
  badgeTh,
  badgeEn,
  returnPath = "/workspace",
  primaryLabel,
  secondaryLabel,
}: PlaceholderBlockerViewProps) {
  const router = useRouter();
  const { navigateWithLoading } = useLoading();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang.toLowerCase() === "th";

  const defaultHeading =
    (isThai ? headingTh : headingEn) ||
    heading ||
    (isThai ? "ฟีเจอร์นี้ยังไม่พร้อมใช้งาน" : "Feature Not Ready Yet");

  const defaultSubtext =
    (isThai ? subtextTh : subtextEn) ||
    subtext ||
    (isThai
      ? "ฟังก์ชันหรือระบบนี้อยู่ระหว่างการพัฒนา และยังไม่พร้อมเปิดให้บริการในขณะนี้"
      : "This feature is currently under development and will be available in an upcoming update.");

  const defaultBadge =
    (isThai ? badgeTh : badgeEn) ||
    badge ||
    (isThai ? "ฟีเจอร์อยู่ระหว่างการพัฒนา" : "FEATURE IN PROGRESS");
  const defaultPrimaryLabel = primaryLabel || (isThai ? "กลับสู่ Workspace" : "Back to Workspace");
  const defaultSecondaryLabel = secondaryLabel || (isThai ? "ย้อนกลับ" : "Go Back");

  const handlePrimaryClick = () => {
    navigateWithLoading(
      returnPath,
      isThai ? "กำลังเปิดศูนย์รวมระบบ..." : "Opening Workspace...",
      isThai ? "กำลังโหลดระบบงาน..." : "Loading workspace..."
    );
  };

  const handleSecondaryClick = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
    } else {
      navigateWithLoading(returnPath);
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="placeholder-page"
        initial={false}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={`relative min-h-screen w-full flex flex-col justify-between items-center overflow-x-hidden overflow-y-auto transition-colors duration-300 ${
          isLight
            ? "bg-[#F8FAFC] text-[#222222] selection:bg-slate-900 selection:text-white"
            : "bg-[#222222] text-white selection:bg-white/20 selection:text-white"
        }`}
        style={{ fontFamily: "var(--font-geist-sans), 'Geist', sans-serif" }}
      >
        {/* ======================================================== */}
        {/* 📌 [Two-Tone Split Background] - Exact Workspace Standard */}
        {/* ======================================================== */}
        <div className="absolute inset-0 flex flex-col pointer-events-none z-0 select-none">
          {/* Upper Tone: Light #EEF2F6 / Dark #1A1A1A */}
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
                    WebkitMaskImage: `url("${DAWH_LONGNOSPACE_DATA_URI}")`,
                    maskImage: `url("${DAWH_LONGNOSPACE_DATA_URI}")`,
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

          {/* Lower Tone: Light #FFFFFF / Dark #282828 */}
          <div
            className={`w-full flex-1 relative overflow-hidden transition-colors duration-300 ${
              isLight ? "bg-[#FFFFFF]" : "bg-[#282828]"
            }`}
          >
            <div
              className="absolute bottom-0 right-0 h-full w-full pointer-events-none select-none transition-colors duration-300"
              style={{
                backgroundColor: isLight ? "#EEF2F6" : "#1A1A1A",
                WebkitMaskImage: `url("${DAWH_LONGNOSPACE_DATA_URI}")`,
                maskImage: `url("${DAWH_LONGNOSPACE_DATA_URI}")`,
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

        {/* ======================================================== */}
        {/* 📌 [Header] - Official Brand Logo                        */}
        {/* ======================================================== */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 w-full max-w-[1440px] h-[84px] px-6 sm:px-12 py-6 flex flex-row items-center shrink-0 box-border"
        >
          {/* Official DAWH Brand Logo */}
          <div
            onClick={() => navigateWithLoading("/workspace")}
            className="flex items-center cursor-pointer hover:opacity-85 transition-opacity select-none"
            title="DAWH Workspace"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getDawhLogo(theme, "horizontal")}
              alt="DAWH Logo"
              className="h-[42px] sm:h-[48px] w-auto object-contain select-none"
              draggable={false}
            />
          </div>
        </motion.header>

        {/* ======================================================== */}
        {/* 📌 [Content Container] - 1440px x 526px spec            */}
        {/* ======================================================== */}
        <main className="relative z-10 w-full max-w-[1440px] flex-1 flex flex-col justify-center items-center px-4 sm:px-10 py-6 box-border">
          {/* error-card: 520px x 526px, animated in & out */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -18 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className={`box-border w-full max-w-[520px] flex flex-col items-center p-8 sm:p-12 gap-6 sm:gap-8 rounded-[20px] backdrop-blur-md transition-colors duration-300 ${
              isLight
                ? "bg-white/95 border border-[#E4E4E7] shadow-[0px_12px_32px_rgba(0,0,0,0.06)]"
                : "bg-[#282828]/95 border border-[#444444] shadow-[0px_12px_32px_rgba(0,0,0,0.25)]"
            }`}
          >
            {/* numeral or icon-wrapper */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center gap-3 text-center w-full max-w-[424px]"
            >
              {numeral ? (
                <span
                  className={`text-[80px] sm:text-[104px] font-black leading-none tracking-tight select-none ${
                    isLight ? "text-slate-900" : "text-[#FFFFFF]"
                  }`}
                  style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}
                >
                  {numeral}
                </span>
              ) : (
                <div className="relative flex items-center justify-center py-2 mb-1">
                  {/* Dynamic Maintenance/Construction Animation */}
                  <motion.div
                    animate={{
                      rotate: [0, -28, 12, -24, 0],
                      y: [0, -4, 0],
                    }}
                    transition={{
                      duration: 2.2,
                      repeat: Infinity,
                      ease: "easeInOut",
                      repeatDelay: 0.35,
                    }}
                    className={`relative flex items-center justify-center select-none ${
                      isLight ? "text-slate-900" : "text-white"
                    }`}
                  >
                    {icon || (
                      <Wrench
                        size={56}
                        strokeWidth={2.2}
                        className={isLight ? "text-slate-900" : "text-white"}
                      />
                    )}
                  </motion.div>
                </div>
              )}

              {/* heading: 32px Outfit 700 */}
              <h1
                className={`text-[24px] sm:text-[30px] font-bold leading-[125%] text-center ${
                  isLight ? "text-slate-900" : "text-[#FFFFFF]"
                }`}
                style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}
              >
                {defaultHeading}
              </h1>

              {code && (
                <span
                  className={`text-[11.5px] font-mono font-semibold tracking-wider select-none ${
                    isLight ? "text-slate-400" : "text-zinc-500"
                  }`}
                >
                  STATUS: {code}
                </span>
              )}
            </motion.div>

            {/* subtext: 15px Geist 400 */}
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className={`w-full max-w-[424px] text-[14px] sm:text-[15px] font-normal leading-[150%] text-center ${
                isLight ? "text-slate-600" : "text-[#E4E4E7]"
              }`}
              style={{ fontFamily: "var(--font-geist-sans), 'Geist', sans-serif" }}
            >
              {defaultSubtext}
            </motion.p>

            {/* actions: Only Back to Workspace button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.26, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-[424px] flex flex-row justify-center items-center pt-2"
            >
              {/* btn-primary: Back to Workspace */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePrimaryClick}
                className={`box-border h-[44px] px-8 py-3 min-w-[180px] sm:min-w-[200px] flex items-center justify-center rounded-[10px] transition-all duration-200 cursor-pointer shadow-sm ${
                  isLight
                    ? "bg-slate-900 hover:bg-black text-white border border-slate-900"
                    : "bg-[#2B2B2B] hover:bg-[#222222] text-[#F4F4F5] border border-[#555555] hover:border-zinc-300"
                }`}
              >
                <span
                  className="text-[14px] font-bold leading-[18px] whitespace-nowrap"
                  style={{ fontFamily: "var(--font-geist-sans), 'Geist', sans-serif" }}
                >
                  {defaultPrimaryLabel}
                </span>
              </motion.button>
            </motion.div>
          </motion.div>
        </main>

        {/* ======================================================== */}
        {/* 📌 [Footer] - 1440px x 80px spec                         */}
        {/* ======================================================== */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="relative z-10 w-full max-w-[1440px] h-[80px] p-8 flex flex-row justify-center items-center shrink-0 box-border"
        >
          <span
            className={`text-[12px] font-normal leading-[16px] text-center select-none ${
              isLight ? "text-slate-500" : "text-[#E4E4E7]"
            }`}
            style={{ fontFamily: "var(--font-geist-sans), 'Geist', sans-serif" }}
          >
            &copy; 2026 DAWH Enterprise. All rights reserved.
          </span>
        </motion.footer>
      </motion.div>
    </AnimatePresence>
  );
}
