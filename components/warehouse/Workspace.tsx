"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Box,
  ChevronDown,
  Database,
  FileText,
  Lock,
  ShoppingCart,
} from "lucide-react";
import { getDawhLogo } from "@/config/brand";
import { getWarehouseRoleLabel } from "@/utils/warehouseRole";
import { useAccountMenu } from "@/hooks/useAccountMenu";
import { useLoading } from "@/components/loading_screen/LoadingProvider";
import { useTheme } from "@/context/ThemeContext";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import DropdownMenu from "@/components/navbar/DropdownMenu";
import { Notice } from "./Ui";
import { apiGet } from "@/lib/api/client";
import type { ManagedModuleKey, ModuleStatus } from "@/lib/contracts/module-status";

const workspaceModules = [
  {
    moduleKey: "datacenter",
    title: "HP Datacenter",
    titleTh: "สัญญาเช่าซื้อ",
    description:
      "Manage Hire-Purchase contracts, ledger controls, overdue recoveries, and customer profiles.",
    descriptionTh:
      "จัดการสัญญาเช่าซื้อ บัญชีแยกประเภท การติดตามหนี้ค้างชำระ และข้อมูลลูกค้า",
    href: "/datacenter",
    statusTone: "active",
    icon: Database,
  },
  {
    moduleKey: "warehouse",
    title: "Warehouse ERP",
    titleTh: "จัดการคลังสินค้า",
    description:
      "Stock items tracking, real-time SKU movements, stock allocation, and dispatch optimization.",
    descriptionTh:
      "ติดตามสินค้าคงคลัง ความเคลื่อนไหวสินค้าแบบเรียลไทม์ การจัดสรรสต็อก และการกระจายสินค้า",
    href: "/warehouse",
    statusTone: "active",
    icon: Box,
  },
  {
    moduleKey: "sales",
    title: "Sales",
    titleTh: "การขาย",
    description:
      "Customer records and staff-entered in-store sales with manually recorded payments.",
    descriptionTh:
      "จัดการข้อมูลลูกค้าและบันทึกการขายหน้าร้านพร้อมบันทึกการชำระเงินจริงโดยพนักงาน",
    href: "/sales",
    statusTone: "active",
    icon: ShoppingCart,
  },
  {
    moduleKey: "reports",
    title: "Reports & Auditing",
    titleTh: "รายงานและตรวจสอบ",
    description:
      "Generate monthly statements, performance statistics, system audit logs, and risk reports.",
    descriptionTh:
      "สร้างรายงานรายเดือน สถิติประสิทธิภาพ บันทึกการตรวจสอบระบบ และรายงานความเสี่ยง",
    href: "/reports",
    statusTone: "maintenance",
    icon: FileText,
  },
] as const;

