"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { DAWH_LOGOS } from "@/config/brand";

export interface AuthLoadingScreenProps {
  /** Whether the auth loading screen is visible */
  show?: boolean;
  /** Duration in seconds for the logo flow fill (default: 3.2s) */
  duration?: number;
  /** Custom logo aspect ratio: "horizontal" (2:1) or "square" (1:1) */
  logoRatio?: "horizontal" | "square";
  /** Optional theme override */
  themeOverride?: "light" | "dark";
  /** Custom additional container class */
  className?: string;
  /** Callback fired when the logo has completed filling to 100% */
  onFilled?: () => void;
}

/**
 * 🛡️ AuthLoadingScreen:
 * Dedicated Loading Screen for Web Entry & Authentication Verification.
 * Calm, deliberate 3.2s flow fill with an ultra-smooth Fade-Out exit transition.
 */
export default function AuthLoadingScreen({
  show = true,
  duration = 3.2,
  logoRatio = "horizontal",
  themeOverride,
  className = "",
  onFilled,
}: AuthLoadingScreenProps) {
  const { theme: contextTheme } = useTheme();
  const theme = themeOverride || contextTheme || "dark";
  const isLight = theme === "light";

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

  return (
    <motion.div
      id="dawh-auth-loading-screen"
      aria-live="polite"
      role="status"
      initial={{ opacity: 1 }}
      exit={{
        opacity: 0,
        transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
      }}
      className={`fixed inset-0 z-[99999] flex flex-col items-center justify-center pointer-events-none shadow-2xl transition-colors duration-300 ${
        isLight ? "bg-[#F8FAFC]" : "bg-[#222222]"
      } ${className}`}
    >
      <div className="relative flex flex-col items-center justify-center select-none">
        {/* Pure Hero Logo Loading */}
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

          {/* Layer 2: Continuous Flow Fill */}
          <motion.div
            initial={{ clipPath: "inset(0 100% 0 0)" }}
            animate={{ clipPath: "inset(0 0% 0 0)" }}
            transition={{
              duration,
              ease: [0.25, 1, 0.5, 1],
              delay: 0.05,
            }}
            onAnimationComplete={() => {
              if (onFilled) onFilled();
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
      </div>
    </motion.div>
  );
}
