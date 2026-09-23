"use client";

import { useState, useEffect } from "react";
import { getCurrentSession, logout as authLogout } from "@/lib/auth-client";
import {
  checkProfileCompleteness,
  fetchAndStoreUserProfile,
  toEmployeeProfile,
} from "@/lib/user-profile";
import { EmployeeProfile } from "@/types/user";
import { getAppMe, checkIsAdmin } from "@/lib/api/session";
import { useAppLanguage, setAppLanguage } from "@/utils/language";
import { useNotification } from "@/context/NotificationContext";
import { useLoading } from "@/components/loading_screen";

export interface UseAccountMenuOptions {
  /** Controlled language — overrides global app language when provided */
  lang?: "TH" | "EN";
  onLangChange?: (lang: "TH" | "EN") => void;
  /** Called when navigating without a direct path (sidebar-style) */
  onNavigate?: (target: string) => void;
  /** Overrides the default /settings path for settings navigation */
  settingsPath?: string;
}

export interface UseAccountMenuReturn {
  // Profile data
  profile: Partial<EmployeeProfile>;
  fullName: string;
  initials: string;
  departmentDisplay: string;
  isAdmin: boolean;
  isProfileLoaded: boolean;
  mounted: boolean;
  // Language
  isThai: boolean;
  toggleLanguage: () => void;
  // Guard modal
  showGuardModal: boolean;
  setShowGuardModal: (v: boolean) => void;
  missingFields: string[];
  isComplete: boolean;
  // Navigation & auth actions
  handleLogout: () => Promise<void>;
  handleGuardedNavigate: (target: string, fallbackPath?: string) => void;
  handleSettingsNavigate: (onClose: () => void) => void;
}