export default function Workspace() {
  const { isLoading } = useLoading();
  const reduceMotion = useReducedMotion();
  const account = useOptionalWarehouseAccount();
  const me = account?.me;
  const loading = account?.loading ?? true;
  const error = account?.error;
  const { theme } = useTheme();
  const isLight = theme === "light";
  const accountMenu = useAccountMenu({ settingsPath: "/settings" });
  const isThai = accountMenu.isThai;
  const [isAccountOpen, setIsAccountOpen] = useState(false);
  const [moduleUnavailable, setModuleUnavailable] = useState(false);
  const [moduleStatuses, setModuleStatuses] = useState<Record<ManagedModuleKey, boolean>>({
    datacenter: true,
    warehouse: true,
    sales: true,
    reports: false,
  });
  const accountRef = useRef<HTMLDivElement>(null);
  const profileRole = me
    ? getWarehouseRoleLabel(me.role, isThai ? "TH" : "EN")
    : "";
  const profileName = accountMenu.fullName || "Horizon Logistics";
  const profileInitial = accountMenu.initials || "H";

  useEffect(() => {
    function closeOnOutsideClick(event: MouseEvent) {
      if (
        accountRef.current &&
        !accountRef.current.contains(event.target as Node)
      ) {
        setIsAccountOpen(false);
      }
    }

    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  useEffect(() => {
    if (!me) return;
    const controller = new AbortController();
    void apiGet<ModuleStatus[]>("/api/modules/status", { signal: controller.signal })
      .then(({ data }) => {
        setModuleStatuses((current) => {
          const next = { ...current };
          for (const status of data) next[status.moduleKey] = status.isEnabled;
          return next;
        });
      })
      .catch(() => {
        // Retain the known defaults if the status service is temporarily unavailable.
      });
    return () => controller.abort();
  }, [me]);

  useEffect(() => {
    setModuleUnavailable(new URLSearchParams(window.location.search).has("moduleUnavailable"));
  }, []);

  if (!loading && !me && !isLoading)
    return (
      <main className="min-h-screen p-8">
        <p>{error || (isThai ? "กรุณาเข้าสู่ระบบ" : "Please sign in")}</p>
        <Link className="underline" href="/auth/login?from=/workspace">
          {isThai ? "เข้าสู่ระบบ" : "Sign in"}
        </Link>
      </main>
    );

  return (
    <main
      className={`relative flex min-h-screen flex-col overflow-hidden transition-colors duration-300 lg:h-dvh lg:min-h-0 ${isLight ? "bg-[#F8FAFC] text-[var(--text-primary)] selection:bg-[#222222] selection:text-white" : "bg-[#222222] text-[var(--text-primary)] selection:bg-white/25 selection:text-white"}`}
    >
      <WorkspaceAuthBackground theme={theme} />
      <motion.header
        initial={reduceMotion ? false : { y: -24, opacity: 0 }}
        animate={
          isLoading && !reduceMotion
            ? { y: -24, opacity: 0 }
            : { y: 0, opacity: 1 }
        }
        transition={{ duration: reduceMotion ? 0 : 0.45, ease: [0.22, 1, 0.36, 1] }}
        className={`relative z-50 flex h-[72px] w-full flex-none items-center justify-between border-b px-6 py-4 transition-colors duration-300 sm:px-8 ${
          isLight
            ? "border-[#E4E4E7] bg-white"
            : "border-[#444444] bg-[#222222]"
        }`}
      >
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
              isLight
                ? "hover:bg-[#F1F5F9] focus-visible:ring-black/20"
                : "hover:bg-white/10 focus-visible:ring-white/40"
            }`}
            aria-haspopup="menu"
            aria-expanded={isAccountOpen}
          >
            <div className="flex min-w-0 items-center gap-3">
              <div
                className={`relative flex h-[38px] w-[38px] flex-none items-center justify-center overflow-hidden rounded-full border ${
                  isLight
                    ? "border-slate-300 bg-slate-100 text-[#222222]"
                    : "border-[#444444] bg-[var(--cards)] text-[#E4E4E7]"
                }`}
              >
                {accountMenu.mounted && accountMenu.profile.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={accountMenu.profile.avatar_url}
                    alt={profileName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span
                    className={`font-geist text-sm font-bold leading-[18px] ${isLight ? "text-[#222222]" : "text-[#F4F4F5]"}`}
                    suppressHydrationWarning
                  >
                    {profileInitial}
                  </span>
                )}
              </div>
              <div className="flex min-w-[70px] flex-col items-start overflow-hidden text-left leading-tight">
                <p
                  className="w-full max-w-[140px] truncate font-outfit text-[14.5px] font-semibold leading-[18px] text-[var(--text-primary)]"
                  suppressHydrationWarning
                >
                  {profileName}
                </p>
                <p
                  className={`mt-px w-full max-w-[140px] truncate font-geist text-xs font-medium leading-[15px] ${isLight ? "text-[#383838]" : "text-[#E4E4E7]"}`}
                >
                  {profileRole}
                </p>
              </div>
            </div>
            <ChevronDown
              className={`h-4 w-4 flex-none transition-transform duration-200 ${isLight ? "text-[var(--text-muted)]" : "text-[#E4E4E7]"} ${isAccountOpen ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
          </button>
          <div
            className={`absolute right-0 top-[calc(100%+14px)] z-[60] w-[280px] rounded-2xl border p-2 shadow-2xl transition-all duration-200 ${
              isLight
                ? "border-[#E4E4E7] bg-white text-[#222222] shadow-xl"
                : "border-[#444444] bg-[var(--cards)] text-white shadow-2xl"
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
      </motion.header>
      <section className="relative z-10 mx-auto flex w-full max-w-[1344px] flex-1 flex-col items-start justify-center gap-5 self-stretch px-4 py-6 sm:gap-6 sm:px-8 sm:py-8 lg:min-h-0 lg:justify-start lg:gap-[clamp(0.75rem,2.5vh,1.25rem)] lg:py-[clamp(0.75rem,3vh,1.5rem)]">
        <motion.div
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={isLoading && !reduceMotion ? { opacity: 0 } : { opacity: 1 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, ease: "easeOut" }}
          className="flex max-w-[507px] flex-col items-start gap-1.5"
        >
          <h1
            className="font-outfit text-[30px] font-bold leading-[38px] tracking-tight text-[var(--text-primary)] sm:text-[32px]"
          >
            {isThai ? "เลือกพื้นที่ทำงาน" : "Select Workspace"}
          </h1>
          <p
            className={`font-geist text-[15px] font-normal leading-[22px] sm:text-base ${isLight ? "text-[#383838]" : "text-[var(--text-muted)]"}`}
          >
            {isThai
              ? "เลือกโมดูลเฉพาะทางเพื่อเริ่มต้นการทำงานสำหรับ Horizon Logistics"
              : "Choose a dedicated module to begin operations for Horizon Logistics."}
          </p>
        </motion.div>

        {(error || moduleUnavailable) && (
          <div className="w-full">
            <Notice tone="error">
              {error || (isThai ? "โมดูลนี้ปิดใช้งานอยู่ โปรดติดต่อผู้ดูแลระบบ" : "This module is currently closed. Contact an administrator for access.")}
            </Notice>
          </div>
        )}

        <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-5 lg:min-h-0 lg:flex-1 lg:grid-rows-2">
          {workspaceModules.map((module, index) => (
            <motion.div
              key={module.title}
              initial={reduceMotion ? false : { y: 28, opacity: 0 }}
              animate={
                isLoading && !reduceMotion
                  ? { y: 28, opacity: 0 }
                  : { y: 0, opacity: 1 }
              }
              transition={{
                duration: reduceMotion ? 0 : 0.48,
                delay: reduceMotion ? 0 : index * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="min-w-0 sm:h-full lg:min-h-0"
            >
              <WorkspaceCard
                module={module}
                moduleStatus={moduleStatuses[module.moduleKey]}
                isLight={isLight}
                isThai={isThai}
              />
            </motion.div>
          ))}
        </div>
      </section>
      <footer
        className={`relative z-10 w-full flex-none border-t px-6 py-4 text-center ${isLight ? "border-zinc-200/40" : "border-zinc-800/60"}`}
      >
        <p
          className={`font-geist text-xs font-normal leading-4 ${isLight ? "text-[#383838]" : "text-zinc-400"}`}
        >
          {isThai
            ? "ระบบบริหารจัดการ dawh Platform © 2026. Horizon Logistics Operations Hub."
            : "dawh Enterprise Platform © 2026. Horizon Logistics Operations Hub."}
        </p>
      </footer>
    </main>
  );
}

function WorkspaceAuthBackground({ theme }: { theme: "light" | "dark" }) {
  const isLight = theme === "light";
  const maskUrl = getDawhLogo(theme, "longNoSpace");

  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex flex-col">
      <div
        className={`relative h-[52%] w-full overflow-hidden transition-colors duration-300 ${isLight ? "bg-[#F1F5F9]" : "bg-[#222222]"}`}
      >
        <div className="pointer-events-none absolute inset-0 select-none">
          <div className="absolute -top-4 -left-24 h-1/2 aspect-[1580/528] sm:-left-36 md:-left-48">
            <div
              className="h-full w-full transition-colors duration-300"
              style={{
                backgroundColor: isLight ? "#FFFFFF" : "var(--cards)",
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
                isLight ? "bg-[#FFFFFF]" : "bg-[var(--cards)]"
              }`}
            />
          </div>
        </div>
      </div>
      <div
        className={`relative flex-1 overflow-hidden transition-colors duration-300 ${isLight ? "bg-[#FFFFFF]" : "bg-[var(--cards)]"}`}
      >
        <div
          className="pointer-events-none absolute right-0 bottom-0 h-full w-full select-none transition-colors duration-300"
          style={{
            backgroundColor: isLight ? "#F1F5F9" : "#222222",
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
  moduleStatus,
  isLight,
  isThai,
}: {
  module: (typeof workspaceModules)[number];
  moduleStatus?: boolean;
  isLight: boolean;
  isThai: boolean;
}) {
  const { navigateWithLoading } = useLoading();
  const Icon = module.icon;
  const isEnabled = moduleStatus ?? module.statusTone !== "maintenance";
  const isDisabled = !isEnabled;
  const statusTone = isEnabled ? "active" : "maintenance";
  const ButtonIcon = isDisabled ? Lock : ArrowRight;
  const statusDot =
    statusTone === "active"
      ? "bg-[var(--status-success)]"
      : statusTone === "maintenance"
        ? "bg-[var(--status-warning)]"
        : "bg-[#383838]";
  const title = isThai ? module.titleTh : module.title;
  const description = isThai ? module.descriptionTh : module.description;
  const status = isEnabled
    ? isThai ? "เปิดใช้งาน" : "Active"
    : isThai ? "ปิดปรับปรุง" : "Maintenance";
  const actionLabel = !isEnabled
    ? isThai ? "ปิดปรับปรุง" : "Maintenance"
    : isThai ? "เข้าสู่พื้นที่ทำงาน" : "Enter Workspace";
  const cardChrome = isDisabled
    ? isLight
      ? "bg-[#F1F5F9] border-zinc-300 text-zinc-400 cursor-not-allowed shadow-none"
      : "bg-[var(--input-bg)] border-[#383838] text-zinc-500 cursor-not-allowed shadow-none"
    : isLight
      ? "bg-white border-zinc-200 hover:border-black shadow-[0px_4px_16px_rgba(0,0,0,0.06)] hover:shadow-[0px_8px_24px_rgba(0,0,0,0.12)] cursor-pointer"
      : "bg-[var(--cards)] border-[#444444] hover:border-white shadow-[0px_4px_16px_rgba(0,0,0,0.3)] hover:shadow-[0px_8px_24px_rgba(0,0,0,0.5)] cursor-pointer";

  const iconChrome = isDisabled
    ? isLight
      ? "bg-zinc-200 border-zinc-300 text-[#71717A]"
      : "bg-[var(--input-bg)] border-zinc-700 text-zinc-600"
    : isLight
      ? "bg-zinc-100 border-zinc-200 text-[#222222] group-hover:bg-black group-hover:text-white group-hover:border-black"
      : "bg-[#222222] border-[#444444] text-white group-hover:bg-white group-hover:text-black group-hover:border-white";

  const buttonChrome = isDisabled
    ? isLight
      ? "cursor-not-allowed bg-zinc-200 hover:bg-zinc-200 text-[#71717A] border-zinc-300 shadow-none"
      : "cursor-not-allowed bg-[var(--input-bg)] hover:bg-[var(--input-bg)] text-zinc-600 border-zinc-700 shadow-none"
    : !isEnabled
      ? isLight
        ? "bg-zinc-100 group-hover:bg-black group-hover:border-black group-hover:text-white border-amber-500 text-[#222222] shadow-xs"
        : "bg-[var(--cards)] group-hover:bg-white group-hover:border-white group-hover:text-black border-amber-400 text-[var(--text-muted)] shadow-xs"
      : isLight
        ? "bg-zinc-100 group-hover:bg-black group-hover:border-black group-hover:text-white border-zinc-300 text-[#222222] shadow-sm"
        : "bg-[var(--cards)] group-hover:bg-white group-hover:border-white group-hover:text-black border-[#444444] text-[var(--text-muted)]";

  const content = (
    <>
      <div className="flex w-full items-start justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3.5">
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors sm:h-12 sm:w-12 ${iconChrome}`}
          >
            <Icon size={22} strokeWidth={2} />
          </div>
          <h2
            className={`min-w-0 truncate font-outfit text-lg font-bold leading-7 tracking-tight sm:text-xl ${
              isDisabled
                ? "text-[#71717A]"
                : isLight
                  ? "text-[#222222]"
                  : "text-[var(--text-primary)]"
            }`}
          >
            {title}
          </h2>
        </div>
        <StatusPill dotClass={statusDot} label={status} isLight={isLight} />
      </div>
      <div className="flex min-h-0 flex-1 items-center py-3 sm:py-4 lg:py-2">
        <p
          className={`line-clamp-3 font-geist text-sm leading-[160%] lg:line-clamp-1 ${
            isDisabled
              ? "text-[#71717A]"
              : isLight
                ? "text-[#383838]"
                : "text-zinc-400"
          }`}
        >
          {description}
        </p>
      </div>
      <div className="flex w-full items-center justify-end">
        <ActionButton
          ButtonIcon={ButtonIcon}
          disabled={isDisabled}
          label={actionLabel}
          className={buttonChrome}
        />
      </div>
    </>
  );

  const cardClass = `group relative flex min-h-[240px] w-full flex-col rounded-2xl border p-5 transition-all duration-200 select-none sm:p-6 lg:h-full lg:min-h-0 lg:p-[clamp(0.75rem,1.3vw,1.5rem)] ${cardChrome}`;

  if (isDisabled) {
    return <div className={cardClass}>{content}</div>;
  }

  return (
    <Link
      href={module.href}
      onClick={(event) => {
        // Keep modified clicks (new tab/window) under native Link behavior.
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        event.preventDefault();
        navigateWithLoading(module.href);
      }}
      className={`${cardClass} focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40`}
    >
      {content}
    </Link>
  );
}

function StatusPill({
  dotClass,
  label,
  isLight,
}: {
  dotClass: string;
  label: string;
  isLight: boolean;
}) {
  return (
    <div
      className={`flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 font-geist text-[11px] font-semibold ${
        isLight
          ? "border-zinc-200 bg-zinc-50 text-[#383838]"
          : "border-[#444444] bg-[#222222] text-zinc-300"
      }`}
    >
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
