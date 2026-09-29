"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu } from "lucide-react";
import { useAppLanguage } from "@/utils/language";
import ControlPanelSidebar from "@/components/navbar/ControlPanelSidebar";
import { useTheme } from "@/context/ThemeContext";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import { motion } from "framer-motion";
import {
  ControlPanelNavigationProvider,
  type ControlPanelTab,
} from "@/components/warehouse/ControlPanelNavigationContext";
import {
  ALL_AUDIT_CATEGORIES,
  AUDIT_CATEGORIES,
  type AuditCategory,
} from "@/components/warehouse/auditLog";

export default function ControlPanelLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme } = useTheme();
  const account = useOptionalWarehouseAccount();
  const isThai = useAppLanguage() === "TH";
  const isLight = theme === "light";
  const [isMinimized, setIsMinimized] = useState(false);
  const [sidebarAnimated, setSidebarAnimated] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [tab, setTab] = useState<ControlPanelTab>("members");
  const [storedAuditCategory, setAuditCategory] = useState(ALL_AUDIT_CATEGORIES);
  const [auditCategories, setAuditCategories] = useState<AuditCategory[]>(AUDIT_CATEGORIES);

  useEffect(() => {
    if (account?.loading) return;
    if (!account?.me && !account?.error) {
      router.replace("/auth/login?from=%2Fcontrolpanel");
    }
  }, [account?.loading, account?.me, account?.error, router]);

  const isAuditRoute = pathname.startsWith("/controlpanel/audit-log/");
  const activeTab: ControlPanelTab = isAuditRoute
    ? "audit"
    : tab === "audit"
      ? "members"
      : tab;
  const auditCategory = isAuditRoute
    ? pathname.split("/").at(-1) ?? ALL_AUDIT_CATEGORIES
    : storedAuditCategory;
  const auditPageCategory = AUDIT_CATEGORIES.find((item) => item.id === auditCategory);
  const pageTitle = auditPageCategory
    ? isThai
      ? auditPageCategory.labelTh
      : auditPageCategory.labelEn
    : isThai
      ? "บันทึกการตรวจสอบ"
      : "Audit Log";

  useEffect(() => {
    let frame = 0;
    try {
      const saved = localStorage.getItem("dawh_sidebar_minimized");
      if (saved !== null) {
        const minimized = JSON.parse(saved) === true;
        frame = requestAnimationFrame(() => setIsMinimized(minimized));
      }
    } catch {
      // Non-blocking
    }
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleMinimizedChange = (minimized: boolean) => {
    setIsMinimized(minimized);
    try {
      localStorage.setItem("dawh_sidebar_minimized", JSON.stringify(minimized));
    } catch {
      // Non-blocking
    }
  };

  return (
    <ControlPanelNavigationProvider
      value={{
        tab: activeTab,
        setTab,
        auditCategory,
        setAuditCategory,
        auditCategories,
        setAuditCategories,
      }}
    >
      <div
        className={`flex min-h-screen w-full transition-colors duration-300 ${
          isLight
            ? "bg-[#F8FAFC] text-[#222222] selection:bg-[#222222] selection:text-white"
            : "bg-[#2C2C2C] text-white selection:bg-white/25 selection:text-white"
        }`}
      >
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        onAnimationComplete={() => setSidebarAnimated(true)}
        style={{ transform: sidebarAnimated ? "none" : undefined }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        className="shrink-0 flex h-screen sticky top-0 z-40"
      >
        <ControlPanelSidebar
          isMinimized={isMinimized}
          onMinimizedChange={handleMinimizedChange}
          activeTab={activeTab}
          onTabChange={setTab}
        />
      </motion.div>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" aria-label="Close navigation" className="absolute inset-0 bg-black/50" onClick={() => setMobileMenuOpen(false)} />
          <ControlPanelSidebar
            isMinimized={false}
            onMinimizedChange={handleMinimizedChange}
            activeTab={activeTab}
            onTabChange={setTab}
            mobileOpen
            onMobileClose={() => setMobileMenuOpen(false)}
          />
        </div>
      )}

      <motion.div
        initial={{ y: -45, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="flex h-screen min-w-0 flex-1 flex-col overflow-hidden"
      >
        {isAuditRoute ? (
          <motion.header
            initial={{ x: -40, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className={`z-10 flex h-[72px] shrink-0 items-center justify-between border-b px-4 sm:px-6 lg:px-10 ${
              isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#222222]"
            }`}
          >
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label={isThai ? "เปิดเมนูนำทาง" : "Open navigation"}
                onClick={() => setMobileMenuOpen(true)}
                className="shrink-0 rounded-lg border border-slate-300 p-2 dark:border-white/15 md:hidden"
              >
                <Menu size={18} />
              </button>
              <h1
                className={`truncate text-[18px] font-bold tracking-tight sm:text-[19px] ${isLight ? "text-[#222222]" : "text-white"}`}
                style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
              >
                {pageTitle}
              </h1>
            </div>
          </motion.header>
        ) : (
          <div className="flex shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-4 py-3 dark:border-white/10 dark:bg-[#222222] md:hidden">
            <button type="button" aria-label={isThai ? "เปิดเมนูนำทาง" : "Open navigation"} onClick={() => setMobileMenuOpen(true)} className="rounded-lg border border-slate-300 p-2 dark:border-white/15">
              <Menu size={18} />
            </button>
            <span className="truncate text-sm font-semibold">{isThai ? "แผงควบคุม" : "Control Panel"}</span>
          </div>
        )}
        {children}
      </motion.div>
      </div>
    </ControlPanelNavigationProvider>
  );
}
