"use client";

import React, { useState, useEffect } from "react";
import { NavbarMain, NavbarsubWarehouse } from "@/components/navbar";
import { useTheme } from "@/context/ThemeContext";

export default function WarehouseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const [isMinimized, setIsMinimized] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("dawh_sidebar_minimized");
      if (saved !== null) {
        setIsMinimized(JSON.parse(saved));
      }
    } catch {
      // Non-blocking
    }
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
      {/* Sidebar with Warehouse Navigation */}
      <NavbarMain
        initialMinimized={isMinimized}
        onMinimizedChange={handleMinimizedChange}
        hubPath="/workspace"
        settingsPath="/settings"
      >
        <NavbarsubWarehouse isMinimized={isMinimized} />
      </NavbarMain>

      {/* Main Content Viewport */}
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
