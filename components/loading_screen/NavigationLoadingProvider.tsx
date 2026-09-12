"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import LoadingScreen from "./LoadingScreen";

interface LoadingContextType {
  isLoading: boolean;
  message?: string;
  description?: string;
  startLoading: (message?: string, description?: string) => void;
  stopLoading: () => void;
  navigateWithLoading: (url: string, message?: string, description?: string) => void;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  message: undefined,
  description: undefined,
  startLoading: () => {},
  stopLoading: () => {},
  navigateWithLoading: () => {},
});

export function isAllowedLoadingRoute(targetUrl: string): boolean {
  if (!targetUrl) return false;
  return true;
}

export function NavigationLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const [description, setDescription] = useState<string | undefined>(undefined);
  const router = useRouter();
  const pathname = usePathname();

  const navigationTimerRef = React.useRef<NodeJS.Timeout | null>(null);
  const watchdogTimerRef = React.useRef<NodeJS.Timeout | null>(null);

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

  // Dismiss loading screen immediately when pathname changes
  useEffect(() => {
    clearAllTimers();
    setIsLoading(false);
  }, [pathname, clearAllTimers]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const stopLoading = useCallback(() => {
    clearAllTimers();
    setIsLoading(false);
    setMessage(undefined);
    setDescription(undefined);
  }, [clearAllTimers]);

  const startLoading = useCallback((msg?: string, desc?: string) => {
    clearAllTimers();
    setMessage(msg);
    setDescription(desc);
    setIsLoading(true);

    // Safety watchdog: Automatically stop loading after 5 seconds max
    watchdogTimerRef.current = setTimeout(() => {
      setIsLoading(false);
    }, 5000);
  }, [clearAllTimers]);

  const navigateWithLoading = useCallback(
    (url: string, msg?: string, desc?: string) => {
      if (!url) return;

      const targetPath = url.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
      const currentPath = (pathname || "").split("?")[0].split("#")[0].replace(/\/$/, "") || "/";

      // 🛑 If user is already on the exact same page, do not get stuck on loading screen!
      if (targetPath === currentPath) {
        clearAllTimers();
        setIsLoading(false);
        router.push(url);
        return;
      }

      clearAllTimers();
      setMessage(msg || "กำลังเชื่อมต่อระบบ...");
      setDescription(desc || "กำลังโหลดข้อมูลโมดูล...");
      setIsLoading(true);

      // Perform smooth transition before route transition
      navigationTimerRef.current = setTimeout(() => {
        router.push(url);
      }, 1200);

      // 🛡️ Safety Watchdog: If route transition takes longer than 3 seconds or is blocked, auto-dismiss
      watchdogTimerRef.current = setTimeout(() => {
        setIsLoading(false);
      }, 3000);
    },
    [router, pathname, clearAllTimers]
  );

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        message,
        description,
        startLoading,
        stopLoading,
        navigateWithLoading,
      }}
    >
      {children}
      {isLoading && (
        <LoadingScreen
          fullscreen
          variant="default"
          message={message}
          description={description}
        />
      )}
    </LoadingContext.Provider>
  );
}

export function useLoading() {
  return useContext(LoadingContext);
}

export default NavigationLoadingProvider;

