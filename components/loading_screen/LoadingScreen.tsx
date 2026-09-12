"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { DAWH_LOGOS } from "@/config/brand";

export interface LoadingScreenProps {
  /** Display variant: "default" (logo + progress bar + loading text) or "pure-logo" (pure logo fill only) */
  variant?: "default" | "pure-logo";
  /** Optional title or status text (reserved) */
  message?: string;
  /** Optional subtitle or detail message (reserved) */
  description?: string;
  /** Whether to show in fullscreen fixed overlay mode (default: true) */
  fullscreen?: boolean;
  /** Custom logo aspect ratio: "horizontal" (2:1) or "square" (1:1) */
  logoRatio?: "horizontal" | "square";
  /** Optional theme override */
  themeOverride?: "light" | "dark";
  /** Custom additional container class */
  className?: string;
  /** Whether the loading screen is visible */
  show?: boolean;
  /** Whether to show the progress bar (default: true if variant is "default") */
  showProgress?: boolean;
  /** Whether to show the loading... text (default: true if variant is "default") */
  showText?: boolean;
}

export default function LoadingScreen({
  variant = "pure-logo",
  fullscreen = true,
  logoRatio = "horizontal",
  themeOverride,
  className = "",
  show = true,
  showProgress = false,
  showText = false,
}: LoadingScreenProps) {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme || "dark";
  const isLight = theme === "light";

  const isPureLogo = true;
  const displayProgress = Boolean(showProgress);
  const displayText = Boolean(showText);

  // Pure logo uses elegant 1.95s synchronized flow fill
  const fillDuration = 1.95;
  const initialDelay = 0.08;

  if (!show) return null;

  // Dual-theme logo CDN URLs
  const activeLogoUrl =
    logoRatio === "square"
      ? isLight
        ? DAWH_LOGOS.square2048.black
        : DAWH_LOGOS.square2048.light
      : isLight
      ? DAWH_LOGOS.horizontal.black
      : DAWH_LOGOS.horizontal.light;

  const content = (
    <div className="relative flex flex-col items-center justify-center select-none">
      {/* 1. Pure Hero Logo Loading */}
      <div
        className={`relative ${
          logoRatio === "square"
            ? "w-[88px] h-[88px] sm:w-[104px] sm:h-[104px]"
            : "w-[224px] sm:w-[296px] md:w-[340px] aspect-[2/1]"
        } flex items-center justify-center`}
      >
        {/* Layer 1: Ghost Base Silhouette */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={activeLogoUrl}
          alt="DAWH Logo Outline"
          className={`absolute inset-0 w-full h-full object-contain pointer-events-none transition-opacity duration-300 ${
            isLight ? "opacity-15" : "opacity-20 brightness-75"
          }`}
          draggable={false}
        />

        {/* Layer 2: Synchronized Flow Fill */}
        <motion.div
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{
            duration: fillDuration,
            ease: [0.25, 1, 0.5, 1],
            delay: initialDelay,
          }}
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeLogoUrl}
            alt="DAWH Logo Active"
            className="w-full h-full object-contain"
            draggable={false}
          />
        </motion.div>
      </div>

      {/* Optional Progress Bar (Only when explicitly enabled with showProgress={true}) */}
      {displayProgress && (
        <div className="w-[260px] max-w-[90vw] mt-[3px]">
          <div
            className={`relative h-[3.5px] w-full rounded-full overflow-hidden ${
              isLight ? "bg-slate-200" : "bg-[#383838]"
            }`}
          >
            <motion.div
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{
                duration: fillDuration,
                ease: [0.25, 1, 0.5, 1],
                delay: initialDelay,
              }}
              className={`h-full rounded-full ${
                isLight
                  ? "bg-[#222222] shadow-[0_0_8px_rgba(0,0,0,0.2)]"
                  : "bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]"
              }`}
            />
          </div>
        </div>
      )}

      {/* Optional Loading Text (Only when explicitly enabled with showText={true}) */}
      {displayText && (
        <div className="relative mt-2.5 flex items-center justify-center">
          <span
            className={`text-[11px] sm:text-xs font-semibold tracking-[0.22em] lowercase select-none ${
              isLight ? "text-slate-400/40" : "text-white/20"
            }`}
          >
            loading...
          </span>
        </div>
      )}
    </div>
  );

  if (fullscreen) {
    return (
      <motion.div
        id="dawh-loading-screen"
        aria-live="polite"
        role="status"
        initial={{ y: "0%", opacity: 1 }}
        exit={{
          y: "-100%",
          transition: { duration: 0.75, ease: [0.16, 1, 0.3, 1] },
        }}
        className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center pointer-events-none shadow-2xl transition-colors duration-300 ${
          isLight ? "bg-[#F8FAFC]" : "bg-[#222222]"
        } ${className}`}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <div
      aria-live="polite"
      role="status"
      className={`relative flex flex-col items-center justify-center p-8 transition-colors duration-300 ${className}`}
    >
      {content}
    </div>
  );
}
