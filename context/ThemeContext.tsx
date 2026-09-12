"use client";

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import { ColorTokens, getThemeTokens, ThemeMode } from "@/config/theme";

export type Theme = ThemeMode;

interface ThemeContextType {
  theme: Theme;
  tokens: ColorTokens;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

export const THEME_STORAGE_KEY = "dawh_theme";

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  tokens: getThemeTokens("dark"),
  toggleTheme: () => {},
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  const tokens = useMemo(() => getThemeTokens(theme), [theme]);

  const applyTheme = useCallback((t: Theme) => {
    if (typeof document === "undefined") return;

    const root = document.documentElement;
    const body = document.body;

    if (t === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
      root.setAttribute("data-theme", "light");
      if (body) {
        body.classList.add("light-theme");
        body.classList.remove("dark-theme");
      }
    } else {
      root.classList.add("dark");
      root.classList.remove("light");
      root.setAttribute("data-theme", "dark");
      if (body) {
        body.classList.add("dark-theme");
        body.classList.remove("light-theme");
      }
    }
  }, []);

  useEffect(() => {
    // 1. Load saved theme from localStorage
    const savedTheme = (
      localStorage.getItem(THEME_STORAGE_KEY) ||
      localStorage.getItem("app_theme")
    ) as Theme | null;

    const initialTheme: Theme = savedTheme === "light" ? "light" : "dark";
    setThemeState(initialTheme);
    applyTheme(initialTheme);

    // 2. Sync across tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === THEME_STORAGE_KEY && e.newValue) {
        const nextTheme = e.newValue as Theme;
        setThemeState(nextTheme);
        applyTheme(nextTheme);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [applyTheme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    if (typeof window !== "undefined") {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      localStorage.setItem("app_theme", newTheme);
      // Persist in Cookie for 1 year
      document.cookie = `${THEME_STORAGE_KEY}=${newTheme}; path=/; max-age=31536000; SameSite=Lax`;
    }
    applyTheme(newTheme);
  };

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, tokens, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
