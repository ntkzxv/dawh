"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Building2, ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import { HeaderNavbar, MobileNavbar } from "@/components/navbar";
import { warehouseApi, type MemberFull, type MemberProfile, type MemberUpdate } from "@/lib/api/warehouse";
import { MemberProfileFields, profileForm, type ProfileForm } from "./MemberProfileFields";
import { button, Field, input, message, Notice, panel, useRemote } from "./Ui";

export default function Settings() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const isThai = useAppLanguage() === "TH";
  const load = useCallback(async () => {
    const me = await warehouseApi.me();
    return { me, member: me.mustChangePassword ? null : await warehouseApi.member(me.id) };
  }, []);
  const { data, loading, error, refresh } = useRemote(load);
  const [activeTab, setActiveTab] = useState<"profile" | "security">("profile");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setFailure(null); setResult(null); try { await warehouseApi.changeInitialPassword(currentPassword, newPassword); setCurrentPassword(""); setNewPassword(""); setResult("เปลี่ยนรหัสผ่านแล้ว"); await refresh(); } catch (cause) { setFailure(message(cause)); } finally { setBusy(false); } };

  const member = data?.member?.detailLevel === "FULL" ? data.member : null;
  const displayName = member?.name || "—";
  const displayEmail = member?.email || "—";
  const initials = displayName !== "—" ? displayName.charAt(0).toUpperCase() : "U";
  const accessLabel = data?.me.role || "—";
  const branchLabel = data?.me.branchIds.length ? data.me.branchIds.join(", ") : isThai ? "ทุกสาขา" : "All Facilities";

  return <main className={`flex h-screen w-full flex-col overflow-hidden transition-colors duration-300 ${
    isLight ? "bg-white text-[#222222]" : "bg-[#2C2C2C] text-white selection:bg-white/20"
  }`}>
    <div className="z-40 w-full shrink-0">
      <HeaderNavbar
        showLogo
        showAccount
        title={isThai ? "ข้อมูลบัญชีและประวัติพนักงาน" : "Employee Profile & Records"}
        subtitle={isThai ? "จัดการและตรวจสอบข้อมูลบัญชี สังกัด และความปลอดภัย" : "Manage account details, organization access, and security"}
      />
      <MobileNavbar />
    </div>

    <div className="min-h-0 w-full flex-1 overflow-y-auto">
      <main className="mx-auto flex w-full max-w-[1200px] flex-col items-start gap-6 p-4 pb-[96px] sm:p-8 md:pb-8">
        <div className={`flex h-[42px] w-full flex-row items-start gap-2 overflow-x-auto border-b select-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          isLight ? "border-[#E4E4E7]" : "border-[#444444]"
        }`}>
          <AccountTabButton active={activeTab === "profile"} isLight={isLight} onClick={() => setActiveTab("profile")}>
            {isThai ? "ข้อมูลประวัติส่วนตัว" : "Personal Profile"}
          </AccountTabButton>
          <AccountTabButton active={activeTab === "security"} isLight={isLight} onClick={() => setActiveTab("security")}>
            {isThai ? "ความปลอดภัยของบัญชี" : "Account Security"}
          </AccountTabButton>
        </div>

        {loading && <p className={isLight ? "text-sm text-slate-600" : "text-sm text-[#E4E4E7]"}>{isThai ? "กำลังโหลด..." : "Loading..."}</p>}
        {error && <Notice tone="error">{error}</Notice>}
        {result && <Notice tone="success">{result}</Notice>}
        {failure && <Notice tone="error">{failure}</Notice>}

        <div className="flex w-full flex-col items-start gap-6 lg:flex-row">
          <aside className="flex w-full shrink-0 flex-col gap-4 lg:w-[360px]">
            <section className={`w-full rounded-2xl border p-5 shadow-sm transition-colors duration-300 ${
              isLight ? "border-[#E4E4E7] bg-white text-[#222222]" : "border-[#444444] bg-[#383838] text-white shadow-lg"
            }`}>
              <div className="flex items-start gap-4">
                <div className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border text-2xl font-bold ${
                  isLight ? "border-slate-200 bg-slate-100 text-slate-900" : "border-[#444444] bg-[#222222] text-white"
                }`}>
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="truncate font-outfit text-xl font-bold leading-7">{displayName}</h1>
                  <p className={`truncate font-geist text-sm ${isLight ? "text-[#64748B]" : "text-[#E4E4E7]"}`}>{displayEmail}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${
                      isLight ? "border-slate-200 bg-slate-50 text-slate-700" : "border-[#444444] bg-[#222222] text-zinc-300"
                    }`}>
                      <ShieldCheck size={12} />
                      {accessLabel}
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {data && <section className={`w-full rounded-2xl border p-5 shadow-sm transition-colors duration-300 ${
              isLight ? "border-[#E4E4E7] bg-white text-[#222222]" : "border-[#444444] bg-[#383838] text-white shadow-lg"
            }`}>
              <div className="flex items-center gap-2">
                <Building2 size={17} />
                <h2 className="font-outfit text-[15px] font-bold">{isThai ? "ขอบเขตการเข้าถึง" : "Access Scope"}</h2>
              </div>
              <div className={`mt-4 space-y-2 font-geist text-sm ${isLight ? "text-[#64748B]" : "text-[#E4E4E7]"}`}>
                <p><strong className={isLight ? "text-[#222222]" : "text-white"}>{isThai ? "สิทธิ์:" : "Role:"}</strong> {accessLabel}</p>
                <p><strong className={isLight ? "text-[#222222]" : "text-white"}>{isThai ? "สาขา:" : "Facilities:"}</strong> {branchLabel}</p>
              </div>
              {data.me.mustChangePassword && <div className="mt-4"><Notice tone="error">{isThai ? "ต้องเปลี่ยนรหัสผ่านเริ่มต้นก่อนใช้งานระบบ" : "Initial password change is required before using the system"}</Notice></div>}
            </section>}
          </aside>

          <section className="min-w-0 flex-1">
            {activeTab === "profile" && (
              <div className="animate-in fade-in duration-200">
                {member ? (
                  <OwnProfile member={member} onSaved={async () => { await refresh(); setResult("บันทึกข้อมูลส่วนตัวแล้ว"); }} onError={setFailure} isLight={isLight} isThai={isThai} />
                ) : !loading ? (
                  <div className={`${panel} text-sm`}>{isThai ? "ไม่พบข้อมูลโปรไฟล์ที่แก้ไขได้" : "No editable profile data found."}</div>
                ) : null}
              </div>
            )}

            {activeTab === "security" && (
              <form className={`animate-in fade-in space-y-5 rounded-2xl border p-5 shadow-sm duration-200 sm:p-6 ${
                isLight ? "border-[#E4E4E7] bg-white text-[#222222]" : "border-[#444444] bg-[#383838] text-white shadow-lg"
              }`} onSubmit={(event) => void submit(event)}>
                <div>
                  <h2 className="font-outfit text-lg font-bold">{isThai ? "เปลี่ยนรหัสผ่านเริ่มต้น" : "Change Initial Password"}</h2>
                  <p className={`mt-1 font-geist text-sm ${isLight ? "text-[#64748B]" : "text-[#E4E4E7]"}`}>
                    {isThai ? "จัดการรหัสผ่านสำหรับการเข้าสู่ระบบองค์กร" : "Manage the password used to access the enterprise system."}
                  </p>
                </div>
                <Field label={isThai ? "รหัสผ่านปัจจุบัน" : "Current Password"}><input className={input} type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></Field>
                <Field label={isThai ? "รหัสผ่านใหม่" : "New Password"}><input className={input} type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></Field>
                <button className={button} disabled={busy}>{busy ? isThai ? "กำลังบันทึก..." : "Saving..." : isThai ? "เปลี่ยนรหัสผ่าน" : "Change Password"}</button>
              </form>
            )}
          </section>
        </div>
      </main>
    </div>
  </main>;
}

