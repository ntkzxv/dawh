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
  const navigationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearAllTimers = useCallback(() => {
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const stopLoading = useCallback(() => {
    clearAllTimers();
    setIsExiting(true);
    exitTimerRef.current = setTimeout(() => {
      setIsNavLoading(false);
      setIsExiting(false);
      setExitTransition("slide");
      exitTimerRef.current = null;
    }, 160);
  }, [clearAllTimers]);

  const startLoading = useCallback(
    (options?: { exitTransition?: "slide" | "fade"; duration?: number }) => {
      clearAllTimers();
      setExitTransition(options?.exitTransition || "slide");
      setIsExiting(false);
      setIsNavLoading(false);

      // Avoid flashing a full-screen loader for fast transitions.
      navigationTimerRef.current = setTimeout(() => {
        setIsNavLoading(true);
        navigationTimerRef.current = null;
      }, 150);

      // Hide stale navigation feedback if an operation never completes.
      watchdogTimerRef.current = setTimeout(() => {
        setIsExiting(true);
        exitTimerRef.current = setTimeout(() => {
          setIsNavLoading(false);
          setIsExiting(false);
          setExitTransition("slide");
          exitTimerRef.current = null;
        }, 160);
      }, 15_000);
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
      setIsExiting(false);
      setIsNavLoading(false);
      setExitTransition("slide");

      navigationTimerRef.current = setTimeout(() => {
        setIsNavLoading(true);
        navigationTimerRef.current = null;
      }, 150);
      router.push(url);

      // Watchdog safety
      watchdogTimerRef.current = setTimeout(() => {
        setIsExiting(true);
        exitTimerRef.current = setTimeout(() => {
          setIsNavLoading(false);
          setIsExiting(false);
          exitTimerRef.current = null;
        }, 160);
      }, 15_000);
    },
    [router, pathname, clearAllTimers]
  );

  // End navigation feedback shortly after the destination route renders.
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      clearAllTimers();

      if (isNavLoading) {
        exitTimerRef.current = setTimeout(() => {
          setIsExiting(true);
          exitTimerRef.current = setTimeout(() => {
            setIsNavLoading(false);
            setIsExiting(false);
            setExitTransition("slide");
            exitTimerRef.current = null;
          }, 160);
        }, 0);
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
