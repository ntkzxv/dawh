"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { NavbarMain, NavbarsubWarehouse } from "@/components/navbar";
import { useTheme } from "@/context/ThemeContext";
import { getCurrentSession } from "@/lib/auth-client";
import { warehouseApi } from "@/lib/api/warehouse";
import type { Role } from "@/lib/api/warehouse";
import { motion } from "framer-motion";

export default function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [isMinimized, setIsMinimized] = useState(false);
  const [sidebarAnimated, setSidebarAnimated] = useState(false);
  const [role, setRole] = useState<Role | null>(null);

  useEffect(() => {
    async function verifyAccess() {
      try {
        const session = await getCurrentSession();
        if (!session?.user) {
          router.replace("/auth/login?from=/warehouse");
          return;
        }

        const me = await warehouseApi.me();
        setRole(me.role);
        if (me.mustChangePassword) router.replace("/settings");
      } catch (err) {
        console.error("Layout guard verification error:", err);
      }
    }
    void verifyAccess();
  }, [router]);

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
    <div
      className={`flex min-h-screen w-full transition-colors duration-300 ${
        isLight
          ? "bg-[#F8FAFC] text-[#222222] selection:bg-[#222222] selection:text-white"
          : "bg-[#2C2C2C] text-white selection:bg-white/25 selection:text-white"
      }`}
    >
      {/* Sidebar with Warehouse Navigation - Slide in from Left to Right */}
      <motion.div
        initial={{ x: -100, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        onAnimationComplete={() => setSidebarAnimated(true)}
        style={{ transform: sidebarAnimated ? "none" : undefined }}
        transition={{
          duration: 0.55,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="shrink-0 flex h-screen sticky top-0 z-40"
      >
        <NavbarMain
          initialMinimized={isMinimized}
          onMinimizedChange={handleMinimizedChange}
          hubPath="/workspace"
          settingsPath="/settings"
        >
          <NavbarsubWarehouse isMinimized={isMinimized} userRole={role} />
        </NavbarMain>
      </motion.div>

      {/* Main Content Viewport - Slide in from Top to Bottom */}
      <motion.div
        initial={{ y: -45, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          duration: 0.55,
          delay: 0.08,
          ease: [0.22, 1, 0.36, 1],
        }}
        className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden"
      >
        {children}
      </motion.div>
    </div>
  );
}
