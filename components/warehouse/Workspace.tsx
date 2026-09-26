"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, Box, ChevronDown, Cpu, Database, FileText, Lock } from "lucide-react";
import { getDawhLogo } from "@/config/brand";
import { useAccountMenu } from "@/hooks/useAccountMenu";
import { useTheme } from "@/context/ThemeContext";
import { warehouseApi } from "@/lib/api/warehouse";
import DropdownMenu from "@/components/navbar/DropdownMenu";
import { Notice, useRemote } from "./Ui";

const roleLabel: Record<string, { en: string; th: string }> = {
  ADMIN: { en: "System Administrator", th: "ผู้ดูแลระบบ" },
  CEO: { en: "Chief Executive Officer", th: "ผู้บริหารสูงสุด" },
  MANAGER: { en: "Branch Manager", th: "ผู้จัดการสาขา" },
  COUNTER_STAFF: { en: "Counter Staff", th: "เจ้าหน้าที่เคาน์เตอร์" },
  EMPLOYEE: { en: "Employee", th: "พนักงาน" },
};

const workspaceModules = [
  {
    title: "HP Datacenter",
    titleTh: "สัญญาเช่าซื้อ",
    description: "Manage Hire-Purchase contracts, ledger controls, overdue recoveries, and customer profiles.",
    descriptionTh: "จัดการสัญญาเช่าซื้อ บัญชีแยกประเภท การติดตามหนี้ค้างชำระ และข้อมูลลูกค้า",
    href: "/datacenter",
    status: "Active",
    statusTh: "เปิดใช้งาน",
    statusTone: "active",
    icon: Database,
    disabled: false,
  },
  {
    title: "Warehouse ERP",
    titleTh: "จัดการคลังสินค้า",
    description: "Stock items tracking, real-time SKU movements, stock allocation, and dispatch optimization.",
    descriptionTh: "ติดตามสินค้าคงคลัง ความเคลื่อนไหวสินค้าแบบเรียลไทม์ การจัดสรรสต็อก และการกระจายสินค้า",
    href: "/warehouse",
    status: "Active",
    statusTh: "เปิดใช้งาน",
    statusTone: "active",
    icon: Box,
    disabled: false,
  },
  {
    title: "Reports & Auditing",
    titleTh: "รายงานและตรวจสอบ",
    description: "Generate monthly statements, performance statistics, system audit logs, and risk reports.",
    descriptionTh: "สร้างรายงานรายเดือน สถิติประสิทธิภาพ บันทึกการตรวจสอบระบบ และรายงานความเสี่ยง",
    href: "/reports",
    status: "Maintenance",
    statusTh: "ปิดปรับปรุง",
    statusTone: "maintenance",
    icon: FileText,
    disabled: false,
  },
  {
    title: "Integration Services",
    titleTh: "บริการเชื่อมต่อ",
    description: "API keys, external payment gateways mapping, CRM syncing, and ERP connections.",
    descriptionTh: "จัดการคีย์เชื่อมต่อ ช่องทางชำระเงินภายนอก การซิงค์ลูกค้า และการเชื่อมต่อระบบองค์กร",
    href: "/integration",
    status: "Locked",
    statusTh: "ปิดใช้งาน",
    statusTone: "locked",
    icon: Cpu,
    disabled: true,
  },
] as const;

