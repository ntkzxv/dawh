"use client";

import { useState, useCallback } from "react";
import { authClient } from "@/lib/auth-client";
import type { PasswordStrength, AuthLanguage } from "@/types";
import { translations } from "@/translations";

export interface PasswordChangeResult {
  success: boolean;
  error?: string;
}

export interface UseSecuritySettingsReturn {
  isChangingPassword: boolean;
  error: string | null;
  changePassword: (currentPassword: string, newPassword: string) => Promise<PasswordChangeResult>;
  evaluatePasswordStrength: (password: string, lang?: AuthLanguage, isLight?: boolean) => PasswordStrength;
  isValidPin: (pin: string) => boolean;
}

export function evaluatePasswordStrength(
  pass: string,
  lang: AuthLanguage = "TH",
  isLight: boolean = false,
): PasswordStrength {
  const dict = translations[lang] || translations.TH;
  if (!pass) {
    return { score: 0, label: "", color: "bg-transparent", textClass: "" };
  }

  const hasLength = pass.length >= 8 && pass.length <= 128;
  const hasUppercase = /[A-Z]/.test(pass);
  const hasLowercase = /[a-z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);
  const hasSpecial = /[^A-Za-z0-9]/.test(pass);

  let score = 0;
  if (hasLength) score += 1;
  if (hasUppercase && hasLowercase) score += 1;
  if (hasNumber) score += 1;
  if (hasSpecial) score += 1;

  if (score <= 1) {
    return {
      score: 1,
      label: dict.strengthWeak,
      color: isLight ? "bg-[#E74C3C]" : "bg-[#E71D36]",
      textClass: isLight ? "text-[#E74C3C] font-bold" : "text-[#E71D36] font-semibold",
    };
  }
  if (score === 2) {
    return {
      score: 2,
      label: dict.strengthFair,
      color: "bg-[#FF9F1C]",
      textClass: "text-[#FF9F1C] font-semibold",
    };
  }
  if (score === 3) {
    return {
      score: 3,
      label: dict.strengthGood,
      color: "bg-[#6366F1]",
      textClass: "text-[#6366F1] font-semibold",
    };
  }
  return {
    score: 4,
    label: dict.strengthStrong,
    color: "bg-[#2EC4B6]",
    textClass: "text-[#2EC4B6] font-semibold",
  };
}

export function isValidPin(pin: string): boolean {
  return /^\d{6}$/.test(pin.trim());
}

export function useSecuritySettings(): UseSecuritySettingsReturn {
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changePassword = useCallback(
    async (currentPassword: string, newPassword: string): Promise<PasswordChangeResult> => {
      setIsChangingPassword(true);
      setError(null);
      try {
        const res = await authClient.changePassword({
          newPassword,
          currentPassword,
          revokeOtherSessions: false,
        });

        if (res.error) {
          setError(res.error.message || "Failed to change password");
          return { success: false, error: res.error.message || "Failed to change password" };
        }

        return { success: true };
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Error changing password";
        setError(msg);
        return { success: false, error: msg };
      } finally {
        setIsChangingPassword(false);
      }
    },
    [],
  );

  return {
    isChangingPassword,
    error,
    changePassword,
    evaluatePasswordStrength,
    isValidPin,
  };
}
