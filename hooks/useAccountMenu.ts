"use client";

import { useEffect, useState } from "react";
import { logout } from "@/lib/auth-client";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import type { EmployeeProfile } from "@/types/user";
import { useAppLanguage, setAppLanguage } from "@/utils/language";
import { getWarehouseRoleLabel } from "@/utils/warehouseRole";
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
  accountSubtitle: string;
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
  const localizedName =
    activeLanguage === "TH"
      ? warehouseAccount?.me?.nameTh
      : warehouseAccount?.me?.nameEn;
  const fullName =
    localizedName ||
    warehouseAccount?.me?.name ||
    warehouseAccount?.me?.email?.split("@")[0] ||
    "";

  useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  const profile: Partial<EmployeeProfile> = {
    id: warehouseAccount?.me?.authUserId,
    email: warehouseAccount?.me?.email,
    full_name: fullName,
    avatar_url: warehouseAccount?.me?.image || undefined,
  };
  const role = warehouseAccount?.me?.role ?? null;
  const loaded = !!warehouseAccount && !warehouseAccount.loading;

  const accountSubtitle = role
    ? getWarehouseRoleLabel(role, activeLanguage)
    : profile.email || "dawh.internal";
  return {
    profile,
    fullName,
    initials: (fullName[0] || "U").toUpperCase(),
    accountSubtitle,
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
