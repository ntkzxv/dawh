"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import {
  beginNavigationApiTracking,
  endNavigationApiTracking,
  getNavigationApiRequestsInFlight,
  subscribeToNavigationApiTracking,
} from "@/lib/api/client";
import LoadingScreen from "./LoadingScreen";

const NAVIGATION_MIN_DISPLAY_MS = 1_100;
const NAVIGATION_FINAL_FILL_MS = 100;
const NAVIGATION_DEFAULT_ESTIMATE_MS = 1_000;
const NAVIGATION_MIN_ESTIMATE_MS = 1_000;
const NAVIGATION_API_QUIET_MS = 50;
const NAVIGATION_POST_FILL_MS = 100;
const NAVIGATION_FILL_START_DELAY_MS = 50;
const NAVIGATION_MIN_READY_MS =
  NAVIGATION_MIN_DISPLAY_MS - NAVIGATION_FINAL_FILL_MS;
const NAVIGATION_FILL_TO_WAIT_MS =
  NAVIGATION_MIN_READY_MS - NAVIGATION_FILL_START_DELAY_MS;
const NAVIGATION_EXIT_MS = 650;
const NAVIGATION_WATCHDOG_MS = 25_000;
const navigationDurationEstimates = new Map<string, number>();

function getNavigationDurationEstimate(path: string) {
  return navigationDurationEstimates.get(path) ?? NAVIGATION_DEFAULT_ESTIMATE_MS;
}

function recordNavigationDuration(path: string, durationMs: number) {
  const measured = Math.min(
    NAVIGATION_WATCHDOG_MS,
    Math.max(NAVIGATION_MIN_ESTIMATE_MS, durationMs),
  );
  const previous = navigationDurationEstimates.get(path);
  navigationDurationEstimates.set(
    path,
    previous === undefined ? measured : previous * 0.35 + measured * 0.65,
  );
}

type PendingNavigation = {
  trackingId: number;
  fromPath: string;
  targetPath: string;
  expectedReadyMs: number;
  startedAt: number;
  routeReady: boolean;
  readyAt: number | null;
};

interface LoadingContextType {
  isLoading: boolean;
  startLoading: (options?: { exitTransition?: "slide" | "fade"; duration?: number }) => void;
  stopLoading: () => void;
  navigateWithLoading: (
    url: string,
    message?: string,
    description?: string,
    options?: { replace?: boolean },
  ) => void;
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
    clean === "/landing-page" ||
    clean === "/controlpanel/audit-log" ||
    clean.startsWith("/controlpanel/audit-log/")
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
  const [isNavigationReady, setIsNavigationReadyState] = useState(false);
  const isNavigationReadyRef = useRef(false);
  const [exitTransition, setExitTransition] = useState<"slide" | "fade">("slide");

  const setIsNavigationReady = useCallback((ready: boolean) => {
    isNavigationReadyRef.current = ready;
    setIsNavigationReadyState(ready);
  }, []);

  // LoadingScreen displays only during active navigation
  const isLoading = isNavLoading && !isExiting;

