"use client";

import { useEffect, useState } from "react";
import { logout } from "@/lib/auth-client";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import type { EmployeeProfile } from "@/types/user";
import { useAppLanguage, setAppLanguage } from "@/utils/language";
import { useLoading } from "@/components/loading_screen";

export interface UseAccountMenuOptions {
  lang?: "TH" | "EN";
  onLangChange?: (lang: "TH" | "EN") => void;
  onNavigate?: (target: string) => void;
  settingsPath?: string;
}
export interface UseAccountMenuReturn {
  profile: Partial<EmployeeProfile>;
  fullName: string;
  initials: string;
  departmentDisplay: string;
  isAdmin: boolean;
  isProfileLoaded: boolean;
  mounted: boolean;
  isThai: boolean;
  toggleLanguage: () => void;
  showGuardModal: boolean;
  setShowGuardModal: (value: boolean) => void;
  missingFields: string[];
  isComplete: boolean;
  handleLogout: () => Promise<void>;
  handleGuardedNavigate: (target: string, fallbackPath?: string) => void;
  handleSettingsNavigate: (onClose: () => void) => void;
}

export function useAccountMenu(
  options: UseAccountMenuOptions = {},
): UseAccountMenuReturn {
  const { navigateWithLoading } = useLoading();
  const language = useAppLanguage();
  const activeLanguage = options.lang ?? language;
  const warehouseAccount = useOptionalWarehouseAccount();
  const [mounted, setMounted] = useState(false);
  const [showGuardModal, setShowGuardModal] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const profile: Partial<EmployeeProfile> = {
    id: warehouseAccount?.me?.authUserId,
    email: warehouseAccount?.me?.email,
    full_name: warehouseAccount?.me?.name,
    avatar_url: warehouseAccount?.me?.image || undefined,
  };
  const role = warehouseAccount?.me?.role ?? null;
  const loaded = !!warehouseAccount && !warehouseAccount.loading;

  const fullName = profile.full_name || profile.email?.split("@")[0] || "";
  return {
    profile,
    fullName,
    initials: (fullName[0] || "U").toUpperCase(),
    departmentDisplay: role ?? "",
    isAdmin: role === "ADMIN",
    isProfileLoaded: loaded,
    mounted,
    isThai: activeLanguage === "TH",
    toggleLanguage: () => {
      const next = activeLanguage === "TH" ? "EN" : "TH";
      setAppLanguage(next);
      options.onLangChange?.(next);
    },
    showGuardModal,
    setShowGuardModal,
    missingFields: [],
    isComplete: true,
    handleLogout: async () => {
      await logout();
      warehouseAccount?.clear();
    },
    handleGuardedNavigate: (target, fallbackPath) => {
      if (fallbackPath) navigateWithLoading(fallbackPath);
      else options.onNavigate?.(target);
    },
    handleSettingsNavigate: (onClose) => {
      onClose();
      if (options.onNavigate) options.onNavigate("settings");
      else navigateWithLoading(options.settingsPath || "/settings");
    },
  };
}
