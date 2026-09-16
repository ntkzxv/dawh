"use client";

import React, { useEffect, useState, useRef } from "react";
import { AnimatePresence } from "framer-motion";
import LoadingScreen from "./LoadingScreen";
import { useLoading } from "./NavigationLoadingProvider";

export interface AuthBarrierLoaderProps {
  /** Whether the auth verification / background task is active */
  isLoading: boolean;
  /** Minimum time to display the loader in milliseconds (default: 2100ms) */
  minDisplayTime?: number;
  /** Custom additional container class */
  className?: string;
  /** Callback fired when the loader finishes its display time and exits */
  onExited?: () => void;
}

/**
 * 🛡️ AuthBarrierLoader:
 * Auth Barrier & Route Gate using the official DAWH Loading Screen.
 * Enforces a Minimum Display Time Delay (2100ms: 1.65s fill + 450ms hold)
 * to prevent flickering and ensure smooth logo & progress animation.
 */
export default function AuthBarrierLoader({
  isLoading,
  minDisplayTime = 2100,
  className = "",
  onExited,
}: AuthBarrierLoaderProps) {
  const { isLoading: isNavLoading } = useLoading();
  const [prevLoading, setPrevLoading] = useState(isLoading);
  const [isFinished, setIsFinished] = useState(!isLoading);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // If the global NavigationLoadingProvider is already covering the screen,
  // we do not render a duplicate AuthBarrierLoader overlay to prevent overlapping.
  const isBypassedByNav = isNavLoading;

  // Sync state during render if isLoading toggles (React pattern: adjusting state when prop changes)
  if (isLoading !== prevLoading) {
    setPrevLoading(isLoading);
    if (isLoading) {
      setIsFinished(false);
    }
  }

  useEffect(() => {
    if (isLoading) {
      if (timerRef.current) clearTimeout(timerRef.current);
      startTimeRef.current = Date.now();
    } else {
      const elapsed =
        startTimeRef.current > 0 ? Date.now() - startTimeRef.current : minDisplayTime;
      const remaining = Math.max(minDisplayTime - elapsed, 0);

      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        setIsFinished(true);
        if (onExited) onExited();
      }, remaining);
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isLoading, minDisplayTime, onExited]);

  const shouldRender = !isBypassedByNav && (isLoading || !isFinished);

  return (
    <AnimatePresence mode="wait">
      {shouldRender && (
        <LoadingScreen
          key="dawh-auth-barrier-loader"
          fullscreen={true}
          show={true}
          className={className}
        />
      )}
    </AnimatePresence>
  );
}

