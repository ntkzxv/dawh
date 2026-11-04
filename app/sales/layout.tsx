"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { NavbarMain } from "@/components/navbar";
import { useTheme } from "@/context/ThemeContext";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import ModuleAvailabilityGuard from "@/components/modules/ModuleAvailabilityGuard";
import SalesNavigation from "@/components/sales/SalesNavigation";

export default function SalesLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { theme } = useTheme();
  const account = useOptionalWarehouseAccount();
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    if (account?.loading) return;
    if (!account?.me && !account?.error) {
      router.replace("/auth/login?from=/sales");
    }
  }, [account?.loading, account?.me, account?.error, router]);

  useEffect(() => {
    try {
      setIsMinimized(localStorage.getItem("dawh_sidebar_minimized") === "true");
    } catch {
      // Keep the sidebar expanded when browser storage is unavailable.
    }
  }, []);

  const handleMinimizedChange = (minimized: boolean) => {
    setIsMinimized(minimized);
    try {
      localStorage.setItem("dawh_sidebar_minimized", JSON.stringify(minimized));
    } catch {
      // The layout remains usable without persisted sidebar preferences.
    }
  };

  const isLight = theme === "light";

  return (
    <div
      className={`flex min-h-screen w-full transition-colors duration-300 ${
        isLight
          ? "bg-[#F8FAFC] text-[#222222] selection:bg-[#222222] selection:text-white"
          : "bg-[#2C2C2C] text-white selection:bg-white/25 selection:text-white"
      }`}
    >
      <motion.aside
        initial={{ x: -48, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="sticky top-0 z-40 flex h-screen shrink-0"
      >
        <NavbarMain
          initialMinimized={isMinimized}
          onMinimizedChange={handleMinimizedChange}
          hubPath="/workspace"
          settingsPath="/settings"
        >
          <SalesNavigation isMinimized={isMinimized} userRole={account?.me?.role ?? null} />
        </NavbarMain>
      </motion.aside>

      <motion.div
        initial={{ y: -24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
        className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden"
      >
        <ModuleAvailabilityGuard moduleKey="sales">{children}</ModuleAvailabilityGuard>
      </motion.div>
    </div>
  );
}
