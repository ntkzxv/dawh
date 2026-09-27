"use client";

import { useCallback, useState, type FormEvent } from "react";
import { Building2, Database, Globe2, Save, Settings as SettingsIcon, ShieldCheck } from "lucide-react";
import { HeaderNavbar, MobileNavbar } from "@/components/navbar";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import { warehouseApi } from "@/lib/api/warehouse";
import { message, Notice, useRemote } from "./Ui";

export default function Settings() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const isThai = useAppLanguage() === "TH";
  const load = useCallback(async () => warehouseApi.organization(), []);
  const { data: organization, loading, error, refresh } = useRemote(load);
  const [draft, setDraft] = useState<{ name?: string; phone?: string; address?: string }>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const name = draft.name ?? organization?.name ?? "";
  const phone = draft.phone ?? organization?.phone ?? "";
  const address = draft.address ?? organization?.address ?? "";

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setResult(null);
    setFailure(null);
    try {
      await warehouseApi.saveOrganization({ name, phone, address }, Boolean(organization));
      await refresh();
      setDraft({});
      setResult(isThai ? "บันทึกการตั้งค่าระบบแล้ว" : "System settings saved");
    } catch (cause) {
      setFailure(message(cause));
    } finally {
      setBusy(false);
    }
  };

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
          title={isThai ? "การตั้งค่าระบบ" : "System Settings"}
          subtitle={isThai ? "จัดการข้อมูลองค์กร สิทธิ์ระบบ และค่าพื้นฐานสำหรับการทำงาน" : "Manage organization details, system access, and operational defaults"}
        />
        <MobileNavbar />
      </div>

      <div className="flex-1 w-full overflow-y-auto min-h-0">
        <main className="w-full max-w-[1200px] mx-auto p-4 sm:p-8 pb-[96px] md:pb-8 flex flex-col items-start gap-6">
          <div className={`w-full h-[42px] border-b flex flex-row items-start gap-2 select-none overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${isLight ? "border-[#E4E4E7]" : "border-[#444444]"}`}>
            <div className={`relative px-6 py-3 h-[42px] text-[14px] leading-[18px] font-semibold whitespace-nowrap shrink-0 ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
              <span>{isThai ? "ข้อมูลองค์กร" : "Organization"}</span>
              <div className={`absolute bottom-0 left-0 right-0 h-[2px] ${isLight ? "bg-[#222222]" : "bg-white"}`} />
            </div>
          </div>

          {loading && <p className={isLight ? "text-sm text-[#666666]" : "text-sm text-[#E4E4E7]"}>{isThai ? "กำลังโหลด..." : "Loading..."}</p>}
          {error && <Notice tone="error">{error}</Notice>}
          {result && <Notice tone="success">{result}</Notice>}
          {failure && <Notice tone="error">{failure}</Notice>}

          <div className="w-full flex flex-col lg:flex-row items-start gap-6 animate-in fade-in duration-200">
            <aside className="w-full lg:w-[360px] flex flex-col gap-4 shrink-0">
              <SystemSummaryCard
                isLight={isLight}
                icon={<SettingsIcon size={22} />}
                title={isThai ? "ศูนย์ควบคุมระบบ" : "System Control"}
                description={isThai ? "พื้นที่นี้แยกออกจากโปรไฟล์ผู้ใช้ ใช้สำหรับตั้งค่าระดับองค์กรเท่านั้น" : "This area is separate from user profile settings and controls organization-level configuration only."}
              />
              <SystemSummaryCard
                isLight={isLight}
                icon={<ShieldCheck size={22} />}
                title={isThai ? "ขอบเขตสิทธิ์" : "Access Boundary"}
                description={isThai ? "การตั้งค่าผู้ใช้และความปลอดภัยส่วนตัวอยู่ที่หน้าโปรไฟล์บัญชี" : "Personal account security and profile controls now live under the account page."}
              />
            </aside>

            <section className={`flex-1 w-full p-6 sm:p-8 flex flex-col items-start gap-5 rounded-[12px] border transition-colors ${isLight ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-sm" : "bg-[#383838] border-[#444444] shadow-lg"}`}>
              <div className="w-full flex items-center justify-between border-b pb-3 border-[#444444]/40">
                <div className="flex items-center gap-2.5">
                  <Building2 size={18} />
                  <h3 className={`font-bold text-[16px] leading-[20px] ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`} style={{ fontFamily: "var(--font-outfit), sans-serif" }}>
                    {isThai ? "ข้อมูลองค์กร" : "Organization Details"}
                  </h3>
                </div>
              </div>

              <form onSubmit={(event) => void submit(event)} className="w-full flex flex-col gap-5">
                <div className="w-full flex flex-col gap-3">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                    {isThai ? "ข้อมูลพื้นฐาน" : "Core Information"}
                  </span>
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <SettingsField label={isThai ? "ชื่อองค์กร" : "Organization Name"} value={name} onChange={(value) => setDraft((current) => ({ ...current, name: value }))} isLight={isLight} required />
                    <SettingsField label={isThai ? "เบอร์โทรศัพท์" : "Phone Number"} value={phone} onChange={(value) => setDraft((current) => ({ ...current, phone: value }))} isLight={isLight} />
                  </div>
                  <SettingsField label={isThai ? "ที่อยู่องค์กร" : "Organization Address"} value={address} onChange={(value) => setDraft((current) => ({ ...current, address: value }))} isLight={isLight} multiline />
                </div>

                <div className="w-full flex flex-col gap-3 pt-5 border-t border-[#444444]/30">
                  <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                    {isThai ? "สถานะระบบ" : "System Status"}
                  </span>
                  <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ReadOnlySetting isLight={isLight} icon={<Database size={16} />} label={isThai ? "ฐานข้อมูล" : "Database"} value={isThai ? "เชื่อมต่ออยู่" : "Connected"} />
                    <ReadOnlySetting isLight={isLight} icon={<Globe2 size={16} />} label={isThai ? "ภาษาและธีม" : "Language & Theme"} value={isThai ? "จัดการจากแถบนำทาง" : "Managed from the top bar"} />
                  </div>
                </div>

                <div className="w-full pt-3 border-t border-[#444444]/40 flex flex-wrap items-center justify-end gap-2.5">
                  <button
                    type="submit"
                    disabled={busy || !name.trim()}
                    className={`px-4 py-2.5 h-[37px] rounded-[8px] font-semibold text-[13px] leading-[17px] transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed ${
                      isLight ? "bg-[#222222] hover:bg-black text-[#FFFFFF]" : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#222222]"
                    }`}
                  >
                    <Save size={14} />
                    <span>{busy ? isThai ? "กำลังบันทึก..." : "Saving..." : isThai ? "บันทึกการตั้งค่าระบบ" : "Save System Settings"}</span>
                  </button>
                </div>
              </form>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}

function SystemSummaryCard({ isLight, icon, title, description }: {
  isLight: boolean;
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <section className={`w-full p-5 rounded-[12px] border flex flex-col gap-3.5 transition-all duration-300 ${isLight ? "bg-white border-[#E4E4E7] text-[#222222] shadow-sm" : "bg-[#383838] border-[#444444] text-[#FFFFFF] shadow-lg"}`}>
      <div className="flex items-center gap-2.5">
        <div className={`p-2 rounded-lg ${isLight ? "bg-[#F5F5F5] text-[#222222]" : "bg-[#282828] text-[#FFFFFF]"}`}>{icon}</div>
        <h2 className="font-outfit text-[15px] font-bold">{title}</h2>
      </div>
      <p className={`text-[12.5px] leading-relaxed ${isLight ? "text-[#666666]" : "text-[#E4E4E7]"}`}>{description}</p>
    </section>
  );
}

function SettingsField({ label, value, onChange, isLight, required, multiline }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  isLight: boolean;
  required?: boolean;
  multiline?: boolean;
}) {
  const className = `w-full p-2.5 ${multiline ? "min-h-[72px] resize-y leading-relaxed" : "h-[38px]"} rounded-[8px] border text-[12.5px] outline-none transition-all ${
    isLight ? "bg-white border-[#E5E5E5] text-[#222222] focus:border-[#222222] focus:ring-1 focus:ring-[#222222]" : "bg-[#282828] border-[#444444] text-[#FFFFFF] focus:border-white focus:ring-1 focus:ring-white"
  }`;
  return (
    <label className="flex flex-col items-start gap-1">
      <span className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>{label}</span>
      {multiline ? (
        <textarea className={className} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
      ) : (
        <input className={className} value={value} required={required} onChange={(event) => onChange(event.target.value)} />
      )}
    </label>
  );
}

function ReadOnlySetting({ isLight, icon, label, value }: {
  isLight: boolean;
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex flex-col items-start gap-1">
      <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>{label}</label>
      <div className={`w-full p-2.5 h-[38px] flex items-center gap-2 rounded-[8px] border text-[12.5px] select-text ${isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"}`}>
        {icon}
        <span>{value}</span>
      </div>
    </div>
  );
}
