"use client";

import { useCallback, useMemo, useState, type FormEvent } from "react";
import { AlertCircle, Building2, CheckCircle2, Eye, EyeOff, Loader2, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { HeaderNavbar, MobileNavbar } from "@/components/navbar";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import { useNotification } from "@/context/NotificationContext";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import { warehouseApi, type MemberFull } from "@/lib/api/warehouse";
import { profileForm } from "./MemberProfileFields";
import { message, Notice, panel, useRemote } from "./Ui";
import { SecondaryRegModal } from "@/components/users/account/modals/SecondaryRegModal";
import { AvatarCropModal } from "@/components/users/AvatarCropModal";

export default function AccountProfile() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const isThai = useAppLanguage() === "TH";
  const load = useCallback(async () => {
    const me = await warehouseApi.me();
    return { me, member: me.mustChangePassword ? null : await warehouseApi.member(me.id) };
  }, []);
  const { data, loading, error, refresh } = useRemote(load);
  const [activeTab, setActiveTab] = useState<"profile" | "employment" | "security">("profile");
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const member = data?.member?.detailLevel === "FULL" ? data.member : null;
  const displayName = member?.name || "—";
  const initials = displayName !== "—" ? displayName.trim().split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() : "U";
  const accessLabel = data?.me.role || "—";
  const branchLabel = data?.me.branchIds.length ? data.me.branchIds.join(", ") : isThai ? "ทุกสาขา" : "All Facilities";
  const employeeCode = member?.profile.employeeCode || "—";

  return (
    <div
      className={`h-screen w-full flex flex-col overflow-hidden transition-colors duration-300 ${
        isLight ? "bg-[#FFFFFF] text-[#222222]" : "bg-[#2C2C2C] text-[#FFFFFF] selection:bg-white/20"
      }`}
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      <div className="shrink-0 w-full z-40">
        <HeaderNavbar
          showLogo
          showAccount
          title={isThai ? "ข้อมูลบัญชีและประวัติพนักงาน" : "Employee Profile & Records"}
          subtitle={isThai ? "จัดการและตรวจสอบข้อมูลประวัติส่วนบุคคล สังกัด และเอกสารสัญญาจ้าง" : "Manage personal details, organization, and employment records"}
        />
        <MobileNavbar />
      </div>

      <div className="flex-1 w-full overflow-y-auto min-h-0">
        <main className="w-full max-w-[1200px] mx-auto p-4 sm:p-8 pb-[96px] md:pb-8 flex flex-col items-start gap-6">
          {loading && !data ? <AccountPageSkeleton isLight={isLight} /> : <>
          <div className={`w-full h-[42px] border-b flex flex-row items-start gap-2 select-none overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${isLight ? "border-[#E4E4E7]" : "border-[#444444]"}`}>
            <AccountTabButton active={activeTab === "profile"} isLight={isLight} onClick={() => setActiveTab("profile")}>
              {isThai ? "ข้อมูลประวัติส่วนตัว" : "Personal Profile"}
            </AccountTabButton>
            <AccountTabButton active={activeTab === "employment"} isLight={isLight} onClick={() => setActiveTab("employment")}>
              {isThai ? "ข้อมูลเกี่ยวกับบริษัทและสัญญา" : "Company & Employment"}
            </AccountTabButton>
            <AccountTabButton active={activeTab === "security"} isLight={isLight} onClick={() => setActiveTab("security")}>
              {isThai ? "เปลี่ยนอีเมลและรหัสผ่าน" : "Change Email / Password"}
            </AccountTabButton>
          </div>

          {error && <Notice tone="error">{error}</Notice>}

          <div className="w-full flex flex-col lg:flex-row items-start gap-6 animate-in fade-in duration-200">
            <aside className="w-full lg:w-[360px] flex flex-col gap-4 shrink-0">
              <section className={`w-full lg:w-[360px] p-8 flex flex-col items-center gap-6 rounded-[12px] border transition-colors shrink-0 ${isLight ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-sm" : "bg-[#383838] border-[#444444] shadow-lg"}`}>
                <div className="relative group">
                  <div className={`w-[110px] h-[110px] rounded-full border overflow-hidden flex items-center justify-center select-none shadow-sm transition-all ${isLight ? "bg-[#F5F5F5] border-[#E5E5E5]" : "bg-[#282828] border-[#444444]"}`}>
                    {member?.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.image} alt={displayName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className={`font-bold text-[48px] leading-[60px] ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`} style={{ fontFamily: "var(--font-outfit), sans-serif" }}>
                        {initials}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowAvatarModal(true)}
                    title={isThai ? "เปลี่ยนรูปโปรไฟล์" : "Change Profile Picture"}
                    className={`absolute bottom-0 right-0 w-8 h-8 rounded-full border shadow-md flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 cursor-pointer ${isLight ? "bg-[#222222] hover:bg-black text-[#FFFFFF] border-white" : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#222222] border-[#282828]"}`}
                  >
                    <Pencil size={14} />
                  </button>
                </div>

                <div className="w-full flex flex-col items-center gap-1.5">
                  <h2 className={`font-bold text-[20px] leading-[25px] text-center ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`} style={{ fontFamily: "var(--font-outfit), sans-serif" }}>
                    {displayName}
                  </h2>
                  <span className={`text-[13px] font-medium leading-tight ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                    {member?.profile.username ? `@${member.profile.username}` : "—"}
                  </span>
                  <div className={`mt-1.5 px-3 py-1 rounded-[8px] border text-xs font-mono font-semibold flex items-center gap-1.5 select-text ${isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#FFFFFF]"}`}>
                    <span className={`text-[10.5px] font-sans font-normal ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                      {isThai ? "รหัสพนักงาน:" : "Staff ID:"}
                    </span>
                    <span>{employeeCode}</span>
                  </div>
                  <div className="flex flex-row items-center px-2 py-0.5 gap-1.5 text-xs opacity-75">
                    <span className={`text-[11px] ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                      {isThai ? "แผนก:" : "Dept:"} {member?.profile.department || "—"}
                    </span>
                  </div>
                </div>
              </section>

              {data && (
                <section className={`w-full p-5 rounded-[12px] border flex flex-col gap-3.5 transition-all duration-300 ${isLight ? "bg-white border-[#E4E4E7] text-[#222222] shadow-sm" : "bg-[#383838] border-[#444444] text-[#FFFFFF] shadow-lg"}`}>
                  <div className="flex items-center gap-2">
                    <Building2 size={17} />
                    <h2 className="font-outfit text-[15px] font-bold">{isThai ? "ขอบเขตการเข้าถึง" : "Access Scope"}</h2>
                  </div>
                  <div className={`space-y-2 font-geist text-sm ${isLight ? "text-[#666666]" : "text-[#E4E4E7]"}`}>
                    <p><strong className={isLight ? "text-[#222222]" : "text-white"}>{isThai ? "สิทธิ์:" : "Role:"}</strong> {accessLabel}</p>
                    <p><strong className={isLight ? "text-[#222222]" : "text-white"}>{isThai ? "สาขา:" : "Facilities:"}</strong> {branchLabel}</p>
                  </div>
                  {data.me.mustChangePassword && <Notice tone="error">{isThai ? "ต้องเปลี่ยนรหัสผ่านเริ่มต้นก่อนใช้งานระบบ" : "Initial password change is required before using the system"}</Notice>}
                </section>
              )}
            </aside>

            <section className="min-w-0 flex-1">
              {activeTab === "profile" && (
                <div className="animate-in fade-in duration-200">
                  {member ? (
                    <OwnProfile member={member} onSaved={refresh} isLight={isLight} isThai={isThai} />
                  ) : !loading ? (
                    <div className={`${panel} text-sm`}>{isThai ? "ไม่พบข้อมูลโปรไฟล์ที่แก้ไขได้" : "No editable profile data found."}</div>
                  ) : null}
                </div>
              )}

              {activeTab === "employment" && (
                <EmploymentProfile
                  isLight={isLight}
                  isThai={isThai}
                  role={accessLabel}
                  branchLabel={branchLabel}
                  employeeCode={employeeCode}
                  startedOn={member?.profile.startedOn || "—"}
                />
              )}

              {activeTab === "security" && (
                <SecuritySettings email={member?.email || "—"} isLight={isLight} isThai={isThai} onChanged={refresh} />
              )}
            </section>
          </div>
          </>}
        </main>
      </div>
      {showAvatarModal && member && (
        <AvatarCropModal
          isOpen={showAvatarModal}
          onClose={() => setShowAvatarModal(false)}
          userId={String(member.id)}
          onSuccess={async (publicUrl) => {
            try {
              await warehouseApi.updateMember(member.id, { image: publicUrl });
              await refresh();
            } catch (e) {
              console.error("Failed to update avatar:", e);
            }
          }}
          isLight={isLight}
          isThai={isThai}
        />
      )}
    </div>
  );
}

function AccountPageSkeleton({ isLight }: { isLight: boolean }) {
  const card = isLight ? "bg-white border-[#E4E4E7] shadow-sm" : "bg-[#383838] border-[#444444] shadow-lg";
  return <div className="w-full flex flex-col gap-6" aria-label="Loading account" aria-busy="true">
    <div className={`w-full h-[42px] border-b flex items-center gap-8 px-4 ${isLight ? "border-[#E4E4E7]" : "border-[#444444]"}`}>
      <SkeletonBox className="h-3.5 w-32 rounded-[4px]" />
      <SkeletonBox className="h-3.5 w-48 rounded-[4px]" />
      <SkeletonBox className="h-3.5 w-40 rounded-[4px]" />
    </div>
    <div className="w-full flex flex-col lg:flex-row items-start gap-6">
      <aside className="w-full lg:w-[360px] flex flex-col gap-4 shrink-0">
        <div className={`w-full p-8 min-h-[296px] flex flex-col items-center gap-5 rounded-[12px] border ${card}`}>
          <SkeletonBox className="w-[110px] h-[110px] rounded-full" />
          <div className="w-full flex flex-col items-center gap-2">
            <SkeletonBox className="h-5 w-40 rounded-[5px]" />
            <SkeletonBox className="h-3 w-28 rounded-[4px]" />
            <SkeletonBox className="h-7 w-32 rounded-[8px] mt-1" />
            <SkeletonBox className="h-3 w-44 rounded-[4px]" />
          </div>
        </div>
        <div className={`w-full p-5 h-[142px] rounded-[12px] border flex flex-col gap-4 ${card}`}>
          <SkeletonBox className="h-4 w-36 rounded-[4px]" />
          <SkeletonBox className="h-3.5 w-48 rounded-[4px]" />
          <SkeletonBox className="h-3.5 w-56 rounded-[4px]" />
        </div>
      </aside>
      <section className={`min-w-0 flex-1 w-full p-6 sm:p-8 rounded-[12px] border flex flex-col gap-5 ${card}`}>
        <div className="w-full pb-3 border-b border-[#444444]/30 flex items-center justify-between"><SkeletonBox className="h-5 w-56 rounded-[5px]" /><SkeletonBox className="h-8 w-32 rounded-[8px]" /></div>
        {[3, 4, 2].map((columns, group) => <div key={group} className={`w-full flex flex-col gap-3 ${group ? "pt-3 border-t border-[#444444]/20" : ""}`}>
          <SkeletonBox className="h-3 w-40 rounded-[4px]" />
          <div className={`grid grid-cols-1 ${columns === 4 ? "sm:grid-cols-4" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2"} gap-3`}>
            {Array.from({ length: columns }).map((_, index) => <div key={index} className="flex flex-col gap-1.5"><SkeletonBox className="h-2.5 w-24 rounded-[3px]" /><SkeletonBox className="h-[38px] w-full rounded-[8px]" /></div>)}
          </div>
        </div>)}
      </section>
    </div>
  </div>;
}

function AccountTabButton({ active, isLight, onClick, children }: {
  active: boolean;
  isLight: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative px-6 py-3 h-[42px] text-[14px] leading-[18px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
        active ? isLight ? "text-[#222222]" : "text-[#FFFFFF]" : isLight ? "text-[#666666] hover:text-[#222222]" : "text-[#E4E4E7] hover:text-[#FFFFFF]"
      }`}
    >
      <span>{children}</span>
      {active && <motion.div layoutId="activeAccountTabUnderline" className={`absolute bottom-0 left-0 right-0 h-[2px] ${isLight ? "bg-[#222222]" : "bg-white"}`} transition={{ type: "spring", stiffness: 450, damping: 35 }} />}
    </button>
  );
}

function SecuritySettings({ email, isLight, isThai, onChanged }: {
  email: string;
  isLight: boolean;
  isThai: boolean;
  onChanged: () => Promise<void>;
}) {
  const { notify } = useNotification();
  const [newEmail, setNewEmail] = useState("");
  const [confirmNewEmail, setConfirmNewEmail] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [visible, setVisible] = useState<Record<string, boolean>>({});
  const strength = useMemo(() => {
    if (!newPassword) return 0;
    return [newPassword.length >= 8, /[A-Z]/.test(newPassword), /[a-z]/.test(newPassword), /\d/.test(newPassword)].filter(Boolean).length;
  }, [newPassword]);

  const submitEmail = async (event: FormEvent) => {
    event.preventDefault();
    setEmailError(null);
    const trimmedConfirm = confirmNewEmail.trim();
    if (newEmail.trim().toLowerCase() !== trimmedConfirm.toLowerCase()) {
      setEmailError(isThai ? "อีเมลใหม่ทั้งสองช่องไม่ตรงกัน" : "The email addresses do not match.");
      return;
    }
    if (newEmail.trim().toLowerCase() === email.toLowerCase()) {
      setEmailError(isThai ? "อีเมลใหม่ต้องไม่ซ้ำกับอีเมลปัจจุบัน" : "The new email must differ from the current email.");
      return;
    }
    setEmailBusy(true);
    try {
      await warehouseApi.changeEmail(newEmail.trim(), trimmedConfirm);
      setNewEmail(""); setConfirmNewEmail("");
      await onChanged();
      notify.success(isThai ? "เปลี่ยนอีเมลสำเร็จ" : "Email updated", { message: isThai ? "อีเมลสำหรับเข้าสู่ระบบได้รับการอัปเดตแล้ว" : "Your login email has been updated." });
    } catch (cause) { setEmailError(message(cause)); }
    finally { setEmailBusy(false); }
  };

  const submitPassword = async (event: FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmNewPassword) {
      setPasswordError(isThai ? "รหัสผ่านใหม่ทั้งสองช่องไม่ตรงกัน" : "The new passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError(isThai ? "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร" : "Use at least eight characters.");
      return;
    }
    setPasswordBusy(true);
    try {
      await warehouseApi.changePassword(currentPassword, newPassword, confirmNewPassword);
      setCurrentPassword(""); setNewPassword(""); setConfirmNewPassword("");
      await onChanged();
      notify.success(isThai ? "เปลี่ยนรหัสผ่านสำเร็จ" : "Password changed", { message: isThai ? "รหัสผ่านใหม่ได้รับการบันทึกแล้ว" : "Your new password has been saved." });
    } catch (cause) { setPasswordError(message(cause)); }
    finally { setPasswordBusy(false); }
  };

  const fieldClass = `w-full h-[38px] rounded-[8px] border px-2.5 text-xs outline-none transition-all ${isLight ? "bg-white border-[#E5E5E5] text-[#222222] focus:border-[#222222] focus:ring-1 focus:ring-[#222222]" : "bg-[#282828] border-[#444444] text-white focus:border-white focus:ring-1 focus:ring-white"}`;
  const actionClass = `h-[37px] px-5 rounded-[8px] inline-flex items-center justify-center gap-2 text-xs font-semibold shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${isLight ? "bg-[#222222] text-white hover:bg-black" : "bg-white text-[#222222] hover:bg-[#F4F4F5]"}`;
  const muted = isLight ? "text-[#666666]" : "text-[#A1A1AA]";
  const label = isLight ? "text-[#222222]" : "text-[#E4E4E7]";
  const toggle = (key: string) => setVisible((current) => ({ ...current, [key]: !current[key] }));

  return <div className={`animate-in fade-in w-full p-6 sm:p-8 flex flex-col items-start gap-6 rounded-[12px] border transition-colors ${isLight ? "bg-white border-[#E4E4E7] shadow-sm" : "bg-[#383838] border-[#444444] shadow-lg"}`}>
    <div className={`w-full border-b pb-3.5 ${isLight ? "border-[#E4E4E7]" : "border-[#555555]"}`}>
      <h3 className={`font-bold text-[16px] leading-5 ${isLight ? "text-[#222222]" : "text-white"}`} style={{ fontFamily: "var(--font-outfit), sans-serif" }}>{isThai ? "เปลี่ยนอีเมลและรหัสผ่าน" : "Change Email & Password"}</h3>
    </div>

    <section className="w-full flex flex-col gap-4">
      <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#F4F4F5]"}`}>{isThai ? "เปลี่ยนอีเมลสำหรับเข้าสู่ระบบ" : "Change Login Email"}</span>
      <div className="flex flex-col gap-1">
        <label className={`font-semibold text-[11.5px] ${muted}`}>{isThai ? "อีเมลปัจจุบันที่ใช้งานอยู่" : "Current Email Address"}</label>
        <div className={`w-full h-[40px] px-2.5 rounded-[8px] border flex items-center justify-between gap-3 text-[13px] font-mono ${isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#383838]" : "bg-[#282828] border-[#444444] text-[#E4E4E7]"}`}><span className="truncate">{email}</span><span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded border border-[#2EC4B6]/30 bg-[#2EC4B6]/10 text-[#2EC4B6] text-[10.5px] font-sans font-semibold"><CheckCircle2 size={11} />{isThai ? "ใช้งานอยู่" : "Active"}</span></div>
      </div>
      <form onSubmit={(event) => void submitEmail(event)} className="w-full flex flex-col gap-3">
        {emailError && <SecurityNotice text={emailError} />}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SecurityField label={isThai ? "อีเมลใหม่" : "New Email"} className={label} required>
            <input type="email" name="new-login-email" required autoComplete="new-email" placeholder={isThai ? "ระบุอีเมลใหม่ เช่น user@company.com" : "e.g. user@company.com"} className={fieldClass} value={newEmail} onChange={(event) => setNewEmail(event.target.value)} />
          </SecurityField>
          <SecurityField label={isThai ? "ยืนยันอีเมลใหม่" : "Confirm New Email"} className={label}>
            <input type="email" name="confirm-new-login-email" required autoComplete="new-email" placeholder={isThai ? "พิมพ์อีเมลใหม่อีกครั้ง" : "Re-enter new email"} className={fieldClass} value={confirmNewEmail} onChange={(event) => setConfirmNewEmail(event.target.value)} />
          </SecurityField>
        </div>
        <p className={`text-[11.5px] leading-relaxed ${muted}`}>{isThai ? "หมายเหตุ: เมื่อกดบันทึก ระบบจะส่งลิงก์ยืนยันไปยังอีเมลใหม่ กรุณาคลิกลิงก์ในอีเมลเพื่อยืนยันการเปลี่ยนแปลง" : "Note: A confirmation link will be sent to the new email address. Verify it to complete the change."}</p>
        <div className="flex justify-end"><button disabled={emailBusy} className={actionClass}>{emailBusy && <Loader2 size={13} className="animate-spin" />}{emailBusy ? isThai ? "กำลังบันทึก..." : "Saving..." : isThai ? "บันทึกอีเมลใหม่" : "Update Email"}</button></div>
      </form>
    </section>

    <section className="w-full flex flex-col gap-4 pt-5">
      <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#F4F4F5]"}`}>{isThai ? "เปลี่ยนรหัสผ่าน" : "Change Password"}</span>
      <form onSubmit={(event) => void submitPassword(event)} className="w-full flex flex-col gap-3">
        {passwordError && <SecurityNotice text={passwordError} />}
        <PasswordField label={isThai ? "รหัสผ่านปัจจุบัน" : "Current Password"} placeholder={isThai ? "พิมพ์รหัสผ่านปัจจุบัน" : "Enter your current password"} value={currentPassword} setValue={setCurrentPassword} shown={Boolean(visible.current)} toggle={() => toggle("current")} fieldClass={fieldClass} labelClass={label} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <PasswordField label={isThai ? "รหัสผ่านใหม่ อย่างน้อย 8 ตัวอักษร" : "New Password (at least 8 characters)"} placeholder={isThai ? "กำหนดรหัสผ่านใหม่อย่างน้อย 8 ตัวอักษร" : "Enter a new password with at least 8 characters"} value={newPassword} setValue={setNewPassword} shown={Boolean(visible.new)} toggle={() => toggle("new")} fieldClass={fieldClass} labelClass={label} />
          <PasswordField label={isThai ? "ยืนยันรหัสผ่านใหม่" : "Confirm New Password"} placeholder={isThai ? "พิมพ์รหัสผ่านใหม่อีกครั้ง" : "Re-enter your new password"} value={confirmNewPassword} setValue={setConfirmNewPassword} shown={Boolean(visible.confirm)} toggle={() => toggle("confirm")} fieldClass={fieldClass} labelClass={label} />
        </div>
        <div className="flex flex-col gap-1.5"><div className={`flex justify-between text-[11.5px] ${muted}`}><span>{isThai ? "ระดับความปลอดภัยของรหัสผ่าน" : "Password Strength"}</span><span>{newPassword ? strength === 4 ? isThai ? "ปลอดภัยมาก" : "Strong" : strength >= 2 ? isThai ? "ปานกลาง" : "Fair" : isThai ? "ควรเพิ่มความปลอดภัย" : "Weak" : isThai ? "อย่างน้อย 8 ตัวอักษร" : "Minimum 8 characters"}</span></div><div className="flex gap-1.5 h-[3.5px]">{[1,2,3,4].map((level) => <span key={level} className={`flex-1 rounded-full ${strength >= level ? strength <= 1 ? "bg-[#E74C3C]" : strength === 2 ? "bg-[#FF9F1C]" : "bg-[#2EC4B6]" : isLight ? "bg-slate-200" : "bg-[#444444]"}`} />)}</div></div>
        <div className="flex justify-end"><button disabled={passwordBusy} className={actionClass}>{passwordBusy && <Loader2 size={13} className="animate-spin" />}{passwordBusy ? isThai ? "กำลังบันทึก..." : "Saving..." : isThai ? "บันทึกรหัสผ่านใหม่" : "Update Password"}</button></div>
      </form>
    </section>
  </div>;
}

function SecurityField({ label, className, required = true, children }: { label: string; className: string; required?: boolean; children: React.ReactNode }) {
  return <label className="flex flex-col gap-1"><span className={`text-xs font-semibold ${className}`}>{label}{required ? " *" : ""}</span>{children}</label>;
}

function PasswordField({ label, placeholder, value, setValue, shown, toggle, fieldClass, labelClass }: { label: string; placeholder: string; value: string; setValue: (value: string) => void; shown: boolean; toggle: () => void; fieldClass: string; labelClass: string }) {
  return <SecurityField label={label} className={labelClass}><span className="relative flex items-center"><input type={shown ? "text" : "password"} required minLength={label.includes("ใหม่") || label.includes("New") ? 8 : undefined} autoComplete={label.includes("ปัจจุบัน") || label.includes("Current") ? "current-password" : "new-password"} placeholder={placeholder} className={`${fieldClass} pr-10 placeholder:text-[#A1A1AA]`} value={value} onChange={(event) => setValue(event.target.value)} /><button type="button" title={shown ? "Hide password" : "Show password"} onClick={toggle} className={`absolute right-2.5 p-1 rounded transition-colors ${labelClass}`} >{shown ? <EyeOff size={14} /> : <Eye size={14} />}</button></span></SecurityField>;
}

function SecurityNotice({ text }: { text: string }) {
  return <div role="alert" className="p-3 rounded-[8px] border text-xs flex items-center gap-2 bg-[#E74C3C]/10 border-[#E74C3C]/30 text-[#E74C3C]"><AlertCircle size={14} /><span>{text}</span></div>;
}

function OwnProfile({ member, onSaved, isLight, isThai }: {
  member: MemberFull;
  onSaved: () => Promise<void>;
  isLight: boolean;
  isThai: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const profile = profileForm(member.profile);
  return (
    <div className={`flex-1 w-full p-6 sm:p-8 flex flex-col items-start gap-5 rounded-[12px] border transition-colors ${isLight ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-sm" : "bg-[#383838] border-[#444444] shadow-lg"}`}>
      <div className={`w-full flex items-center justify-between gap-3 border-b pb-3 ${isLight ? "border-[#E4E4E7]" : "border-[#555555]"}`}>
        <h3 className={`font-bold text-[16px] leading-[20px] ${isLight ? "text-[#222222]" : "text-[#F4F4F5]"}`} style={{ fontFamily: "var(--font-outfit), sans-serif" }}>
          {isThai ? "ข้อมูลประวัติส่วนตัวและการติดต่อ" : "Personal Profile & Contact Details"}
        </h3>
      </div>

      <AccountFieldGroup title={isThai ? "ข้อมูลชื่อและบัญชีผู้ใช้" : "Name & Account Details"} isLight={isLight}>
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ReadOnlyAccountField label={isThai ? "ชื่อจริง ภาษาไทย" : "First Name (Thai)"} value={member.profile.firstNameTh || "—"} isLight={isLight} />
          <ReadOnlyAccountField label={isThai ? "นามสกุล ภาษาไทย" : "Last Name (Thai)"} value={member.profile.lastNameTh || "—"} isLight={isLight} />
          <ReadOnlyAccountField label={isThai ? "ชื่อเล่น ภาษาไทย" : "Nickname (Thai)"} value={member.profile.nicknameTh || "—"} isLight={isLight} />
        </div>
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ReadOnlyAccountField label={isThai ? "ชื่อจริง ภาษาอังกฤษ" : "First Name (English)"} value={member.profile.firstNameEn || "—"} isLight={isLight} />
          <ReadOnlyAccountField label={isThai ? "นามสกุล ภาษาอังกฤษ" : "Last Name (English)"} value={member.profile.lastNameEn || "—"} isLight={isLight} />
          <ReadOnlyAccountField label={isThai ? "ชื่อเล่น ภาษาอังกฤษ" : "Nickname (English)"} value={member.profile.nicknameEn || "—"} isLight={isLight} />
        </div>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <EditableAccountField label={isThai ? "ชื่อบัญชี" : "Account Name"} value={member.name} onChange={() => undefined} isLight={isLight} required disabled />
          <ReadOnlyAccountField label={isThai ? "อีเมลบัญชี" : "Account Email"} value={member.email} isLight={isLight} mono />
        </div>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ReadOnlyAccountField label={isThai ? "คำนำหน้า" : "Prefix"} value={member.profile.prefix || "—"} isLight={isLight} />
          <ReadOnlyAccountField label={isThai ? "ชื่อผู้ใช้" : "Username"} value={member.profile.username || "—"} isLight={isLight} mono />
        </div>
      </AccountFieldGroup>

      <AccountFieldGroup title={isThai ? "ข้อมูลส่วนบุคคลและเอกสารประจำตัว" : "Personal Identity & Details"} isLight={isLight}>
        <div className="w-full grid grid-cols-1 sm:grid-cols-4 gap-3">
          <ReadOnlyAccountField label={isThai ? "เลขบัตรประชาชน" : "Citizen ID"} value={member.profile.citizenId || "—"} isLight={isLight} mono className="sm:col-span-2" />
          <ReadOnlyAccountField label={isThai ? "วันเกิด" : "Birth Date"} value={member.profile.birthDate || "—"} isLight={isLight} />
          <ReadOnlyAccountField label={isThai ? "เพศ" : "Gender"} value={member.profile.gender || "—"} isLight={isLight} />
        </div>
        <div className="w-full grid grid-cols-1 sm:grid-cols-4 gap-3">
          <ReadOnlyAccountField label={isThai ? "กรุ๊ปเลือด" : "Blood Type"} value={member.profile.bloodType || "—"} isLight={isLight} />
          <ReadOnlyAccountField label={isThai ? "สถานภาพสมรส" : "Marital Status"} value={member.profile.maritalStatus || "—"} isLight={isLight} />
          <ReadOnlyAccountField label={isThai ? "สัญชาติ" : "Nationality"} value={member.profile.nationality || "—"} isLight={isLight} />
          <ReadOnlyAccountField label={isThai ? "ศาสนา" : "Religion"} value={member.profile.religion || "—"} isLight={isLight} />
        </div>
      </AccountFieldGroup>

      <AccountFieldGroup title={isThai ? "ข้อมูลการศึกษา" : "Educational Background"} isLight={isLight}>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ReadOnlyAccountField label={isThai ? "วุฒิการศึกษา" : "Education Level"} value={member.profile.educationLevel || "—"} isLight={isLight} />
          <ReadOnlyAccountField label={isThai ? "สาขาวิชา" : "Major Subject"} value={member.profile.majorSubject || "—"} isLight={isLight} />
          <ReadOnlyAccountField label={isThai ? "สถาบันการศึกษา ภาษาไทย" : "Institution (Thai)"} value={member.profile.universityNameTh || "—"} isLight={isLight} />
          <ReadOnlyAccountField label={isThai ? "สถาบันการศึกษา ภาษาอังกฤษ" : "Institution (English)"} value={member.profile.universityNameEn || "—"} isLight={isLight} />
        </div>
      </AccountFieldGroup>

      <AccountFieldGroup title={isThai ? "ข้อมูลการติดต่อและที่อยู่อาศัย" : "Contact & Addresses"} isLight={isLight}>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ReadOnlyAccountField label={isThai ? "อีเมลติดต่อ" : "Contact Email"} value={member.profile.contactEmail || member.email} isLight={isLight} mono />
          <EditableAccountField label={isThai ? "เบอร์โทรศัพท์" : "Phone Number"} value={profile.phone} onChange={() => undefined} isLight={isLight} disabled />
        </div>
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          <EditableAccountField label={isThai ? "ผู้ติดต่อฉุกเฉิน ภาษาไทย" : "Emergency Contact (Thai)"} value={profile.emergencyContactName} onChange={() => undefined} isLight={isLight} disabled />
          <ReadOnlyAccountField label={isThai ? "ผู้ติดต่อฉุกเฉิน ภาษาอังกฤษ" : "Emergency Contact (English)"} value={member.profile.emergencyContactNameEn || "—"} isLight={isLight} />
          <EditableAccountField label={isThai ? "เบอร์ผู้ติดต่อฉุกเฉิน" : "Emergency Phone"} value={profile.emergencyContactPhone} onChange={() => undefined} isLight={isLight} disabled />
        </div>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ReadOnlyAccountField label={isThai ? "ที่อยู่ปัจจุบัน" : "Current Resident Address"} value={profile.address || "—"} isLight={isLight} multiline />
          <ReadOnlyAccountField label={isThai ? "ที่อยู่ตามทะเบียนบ้าน" : "Registered Legal Address"} value={member.profile.registeredAddress || "—"} isLight={isLight} multiline />
        </div>
      </AccountFieldGroup>

      <div className="w-full pt-3 flex flex-wrap items-center justify-end gap-2.5">
        <button
            type="button"
            onClick={() => setEditing(true)}
            className={`h-[37px] px-4 rounded-[8px] font-semibold text-[13px] leading-[17px] transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-1.5 shadow-sm ${
              isLight
                ? "bg-[#222222] hover:bg-black text-[#FFFFFF]"
                : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#222222]"
            }`}
          >
            <Pencil size={14} />
            <span>{isThai ? "แก้ไขข้อมูลส่วนตัว" : "Edit Profile"}</span>
          </button>
      </div>

      {editing && <SecondaryRegModal isOpen onClose={() => setEditing(false)} member={member} isLight={isLight} isThai={isThai} onSuccess={onSaved} />}
    </div>
  );
}

function EmploymentProfile({ isLight, isThai, role, branchLabel, employeeCode, startedOn }: {
  isLight: boolean;
  isThai: boolean;
  role: string;
  branchLabel: string;
  employeeCode: string;
  startedOn: string;
}) {
  return (
    <div className={`flex-1 w-full p-6 sm:p-8 flex flex-col items-start gap-5 rounded-[12px] border transition-colors ${isLight ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-sm" : "bg-[#383838] border-[#444444] shadow-lg"}`}>
      <AccountSectionHeader isLight={isLight}>
        {isThai ? "ข้อมูลเกี่ยวกับบริษัทและสัญญาการจ้างงาน" : "Company & Employment Information"}
      </AccountSectionHeader>

      <AccountFieldGroup title={isThai ? "ข้อมูลสังกัดและตำแหน่งงานในองค์กร" : "Organization & Position Assignment"} isLight={isLight}>
        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ReadOnlyAccountField label={isThai ? "แผนก / ฝ่ายสังกัด" : "Department"} value={isThai ? "ฝ่ายปฏิบัติการทั่วไป" : "General Operations"} isLight={isLight} />
          <ReadOnlyAccountField label={isThai ? "สาขาประจำการ" : "Branch Location"} value={branchLabel} isLight={isLight} />
        </div>
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ReadOnlyAccountField label={isThai ? "สถานะการจ้างงาน" : "Employment Status"} value={isThai ? "พนักงานประจำ" : "Permanent Staff"} isLight={isLight} success />
          <ReadOnlyAccountField label={isThai ? "วันที่เริ่มงาน" : "Start Date"} value={startedOn || "—"} isLight={isLight} />
          <ReadOnlyAccountField label={isThai ? "สิทธิ์ระบบ" : "System Role"} value={role || "—"} isLight={isLight} />
        </div>
      </AccountFieldGroup>

      <AccountFieldGroup title={isThai ? "ข้อมูลอ้างอิงพนักงาน" : "Employee References"} isLight={isLight}>
        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          <ReadOnlyAccountField label={isThai ? "รหัสพนักงาน" : "Staff ID"} value={employeeCode || "—"} isLight={isLight} mono />
          <ReadOnlyAccountField label={isThai ? "โครงสร้างเงินเดือน / ค่าตอบแทน" : "Compensation"} value="—" isLight={isLight} />
          <ReadOnlyAccountField label={isThai ? "ประเภทสัญญา" : "Contract Type"} value={isThai ? "สัญญาจ้างมาตรฐาน" : "Standard Employment"} isLight={isLight} />
        </div>
      </AccountFieldGroup>
    </div>
  );
}

function AccountSectionHeader({ children, isLight }: { children: React.ReactNode; isLight: boolean }) {
  return (
    <div className={`w-full flex items-center justify-between border-b pb-3 ${isLight ? "border-[#E4E4E7]" : "border-[#555555]"}`}>
      <h3 className={`font-bold text-[16px] leading-[20px] ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`} style={{ fontFamily: "var(--font-outfit), sans-serif" }}>
        {children}
      </h3>
    </div>
  );
}

function AccountFieldGroup({ title, isLight, children }: {
  title: string;
  isLight: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full flex flex-col gap-3">
      <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#F4F4F5]"}`}>
        {title}
      </span>
      {children}
    </div>
  );
}

function ReadOnlyAccountField({ label, value, isLight, mono, multiline, success, className = "" }: {
  label: string;
  value: string;
  isLight: boolean;
  mono?: boolean;
  multiline?: boolean;
  success?: boolean;
  className?: string;
}) {
  return (
    <div className={`min-w-0 flex flex-col items-start gap-1 ${className}`}>
      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>{label}</label>
      <div
        className={`w-full p-2.5 ${multiline ? "min-h-[56px] leading-relaxed whitespace-pre-wrap" : "h-[38px]"} flex items-center rounded-[8px] border text-[12.5px] select-text ${
          mono ? "font-mono" : ""
        } ${success ? "font-semibold text-[#2EC4B6]" : isLight ? "text-[#383838]" : "text-[#E4E4E7]"} ${
          isLight ? "bg-[#F5F5F5] border-[#E5E5E5]" : "bg-[#282828] border-[#444444]"
        }`}
      >
        <span title={value || "—"} className={multiline ? "break-words min-w-0" : "truncate"}>{value || "—"}</span>
      </div>
    </div>
  );
}

function EditableAccountField({ label, value, onChange, isLight, required, multiline, disabled }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isLight: boolean;
  required?: boolean;
  multiline?: boolean;
  disabled?: boolean;
}) {
  const className = `w-full p-2.5 ${multiline ? "min-h-[56px] resize-y leading-relaxed" : "h-[38px]"} rounded-[8px] border text-[12.5px] outline-none transition-all ${
    isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#383838] focus:border-[#222222] focus:ring-1 focus:ring-[#222222]" : "bg-[#282828] border-[#444444] text-[#E4E4E7] focus:border-white focus:ring-1 focus:ring-white"
  }`;
  return (
    <div className="flex flex-col items-start gap-1">
      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>{label}</label>
      {multiline ? (
        <textarea className={`${className} disabled:cursor-default disabled:opacity-100`} value={value} required={required} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className={`${className} disabled:cursor-default disabled:opacity-100`} value={value} required={required} disabled={disabled} onChange={(event) => onChange(event.target.value)} />
      )}
    </div>
  );
}
