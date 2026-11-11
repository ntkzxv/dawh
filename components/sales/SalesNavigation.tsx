"use client";

import Link from "next/link";
import type { ElementType } from "react";
import { usePathname } from "next/navigation";
import { Banknote, BookOpenCheck, FileText, LayoutDashboard, ReceiptText, Users } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";

// Items with live:false stay hidden.
const groups = [
  {
    th: "งานขาย",
    en: "Sales",
    items: [
      { icon: ReceiptText, th: "รายการขาย", en: "Sales", path: "/sales/transactions", live: true },
      { icon: Users, th: "ลูกค้า", en: "Customers", path: "/sales/customers", live: true },
      { icon: BookOpenCheck, th: "บันทึกชำระค่างวด", en: "Installment payments", path: "/sales/installments", live: true },
    ],
  },
  {
    th: "ลูกหนี้",
    en: "A/R",
    items: [
      { icon: FileText, th: "ภาพรวม", en: "Overview", path: "/sales/ar", live: true },
      { icon: Users, th: "ทะเบียนลูกค้า", en: "Customer registry", path: "/sales/ar/customers", live: true },
      { icon: BookOpenCheck, th: "สัญญาผ่อนชำระ", en: "Installment contracts", path: "/sales/ar/contracts", live: true },
      { icon: ReceiptText, th: "ประวัติการชำระเงิน", en: "Payment history", path: "/sales/ar/payments", live: true },
      { icon: Banknote, th: "รายการเกินกำหนด", en: "Overdue", path: "/sales/ar/overdue", live: true },
    ],
  },
]
  .map((group) => ({ ...group, items: group.items.filter((item) => item.live) }))
  .filter((group) => group.items.length);

// /sales/ar is the A/R overview and a prefix of its siblings, so it matches exactly.
const isItemActive = (pathname: string, path: string) =>
  pathname === path || (path !== "/sales/ar" && pathname.startsWith(`${path}/`));

function NavItem({ href, icon: Icon, label, active, isMinimized, isLight }: {
  href: string;
  icon: ElementType;
  label: string;
  active: boolean;
  isMinimized: boolean;
  isLight: boolean;
}) {
  const bar = isLight ? "bg-[#222222]" : "bg-white";
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      title={isMinimized ? label : undefined}
      className={`group relative flex items-center overflow-hidden rounded-xl border outline-none transition-colors duration-300 select-none ${
        isMinimized ? "mx-auto h-12 w-12 justify-center px-0" : "w-full gap-3 px-3.5 py-2.5"
      } ${
        active
          ? isLight
            ? "border-[#E4E4E7] bg-[#F1F5F9] font-semibold text-[#222222]"
            : "border-[#444444]/60 bg-[#383838]/80 font-semibold text-white"
          : isLight
            ? "border-transparent text-[#222222] hover:bg-[#F1F5F9]"
            : "border-transparent text-[#F4F4F5] hover:bg-[#383838]/60 hover:text-white"
      }`}
    >
      <Icon size={18} className="shrink-0" />
      {!isMinimized && <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium leading-tight">{label}</span>}
      {!isMinimized && <span className={`h-[13px] w-[2.5px] shrink-0 rounded-full transition-opacity ${bar} ${active ? "opacity-100" : "opacity-0"}`} />}
      {isMinimized && <span className={`absolute bottom-1.5 left-1/2 h-[2.5px] w-3.5 -translate-x-1/2 rounded-full transition-opacity ${bar} ${active ? "opacity-100" : "opacity-0"}`} />}
    </Link>
  );
}

export default function SalesNavigation({
  isMinimized,
  userRole,
}: {
  isMinimized: boolean;
  userRole: string | null;
}) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const isThai = useAppLanguage() === "TH";
  const isLight = theme === "light";
  const muted = isLight ? "text-[#737D88]" : "text-[#E4E4E7]";

  return (
    <nav aria-label={isThai ? "เมนูงานขาย" : "Sales navigation"} className="w-full space-y-1.5 py-2">
      <NavItem
        href="/sales"
        icon={LayoutDashboard}
        label={isThai ? "ภาพรวม" : "Overview"}
        active={pathname === "/sales"}
        isMinimized={isMinimized}
        isLight={isLight}
      />

      {groups.map((group) => (
        <div key={group.en} className="space-y-1.5 pt-3">
          {isMinimized ? (
            <div className={`mx-auto h-px w-8 ${isLight ? "bg-[#E4E4E7]" : "bg-[#444444]"}`} />
          ) : (
            <p className={`px-3.5 pb-1 text-[11px] font-semibold ${muted}`}>{isThai ? group.th : group.en}</p>
          )}
          {group.items.map(({ icon, th, en, path }) => (
            <NavItem
              key={path}
              href={path}
              icon={icon}
              label={isThai ? th : en}
              active={isItemActive(pathname, path)}
              isMinimized={isMinimized}
              isLight={isLight}
            />
          ))}
        </div>
      ))}

      {userRole && !isMinimized && (
        <p className={`px-3.5 pt-3 text-[11px] ${muted}`}>
          {isThai ? "สิทธิ์ผู้ใช้งานจะกำหนดตามบทบาท" : "Access will follow your assigned role."}
        </p>
      )}
    </nav>
  );
}
