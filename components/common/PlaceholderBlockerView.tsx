"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppLanguage } from "@/utils/language";
import { useLoading } from "@/components/loading_screen";
import { useTheme } from "@/context/ThemeContext";
import { getDawhLogo } from "@/config/brand";

export interface PlaceholderBlockerViewProps {
  numeral?: string;
  heading?: string;
  subtext?: string;
  badge?: string;
  returnPath?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export default function PlaceholderBlockerView({
  numeral = "404",
  heading,
  subtext,
  badge = "SYSTEM 404",
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

  const defaultHeading = heading || (isThai ? "ระบบยังไม่เปิดให้บริการ" : "Page Not Found");
  const defaultSubtext =
    subtext ||
    (isThai
      ? "หน้านี้ยังไม่ได้เปิดให้ใช้งาน หรือกำลังอยู่ในขั้นตอนการพัฒนา"
      : "The page you are looking for is currently under development or does not exist.");
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
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={`min-h-screen w-full flex flex-col justify-between items-center transition-colors duration-300 ${
          isLight
            ? "bg-[#F8FAFC] text-[#222222] selection:bg-slate-900 selection:text-white"
            : "bg-[#2C2C2C] text-white selection:bg-white/20 selection:text-white"
        }`}
        style={{ fontFamily: "var(--font-geist-sans), 'Geist', sans-serif" }}
      >
        {/* ======================================================== */}
        {/* 📌 [Header] - 1440px x 78px spec with Official Brand Logo */}
        {/* ======================================================== */}
        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="w-full max-w-[1440px] h-[78px] px-6 sm:px-12 py-6 flex flex-row justify-between items-center shrink-0 box-border"
        >
          {/* Official DAWH Brand Logo (Same as other pages) */}
          <div
            onClick={() => navigateWithLoading("/workspace")}
            className="flex items-center cursor-pointer hover:opacity-85 transition-opacity select-none"
            title="DAWH Workspace"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={getDawhLogo(theme, "horizontal")}
              alt="DAWH Logo"
              className="h-[32px] sm:h-[36px] w-auto object-contain select-none"
              draggable={false}
            />
          </div>

          {/* system-badge: Geist 12px Bold */}
          <span
            className={`text-[12px] font-bold leading-[16px] tracking-wider uppercase select-none ${
              isLight ? "text-slate-500" : "text-[#E4E4E7]"
            }`}
            style={{ fontFamily: "var(--font-geist-sans), 'Geist', sans-serif" }}
          >
            {badge}
          </span>
        </motion.header>

        {/* ======================================================== */}
        {/* 📌 [Content Container] - 1440px x 526px spec            */}
        {/* ======================================================== */}
        <main className="w-full max-w-[1440px] flex-1 flex flex-col justify-center items-center px-4 sm:px-10 py-6 box-border">
          {/* error-card: 520px x 526px, animated in & out */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -18 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className={`box-border w-full max-w-[520px] flex flex-col items-center p-8 sm:p-12 gap-8 rounded-[16px] transition-colors duration-300 ${
              isLight
                ? "bg-white border border-[#E4E4E7] shadow-[0px_12px_32px_rgba(0,0,0,0.06)]"
                : "bg-[#383838] border border-[#444444] shadow-[0px_12px_32px_rgba(0,0,0,0.0313726)]"
            }`}
          >
            {/* numeral-wrapper */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center gap-2 text-center w-full max-w-[424px]"
            >
              {/* numeral: 120px Outfit 900 */}
              <span
                className={`text-[96px] sm:text-[120px] font-black leading-none tracking-tight select-none ${
                  isLight ? "text-slate-900" : "text-[#FFFFFF]"
                }`}
                style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}
              >
                {numeral}
              </span>

              {/* heading: 32px Outfit 700 */}
              <h1
                className={`text-[26px] sm:text-[32px] font-bold leading-[120%] text-center ${
                  isLight ? "text-slate-900" : "text-[#FFFFFF]"
                }`}
                style={{ fontFamily: "var(--font-outfit), 'Outfit', sans-serif" }}
              >
                {defaultHeading}
              </h1>
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

            {/* actions: 424px x 42px gap 12px (No Search Bar) */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.26, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-[424px] flex flex-row justify-center items-center gap-3 pt-2"
            >
              {/* btn-primary: 163px x 42px */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handlePrimaryClick}
                className={`box-border h-[42px] px-6 py-3 min-w-[140px] sm:min-w-[163px] flex items-center justify-center rounded-[8px] transition-all duration-200 cursor-pointer shadow-xs ${
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

              {/* btn-secondary: 106px x 42px */}
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSecondaryClick}
                className={`box-border h-[42px] px-6 py-3 min-w-[96px] sm:min-w-[106px] flex items-center justify-center rounded-[8px] transition-all duration-200 cursor-pointer ${
                  isLight
                    ? "bg-white hover:bg-slate-100 text-slate-800 border border-[#E4E4E7] hover:border-slate-400"
                    : "bg-[#383838] hover:bg-[#444444] text-[#F4F4F5] border border-[#444444] hover:border-zinc-400"
                }`}
              >
                <span
                  className="text-[14px] font-bold leading-[18px] whitespace-nowrap"
                  style={{ fontFamily: "var(--font-geist-sans), 'Geist', sans-serif" }}
                >
                  {defaultSecondaryLabel}
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
          className="w-full max-w-[1440px] h-[80px] p-8 flex flex-row justify-center items-center shrink-0 box-border"
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
