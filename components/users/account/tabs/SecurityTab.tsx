"use client";

import React, { useState, useMemo } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  EyeOff,
  Fingerprint,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useNotification } from "@/context/NotificationContext";
import type { EmployeeProfile } from "@/types/user";

export interface SecurityTabProps {
  profile: Partial<EmployeeProfile>;
  isLight: boolean;
  isThai: boolean;
  emailText: string;
  onOpenPinSetup: () => void;
  onPasswordResetSuccess?: () => void;
  frameless?: boolean;
}

export function SecurityTab({
  profile,
  isLight,
  isThai,
  emailText,
  onOpenPinSetup,
  onPasswordResetSuccess,
  frameless = false,
}: SecurityTabProps) {
  const { notify } = useNotification();

  // Email form state
  const [newEmail, setNewEmail] = useState("");
  const [confirmNewEmail, setConfirmNewEmail] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isSavingEmail, setIsSavingEmail] = useState(false);
  const [emailSuccess, setEmailSuccess] = useState(false);

  // Password form state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Password Strength Calculation (Identical to original)
  const passwordStrength = useMemo(() => {
    if (!newPassword) return { score: 0, label: "", color: "bg-transparent", textClass: "" };

    const hasLength = newPassword.length >= 8 && newPassword.length <= 32;
    const hasUppercase = /[A-Z]/.test(newPassword);
    const hasLowercase = /[a-z]/.test(newPassword);
    const hasNumber = /[0-9]/.test(newPassword);

    let score = 0;
    if (hasLength) score += 1;
    if (hasUppercase) score += 1;
    if (hasLowercase) score += 1;
    if (hasNumber) score += 1;

    if (score <= 1) {
      return {
        score: 1,
        label: isThai ? "ไม่ปลอดภัย (Weak)" : "Weak",
        color: isLight ? "bg-[#E74C3C]" : "bg-[#E71D36]",
        textClass: isLight ? "text-[#E74C3C] font-bold" : "text-[#E71D36] font-semibold",
      };
    }
    if (score === 2) {
      return {
        score: 2,
        label: isThai ? "ปานกลาง (Fair)" : "Fair",
        color: "bg-[#FF9F1C]",
        textClass: isLight ? "text-[#FF9F1C] font-bold" : "text-[#FF9F1C] font-semibold",
      };
    }
    if (score === 3) {
      return {
        score: 3,
        label: isThai ? "ระดับดี (Good)" : "Good",
        color: "bg-[#2EC4B6]",
        textClass: isLight ? "text-[#2EC4B6] font-bold" : "text-[#2EC4B6] font-semibold",
      };
    }
    return {
      score: 4,
      label: isThai ? "ปลอดภัยมาก (Strong)" : "Strong",
      color: "bg-[#2EC4B6]",
      textClass: isLight ? "text-[#2EC4B6] font-bold" : "text-[#2EC4B6] font-semibold",
    };
  }, [newPassword, isThai, isLight]);

  const handleTabChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!newEmail || !emailRegex.test(newEmail)) {
      setEmailError(isThai ? "กรุณาระบุรูปแบบอีเมลที่ถูกต้อง" : "Please enter a valid email address");
      return;
    }
    if (newEmail.toLowerCase() === (profile.email || "").toLowerCase()) {
      setEmailError(isThai ? "อีเมลใหม่ตรงกับอีเมลปัจจุบันที่ใช้งานอยู่" : "New email cannot be identical to your current email");
      return;
    }
    if (confirmNewEmail && newEmail.toLowerCase() !== confirmNewEmail.toLowerCase()) {
      setEmailError(isThai ? "อีเมลทั้งสองช่องไม่ตรงกัน" : "Email confirmation does not match");
      return;
    }

    setIsSavingEmail(true);
    setEmailError(null);

    try {
      const { error } = await authClient.changeEmail({
        newEmail,
        callbackURL: "/settings",
      });

      if (error) throw new Error(error.message);

      setEmailSuccess(true);
      notify.success(
        isThai ? "ส่งคำขอยืนยันอีเมลสำเร็จ" : "Email Update Requested",
        {
          message: isThai
            ? "ระบบได้ส่งลิงก์ยืนยันไปยังอีเมลใหม่เรียบร้อยแล้ว กรุณาคลิกลิงก์เพื่อยืนยันการเปลี่ยนแปลง"
            : "A confirmation link has been sent to your new email. Please verify to complete.",
          duration: 6000,
        }
      );

      setTimeout(() => {
        setEmailSuccess(false);
        setNewEmail("");
        setConfirmNewEmail("");
      }, 2000);
    } catch (err: unknown) {
      const errorMsg = (err instanceof Error ? err.message : null) || (isThai ? "ไม่สามารถเปลี่ยนอีเมลได้" : "Failed to update email");
      setEmailError(errorMsg);
      notify.error(isThai ? "เกิดข้อผิดพลาด" : "Email Update Error", {
        message: errorMsg,
        duration: 5000,
      });
    } finally {
      setIsSavingEmail(false);
    }
  };

  const handleTabChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim()) {
      setPasswordError(isThai ? "กรุณาระบุรหัสผ่านเดิม (ปัจจุบัน)" : "Please enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(isThai ? "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร" : "New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordError(isThai ? "รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน" : "New passwords do not match");
      return;
    }
    if (currentPassword === newPassword) {
      setPasswordError(isThai ? "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม" : "New password cannot be the same as current password");
      return;
    }

    setIsSavingPassword(true);
    setPasswordError(null);

    try {
      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true,
      });

      if (error) throw new Error(error.message);

      if (typeof window !== "undefined") {
        localStorage.removeItem("dawh_needs_password_reset");
        const cached = localStorage.getItem("dawh_user_profile");
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            parsed.needs_password_reset = false;
            localStorage.setItem("dawh_user_profile", JSON.stringify(parsed));
          } catch {
            // ignore
          }
        }
      }

      setPasswordSuccess(true);
      notify.success(
        isThai ? "เปลี่ยนรหัสผ่านสำเร็จ" : "Password Changed Successfully",
        {
          message: isThai
            ? "รหัสผ่านใหม่ของท่านได้รับการบันทึกแล้ว"
            : "Your password has been securely updated.",
          duration: 4000,
        }
      );

      if (onPasswordResetSuccess) {
        onPasswordResetSuccess();
      }

      setTimeout(() => {
        setPasswordSuccess(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmNewPassword("");
      }, 1500);
    } catch (err: unknown) {
      const errorMsg = (err instanceof Error ? err.message : null) || (isThai ? "ไม่สามารถเปลี่ยนรหัสผ่านได้" : "Failed to update password");
      setPasswordError(errorMsg);
      notify.error(isThai ? "เกิดข้อผิดพลาด" : "Password Update Error", {
        message: errorMsg,
        duration: 5000,
      });
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <div
      className={`flex-1 w-full flex flex-col items-start gap-6 transition-colors ${
        frameless
          ? "p-0 bg-transparent border-0 shadow-none"
          : isLight
          ? "p-6 sm:p-8 rounded-[12px] border bg-[#FFFFFF] border-[#E4E4E7] shadow-sm"
          : "p-6 sm:p-8 rounded-[12px] border bg-[#383838] border-[#444444] shadow-lg"
      }`}
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between border-b pb-3.5 border-[#444444]/40">
        <div>
          <h3
            className={`font-bold text-[16px] leading-[20px] ${
              isLight ? "text-[#222222]" : "text-[#FFFFFF]"
            }`}
            style={{ fontFamily: "var(--font-outfit), sans-serif" }}
          >
            {isThai ? "เปลี่ยนอีเมลและรหัสผ่าน (Change Email & Password)" : "Change Email & Password"}
          </h3>
          <p className={`text-[12px] mt-0.5 ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
            {isThai
              ? "จัดการข้อมูลความปลอดภัย อัปเดตอีเมลสำหรับเข้าสู่ระบบ และตั้งรหัสผ่านใหม่"
              : "Manage authentication credentials, update login email, and set your new password"}
          </p>
        </div>
      </div>

      {/* Optional Alert: Temporary Password Reset Needed */}
      {((profile.needs_password_reset) ||
        (typeof window !== "undefined" && localStorage.getItem("dawh_needs_password_reset") === "true")) && (
        <div className="w-full p-3.5 rounded-xl border flex items-start gap-3 bg-amber-500/10 border-amber-500/30 text-amber-500">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <div className="flex-1 text-xs leading-relaxed">
            <p className="font-bold">
              {isThai ? "แจ้งเตือน: บัญชีกำลังใช้งานรหัสผ่านชั่วคราว" : "Notice: Using Temporary Password"}
            </p>
            <p className={`mt-0.5 ${isLight ? "text-amber-700" : "text-amber-200/90"}`}>
              {isThai
                ? "เพื่อความปลอดภัยสูงสุด กรุณากำหนดรหัสผ่านใหม่ของคุณในส่วน 'เปลี่ยนรหัสผ่าน' ด้านล่าง"
                : "For system security, please update your account password to a permanent one below."}
            </p>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 1. CHANGE EMAIL SECTION                                       */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
            {isThai ? "เปลี่ยนอีเมลสำหรับเข้าสู่ระบบ" : "Change Account Email"}
          </span>
        </div>

        {/* Current Email Display */}
        <div className="flex flex-col gap-1">
          <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
            {isThai ? "อีเมลปัจจุบันที่ใช้งานอยู่" : "Current Email Address"}
          </label>
          <div
            className={`w-full p-2.5 h-[40px] flex items-center justify-between rounded-[8px] border text-[13px] font-mono select-text ${
              isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
            }`}
          >
            <span className="truncate">{emailText}</span>
            <span className="px-2 py-0.5 rounded text-[10.5px] font-sans font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1 shrink-0">
              <CheckCircle2 size={11} />
              {isThai ? "ใช้งานอยู่" : "Active"}
            </span>
          </div>
        </div>

        {/* Change Email Form */}
        <form onSubmit={handleTabChangeEmail} className="w-full flex flex-col gap-3">
          {emailError && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle size={14} className="shrink-0" />
              <span>{emailError}</span>
            </div>
          )}

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                {isThai ? "อีเมลใหม่ *" : "New Email Address *"}
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => {
                    setNewEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder={isThai ? "ระบุอีเมลใหม่ เช่น user@company.com" : "e.g. user@company.com"}
                  className={`w-full p-2.5 h-[38px] rounded-lg border text-xs outline-none transition-all ${
                    isLight
                      ? "bg-white border-[#E5E5E5] text-[#222222] focus:border-[#222222] focus:ring-1 focus:ring-[#222222]"
                      : "bg-[#282828] border-[#444444] text-[#FFFFFF] focus:border-white focus:ring-1 focus:ring-white"
                  }`}
                />
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                {isThai ? "ยืนยันอีเมลใหม่ *" : "Confirm New Email *"}
              </label>
              <div className="relative flex items-center">
                <input
                  type="email"
                  value={confirmNewEmail}
                  onChange={(e) => {
                    setConfirmNewEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder={isThai ? "พิมพ์อีเมลใหม่อีกครั้ง" : "Re-enter new email"}
                  className={`w-full p-2.5 h-[38px] rounded-lg border text-xs outline-none transition-all ${
                    isLight
                      ? "bg-white border-[#E5E5E5] text-[#222222] focus:border-[#222222] focus:ring-1 focus:ring-[#222222]"
                      : "bg-[#282828] border-[#444444] text-[#FFFFFF] focus:border-white focus:ring-1 focus:ring-white"
                  }`}
                />
              </div>
            </div>
          </div>

          <p className={`text-[11.5px] leading-relaxed ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
            {isThai
              ? "หมายเหตุ: เมื่อกดบันทึก ระบบจะส่งลิงก์ยืนยันไปยังอีเมลใหม่ กรุณาคลิกลิงก์ในอีเมลเพื่อเสร็จสิ้นกระบวนการ"
              : "Note: A confirmation link will be sent to the new email address. You must verify it before the change takes effect."}
          </p>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            {(newEmail || confirmNewEmail || emailError) && (
              <button
                type="button"
                onClick={() => {
                  setNewEmail("");
                  setConfirmNewEmail("");
                  setEmailError(null);
                }}
                className={`px-2.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer select-none ${
                  isLight
                    ? "text-zinc-500 hover:text-black hover:underline"
                    : "text-zinc-400 hover:text-white hover:underline"
                }`}
              >
                {isThai ? "ยกเลิก" : "Cancel"}
              </button>
            )}

            <button
              type="submit"
              disabled={isSavingEmail || !newEmail.trim()}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                !newEmail.trim() || isSavingEmail
                  ? "opacity-50 cursor-not-allowed bg-zinc-300 dark:bg-[#444444] text-zinc-500 dark:text-zinc-400"
                  : isLight
                  ? "bg-[#222222] hover:bg-black text-white active:scale-95"
                  : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#222222] active:scale-95"
              }`}
            >
              {isSavingEmail ? (
                <Loader2 size={13} className="animate-spin" />
              ) : emailSuccess ? (
                <CheckCircle2 size={13} className="text-emerald-500" />
              ) : null}
              <span>
                {isSavingEmail
                  ? isThai
                    ? "กำลังส่งคำขอ..."
                    : "Updating..."
                  : emailSuccess
                  ? isThai
                    ? "ส่งคำขอสำเร็จ!"
                    : "Confirmation Sent!"
                  : isThai
                  ? "บันทึกและส่งคำขอยืนยันอีเมล"
                  : "Update Email Address"}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. CHANGE PASSWORD SECTION                                    */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full flex flex-col gap-4 pt-5 border-t border-[#444444]/30">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
            {isThai ? "เปลี่ยนรหัสผ่าน" : "Change Password"}
          </span>
        </div>

        <form onSubmit={handleTabChangePassword} className="w-full flex flex-col gap-3">
          {passwordError && (
            <div className="p-3 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 animate-in fade-in duration-150">
              <AlertCircle size={14} className="shrink-0" />
              <span>{passwordError}</span>
            </div>
          )}

          <div className="flex flex-col gap-3">
            {/* Field 1: Current Password */}
            <div className="flex flex-col gap-1">
              <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                {isThai ? "รหัสผ่านปัจจุบัน *" : "Current Password *"}
              </label>
              <div className="relative flex items-center">
                <input
                  type={showCurrentPassword ? "text" : "password"}
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  placeholder={isThai ? "พิมพ์รหัสผ่านปัจจุบันเพื่อยืนยันตัวตน" : "Enter your current password"}
                  className={`w-full p-2.5 pr-10 h-[38px] rounded-lg border text-xs outline-none transition-all ${
                    isLight
                      ? "bg-white border-[#E5E5E5] text-[#222222] focus:border-[#222222] focus:ring-1 focus:ring-[#222222]"
                      : "bg-[#282828] border-[#444444] text-[#FFFFFF] focus:border-white focus:ring-1 focus:ring-white"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className={`absolute right-2.5 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                    isLight ? "text-[#666666]" : "text-[#A1A1AA]"
                  }`}
                >
                  {showCurrentPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {/* Fields 2 & 3: New Password & Confirm New Password */}
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* New Password */}
              <div className="flex flex-col gap-1">
                <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                  {isThai ? "รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร) *" : "New Password (At least 8 chars) *"}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder={isThai ? "กำหนดรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร" : "Enter new password (min. 8 characters)"}
                    className={`w-full p-2.5 pr-10 h-[38px] rounded-lg border text-xs outline-none transition-all ${
                      isLight
                        ? "bg-white border-[#E5E5E5] text-[#222222] focus:border-[#222222] focus:ring-1 focus:ring-[#222222]"
                        : "bg-[#282828] border-[#444444] text-[#FFFFFF] focus:border-white focus:ring-1 focus:ring-white"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className={`absolute right-2.5 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                      isLight ? "text-[#666666]" : "text-[#A1A1AA]"
                    }`}
                  >
                    {showNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>

              {/* Confirm New Password */}
              <div className="flex flex-col gap-1">
                <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                  {isThai ? "ยืนยันรหัสผ่านใหม่อีกครั้ง *" : "Confirm New Password *"}
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showConfirmNewPassword ? "text" : "password"}
                    value={confirmNewPassword}
                    onChange={(e) => {
                      setConfirmNewPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder={isThai ? "พิมพ์รหัสผ่านใหม่อีกครั้งเพื่อยืนยัน" : "Re-enter new password"}
                    className={`w-full p-2.5 pr-10 h-[38px] rounded-lg border text-xs outline-none transition-all ${
                      isLight
                        ? "bg-white border-[#E5E5E5] text-[#222222] focus:border-[#222222] focus:ring-1 focus:ring-[#222222]"
                        : "bg-[#282828] border-[#444444] text-[#FFFFFF] focus:border-white focus:ring-1 focus:ring-white"
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmNewPassword(!showConfirmNewPassword)}
                    className={`absolute right-2.5 p-1 rounded hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer ${
                      isLight ? "text-[#666666]" : "text-[#A1A1AA]"
                    }`}
                  >
                    {showConfirmNewPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Password Strength Meter */}
          <div className="w-full flex flex-col gap-1.5 pt-1">
            <div className="flex items-center justify-between">
              <span className={`text-[11.5px] font-medium ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                {isThai ? "ระดับความปลอดภัยของรหัสผ่าน" : "Password Strength"}
              </span>
              {newPassword ? (
                <span
                  className={`text-[10.5px] font-bold tracking-wider uppercase transition-all duration-300 ${
                    confirmNewPassword && newPassword !== confirmNewPassword
                      ? "text-rose-500 font-semibold"
                      : passwordStrength.textClass
                  }`}
                >
                  {confirmNewPassword && newPassword !== confirmNewPassword
                    ? isThai
                      ? "รหัสผ่านไม่ตรงกัน"
                      : "Passwords do not match"
                    : confirmNewPassword && newPassword === confirmNewPassword
                    ? `${passwordStrength.label} • ${isThai ? "ตรงกัน" : "Match"}`
                    : passwordStrength.label}
                </span>
              ) : (
                <span className={`text-[10.5px] ${isLight ? "text-zinc-400" : "text-zinc-500"}`}>
                  {isThai ? "อย่างน้อย 8 ตัวอักษร" : "Min. 8 characters"}
                </span>
              )}
            </div>

            <div className="flex gap-1.5 h-[3.5px]">
              {[1, 2, 3, 4].map((level) => (
                <div
                  key={level}
                  className={`h-full flex-1 rounded-full transition-all duration-300 ${
                    newPassword && passwordStrength.score >= level
                      ? confirmNewPassword && newPassword !== confirmNewPassword
                        ? "bg-rose-500"
                        : passwordStrength.color
                      : isLight
                      ? "bg-slate-200"
                      : "bg-[#444444]"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-1">
            {(currentPassword || newPassword || confirmNewPassword || passwordError) && (
              <button
                type="button"
                onClick={() => {
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmNewPassword("");
                  setPasswordError(null);
                }}
                className={`px-2.5 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer select-none ${
                  isLight
                    ? "text-zinc-500 hover:text-black hover:underline"
                    : "text-zinc-400 hover:text-white hover:underline"
                }`}
              >
                {isThai ? "ยกเลิก" : "Cancel"}
              </button>
            )}

            <button
              type="submit"
              disabled={isSavingPassword || !currentPassword.trim() || newPassword.length < 8 || newPassword !== confirmNewPassword}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer ${
                isSavingPassword || !currentPassword.trim() || newPassword.length < 8 || newPassword !== confirmNewPassword
                  ? "opacity-50 cursor-not-allowed bg-zinc-300 dark:bg-[#444444] text-zinc-500 dark:text-zinc-400"
                  : isLight
                  ? "bg-[#222222] hover:bg-black text-white active:scale-95"
                  : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#222222] active:scale-95"
              }`}
            >
              {isSavingPassword ? (
                <Loader2 size={13} className="animate-spin" />
              ) : passwordSuccess ? (
                <CheckCircle2 size={13} className="text-emerald-500" />
              ) : null}
              <span>
                {isSavingPassword
                  ? isThai
                    ? "กำลังอัปเดตรหัสผ่าน..."
                    : "Updating..."
                  : passwordSuccess
                  ? isThai
                    ? "เปลี่ยนรหัสผ่านสำเร็จ!"
                    : "Password Changed!"
                  : isThai
                  ? "อัปเดตรหัสผ่านใหม่"
                  : "Update Password"}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. 6-DIGIT PIN SECURITY & RECOVERY                            */}
      {/* ------------------------------------------------------------- */}
      <div className="w-full flex flex-col gap-3 pt-5 border-t border-[#444444]/30">
        <div className="flex items-center gap-2">
          <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
            {isThai ? "ระบบความปลอดภัยเพิ่มเติม" : "Additional Security"}
          </span>
        </div>

        <div
          className={`w-full p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
            isLight ? "bg-[#F8FAFC] border-[#E2E8F0]" : "bg-[#282828] border-[#444444]"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg transition-colors ${
                !(profile.pin_code || profile.is_pin_enabled)
                  ? isLight
                    ? "bg-amber-500/10 border border-amber-500/50 text-amber-600 shadow-xs"
                    : "bg-amber-500/10 border border-amber-500/50 text-amber-400"
                  : isLight
                  ? "bg-white border border-transparent text-zinc-700 shadow-xs"
                  : "bg-[#333333] border border-transparent text-zinc-200"
              }`}
            >
              <Fingerprint size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className={`text-xs font-bold ${isLight ? "text-[#222222]" : "text-white"}`}>
                  {isThai ? "รหัส PIN 6 หลัก (Quick 6-Digit PIN)" : "Quick 6-Digit PIN"}
                </h4>
                {(profile.pin_code || profile.is_pin_enabled) && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-500 border border-emerald-500/30">
                    {isThai ? "ตั้งค่าแล้ว" : "Configured"}
                  </span>
                )}
              </div>
              <p className={`text-[11.5px] mt-0.5 ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                {isThai
                  ? "ใช้สำหรับการเข้าถึงโมดูลสำคัญและการยืนยันตัวตนอย่างรวดเร็วในองค์กร"
                  : "Used for quick authorization and sensitive actions verification"}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenPinSetup}
            className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer shrink-0 ${
              isLight
                ? "border-[#E5E5E5] bg-white text-[#222222] hover:bg-slate-50 active:scale-95"
                : "border-[#555555] bg-[#333333] text-white hover:bg-[#3d3d3d] active:scale-95"
            }`}
          >
            {profile.pin_code || profile.is_pin_enabled
              ? isThai
                ? "เปลี่ยนรหัส PIN"
                : "Change PIN"
              : isThai
              ? "ตั้งค่ารหัส PIN ทันที"
              : "Setup PIN"}
          </button>
        </div>

        {!(profile.pin_code || profile.is_pin_enabled) && (
          <p className="w-full text-xs text-amber-500 font-medium">
            {isThai ? "ยังไม่ได้ตั้งค่า" : "Not Set"}
          </p>
        )}
      </div>
    </div>
  );
}

export default SecurityTab;
