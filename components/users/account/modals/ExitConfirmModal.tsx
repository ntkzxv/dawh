"use client";

import React from "react";

export interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmDiscard: () => void;
  isLight: boolean;
  isThai: boolean;
}

export function ExitConfirmModal({
  isOpen,
  onClose,
  onConfirmDiscard,
  isLight,
  isThai,
}: ExitConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className={`w-full max-w-[420px] rounded-[22px] border p-6 sm:p-7 shadow-2xl flex flex-col items-center gap-5 text-center overflow-hidden animate-in zoom-in-95 duration-150 ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#333333] border-[#444444]"
        }`}
      >
        {/* Content Text */}
        <div className="flex flex-col gap-2">
          <h4
            className={`font-bold text-[19px] leading-tight ${
              isLight ? "text-[#222222]" : "text-[#FFFFFF]"
            }`}
            style={{ fontFamily: "var(--font-outfit), sans-serif" }}
          >
            {isThai ? "ยืนยันการออกจากแบบฟอร์ม?" : "Discard Changes & Exit?"}
          </h4>
          <p className={`text-xs leading-relaxed ${isLight ? "text-[#666666]" : "text-[#D4D4D8]"}`}>
            {isThai
              ? "หากออกจากหน้านี้ ข้อมูลทั้งหมดที่คุณกรอกไว้จะหายไปและคุณจะต้องเริ่มกรอกใหม่ทั้งหมดในครั้งถัดไป คุณต้องการออกจากแบบฟอร์มใช่หรือไม่?"
              : "If you exit now, all entered information will be discarded and you will need to re-enter all fields again next time. Are you sure you want to exit?"}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2 border-t border-[#444444]/20">
          <button
            type="button"
            onClick={onClose}
            className={`w-full sm:flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              isLight
                ? "bg-[#222222] text-white hover:bg-black shadow-sm"
                : "bg-white text-[#222222] hover:bg-slate-100 shadow-sm"
            }`}
          >
            {isThai ? "กรอกข้อมูลต่อ" : "Keep Editing"}
          </button>
          <button
            type="button"
            onClick={onConfirmDiscard}
            className={`w-full sm:flex-1 py-2.5 px-4 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              isLight
                ? "border-rose-300 text-rose-600 hover:bg-rose-50"
                : "border-rose-500/40 text-rose-400 hover:bg-rose-500/10"
            }`}
          >
            {isThai ? "ยืนยันการออก" : "Discard & Exit"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ExitConfirmModal;