export function useAccountMenu(
  options: UseAccountMenuOptions = {}
): UseAccountMenuReturn {
  const { navigateWithLoading } = useLoading();
  const { notify } = useNotification();
  const appLang = useAppLanguage();
  const activeLang: "TH" | "EN" = options.lang ?? appLang;
  const isThai = activeLang === "TH";

  const [profile, setProfile] = useState<Partial<EmployeeProfile>>({});
  const [isProfileLoaded, setIsProfileLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [roles, setRoles] = useState<string[]>([]);
  const [showGuardModal, setShowGuardModal] = useState(false);

  const toggleLanguage = () => {
    const nextLang: "TH" | "EN" = activeLang === "TH" ? "EN" : "TH";
    setAppLanguage(nextLang);
    options.onLangChange?.(nextLang);
  };

  // Cache-first profile loading — same strategy as HeaderNavbar
  useEffect(() => {
    let isMounted = true;
    setMounted(true);

    // 1. Instant cache check (0 ms) — prevents name/avatar flicker
    try {
      const cached = localStorage.getItem("dawh_user_profile");
      if (cached) {
        const parsed = JSON.parse(cached);
        if (
          parsed &&
          (parsed.full_name ||
            parsed.first_name ||
            parsed.first_name_th ||
            parsed.username ||
            parsed.email)
        ) {
          setProfile(parsed);
          setIsProfileLoaded(true);
        }
      }
      const cachedSession = localStorage.getItem("dawh_session_user");
      if (cachedSession) {
        const parsedSession = JSON.parse(cachedSession);
        if (parsedSession) {
          setProfile((prev) => ({ ...parsedSession, ...prev }));
          setIsProfileLoaded(true);
        }
      }
    } catch {
      // Non-blocking
    }

    // 2. Live fetch via application API, then Better Auth session as fallback
    async function loadUserProfile() {
      try {
        let appMe: Awaited<ReturnType<typeof getAppMe>> | null = null;
        try {
          const me = await getAppMe();
          appMe = me;
          if (isMounted) {
            setPermissions(me.data.permissions || []);
            setRoles(me.data.roles || []);
            if (me.data.profile) {
              const canonicalProfile = toEmployeeProfile(me.data.profile);
              setProfile(canonicalProfile);
              setIsProfileLoaded(true);
              localStorage.setItem(
                "dawh_user_profile",
                JSON.stringify(canonicalProfile)
              );
            } else {
              setProfile((prev) => ({
                ...prev,
                id: me.data.user.id,
                email: me.data.user.email,
                full_name: me.data.user.name,
              }));
              setIsProfileLoaded(true);
            }
          }
        } catch {
          // Profile and session APIs remain source of truth for navigation guards.
        }

        const session = await getCurrentSession();
        const targetId = session?.user.id;
        const targetEmail = session?.user.email;

        if (targetId && !appMe?.data.profile) {
          const fetched = await fetchAndStoreUserProfile(targetId, targetEmail);
          if (fetched) {
            if (isMounted) {
              setProfile(fetched);
              setIsProfileLoaded(true);
              try {
                localStorage.setItem(
                  "dawh_session_user",
                  JSON.stringify({
                    id: fetched.id,
                    email: fetched.email,
                    full_name:
                      fetched.full_name ||
                      [fetched.first_name, fetched.last_name]
                        .filter(Boolean)
                        .join(" ") ||
                      undefined,
                    first_name: fetched.first_name || undefined,
                    last_name: fetched.last_name || undefined,
                    username: fetched.username || undefined,
                  })
                );
              } catch {
                // Non-blocking
              }
            }
            return;
          }

          // Fallback to Better Auth session identity
          if (session?.user && isMounted) {
            const sessionProfile: Partial<EmployeeProfile> = {
              id: session.user.id,
              email: session.user.email,
              full_name: session.user.name || undefined,
              first_name: session.user.name?.split(" ")[0] || undefined,
              last_name:
                session.user.name?.split(" ").slice(1).join(" ") || undefined,
              username: session.user.email?.split("@")[0] || undefined,
            };
            setProfile((prev) => ({ ...prev, ...sessionProfile }));
            setIsProfileLoaded(true);
            try {
              localStorage.setItem(
                "dawh_session_user",
                JSON.stringify(sessionProfile)
              );
            } catch {
              // Non-blocking
            }
          }
        }
      } catch (err) {
        console.error("Error loading user profile in account menu:", err);
      }
    }

    loadUserProfile();

    // Listen for profile updates dispatched by the account settings page
    const handleProfileUpdated = (e: Event) => {
      const customEvent = e as CustomEvent<Partial<EmployeeProfile>>;
      if (customEvent.detail) {
        setProfile((prev) => ({ ...prev, ...customEvent.detail }));
      }
    };

    if (typeof window !== "undefined") {
      window.addEventListener("dawh_profile_updated", handleProfileUpdated);
      return () => {
        isMounted = false;
        window.removeEventListener(
          "dawh_profile_updated",
          handleProfileUpdated
        );
      };
    }
    return () => {
      isMounted = false;
    };
  }, []);

  // UI-only permission hint; every API still enforces server-side.
  const isAdmin = checkIsAdmin(roles, permissions, profile.role);

  // Display name resolution (priority: full_name → parts → nickname → username → email)
  const validFullName =
    profile.full_name &&
    profile.full_name !== "Authorized Staff" &&
    profile.full_name !== "H. Administrator" &&
    profile.full_name !== "Staff Member"
      ? profile.full_name
      : "";

  const fullName =
    validFullName ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    [profile.first_name_th, profile.last_name_th].filter(Boolean).join(" ") ||
    (profile.nickname_th ? `ชื่อเล่น: ${profile.nickname_th}` : "") ||
    (profile.nickname ? `Nickname: ${profile.nickname}` : "") ||
    profile.username ||
    (profile.email ? profile.email.split("@")[0] : "") ||
    (typeof window !== "undefined"
      ? localStorage.getItem("current_user_email")?.split("@")[0]
      : "") ||
    "";

  const initials = (
    profile.nickname_th?.charAt(0) ||
    profile.nickname?.charAt(0) ||
    profile.first_name?.charAt(0) ||
    profile.username?.charAt(0) ||
    (fullName ? fullName.charAt(0) : "U")
  ).toUpperCase();

  const departmentDisplay =
    profile.department || (profile.role ? `Role: ${profile.role}` : "");

  const { isComplete, missingFields } = checkProfileCompleteness(profile);

  const handleLogout = async () => {
    await authLogout();
  };

  const handleGuardedNavigate = (target: string, fallbackPath?: string) => {
    if (
      !isComplete &&
      target !== "settings" &&
      target !== "account" &&
      target !== "auth" &&
      target !== "workspace" &&
      target !== "portal" &&
      target !== "controlpanel"
    ) {
      setShowGuardModal(true);
      notify.warning(
        isThai
          ? "ต้องกรอกข้อมูลให้ครบถ้วนก่อน"
          : "Incomplete Profile Information",
        {
          message: isThai
            ? "กรุณากรอกข้อมูลส่วนตัวในหน้าตั้งค่าก่อนเข้าใช้งานส่วนอื่นๆ"
            : "Please complete your employee profile in Settings before accessing system modules.",
          duration: 5000,
        }
      );
      return;
    }

    if (fallbackPath) {
      const loadingTitle =
        target === "controlpanel"
          ? isThai
            ? "กำลังเปิดแผงควบคุมระบบ..."
            : "Opening Control Panel..."
          : isThai
          ? "กำลังเปิดศูนย์รวมโมดูล..."
          : "Opening Module Hub...";
      const loadingDesc =
        target === "controlpanel"
          ? isThai
            ? "กำลังโหลดแผงควบคุมและสิทธิ์การดูแลระบบ..."
            : "Loading control panel & admin privileges..."
          : isThai
          ? "กำลังโหลดโมดูลและสิทธิ์การใช้งาน..."
          : "Loading modules and permissions...";

      navigateWithLoading(fallbackPath, loadingTitle, loadingDesc);
    } else if (options.onNavigate) {
      options.onNavigate(target);
    }
  };

  const handleSettingsNavigate = (onClose: () => void) => {
    const path = options.settingsPath || "/settings";
    onClose();
    if (options.onNavigate) {
      options.onNavigate("settings");
    } else {
      navigateWithLoading(path);
    }
  };

  return {
    profile,
    fullName,
    initials,
    departmentDisplay,
    isAdmin,
    isProfileLoaded,
    mounted,
    isThai,
    toggleLanguage,
    showGuardModal,
    setShowGuardModal,
    missingFields,
    isComplete,
    handleLogout,
    handleGuardedNavigate,
    handleSettingsNavigate,
  };
}
