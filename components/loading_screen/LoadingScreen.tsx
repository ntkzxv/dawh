"use client";

import React from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { DAWH_LOGOS } from "@/config/brand";

export interface LoadingScreenProps {
  /** Whether the loading screen is visible */
  show?: boolean;
  /** Whether system readiness has completed */
  isReady?: boolean;
  /** Callback fired when the logo has completed filling to 100% */
  onFilled?: () => void;
  /** Duration in seconds for the flow fill animation (default: 2.0s) */
  duration?: number;
  /** Whether to show in fullscreen fixed overlay mode (default: true) */
  fullscreen?: boolean;
  /** Custom logo aspect ratio: "horizontal" (2:1) or "square" (1:1) */
  logoRatio?: "horizontal" | "square";
  /** Optional theme override */
  themeOverride?: "light" | "dark";
  /** Custom additional container class */
  className?: string;
  /** Display variant (reserved for backward compatibility) */
  variant?: "default" | "pure-logo";
  /** Optional title or status text (reserved) */
  message?: string;
  /** Optional subtitle or detail message (reserved) */
  description?: string;
  /** Reserved */
  showProgress?: boolean;
  /** Reserved */
  showText?: boolean;
  /** Transition type on exit: "slide" (y: -100%) or "fade" (opacity: 0). Default: "slide" */
  exitTransition?: "slide" | "fade";
  /** Reserved */
  progress?: number;
}

export default function LoadingScreen({
  show = true,
  onFilled,
  duration = 1.3,
  fullscreen = true,
  logoRatio = "horizontal",
  themeOverride,
  className = "",
  exitTransition = "slide",
}: LoadingScreenProps) {
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

  const content = (
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

        {/* Layer 2: Continuous Flow Fill (flows smoothly 0% -> 100% without stopping at half) */}
        <motion.div
          initial={{ clipPath: "inset(0 100% 0 0)" }}
          animate={{ clipPath: "inset(0 0% 0 0)" }}
          transition={{
            duration,
            ease: [0.25, 1, 0.5, 1],
            delay: 0.05,
          }}
          onAnimationComplete={() => {
            if (onFilled) {
              onFilled();
            }
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
  );

  if (fullscreen) {
    const isSlide = exitTransition === "slide";

    return (
      <motion.div
        id="dawh-loading-screen"
        aria-live="polite"
        role="status"
        initial={isSlide ? { y: "0%", opacity: 1 } : { opacity: 1 }}
        exit={
          isSlide
            ? {
                y: "-100%",
                transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
              }
            : {
                opacity: 0,
                transition: { duration: 0.55, ease: [0.4, 0, 0.2, 1] },
              }
        }
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
