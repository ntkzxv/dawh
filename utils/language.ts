"use client";

import { useSyncExternalStore } from "react";

export type AppLanguage = "TH" | "EN";

function subscribe(callback: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("dawh_lang_change", callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener("dawh_lang_change", callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): AppLanguage {
  if (typeof window === "undefined") return "TH";
  try {
    const saved = (
      localStorage.getItem("dawh_lang") ||
      localStorage.getItem("app_lang") ||
      "TH"
    ).toUpperCase();
    return saved === "EN" ? "EN" : "TH";
  } catch {
    return "TH";
  }
}

function getServerSnapshot(): AppLanguage {
  return "TH";
}

/**
 * Hook to retrieve synchronized App language across tabs, SSR, and components without hydration mismatches.
 */
export function useAppLanguage(): AppLanguage {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Function to set App language and notify all components/tabs
 */
export function setAppLanguage(lang: AppLanguage) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("dawh_lang", lang);
    localStorage.setItem("app_lang", lang.toLowerCase());
    window.dispatchEvent(
      new CustomEvent("dawh_lang_change", { detail: lang })
    );
  } catch {
    // Non-blocking
  }
}
