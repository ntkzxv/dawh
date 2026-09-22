"use client";

import React from "react";
import { ArrowRight, Settings, User, X } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useLoading } from "@/components/loading_screen";
import { useAppLanguage } from "@/utils/language";

export interface ProfileGuardModalProps {
  isOpen: boolean;
  missingFields?: string[];
  onGoToSettings?: () => void;
  onClose?: () => void;
}

export function ProfileGuardModal({
  isOpen,
  onGoToSettings,
  onClose,
}: ProfileGuardModalProps) {
  const { navigateWithLoading } = useLoading();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";

  if (!isOpen) return null;

  const handleGoToSettings = () => {
    if (onGoToSettings) {
      onGoToSettings();
    } else {
      navigateWithLoading("/account?autoOpen=true");
    }
  };

  return (
    <div className="fixed inset-0 z-[99998] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div
        className={`relative w-full max-w-[500px] rounded-[24px] border p-6 sm:p-8 shadow-lg flex flex-col items-center text-center gap-6 animate-in zoom-in-95 duration-200 ${
          isLight
            ? "bg-white border-[#E4E4E7] text-[#222222] shadow-slate-300/30"
            : "bg-[#2A2A2A] border-[#444444] text-[#FFFFFF] shadow-black/50"
        }`}
      >
        {/* Close (X) Button (Top Right) */}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className={`absolute top-4 right-4 sm:top-5 sm:right-5 p-2 rounded-full transition-colors cursor-pointer ${
              isLight
                ? "text-slate-400 hover:text-[#222222] hover:bg-slate-100"
                : "text-[#A1A1AA] hover:text-white hover:bg-white/10"
            }`}
            title={isThai ? "ปิด" : "Close"}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        )}

        {/* Text Content */}
        <div className="flex flex-col gap-2.5 pt-2 sm:pt-1">
          <h3
            className={`text-[22px] sm:text-[24px] font-bold leading-tight ${
              isLight ? "text-[#222222]" : "text-white"
            }`}
            style={{
              fontFamily: isThai
                ? "var(--font-prompt), sans-serif"
                : "var(--font-outfit), sans-serif",
            }}
          >
            {isThai ? "ต้องกรอกข้อมูลให้ครบถ้วนก่อน" : "Incomplete Profile Information"}
          </h3>
          <p
            className={`text-[13.5px] sm:text-[14px] leading-relaxed max-w-md mx-auto ${
              isLight ? "text-[#555555]" : "text-[#B4B4B8]"
            }`}
            style={{
              fontFamily: isThai
                ? "var(--font-prompt), sans-serif"
                : "var(--font-geist-sans), sans-serif",
            }}
          >
            {isThai
              ? "คุณยังไม่ได้กรอกข้อมูลประวัติพนักงานในระบบ กรุณากรอกข้อมูลส่วนตัวในหน้าตั้งค่าให้เรียบร้อยก่อน จึงจะสามารถเข้าใช้งานระบบงานอื่นๆ ได้"
              : "You have not completed your employee profile records. Please complete your profile in Settings before accessing system modules."}
          </p>
        </div>

        {/* Action Button */}
        <div className="w-full pt-1">
          <button
            type="button"
            onClick={handleGoToSettings}
            className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg hover:scale-[1.01] active:scale-[0.99] cursor-pointer ${
              isLight
                ? "bg-[#222222] hover:bg-black text-white"
                : "bg-white hover:bg-slate-100 text-[#222222]"
            }`}
            style={{
              fontFamily: isThai
                ? "var(--font-prompt), sans-serif"
                : "var(--font-outfit), sans-serif",
            }}
          >
            <User size={16} />
            <span>{isThai ? "ไปที่หน้ากรอกข้อมูลส่วนตัว (Profile)" : "Go to Profile Registration"}</span>
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