export default function Workspace() {
  const load = useCallback(() => warehouseApi.me(), []);
  const { data: me, loading, error } = useRemote(load);
  const { theme } = useTheme();
  const isLight = theme === "light";
  const accountMenu = useAccountMenu({ settingsPath: "/settings" });
  const isThai = accountMenu.isThai;
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const accountRef = useRef<HTMLDivElement>(null);
  const profileRole = me ? roleLabel[me.role]?.[isThai ? "th" : "en"] ?? me.role : isThai ? "ผู้ดูแลระบบ" : "System Administrator";
  const profileName = accountMenu.fullName || "Horizon Logistics";
  const profileInitial = accountMenu.initials || "H";

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (accountRef.current && !accountRef.current.contains(event.target as Node)) {
        setIsAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  return <main className={`relative flex min-h-screen flex-col justify-between overflow-hidden transition-colors duration-300 ${isLight ? "bg-[#F8FAFC] text-slate-900 selection:bg-[#222222] selection:text-white" : "bg-[#222222] text-white selection:bg-white/25 selection:text-white"}`}>
    <WorkspaceAuthBackground theme={theme} />
    <header className={`relative z-50 flex h-[72px] w-full flex-none items-center justify-between border-b px-6 py-4 transition-colors duration-300 sm:px-8 ${
      isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#222222]"
    }`}>
      <div className="relative h-10 w-[112px] flex-none cursor-pointer select-none transition-opacity hover:opacity-90">
        <Image
          src={getDawhLogo(theme, "horizontal")}
          alt="DAWH Logo"
          fill
          priority
          sizes="112px"
          className="object-contain object-left"
        />
      </div>
      <div className="relative" ref={accountRef}>
        <button
          type="button"
          onClick={() => setIsAccountOpen((open) => !open)}
          className={`flex h-[50px] w-[232px] flex-none items-center justify-between gap-5 rounded-full px-2 py-1.5 text-left transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 ${
            isLight ? "hover:bg-[#F4F4F5] focus-visible:ring-black/20" : "hover:bg-white/10 focus-visible:ring-white/40"
          }`}
          aria-haspopup="menu"
          aria-expanded={isAccountOpen}
        >
          <div className="flex min-w-0 items-center gap-3">
            <div className={`relative flex h-[38px] w-[38px] flex-none items-center justify-center overflow-hidden rounded-full border ${
              isLight ? "border-slate-300 bg-slate-100 text-slate-800" : "border-[#444444] bg-[#282828] text-[#E4E4E7]"
            }`}>
              {accountMenu.mounted && accountMenu.profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={accountMenu.profile.avatar_url}
                  alt={profileName}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className={`font-geist text-sm font-bold leading-[18px] ${isLight ? "text-slate-800" : "text-[#F4F4F5]"}`} suppressHydrationWarning>
                  {profileInitial}
                </span>
              )}
            </div>
            <div className="flex min-w-[70px] flex-col items-start overflow-hidden text-left leading-tight">
              <p className={`w-full max-w-[140px] truncate font-outfit text-[14.5px] font-semibold leading-[18px] ${isLight ? "text-[#222222]" : "text-white"}`} suppressHydrationWarning>
                {profileName}
              </p>
              <p className={`mt-px w-full max-w-[140px] truncate font-geist text-xs font-medium leading-[15px] ${isLight ? "text-[#666666]" : "text-[#E4E4E7]"}`}>{profileRole}</p>
            </div>
          </div>
          <ChevronDown
            className={`h-4 w-4 flex-none transition-transform duration-200 ${isLight ? "text-[#666666]" : "text-[#E4E4E7]"} ${isAccountOpen ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>
        <div
          className={`absolute right-0 top-[calc(100%+14px)] z-[60] w-[280px] rounded-2xl border p-2 shadow-2xl transition-all duration-200 ${
            isLight ? "border-[#E4E4E7] bg-white text-[#222222] shadow-xl" : "border-[#444444] bg-[#282828] text-white shadow-2xl"
          } ${
            isAccountOpen
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-2 scale-95 opacity-0"
          }`}
        >
          <DropdownMenu
            {...accountMenu}
            onClose={() => setIsAccountOpen(false)}
            variant="popup"
            settingsPath="/settings"
          />
        </div>
      </div>
    </header>
    <section className="relative z-10 mx-auto flex w-full max-w-[1344px] flex-1 flex-col items-start justify-center gap-6 self-stretch px-4 py-8 sm:gap-7 sm:px-8 sm:py-10">
      <div className="flex max-w-[507px] flex-col items-start gap-1.5">
        <h1 className={`font-outfit text-[30px] font-bold leading-[38px] tracking-tight sm:text-[32px] ${isLight ? "text-[#0F172A]" : "text-white"}`}>
          {isThai ? "เลือกพื้นที่ทำงาน" : "Select Workspace"}
        </h1>
        <p className={`font-geist text-[15px] font-normal leading-[22px] sm:text-base ${isLight ? "text-[#64748B]" : "text-[#999999]"}`}>
          {isThai ? "เลือกโมดูลเฉพาะทางเพื่อเริ่มต้นการทำงานสำหรับ Horizon Logistics" : "Choose a dedicated module to begin operations for Horizon Logistics."}
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        {loading && <p className={`font-geist text-sm ${isLight ? "text-slate-600" : "text-[#E4E4E7]"}`}>{isThai ? "กำลังโหลดสิทธิ์การเข้าถึง..." : "Loading access permissions..."}</p>}
        {error && <Notice tone="error">{error}</Notice>}
        {me?.mustChangePassword && (
          <Notice tone="error">
            {isThai ? "บัญชีนี้ต้องเปลี่ยนรหัสผ่านเริ่มต้นก่อนใช้งานโมดูล" : "This account must change its initial password before using workspace modules."}{" "}
            <Link className="font-semibold underline" href="/settings">{isThai ? "ไปที่การตั้งค่า" : "Go to settings"}</Link>
          </Notice>
        )}
      </div>

      <div className="flex w-full flex-col gap-5">
        <div className="grid w-full grid-cols-1 gap-5 lg:grid-cols-2">
          {workspaceModules.slice(0, 2).map((module) => (
            <WorkspaceCard key={module.title} module={module} isLight={isLight} isThai={isThai} variant="standard" />
          ))}
        </div>
        {workspaceModules.slice(2).map((module) => (
          <WorkspaceCard key={module.title} module={module} isLight={isLight} isThai={isThai} variant="horizontal" />
        ))}
      </div>
    </section>
    <footer className={`relative z-10 w-full border-t px-6 py-5 text-center ${isLight ? "border-zinc-200/40" : "border-zinc-800/60"}`}>
      <p className={`font-geist text-xs font-normal leading-4 ${isLight ? "text-zinc-500" : "text-zinc-400"}`}>
        {isThai ? "ระบบบริหารจัดการ dawh Platform © 2026. Horizon Logistics Operations Hub." : "dawh Enterprise Platform © 2026. Horizon Logistics Operations Hub."}
      </p>
    </footer>
  </main>;
}

function WorkspaceAuthBackground({ theme }: { theme: "light" | "dark" }) {
  const isLight = theme === "light";
  const maskUrl = getDawhLogo(theme, "longNoSpace");

  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex flex-col">
      <div className={`relative h-[52%] w-full overflow-hidden transition-colors duration-300 ${isLight ? "bg-[#EEF2F6]" : "bg-[#1A1A1A]"}`}>
        <div className="pointer-events-none absolute inset-0 select-none">
          <div className="absolute -top-4 -left-24 h-1/2 aspect-[1580/528] sm:-left-36 md:-left-48">
            <div
              className="h-full w-full transition-colors duration-300"
              style={{
                backgroundColor: isLight ? "#FFFFFF" : "#282828",
                WebkitMaskImage: `url(${maskUrl})`,
                maskImage: `url(${maskUrl})`,
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
              className={`absolute top-[61.2%] left-[76.2%] h-[150vh] w-[7%] transition-colors duration-300 ${
                isLight ? "bg-[#FFFFFF]" : "bg-[#282828]"
              }`}
            />
          </div>
        </div>
      </div>
      <div className={`relative flex-1 overflow-hidden transition-colors duration-300 ${isLight ? "bg-[#FFFFFF]" : "bg-[#282828]"}`}>
        <div
          className="pointer-events-none absolute right-0 bottom-0 h-full w-full select-none transition-colors duration-300"
          style={{
            backgroundColor: isLight ? "#EEF2F6" : "#1A1A1A",
            WebkitMaskImage: `url(${maskUrl})`,
            maskImage: `url(${maskUrl})`,
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
  );
}

function WorkspaceCard({
  module,
  isLight,
  isThai,
  variant,
}: {
  module: (typeof workspaceModules)[number];
  isLight: boolean;
  isThai: boolean;
  variant: "standard" | "horizontal";
}) {
  const Icon = module.icon;
  const ButtonIcon = module.disabled ? Lock : ArrowRight;
  const statusDot = module.statusTone === "active"
    ? "bg-[#2EC4B6]"
    : module.statusTone === "maintenance"
      ? "bg-[#FF9F1C]"
      : "bg-[#383838]";
  const title = isThai ? module.titleTh : module.title;
  const description = isThai ? module.descriptionTh : module.description;
  const status = isThai ? module.statusTh : module.status;
  const actionLabel = module.disabled
    ? isThai ? "ปิดใช้งาน" : "Disabled"
    : module.statusTone === "maintenance"
      ? isThai ? "ปิดปรับปรุง" : "Maintenance"
      : isThai ? "เข้าสู่พื้นที่ทำงาน" : "Enter Workspace";
  const cardChrome = module.disabled
    ? isLight
      ? "bg-[#F4F4F5] border-zinc-300 text-zinc-400 cursor-not-allowed shadow-none"
      : "bg-[#242424] border-[#383838] text-zinc-500 cursor-not-allowed shadow-none"
    : isLight
      ? "bg-white border-zinc-200 hover:border-black shadow-[0px_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0px_8px_24px_rgba(0,0,0,0.12)] cursor-pointer"
      : "bg-[#282828] border-[#444444] hover:border-white shadow-[0px_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0px_8px_24px_rgba(0,0,0,0.5)] cursor-pointer";

  const iconChrome = module.disabled
    ? isLight
      ? "bg-zinc-200 border-zinc-300 text-zinc-500"
      : "bg-[#1E1E1E] border-zinc-700 text-zinc-600"
    : isLight
      ? "bg-zinc-100 border-zinc-200 text-zinc-900 group-hover:bg-black group-hover:text-white group-hover:border-black"
      : "bg-[#222222] border-[#444444] text-white group-hover:bg-white group-hover:text-black group-hover:border-white";

  const buttonChrome = module.disabled
    ? isLight
      ? "cursor-not-allowed bg-zinc-200 hover:bg-zinc-200 text-zinc-500 border-zinc-300 shadow-none"
      : "cursor-not-allowed bg-[#1E1E1E] hover:bg-[#1E1E1E] text-zinc-600 border-zinc-700 shadow-none"
    : module.statusTone === "maintenance"
      ? isLight
        ? "bg-zinc-100 group-hover:bg-black group-hover:border-black group-hover:text-white border-amber-500 text-zinc-800 shadow-xs"
        : "bg-[#333333] group-hover:bg-white group-hover:border-white group-hover:text-black border-amber-400 text-neutral-200 shadow-xs"
      : isLight
        ? "bg-zinc-100 group-hover:bg-black group-hover:border-black group-hover:text-white border-zinc-300 text-zinc-800 shadow-sm"
        : "bg-[#333333] group-hover:bg-white group-hover:border-white group-hover:text-black border-[#444444] text-neutral-200";

  const content = variant === "horizontal" ? (
    <div className="flex w-full flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors ${iconChrome}`}>
          <Icon size={22} strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className={`truncate font-outfit text-lg font-bold tracking-tight sm:text-xl ${
              module.disabled ? "text-zinc-500" : isLight ? "text-zinc-900" : "text-white"
            }`}>
              {title}
            </h2>
            <StatusPill dotClass={statusDot} label={status} isLight={isLight} />
          </div>
          <p className={`mt-0.5 line-clamp-1 font-geist text-[13px] ${
            module.disabled ? "text-zinc-500" : isLight ? "text-zinc-600" : "text-zinc-400"
          }`}>
            {description}
          </p>
        </div>
      </div>
      <ActionButton ButtonIcon={ButtonIcon} disabled={module.disabled} label={actionLabel} className={buttonChrome} />
    </div>
  ) : (
    <>
      <div className="flex w-full items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-start gap-3.5">
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border transition-colors ${iconChrome}`}>
            <Icon size={23} strokeWidth={2} />
          </div>
          <div className="min-w-0 flex-1 pt-1">
            <h2 className={`truncate font-outfit text-[21px] font-bold leading-7 tracking-tight ${
              module.disabled ? "text-zinc-500" : isLight ? "text-zinc-900" : "text-white"
            }`}>
              {title}
            </h2>
          </div>
        </div>
        <StatusPill dotClass={statusDot} label={status} isLight={isLight} />
      </div>
      <div className="my-auto flex flex-col justify-center py-2">
        <p className={`font-geist text-[14.5px] leading-[160%] ${
          module.disabled ? "text-zinc-500" : isLight ? "text-zinc-600" : "text-zinc-400"
        }`}>
          {description}
        </p>
      </div>
      <div className="mt-auto flex w-full items-center justify-end pt-2">
        <ActionButton ButtonIcon={ButtonIcon} disabled={module.disabled} label={actionLabel} className={buttonChrome} />
      </div>
    </>
  );

  const cardClass = variant === "horizontal"
    ? `group relative flex min-h-[100px] w-full rounded-2xl border p-5 transition-all duration-200 select-none sm:h-[100px] sm:px-7 ${cardChrome}`
    : `group relative flex min-h-[390px] w-full flex-col justify-between rounded-2xl border p-8 transition-all duration-200 select-none sm:p-9 ${cardChrome}`;

  if (module.disabled || module.statusTone === "maintenance") {
    return <div className={cardClass}>{content}</div>;
  }

  return (
    <Link
      href={module.href}
      className={`${cardClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
    >
      {content}
    </Link>
  );
}

function StatusPill({ dotClass, label, isLight }: { dotClass: string; label: string; isLight: boolean }) {
  return (
    <div className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-geist text-[11px] font-semibold ${
      isLight ? "border-zinc-200 bg-zinc-50 text-zinc-700" : "border-[#444444] bg-[#222222] text-zinc-300"
    }`}>
      <span className={`h-2 w-2 shrink-0 rounded-full ${dotClass}`} />
      <span>{label}</span>
    </div>
  );
}

function ActionButton({
  ButtonIcon,
  disabled,
  label,
  className,
}: {
  ButtonIcon: typeof ArrowRight;
  disabled: boolean;
  label: string;
  className: string;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      className={`flex items-center gap-2 rounded-lg border px-4 py-2 font-geist text-xs font-semibold transition-all ${className}`}
    >
      <span>{label}</span>
      <ButtonIcon size={14} />
    </button>
  );
}
