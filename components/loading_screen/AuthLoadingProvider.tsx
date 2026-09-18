"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence } from "framer-motion";
import AuthLoadingScreen from "./AuthLoadingScreen";
import { getCurrentSession } from "@/lib/auth-client";
import { fetchAndStoreUserProfile } from "@/lib/user-profile";

interface AuthLoadingContextType {
  isAuthLoading: boolean;
}

const AuthLoadingContext = createContext<AuthLoadingContextType>({
  isAuthLoading: false,
});

export function AuthLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  // Active ONLY when opening the web at root "/" or ""
  const isRoot = pathname === "/" || pathname === "";
  const [showAuthLoader, setShowAuthLoader] = useState<boolean>(() => isRoot);

  const targetRouteRef = useRef<string>("/auth/login");
  const isResolvedRef = useRef<boolean>(false);
  const isTransitioningRef = useRef<boolean>(false);
  const transitionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const completeTransition = useCallback(() => {
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;

    if (transitionTimerRef.current) {
      clearTimeout(transitionTimerRef.current);
      transitionTimerRef.current = null;
    }

    const destination = targetRouteRef.current;
    try {
      router.replace(destination);
    } catch {
      window.location.replace(destination);
    }

    // Trigger fade-out exit animation
    setShowAuthLoader(false);
  }, [router]);

  useEffect(() => {
    // If not visiting root "/", dismiss auth loader immediately
    if (pathname !== "/" && pathname !== "") {
      setShowAuthLoader(false);
      return;
    }

    let isDisposed = false;
    const startTime = Date.now();
    const minFillTime = 3200; // 3.2s logo fill duration

    async function checkAuthAndScheduleRoute() {
      try {
        const session = await getCurrentSession();
        if (isDisposed) return;

        if (session?.user) {
          targetRouteRef.current = "/workspace";
          try {
            fetchAndStoreUserProfile(session.user.id, session.user.email);
          } catch {}
          try {
            router.prefetch("/workspace");
          } catch {}
        } else {
          targetRouteRef.current = "/auth/login";
          try {
            router.prefetch("/auth/login");
          } catch {}
        }
      } catch (err) {
        console.error("[AuthLoadingProvider] Error verifying session:", err);
        targetRouteRef.current = "/auth/login";
      } finally {
        if (isDisposed) return;
        isResolvedRef.current = true;

        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, minFillTime - elapsed);

        transitionTimerRef.current = setTimeout(() => {
          completeTransition();
        }, remaining);
      }
    }

    checkAuthAndScheduleRoute();

    // Safety watchdog: ensure transition always fires even on network lag
    const watchdog = setTimeout(() => {
      if (!isDisposed && !isTransitioningRef.current) {
        completeTransition();
      }
    }, 4500);

    return () => {
      isDisposed = true;
      if (transitionTimerRef.current) {
        clearTimeout(transitionTimerRef.current);
      }
      clearTimeout(watchdog);
    };
  }, [pathname, completeTransition]);

  // If the fill animation finishes and auth is already resolved, complete immediately
  const handleLogoFilled = useCallback(() => {
    if (isResolvedRef.current) {
      completeTransition();
    }
  }, [completeTransition]);

  return (
    <AuthLoadingContext.Provider value={{ isAuthLoading: showAuthLoader }}>
      {children}
      <AnimatePresence mode="wait">
        {showAuthLoader && (
          <AuthLoadingScreen
            key="dawh-auth-entry-loading-screen"
            duration={3.2}
            onFilled={handleLogoFilled}
          />
        )}
      </AnimatePresence>
    </AuthLoadingContext.Provider>
  );
}

export function useAuthLoading() {
  return useContext(AuthLoadingContext);
}

export default AuthLoadingProvider;
