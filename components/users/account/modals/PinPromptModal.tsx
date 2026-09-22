"use client";

import React from "react";
import { X, KeyRound } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";

export interface PinPromptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAccept: () => void;
  isLight: boolean;
  isThai: boolean;
}

export function PinPromptModal({
  isOpen,
  onClose,
  onAccept,
  isLight,
  isThai,
}: PinPromptModalProps) {
  const { notify } = useNotification();

  if (!isOpen) return null;

  const handleSkip = () => {
    onClose();
    notify.info(isThai ? "ข้ามการตั้งรหัส PIN" : "PIN Setup Skipped", {
      message: isThai
        ? "คุณสามารถตั้งรหัส PIN ได้ตลอดเวลาในแท็บความปลอดภัย"
        : "You can set up your PIN anytime in Security settings.",
      duration: 4000,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-[400px] rounded-[24px] border p-6 sm:p-7 shadow-2xl flex flex-col items-center gap-5 text-center relative animate-in zoom-in-95 duration-150 ${
          isLight ? "bg-[#FAFAFA] border-[#E4E4E7]" : "bg-[#242424] border-[#383838]"
        }`}
      >
        {/* Close / Skip button in top right */}
        <button
          type="button"
          onClick={handleSkip}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer ${
            isLight ? "text-zinc-400 hover:text-black hover:bg-zinc-100" : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
          title={isThai ? "ข้าม" : "Skip"}
        >
          <X size={16} />
        </button>

        {/* Icon Graphic */}
        <div
          className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
            isLight ? "bg-[#222222] text-white" : "bg-white text-[#222222]"
          }`}
        >
          <KeyRound size={26} />
        </div>

        {/* Header Titles */}
        <div className="flex flex-col gap-1.5">
          <h4 className={`text-lg sm:text-[19px] font-bold tracking-tight ${isLight ? "text-black" : "text-white"}`}>
            {isThai ? "ต้องการสร้างรหัส PIN หรือไม่?" : "Set Up a 6-Digit PIN?"}
          </h4>
          <p className={`text-xs leading-relaxed max-w-xs mx-auto ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
            {isThai
              ? "รหัส PIN 6 หลักช่วยให้คุณเข้าสู่ระบบได้อย่างสะดวก รวดเร็ว และปลอดภัยยิ่งขึ้น (สามารถตั้งค่าภายหลังได้)"
              : "A 6-digit PIN enables faster and more secure sign-in. You can also configure this later."}
          </p>
        </div>

        {/* Action Buttons: Skip and Create */}
        <div className="w-full flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={handleSkip}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold border transition-all active:scale-95 cursor-pointer ${
              isLight
                ? "border-zinc-300 hover:bg-zinc-100 text-zinc-700"
                : "border-zinc-700 hover:bg-zinc-800 text-zinc-300"
            }`}
          >
            {isThai ? "ข้าม" : "Skip"}
          </button>

          <button
            type="button"
            onClick={() => {
              onClose();
              onAccept();
            }}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold transition-all active:scale-95 shadow-md cursor-pointer ${
              isLight
                ? "bg-[#000000] hover:bg-[#222222] text-white"
                : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#18181B]"
            }`}
          >
            {isThai ? "สร้างรหัส PIN" : "Create PIN"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PinPromptModal;