  useEffect(() => {
    if (!isLoading) return;

    const previousBodyOverflow = document.body.style.overflow;
    const previousRootOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousRootOverflow;
    };
  }, [isLoading]);

  const prevPathnameRef = useRef<string>(pathname);
  const navigationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const readinessTimerRef = useRef<NodeJS.Timeout | null>(null);
  const watchdogTimerRef = useRef<NodeJS.Timeout | null>(null);
  const exitTimerRef = useRef<NodeJS.Timeout | null>(null);
  const pendingNavigationRef = useRef<PendingNavigation | null>(null);

  const scheduleNavigationReadiness = useCallback(() => {
    const pendingNavigation = pendingNavigationRef.current;
    if (!pendingNavigation) return;

    const inFlight = getNavigationApiRequestsInFlight(
      pendingNavigation.trackingId,
    );
    if (!pendingNavigation.routeReady || inFlight > 0) {
      if (inFlight > 0) pendingNavigation.readyAt = null;
      if (readinessTimerRef.current) {
        clearTimeout(readinessTimerRef.current);
        readinessTimerRef.current = null;
      }
      if (inFlight > 0 && isNavigationReadyRef.current)
        setIsNavigationReady(false);
      return;
    }
    if (readinessTimerRef.current || isNavigationReadyRef.current) return;

    pendingNavigation.readyAt ??= Date.now();
    const elapsed = Date.now() - pendingNavigation.startedAt;
    const apiQuietFor = Date.now() - pendingNavigation.readyAt;
    const delay = Math.max(
      NAVIGATION_MIN_READY_MS - elapsed,
      NAVIGATION_API_QUIET_MS - apiQuietFor,
    );
    readinessTimerRef.current = setTimeout(() => {
      readinessTimerRef.current = null;
      if (
        pendingNavigationRef.current !== pendingNavigation ||
        !pendingNavigation.routeReady ||
        getNavigationApiRequestsInFlight(pendingNavigation.trackingId) > 0
      ) {
        return;
      }
      if (pendingNavigation.readyAt !== null) {
        recordNavigationDuration(
          pendingNavigation.targetPath,
          pendingNavigation.readyAt - pendingNavigation.startedAt,
        );
      }
      setIsNavigationReady(true);
    }, delay);
  }, [setIsNavigationReady]);

  const clearAllTimers = useCallback(() => {
    if (navigationTimerRef.current) {
      clearTimeout(navigationTimerRef.current);
      navigationTimerRef.current = null;
    }
    if (watchdogTimerRef.current) {
      clearTimeout(watchdogTimerRef.current);
      watchdogTimerRef.current = null;
    }
    if (readinessTimerRef.current) {
      clearTimeout(readinessTimerRef.current);
      readinessTimerRef.current = null;
    }
    if (exitTimerRef.current) {
      clearTimeout(exitTimerRef.current);
      exitTimerRef.current = null;
    }
  }, []);

  const stopLoading = useCallback(() => {
    const pendingNavigation = pendingNavigationRef.current;
    clearAllTimers();
    pendingNavigationRef.current = null;
    if (pendingNavigation)
      endNavigationApiTracking(pendingNavigation.trackingId);
    setIsNavigationReady(false);
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
      const pendingNavigation = pendingNavigationRef.current;
      clearAllTimers();
      pendingNavigationRef.current = null;
      if (pendingNavigation)
        endNavigationApiTracking(pendingNavigation.trackingId);
      setIsNavigationReady(false);
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
    (url: string, _message?: string, _description?: string, options?: { replace?: boolean }) => {
      if (!url) return;

      const navigate = () => {
        if (options?.replace) router.replace(url);
        else router.push(url);
      };

      const targetPath = url.split("?")[0].split("#")[0].replace(/\/$/, "") || "/";
      const currentPath = (pathname || "").split("?")[0].split("#")[0].replace(/\/$/, "") || "/";

      if (targetPath === currentPath) {
        const pendingNavigation = pendingNavigationRef.current;
        clearAllTimers();
        pendingNavigationRef.current = null;
        if (pendingNavigation)
          endNavigationApiTracking(pendingNavigation.trackingId);
        setIsNavigationReady(false);
        setIsNavLoading(false);
        setIsExiting(false);
        navigate();
        return;
      }

      if (!isAllowedLoadingRoute(url)) {
        const pendingNavigation = pendingNavigationRef.current;
        clearAllTimers();
        pendingNavigationRef.current = null;
        if (pendingNavigation)
          endNavigationApiTracking(pendingNavigation.trackingId);
        setIsNavigationReady(false);
        setIsNavLoading(false);
        setIsExiting(false);
        navigate();
        return;
      }

      const previousNavigation = pendingNavigationRef.current;
      clearAllTimers();
      pendingNavigationRef.current = null;
      if (previousNavigation)
        endNavigationApiTracking(previousNavigation.trackingId);
      const trackingId = beginNavigationApiTracking();
      pendingNavigationRef.current = {
        trackingId,
        fromPath: currentPath,
        targetPath,
        expectedReadyMs: getNavigationDurationEstimate(targetPath),
        startedAt: Date.now(),
        routeReady: false,
        readyAt: null,
      };
      setIsNavigationReady(false);
      setIsExiting(false);
      setIsNavLoading(true);
      setExitTransition("slide");
      navigate();

      // Release the overlay if a client navigation never resolves.
      watchdogTimerRef.current = setTimeout(() => {
        const pendingNavigation = pendingNavigationRef.current;
        if (pendingNavigation)
          endNavigationApiTracking(pendingNavigation.trackingId);
        pendingNavigationRef.current = null;
        setIsNavigationReady(false);
        setIsExiting(true);
        exitTimerRef.current = setTimeout(() => {
          setIsNavLoading(false);
          setIsExiting(false);
          setExitTransition("slide");
          exitTimerRef.current = null;
        }, 160);
      }, NAVIGATION_WATCHDOG_MS);
    },
    [router, pathname, clearAllTimers]
  );

  useEffect(
    () => subscribeToNavigationApiTracking(scheduleNavigationReadiness),
    [scheduleNavigationReadiness],
  );

  // Keep navigation covered until the route and its API requests are ready.
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      const pendingNavigation = pendingNavigationRef.current;
      if (pendingNavigation) {
        pendingNavigation.routeReady = pathname !== pendingNavigation.fromPath;
        scheduleNavigationReadiness();
        return;
      }

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
  }, [pathname, isNavLoading, clearAllTimers, scheduleNavigationReadiness]);

  const isTrackingNavigation = pendingNavigationRef.current !== null;
  const navigationFillDuration = isTrackingNavigation
    ? Math.max(
        NAVIGATION_FILL_TO_WAIT_MS,
        (pendingNavigationRef.current?.expectedReadyMs ??
          NAVIGATION_DEFAULT_ESTIMATE_MS) - NAVIGATION_FILL_START_DELAY_MS,
      ) / 1000
    : 0.65;

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
            duration={navigationFillDuration}
            isReady={isTrackingNavigation ? isNavigationReady : undefined}
            exitTransition={exitTransition}
            onFilled={() => {
              const pendingNavigation = pendingNavigationRef.current;
              if (!pendingNavigation || !isNavigationReady) return;

              exitTimerRef.current = setTimeout(() => {
                if (pendingNavigationRef.current !== pendingNavigation) return;
                if (
                  getNavigationApiRequestsInFlight(
                    pendingNavigation.trackingId,
                  ) > 0
                ) {
                  setIsNavigationReady(false);
                  scheduleNavigationReadiness();
                  return;
                }

                if (watchdogTimerRef.current) {
                  clearTimeout(watchdogTimerRef.current);
                  watchdogTimerRef.current = null;
                }
                endNavigationApiTracking(pendingNavigation.trackingId);
                setIsExiting(true);
                exitTimerRef.current = setTimeout(() => {
                  setIsNavLoading(false);
                  setIsExiting(false);
                  setIsNavigationReady(false);
                  setExitTransition("slide");
                  pendingNavigationRef.current = null;
                  exitTimerRef.current = null;
                }, NAVIGATION_EXIT_MS);
              }, NAVIGATION_POST_FILL_MS);
            }}
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
