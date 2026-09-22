"use client";

import React, { useState } from "react";
import { X, Loader2, CheckCircle2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { useNotification } from "@/context/NotificationContext";

export interface PasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  isLight: boolean;
  isThai: boolean;
}

export function PasswordModal({
  isOpen,
  onClose,
  onSuccess,
  isLight,
  isThai,
}: PasswordModalProps) {
  const { notify } = useNotification();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleClose = () => {
    onClose();
    setCurrentPassword("");
    setNewPassword("");
    setConfirmNewPassword("");
    setModalError(null);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword.trim()) {
      setModalError(isThai ? "กรุณาระบุรหัสผ่านปัจจุบัน" : "Please enter your current password");
      return;
    }
    if (newPassword.length < 8) {
      setModalError(isThai ? "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 8 ตัวอักษร" : "New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setModalError(isThai ? "รหัสผ่านใหม่ไม่ตรงกัน" : "New passwords do not match");
      return;
    }
    if (currentPassword === newPassword) {
      setModalError(isThai ? "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสผ่านเดิม" : "New password cannot be the same as current password");
      return;
    }

    setIsSaving(true);
    setModalError(null);

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
            // ignore JSON parse error
          }
        }
      }

      setSaveSuccess(true);
      notify.success(
        isThai ? "เปลี่ยนรหัสผ่านสำเร็จ" : "Password Changed Successfully",
        {
          message: isThai
            ? "รหัสผ่านใหม่ของท่านได้รับการบันทึกแล้ว"
            : "Your password has been securely updated.",
          duration: 4000,
        }
      );

      if (onSuccess) {
        onSuccess();
      }

      setTimeout(() => {
        setSaveSuccess(false);
        handleClose();
      }, 1200);
    } catch (err: unknown) {
      const errorMsg = (err instanceof Error ? err.message : null) || (isThai ? "ไม่สามารถเปลี่ยนรหัสผ่านได้" : "Failed to update password");
      setModalError(errorMsg);
      notify.error(isThai ? "เกิดข้อผิดพลาด" : "Password Update Error", {
        message: errorMsg,
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-[420px] rounded-[16px] border p-6 shadow-2xl flex flex-col gap-4 overflow-hidden ${
          isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
        }`}
      >
        <div className="flex items-center justify-between border-b pb-3 border-[#444444]/40">
          <h4
            className={`font-bold text-[18px] ${
              isLight ? "text-[#222222]" : "text-[#FFFFFF]"
            }`}
            style={{ fontFamily: "var(--font-outfit), sans-serif" }}
          >
            {isThai ? "เปลี่ยนรหัสผ่าน" : "Change Password"}
          </h4>
          <button
            type="button"
            onClick={handleClose}
            className={`p-1 rounded-lg transition-colors cursor-pointer ${
              isLight ? "text-slate-400 hover:text-[#222222]" : "text-[#E4E4E7] hover:text-[#FFFFFF]"
            }`}
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleChangePassword} className="flex flex-col gap-3.5">
          {modalError && (
            <div className="p-2.5 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs">
              {modalError}
            </div>
          )}

          <div className="flex flex-col gap-1">
            <label className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-[#E4E4E7]"}`}>
              {isThai ? "รหัสผ่านปัจจุบัน (เดิม) *" : "Current Password *"}
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder={isThai ? "ระบุรหัสผ่านปัจจุบันของคุณ" : "Enter your current password"}
              className={`p-2.5 rounded-lg border text-xs outline-none ${
                isLight
                  ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]"
                  : "bg-[#282828] border-[#444444] text-[#FFFFFF]"
              }`}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-[#E4E4E7]"}`}>
              {isThai ? "รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร) *" : "New Password (At least 8 characters) *"}
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={isThai ? "อย่างน้อย 8 ตัวอักษร" : "At least 8 characters"}
              className={`p-2.5 rounded-lg border text-xs outline-none ${
                isLight
                  ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]"
                  : "bg-[#282828] border-[#444444] text-[#FFFFFF]"
              }`}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className={`text-xs font-semibold ${isLight ? "text-slate-600" : "text-[#E4E4E7]"}`}>
              {isThai ? "ยืนยันรหัสผ่านใหม่อีกครั้ง *" : "Confirm New Password *"}
            </label>
            <input
              type="password"
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              placeholder={isThai ? "พิมพ์รหัสผ่านใหม่อีกครั้ง" : "Repeat new password"}
              className={`p-2.5 rounded-lg border text-xs outline-none ${
                isLight
                  ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]"
                  : "bg-[#282828] border-[#444444] text-[#FFFFFF]"
              }`}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#444444]/30">
            <button
              type="button"
              onClick={handleClose}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                isLight ? "text-slate-500 hover:text-[#222222]" : "text-[#E4E4E7] hover:text-[#FFFFFF]"
              }`}
            >
              {isThai ? "ยกเลิก" : "Cancel"}
            </button>
            <button
              type="submit"
              disabled={isSaving || !currentPassword.trim() || newPassword.length < 8 || newPassword !== confirmNewPassword}
              className={`px-5 py-2 text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer ${
                isLight ? "bg-[#222222] text-white" : "bg-[#FFFFFF] text-[#222222]"
              }`}
            >
              {isSaving ? (
                <Loader2 size={13} className="animate-spin" />
              ) : saveSuccess ? (
                <CheckCircle2 size={13} className="text-[#2EC4B6]" />
              ) : null}
              <span>{saveSuccess ? (isThai ? "สำเร็จ!" : "Updated!") : (isThai ? "อัปเดตรหัสผ่าน" : "Update Password")}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default PasswordModal;
