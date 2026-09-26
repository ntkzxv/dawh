"use client";

import { useEffect, useState } from "react";
import { getCurrentSession, logout } from "@/lib/auth-client";
import { warehouseApi, type Role } from "@/lib/api/warehouse";
import type { EmployeeProfile } from "@/types/user";
import { useAppLanguage, setAppLanguage } from "@/utils/language";
import { useLoading } from "@/components/loading_screen";

export interface UseAccountMenuOptions { lang?: "TH" | "EN"; onLangChange?: (lang: "TH" | "EN") => void; onNavigate?: (target: string) => void; settingsPath?: string }
export interface UseAccountMenuReturn {
  profile: Partial<EmployeeProfile>; fullName: string; initials: string; departmentDisplay: string; isAdmin: boolean; isProfileLoaded: boolean; mounted: boolean;
  isThai: boolean; toggleLanguage: () => void; showGuardModal: boolean; setShowGuardModal: (value: boolean) => void; missingFields: string[]; isComplete: boolean;
  handleLogout: () => Promise<void>; handleGuardedNavigate: (target: string, fallbackPath?: string) => void; handleSettingsNavigate: (onClose: () => void) => void;
}

export function useAccountMenu(options: UseAccountMenuOptions = {}): UseAccountMenuReturn {
  const { navigateWithLoading } = useLoading();
  const language = useAppLanguage();
  const activeLanguage = options.lang ?? language;
  const [profile, setProfile] = useState<Partial<EmployeeProfile>>({});
  const [role, setRole] = useState<Role | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [showGuardModal, setShowGuardModal] = useState(false);

  useEffect(() => {
    let active = true;
    const frame = requestAnimationFrame(() => setMounted(true));
    void Promise.all([getCurrentSession(), warehouseApi.me()]).then(([session, me]) => {
      if (!active) return;
      setRole(me.role);
      setProfile({ id: session?.user?.id, email: session?.user?.email, full_name: session?.user?.name ?? undefined });
      setLoaded(true);
    }).catch(async () => {
      const session = await getCurrentSession().catch(() => null);
      if (!active) return;
      setProfile({ id: session?.user?.id, email: session?.user?.email, full_name: session?.user?.name ?? undefined });
      setLoaded(true);
    });
    return () => { active = false; cancelAnimationFrame(frame); };
  }, []);

  const fullName = profile.full_name || profile.email?.split("@")[0] || "";
  return {
    profile, fullName, initials: (fullName[0] || "U").toUpperCase(), departmentDisplay: role ?? "", isAdmin: role === "ADMIN", isProfileLoaded: loaded, mounted,
    isThai: activeLanguage === "TH", toggleLanguage: () => { const next = activeLanguage === "TH" ? "EN" : "TH"; setAppLanguage(next); options.onLangChange?.(next); },
    showGuardModal, setShowGuardModal, missingFields: [], isComplete: true,
    handleLogout: logout,
    handleGuardedNavigate: (target, fallbackPath) => { if (fallbackPath) navigateWithLoading(fallbackPath); else options.onNavigate?.(target); },
    handleSettingsNavigate: (onClose) => { onClose(); if (options.onNavigate) options.onNavigate("settings"); else navigateWithLoading(options.settingsPath || "/settings"); },
  };
}