function AccountTabButton({ active, isLight, onClick, children }: {
  active: boolean;
  isLight: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return <button
    type="button"
    onClick={onClick}
    className={`relative h-[42px] shrink-0 cursor-pointer whitespace-nowrap px-6 py-3 text-[14px] font-semibold leading-[18px] transition-colors ${
      active
        ? isLight ? "text-[#222222]" : "text-white"
        : isLight ? "text-[#666666] hover:text-[#222222]" : "text-[#E4E4E7] hover:text-white"
    }`}
  >
    <span>{children}</span>
    {active && (
      <motion.div
        layoutId="activeAccountTabUnderline"
        className={`absolute right-0 bottom-0 left-0 h-0.5 ${isLight ? "bg-[#222222]" : "bg-white"}`}
        transition={{ type: "spring", stiffness: 450, damping: 35 }}
      />
    )}
  </button>;
}

function OwnProfile({ member, onSaved, onError, isLight, isThai }: {
  member: MemberFull;
  onSaved: () => Promise<void>;
  onError: (value: string | null) => void;
  isLight: boolean;
  isThai: boolean;
}) {
  const [name, setName] = useState(member.name);
  const [profile, setProfile] = useState<ProfileForm>(profileForm(member.profile));
  const [busy, setBusy] = useState(false);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    onError(null);
    try {
      const update: MemberUpdate = {};
      if (name !== member.name) update.name = name;
      const changedProfile: Partial<MemberProfile> = {};
      for (const field of ["phone", "address", "emergencyContactName", "emergencyContactPhone"] as const) {
        if (profile[field] !== (member.profile[field] ?? "")) changedProfile[field] = profile[field];
      }
      if (Object.keys(changedProfile).length) update.profile = changedProfile;
      if (Object.keys(update).length) await warehouseApi.updateMember(member.id, update);
      await onSaved();
    } catch (cause) { onError(message(cause)); }
    finally { setBusy(false); }
  };
  return <form className={`space-y-5 rounded-2xl border p-5 shadow-sm sm:p-6 ${
    isLight ? "border-[#E4E4E7] bg-white text-[#222222]" : "border-[#444444] bg-[#383838] text-white shadow-lg"
  }`} onSubmit={(event) => void save(event)}>
    <div><h2 className="font-outfit text-lg font-bold">{isThai ? "ข้อมูลส่วนตัว" : "Personal Information"}</h2><p className={`mt-1 font-geist text-sm ${isLight ? "text-[#64748B]" : "text-[#E4E4E7]"}`}>{isThai ? "แก้ไขข้อมูลติดต่อของคุณได้ที่นี่" : "Update your contact information here."}</p></div>
    <Field label={isThai ? "ชื่อ" : "Name"}><input className={input} value={name} maxLength={160} required onChange={(event) => setName(event.target.value)} /></Field>
    <Field label={isThai ? "อีเมลบัญชี" : "Account Email"}><input className={input} value={member.email} disabled /></Field>
    <MemberProfileFields value={profile} onChange={setProfile} employmentEditable={false} />
    <button className={button} disabled={busy}>{busy ? isThai ? "กำลังบันทึก..." : "Saving..." : isThai ? "บันทึกข้อมูลส่วนตัว" : "Save Profile"}</button>
  </form>;
}
