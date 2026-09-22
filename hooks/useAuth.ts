"use client";

import { useState, useEffect, useCallback, useTransition } from "react";
import { useRouter } from "next/navigation";
import { authClient, getCurrentSession, logout as performLogout } from "@/lib/auth-client";
import { getAppMe, type AppMe, isAppAdmin, hasPermission } from "@/lib/api/session";
import type { AuthUser, AuthSessionData, SignInInput, SignUpInput } from "@/types";

export interface UseAuthReturn {
  user: AuthUser | null;
  session: AuthSessionData | null;
  appMe: AppMe | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  error: string | null;
  signIn: (input: SignInInput) => Promise<{ success: boolean; error?: string }>;
  signUp: (input: SignUpInput) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
  checkPermission: (permission: string) => boolean;
}

export function useAuth(): UseAuthReturn {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<AuthSessionData | null>(null);
  const [appMe, setAppMe] = useState<AppMe | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const loadSessionAndMe = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [sessionData, meData] = await Promise.allSettled([
        getCurrentSession(),
        getAppMe(),
      ]);

      if (sessionData.status === "fulfilled" && sessionData.value?.user) {
        setUser(sessionData.value.user as unknown as AuthUser);
        setSession(sessionData.value.session as unknown as AuthSessionData);
      } else {
        setUser(null);
        setSession(null);
      }

      if (meData.status === "fulfilled" && meData.value?.data) {
        setAppMe(meData.value.data);
      } else {
        setAppMe(null);
      }
    } catch (err) {
      console.warn("[useAuth] Failed to load session:", err);
      setUser(null);
      setSession(null);
      setAppMe(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSessionAndMe();

    // Multi-tab logout listener
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "dawh_auth_logout" && e.newValue) {
        setUser(null);
        setSession(null);
        setAppMe(null);
        router.replace("/auth/login");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [loadSessionAndMe, router]);

  const signIn = useCallback(
    async ({ email, password, rememberMe }: SignInInput) => {
      setError(null);
      try {
        const res = await authClient.signIn.email({
          email,
          password,
          rememberMe: rememberMe ?? true,
        });

        if (res.error) {
          setError(res.error.message || "Failed to sign in");
          return { success: false, error: res.error.message || "Failed to sign in" };
        }

        await loadSessionAndMe();
        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error during sign in";
        setError(msg);
        return { success: false, error: msg };
      }
    },
    [loadSessionAndMe],
  );

  const signUp = useCallback(
    async ({ email, password, name }: SignUpInput) => {
      setError(null);
      try {
        const res = await authClient.signUp.email({
          email,
          password,
          name,
        });

        if (res.error) {
          setError(res.error.message || "Failed to sign up");
          return { success: false, error: res.error.message || "Failed to sign up" };
        }

        await loadSessionAndMe();
        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error during sign up";
        setError(msg);
        return { success: false, error: msg };
      }
    },
    [loadSessionAndMe],
  );

  const signOut = useCallback(async () => {
    try {
      await performLogout();
    } finally {
      setUser(null);
      setSession(null);
      setAppMe(null);
      startTransition(() => {
        router.replace("/auth/login");
      });
    }
  }, [router]);

  const checkPermission = useCallback(
    (permission: string) => {
      return hasPermission(appMe, permission);
    },
    [appMe],
  );

  return {
    user,
    session,
    appMe,
    isLoading,
    isAuthenticated: Boolean(user && session),
    isAdmin: isAppAdmin(appMe),
    error,
    signIn,
    signUp,
    signOut,
    refresh: loadSessionAndMe,
    checkPermission,
  };
}
