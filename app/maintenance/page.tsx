"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useAppLanguage } from "@/utils/language";
import { DAWH_LONGNOSPACE_DATA_URI, getDawhLogo } from "@/config/brand";
import { useNotification } from "@/context/NotificationContext";
import { useTheme } from "@/context/ThemeContext";

export default function SystemMaintenancePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const moduleParam = searchParams.get("module");
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";
  const { theme } = useTheme();
  const isLight = theme === "light";
  const { notify } = useNotification();
  const isCompletedRef = useRef(false);

  // Countdown timer simulation (defaults to 02:45:18 per Figma spec)
  const [secondsRemaining, setSecondsRemaining] = useState(2 * 3600 + 45 * 60 + 18);
  const [schedule, setSchedule] = useState({
    startTime: "02:00 AM",
    endTime: "06:00 AM",
  });



  useEffect(() => {
    try {
      const saved = localStorage.getItem("dawh_maintenance_schedule");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed) {
          setSchedule((prev) => ({
            ...prev,
            startTime: parsed.startTime || prev.startTime,
            endTime: parsed.endTime || prev.endTime,
          }));
          if (typeof parsed.secondsRemaining === "number" && parsed.secondsRemaining > 0) {
            setSecondsRemaining(parsed.secondsRemaining);
          }
        }
      }
    } catch {
      // non-blocking
    }
  }, []);

  // Countdown interval + Auto-restore module status to Active when timer hits 0
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          if (!isCompletedRef.current) {
            isCompletedRef.current = true;
            // Restore module status in localStorage
            try {
              const statusRaw = localStorage.getItem("dawh_module_statuses");
              const statuses = statusRaw ? JSON.parse(statusRaw) : {};
              if (moduleParam) {
                statuses[moduleParam] = "active";
              } else {
                statuses.warehouse = "active";
                statuses.datacenter = "active";
                statuses.employee = "active";
                statuses.reports = "active";
              }
              localStorage.setItem("dawh_module_statuses", JSON.stringify(statuses));

              // Also update scheduled maintenance enabled = false
              const schedRaw = localStorage.getItem("dawh_maintenance_schedule");
              if (schedRaw) {
                const sched = JSON.parse(schedRaw);
                sched.enabled = false;
                sched.secondsRemaining = 0;
                localStorage.setItem("dawh_maintenance_schedule", JSON.stringify(sched));
              }
            } catch (e) {
              console.error("Failed to restore module status:", e);
            }

            // Notify user of completion and redirect to workspace
            notify.success(
              isThai ? "การปรับปรุงระบบเสร็จสมบูรณ์" : "Maintenance Completed",
              {
                message: isThai
                  ? "ระบบเปิดให้ใช้งานตามปกติเรียบร้อยแล้ว กำลังนำท่านเข้าสู่พื้นที่ทำงาน..."
                  : "System has been restored to active status. Returning to workspace...",
                duration: 4000,
              }
            );

            setTimeout(() => {
              router.push("/workspace");
            }, 1800);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [moduleParam, isThai, notify, router]);

  const formatTimer = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const getModuleName = () => {
    if (!moduleParam) return isThai ? "ระบบพื้นที่ทำงาน" : "System Platform";
    switch (moduleParam) {
      case "warehouse":
        return isThai ? "จัดการคลังสินค้า" : "Warehouse ERP";
      case "datacenter":
        return isThai ? "สัญญาเช่าซื้อ" : "HP Datacenter";
      case "employee":
        return isThai ? "จัดการพนักงาน" : "Employee Management";
      case "reports":
        return isThai ? "รายงานและตรวจสอบ" : "Reports & Auditing";
      default:
        return moduleParam.toUpperCase();
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key="maintenance-page"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={`relative min-h-screen w-full flex flex-col justify-between items-center overflow-x-hidden overflow-y-auto transition-colors duration-300 ${
          isLight
            ? "bg-[#F8FAFC] text-[#222222] selection:bg-slate-900 selection:text-white"
            : "bg-[#222222] text-white selection:bg-white/20 selection:text-white"
        }`}
        style={{ fontFamily: "var(--font-geist-sans), 'Geist', sans-serif" }}
      >
        <div className="absolute inset-0 flex flex-col pointer-events-none z-0 select-none">
          <div
            className={`w-full h-[52%] relative overflow-hidden transition-colors duration-300 ${
              isLight ? "bg-[#EEF2F6]" : "bg-[#1A1A1A]"
            }`}
          >
            <div className="absolute inset-0 pointer-events-none select-none">
              <div className="absolute -top-4 -left-24 sm:-left-36 md:-left-48 h-1/2 aspect-[1580/528] relative">
                <div
                  className="w-full h-full transition-colors duration-300"
                  style={{
                    backgroundColor: isLight ? "#FFFFFF" : "#282828",
                    WebkitMaskImage: `url("${DAWH_LONGNOSPACE_DATA_URI}")`,
                    maskImage: `url("${DAWH_LONGNOSPACE_DATA_URI}")`,
                    WebkitMaskSize: "contain",
                    maskSize: "contain",
                    WebkitMaskRepeat: "no-repeat",
                    maskRepeat: "no-repeat",
                    WebkitMaskPosition: "center",
                    maskPosition: "center",
                    transform: "rotate(-180deg)",
                  }}
                />
                <div
                  className={`absolute top-[61.2%] h-[150vh] left-[76.2%] w-[7%] transition-colors duration-300 ${
                    isLight ? "bg-[#FFFFFF]" : "bg-[#282828]"
                  }`}
                />
              </div>
            </div>
          </div>
          <div
            className={`w-full flex-1 relative overflow-hidden transition-colors duration-300 ${
              isLight ? "bg-[#FFFFFF]" : "bg-[#282828]"
            }`}
          >
            <div
              className="absolute bottom-0 right-0 h-full w-full pointer-events-none select-none transition-colors duration-300"
              style={{
                backgroundColor: isLight ? "#EEF2F6" : "#1A1A1A",
                WebkitMaskImage: `url("${DAWH_LONGNOSPACE_DATA_URI}")`,
                maskImage: `url("${DAWH_LONGNOSPACE_DATA_URI}")`,
                WebkitMaskSize: "contain",
                maskSize: "contain",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat",
                WebkitMaskPosition: "right bottom",
                maskPosition: "right bottom",
              }}
            />
          </div>
        </div>

        <motion.header
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="relative z-10 w-full h-[84px] px-4 sm:px-6 md:px-8 py-6 flex flex-row items-center shrink-0 box-border"
        >
          <Link
            href="/workspace"
            className="flex items-center cursor-pointer hover:opacity-85 transition-opacity select-none"
            title="DAWH Workspace"
          >
            <img
              src={getDawhLogo(theme, "horizontal")}
              alt="DAWH Logo"
              className="h-[42px] sm:h-[48px] w-auto object-contain select-none"
              draggable={false}
            />
          </Link>
        </motion.header>

        <main className="relative z-10 w-full max-w-[1440px] flex-1 flex flex-col justify-center items-center px-4 sm:px-10 py-6 box-border">
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 18 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -18 }}
            transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
            className={`box-border w-full max-w-[580px] flex flex-col items-center p-8 sm:p-12 gap-6 sm:gap-8 rounded-[20px] backdrop-blur-md transition-colors duration-300 ${
              isLight
                ? "bg-white/95 border border-[#E4E4E7] shadow-[0px_12px_32px_rgba(0,0,0,0.06)]"
                : "bg-[#282828]/95 border border-[#444444] shadow-[0px_12px_32px_rgba(0,0,0,0.25)]"
            }`}
          >
            {/* countdown-wrapper with staggered transition */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col items-center gap-3 w-full text-center"
            >
              {/* timer */}
              <div
                className="font-bold text-[48px] sm:text-[64px] leading-[110%] text-white tracking-tight select-none"
                style={{ fontFamily: "var(--font-outfit), sans-serif" }}
              >
                {formatTimer(secondsRemaining)}
              </div>

              {/* heading */}
              <h1
                className="font-bold text-[24px] sm:text-[32px] leading-[120%] text-center text-white"
                style={{ fontFamily: "var(--font-outfit), sans-serif" }}
              >
                {secondsRemaining === 0
                  ? isThai
                    ? `${getModuleName()} เปิดให้บริการแล้ว`
                    : `${getModuleName()} Ready for Operations`
                  : isThai
                  ? `${getModuleName()} ปิดปรับปรุงชั่วคราว`
                  : `${getModuleName()} Scheduled Maintenance`}
              </h1>

              {/* subtext */}
              <p
                className="font-normal text-[14px] sm:text-[15px] leading-[150%] text-center text-[#E4E4E7] max-w-[484px]"
                style={{ fontFamily: "var(--font-geist-sans)" }}
              >
                {secondsRemaining === 0
                  ? isThai
                    ? "การปรับปรุงระบบเสร็จสมบูรณ์เรียบร้อยแล้ว ระบบพร้อมใช้งานตามปกติ"
                    : "Scheduled maintenance completed successfully. All systems are fully operational."
                  : isThai
                  ? "เรากำลังดำเนินการปรับปรุงระบบฐานข้อมูลและอัปเกรดความปลอดภัยตามแผนงาน กรุณาลองใหม่อีกครั้งหลังจากระยะเวลาที่กำหนด"
                  : "We are performing scheduled maintenance to upgrade core database clusters and improve platform reliability. Please check back shortly."}
              </p>
            </motion.div>

            {/* progress-container */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.18, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-[484px] flex flex-col items-start gap-2"
            >
              {/* progress-bar-track */}
              <div className="w-full h-[6px] bg-[#2A2A2A] rounded-full overflow-hidden">
                {/* progress-bar-fill */}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: secondsRemaining === 0 ? "100%" : "78%" }}
                  transition={{ duration: 0.8, delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className={`h-full rounded-full ${secondsRemaining === 0 ? "bg-emerald-400" : "bg-white"}`}
                />
              </div>

              {/* progress-labels */}
              <div className="w-full flex flex-row justify-between items-center text-[11px] leading-[14px] text-[#E4E4E7]">
                <span className="font-normal">
                  {isThai ? `เริ่มเวลา ${schedule.startTime || "02:00 น."}` : `STARTED ${schedule.startTime || "02:00 AM"}`}
                </span>
                <span className="font-bold">
                  {isThai ? `คาดการณ์เสร็จสิ้น ${schedule.endTime || "06:00 น."}` : `EST. ${schedule.endTime || "06:00 AM"}`}
                </span>
              </div>
            </motion.div>

            {/* actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-[484px] flex flex-col items-center pt-2"
            >
              {/* btn-primary with hover/tap scale effects */}
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="w-full sm:w-[228px]"
              >
                <Link
                  href="/workspace"
                  className="w-full h-[42px] flex flex-row justify-center items-center px-6 py-3 rounded-[8px] border border-[#555555] bg-[#2A2A2A] hover:bg-white hover:text-zinc-950 transition-all text-[#F4F4F5] font-bold text-[14px] leading-[18px] select-none text-center block"
                  style={{ fontFamily: "var(--font-geist-sans)" }}
                >
                  {isThai ? "กลับสู่หน้าพื้นที่ทำงาน" : "Return to Workspace"}
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </main>

        {/* FOOTER: matching Figma CSS */}
        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className="w-full flex flex-row justify-center items-center px-6 py-6 border-t border-[#3D3D3D]"
          style={{ height: "80px" }}
        >
          <span
            className="font-normal text-[12px] leading-[16px] text-[#E4E4E7] text-center"
            style={{ fontFamily: "var(--font-geist-sans)" }}
          >
            {isThai
              ? "dawh Enterprise Platform © 2026. Horizon Logistics Operations Hub."
              : "dawh Platform © 2026. Horizon Logistics Operations Hub."}
          </span>
        </motion.footer>
      </motion.div>
    </AnimatePresence>
  );
}
