"use client";

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import LoadingScreen from "./LoadingScreen";

interface LoadingContextType {
  isLoading: boolean;
  startLoading: (options?: { exitTransition?: "slide" | "fade"; duration?: number }) => void;
  stopLoading: () => void;
  navigateWithLoading: (url: string, message?: string, description?: string) => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  startLoading: () => {},
  stopLoading: () => {},
  navigateWithLoading: () => {},
});

export function isAllowedLoadingRoute(targetUrl: string): boolean {
  if (!targetUrl) return false;
  const clean = targetUrl.split("?")[0].split("#")[0].replace(/\/$/, "");
  if (
    clean === "" ||
    clean === "/auth/login" ||
    clean === "/login" ||
    clean === "/auth" ||
    clean.startsWith("/auth/") ||
    clean === "/landing-page"
  ) {
    return false;
  }
  return true;
}

export function LoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [isNavLoading, setIsNavLoading] = useState<boolean>(false);
  const [isExiting, setIsExiting] = useState<boolean>(false);
  const [exitTransition, setExitTransition] = useState<"slide" | "fade">("slide");

  // LoadingScreen displays only during active navigation
  const isLoading = isNavLoading && !isExiting;

  const prevPathnameRef = useRef<string>(pathname);
  const navStartTimeTracker = useRef<number>(0);
  const navigationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
  }, []);

  const stopLoading = useCallback(() => {
    clearAllTimers();
    setIsExiting(true);
    setTimeout(() => {
      setIsNavLoading(false);
      setIsExiting(false);
      setExitTransition("slide");
    }, 650);
  }, [clearAllTimers]);

  const startLoading = useCallback(
    (options?: { exitTransition?: "slide" | "fade"; duration?: number }) => {
      clearAllTimers();
      setExitTransition(options?.exitTransition || "slide");
      navStartTimeTracker.current = Date.now();
      setIsExiting(false);
      setIsNavLoading(true);

      // Watchdog safety: auto dismiss after 7 seconds max
      watchdogTimerRef.current = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsNavLoading(false);
          setIsExiting(false);
          setExitTransition("slide");
        }, 650);
      }, 7000);
    },
    [clearAllTimers]
  );

  const navigateWithLoading = useCallback(
    (url: string) => {
      if (!url) return;

      const targetPath = url.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
      const currentPath = (pathname || "").split("?")[0].split("#")[0].replace(/\/$/, "") || "/";

      if (targetPath === currentPath) {
        clearAllTimers();
        setIsNavLoading(false);
        router.push(url);
        return;
      }

      if (!isAllowedLoadingRoute(url)) {
        clearAllTimers();
        setIsNavLoading(false);
        setIsExiting(false);
        router.push(url);
        return;
      }

      clearAllTimers();
      navStartTimeTracker.current = Date.now();
      setIsExiting(false);
      setIsNavLoading(true);

      try {
        router.prefetch(url);
      } catch {}

      // Push route transition smoothly after initial logo flow starts
      navigationTimerRef.current = setTimeout(() => {
        router.push(url);
      }, 350);

      // Watchdog safety
      watchdogTimerRef.current = setTimeout(() => {
        setIsExiting(true);
        setTimeout(() => {
          setIsNavLoading(false);
          setIsExiting(false);
        }, 650);
      }, 7000);
    },
    [router, pathname, clearAllTimers]
  );

  // Route change monitor: ensures standard 2.0s flow fill, then exits quickly (halved hold time: 90ms)
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      clearAllTimers();

      if (isNavLoading) {
        const minAnimationTime = 1300; // Fast & crisp 1.3s fill duration
        const elapsed =
          navStartTimeTracker.current > 0
            ? Date.now() - navStartTimeTracker.current
            : minAnimationTime;

        // Hold time when full: 80ms
        const remaining = Math.max(80, minAnimationTime - elapsed + 80);

        const exitTimer = setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            setIsNavLoading(false);
            setIsExiting(false);
            setExitTransition("slide");
          }, 550);
        }, remaining);

        return () => clearTimeout(exitTimer);
      }
    }
  }, [pathname, isNavLoading, clearAllTimers]);

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        startLoading,
        stopLoading,
        navigateWithLoading,
      }}
    >
      {children}
      <AnimatePresence mode="wait">
        {isLoading && (
          <LoadingScreen
            key="dawh-module-navigation-loading-screen"
            fullscreen
            duration={1.3}
            exitTransition={exitTransition}
          />
        )}
      </AnimatePresence>
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}

// Backwards compatibility alias
export { LoadingProvider as NavigationLoadingProvider };
export default LoadingProvider;
