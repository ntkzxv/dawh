"use client";

import React, { useState, useEffect, useRef } from "react";
import { X, ArrowLeft, ArrowRight, Loader2, Delete } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNotification } from "@/context/NotificationContext";

export interface PinSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId?: string;
  isLight: boolean;
  isThai: boolean;
}

export function PinSetupModal({
  isOpen,
  onClose,
  isLight,
  isThai,
}: PinSetupModalProps) {
  const { notify } = useNotification();
  const [pinDigits, setPinDigits] = useState(["", "", "", "", "", ""]);
  const [confirmPinDigits, setConfirmPinDigits] = useState(["", "", "", "", "", ""]);
  const [pinStep, setPinStep] = useState<"enter" | "confirm">("enter");
  const [lastTypedPinIndex, setLastTypedPinIndex] = useState<number | null>(null);
  const [pinShake, setPinShake] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving] = useState(false);
  const pinMorphTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const resetPinState = () => {
    setPinDigits(["", "", "", "", "", ""]);
    setConfirmPinDigits(["", "", "", "", "", ""]);
    setPinStep("enter");
    setLastTypedPinIndex(null);
    setModalError(null);
    setPinShake(false);
  };

  const handleClose = () => {
    resetPinState();
    onClose();
  };

  const triggerPinDigitMorph = (index: number) => {
    if (pinMorphTimeoutRef.current) clearTimeout(pinMorphTimeoutRef.current);
    setLastTypedPinIndex(index);
    pinMorphTimeoutRef.current = setTimeout(() => {
      setLastTypedPinIndex(null);
    }, 550);
  };

  const handlePinKeypadPress = (val: string) => {
    if (isSaving) return;
    if (pinStep === "enter") {
      setPinDigits((prev) => {
        const idx = prev.findIndex((d) => d === "");
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = val;
        triggerPinDigitMorph(idx);
        return next;
      });
    } else {
      setConfirmPinDigits((prev) => {
        const idx = prev.findIndex((d) => d === "");
        if (idx === -1) return prev;
        const next = [...prev];
        next[idx] = val;
        triggerPinDigitMorph(idx);
        return next;
      });
    }
  };

  const handlePinKeypadBackspace = () => {
    if (isSaving) return;
    if (pinMorphTimeoutRef.current) clearTimeout(pinMorphTimeoutRef.current);
    setLastTypedPinIndex(null);
    if (pinStep === "enter") {
      setPinDigits((prev) => {
        const filledIdxs = prev.map((d, i) => (d !== "" ? i : -1)).filter((i) => i !== -1);
        if (filledIdxs.length === 0) return prev;
        const lastIdx = filledIdxs[filledIdxs.length - 1];
        const next = [...prev];
        next[lastIdx] = "";
        return next;
      });
    } else {
      setConfirmPinDigits((prev) => {
        const filledIdxs = prev.map((d, i) => (d !== "" ? i : -1)).filter((i) => i !== -1);
        if (filledIdxs.length === 0) return prev;
        const lastIdx = filledIdxs[filledIdxs.length - 1];
        const next = [...prev];
        next[lastIdx] = "";
        return next;
      });
    }
  };

  const handlePinKeypadClear = () => {
    if (isSaving) return;
    if (pinMorphTimeoutRef.current) clearTimeout(pinMorphTimeoutRef.current);
    setLastTypedPinIndex(null);
    if (pinStep === "enter") {
      setPinDigits(["", "", "", "", "", ""]);
    } else {
      setConfirmPinDigits(["", "", "", "", "", ""]);
    }
  };

  const handleAdvancePin = async () => {
    const pinStr = pinDigits.join("");
    const confirmPinStr = confirmPinDigits.join("");

    if (pinStep === "enter") {
      if (pinStr.length !== 6) return;
      setModalError(null);
      setPinStep("confirm");
      setConfirmPinDigits(["", "", "", "", "", ""]);
      setLastTypedPinIndex(null);
      return;
    }

    if (confirmPinStr !== pinStr) {
      setPinShake(true);
      const msg = isThai ? "รหัส PIN ยืนยันไม่ตรงกัน กรุณาลองใหม่อีกครั้ง" : "PINs do not match. Please try again.";
      setModalError(msg);
      notify.warning(isThai ? "รหัส PIN ไม่ตรงกัน" : "PIN Mismatch", {
        message: msg,
        duration: 4000,
      });
      setTimeout(() => {
        setPinShake(false);
        setConfirmPinDigits(["", "", "", "", "", ""]);
        setLastTypedPinIndex(null);
      }, 600);
      return;
    }

    const message = isThai
      ? "ระบบ Auth ใหม่ไม่รองรับการเข้าสู่ระบบด้วย PIN"
      : "Quick PIN is not supported by the new authentication system.";
    setModalError(message);
    notify.warning(isThai ? "ยกเลิก Quick PIN แล้ว" : "Quick PIN removed", {
      message,
      duration: 5000,
    });
  };

  // Hardware keyboard listener when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handlePinKeypadPress(e.key);
      } else if (e.code && e.code.startsWith("Numpad") && e.code.length === 7) {
        const numChar = e.code.replace("Numpad", "");
        if (/^[0-9]$/.test(numChar)) {
          e.preventDefault();
          handlePinKeypadPress(numChar);
        }
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handlePinKeypadBackspace();
      } else if (e.key === "Escape") {
        e.preventDefault();
        handlePinKeypadClear();
      } else if (e.key === "Enter") {
        e.preventDefault();
        const active = pinStep === "enter" ? pinDigits : confirmPinDigits;
        if (active.every((d) => d !== "")) {
          handleAdvancePin();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, pinStep, pinDigits, confirmPinDigits, isSaving, isThai, notify]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`w-full max-w-[380px] rounded-[24px] border p-6 sm:p-7 shadow-2xl flex flex-col items-center gap-5 text-center overflow-hidden relative ${
          isLight ? "bg-[#FAFAFA] border-[#E4E4E7]" : "bg-[#282828] border-[#3F3F3F]"
        }`}
      >
        {/* DEV_TESTPUSHFILL_START */}
        <button
          type="button"
          onClick={() => {
            setPinDigits(["1", "2", "3", "4", "5", "6"]);
            setConfirmPinDigits(["1", "2", "3", "4", "5", "6"]);
            setPinStep("confirm");
          }}
          className="absolute top-4 left-4 text-xs text-amber-500 hover:text-amber-400 underline cursor-pointer p-1 font-mono"
          title="Auto-fill PIN 123456"
        >
          testpushfill
        </button>
        {/* DEV_TESTPUSHFILL_END */}

        {/* Close Button */}
        <button
          type="button"
          onClick={handleClose}
          className={`absolute top-4 right-4 p-2 rounded-full transition-colors cursor-pointer ${
            isLight ? "text-zinc-400 hover:text-black hover:bg-zinc-100" : "text-zinc-400 hover:text-white hover:bg-white/10"
          }`}
          title={isThai ? "ปิด" : "Close"}
        >
          <X size={16} />
        </button>

        {/* Header Titles */}
        <div className="text-center">
          <h4 className={`text-lg sm:text-[20px] font-bold tracking-tight ${isLight ? "text-black" : "text-white"}`}>
            {pinStep === "enter"
              ? isThai ? "กำหนดรหัสผ่าน PIN Code" : "Create 6-Digit PIN"
              : isThai ? "ยืนยันรหัสผ่าน PIN Code อีกครั้ง" : "Confirm 6-Digit PIN"}
          </h4>
          <p className={`text-xs mt-1 max-w-xs mx-auto leading-relaxed ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
            {pinStep === "enter"
              ? isThai
                ? "กรอกรหัสตัวเลข 6 หลักที่คุณต้องการใช้สำหรับเข้าสู่ระบบ"
                : "Enter the 6-digit numeric PIN for quick sign-in."
              : isThai
              ? "กรอกรหัส PIN เดิมอีกครั้งเพื่อยืนยันความถูกต้อง"
              : "Re-enter the exact same 6 digits to verify."}
          </p>
        </div>

        {/* Error message */}
        {modalError && (
          <div className="w-full p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs">
            {modalError}
          </div>
        )}

        {/* DYNAMIC CAPSULE: MORPHS INTO FULL-WIDTH BUTTON ON COMPLETE WITH SLIDE ANIMATION */}
        <div className={`w-full flex flex-col items-center ${pinShake ? "animate-shake" : ""}`}>
          <div className="w-full max-w-[270px] h-[44px] sm:h-[46px] relative overflow-hidden rounded-full">
            <AnimatePresence mode="wait" initial={false}>
              {!(pinStep === "enter" ? pinDigits : confirmPinDigits).every((d) => d !== "") ? (
                /* State 1: PIN Input Dots Capsule */
                <motion.div
                  key="settings-capsule-dots"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className={`w-full h-full rounded-full border px-4 flex items-center justify-center transition-all ${
                    isLight
                      ? "bg-white border-zinc-300"
                      : "bg-[#1E1E1E] border-zinc-700"
                  }`}
                >
                  <div className="flex items-center justify-center gap-3 select-none">
                    {(pinStep === "enter" ? pinDigits : confirmPinDigits).map((digit, i) => {
                      const isFilled = digit !== "";
                      const isCurrentlyTyping = lastTypedPinIndex === i;

                      return (
                        <div
                          key={`pin-dot-settings-${pinStep}-${i}`}
                          className="flex items-center justify-center w-3 h-5 relative"
                        >
                          <AnimatePresence mode="wait">
                            {isFilled ? (
                              isCurrentlyTyping ? (
                                /* Transient Number Flash */
                                <motion.span
                                  key={`num-set-${i}-${digit}`}
                                  initial={{ scale: 0.7, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.5, opacity: 0 }}
                                  transition={{ duration: 0.14 }}
                                  className={`text-sm sm:text-base font-bold font-mono ${
                                    isLight ? "text-black" : "text-white"
                                  }`}
                                >
                                  {digit}
                                </motion.span>
                              ) : (
                                /* Small Solid White/Black Dot */
                                <motion.span
                                  key={`dot-set-${i}`}
                                  initial={{ scale: 0.4, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0.4, opacity: 0 }}
                                  transition={{ duration: 0.14 }}
                                  className={`w-2 h-2 rounded-full ${
                                    isLight ? "bg-black" : "bg-white"
                                  }`}
                                />
                              )
                            ) : (
                              /* Small Unfilled Gray Dot */
                              <motion.span
                                key={`empty-set-${i}`}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`w-2 h-2 rounded-full ${
                                  isLight ? "bg-zinc-300" : "bg-zinc-700"
                                }`}
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                /* State 2: Entire Capsule Transforms into Full-Width Slide-In Button */
                <motion.button
                  key="settings-capsule-submit-btn"
                  initial={{ x: "-100%", opacity: 0 }}
                  animate={{ x: "0%", opacity: 1 }}
                  exit={{ x: "100%", opacity: 0 }}
                  transition={{ type: "spring", stiffness: 440, damping: 28 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  type="button"
                  onClick={handleAdvancePin}
                  disabled={isSaving}
                  className={`w-full h-full rounded-full font-bold text-xs sm:text-[13px] flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-colors ${
                    isLight
                      ? "bg-black hover:bg-zinc-800 text-white"
                      : "bg-white hover:bg-zinc-200 text-black"
                  }`}
                >
                  {isSaving ? (
                    <Loader2 size={15} className="animate-spin" />
                  ) : (
                    <>
                      <span>
                        {pinStep === "enter"
                          ? isThai ? "ยืนยันรหัสผ่าน" : "Continue"
                          : isThai ? "บันทึกรหัสผ่าน" : "Confirm"}
                      </span>
                      <ArrowRight size={15} strokeWidth={2.4} />
                    </>
                  )}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* BORDERLESS NUMBER KEYPAD */}
        <div className="grid grid-cols-3 gap-1.5 max-w-[210px] mx-auto w-full pt-1">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              key={num}
              type="button"
              onClick={() => handlePinKeypadPress(num)}
              disabled={isSaving}
              className={`h-10 rounded-full border-0 text-lg font-bold flex items-center justify-center cursor-pointer select-none transition-colors ${
                isLight
                  ? "text-black hover:bg-zinc-200/70 active:bg-zinc-300/80"
                  : "text-white hover:bg-white/10 active:bg-white/20"
              }`}
            >
              {num}
            </motion.button>
          ))}

          {/* Bottom Left: Clear Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={handlePinKeypadClear}
            disabled={isSaving}
            className={`h-10 rounded-full border-0 text-xs font-bold flex items-center justify-center cursor-pointer select-none transition-colors ${
              isLight
                ? "text-zinc-400 hover:text-black hover:bg-zinc-200/70"
                : "text-zinc-500 hover:text-white hover:bg-white/10"
            }`}
          >
            C
          </motion.button>

          {/* 0 Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={() => handlePinKeypadPress("0")}
            disabled={isSaving}
            className={`h-10 rounded-full border-0 text-lg font-bold flex items-center justify-center cursor-pointer select-none transition-colors ${
              isLight
                ? "text-black hover:bg-zinc-200/70 active:bg-zinc-300/80"
                : "text-white hover:bg-white/10 active:bg-white/20"
            }`}
          >
            0
          </motion.button>

          {/* Backspace Button */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            type="button"
            onClick={handlePinKeypadBackspace}
            disabled={isSaving}
            className={`h-10 rounded-full border-0 text-xs font-bold flex items-center justify-center cursor-pointer select-none transition-colors ${
              isLight
                ? "text-zinc-400 hover:text-black hover:bg-zinc-200/70"
                : "text-zinc-500 hover:text-white hover:bg-white/10"
            }`}
            title="Delete"
          >
            <Delete size={16} strokeWidth={2.2} />
          </motion.button>
        </div>

        {/* Back Button if in Confirm Step */}
        {pinStep === "confirm" && (
          <button
            type="button"
            onClick={() => {
              setPinStep("enter");
              setConfirmPinDigits(["", "", "", "", "", ""]);
              setLastTypedPinIndex(null);
            }}
            className={`text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1 mt-1 ${
              isLight ? "text-zinc-500 hover:text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            <ArrowLeft size={13} />
            <span>{isThai ? "ย้อนกลับไปกำหนดรหัสใหม่" : "Back to step 1"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default PinSetupModal;
