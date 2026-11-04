"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Banknote, BookOpenCheck, FileText, LayoutDashboard, ReceiptText, Users } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";

const salesItems = [
  { icon: ReceiptText, th: "รายการขาย", en: "Sales", path: "/sales/transactions" },
  { icon: Users, th: "ลูกค้า", en: "Customers", path: "/sales/customers" },
  { icon: FileText, th: "ลูกหนี้", en: "Receivables", path: "/sales/receivables" },
  { icon: Banknote, th: "รับชำระ", en: "Payments", path: "/sales/payments" },
  { icon: BookOpenCheck, th: "สัญญาเช่าซื้อ", en: "Hire-purchase", path: "/sales/hire-purchase" },
];

const isItemActive = (pathname: string, path: string) => pathname === path || pathname.startsWith(`${path}/`);

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

  return (
    <nav aria-label={isThai ? "เมนูงานขาย" : "Sales navigation"} className="space-y-5 py-2">
      <div>
        {!isMinimized && (
          <p className={`mb-2 px-3.5 text-[10px] font-semibold tracking-[0.14em] ${isLight ? "text-[#737D88]" : "text-[#E4E4E7]"}`}>
            {isThai ? "การขายและลูกหนี้" : "Sales & Receivables"}
          </p>
        )}
        <Link
          href="/sales"
          aria-current={pathname === "/sales" ? "page" : undefined}
          title={isMinimized ? (isThai ? "ภาพรวม" : "Overview") : undefined}
          className={`flex h-11 items-center gap-3 rounded-xl border px-3.5 transition-colors duration-300 ${
            pathname === "/sales"
              ? isLight
                ? "border-[#E4E4E7] bg-[#F1F5F9] font-semibold text-[#222222]"
                : "border-[#444444] bg-[#383838] font-semibold text-white"
              : isLight
                ? "border-transparent text-[#222222] hover:bg-[#F1F5F9]"
                : "border-transparent text-[#F4F4F5] hover:bg-[#383838]"
          } ${isMinimized ? "justify-center px-0" : ""}`}
        >
          <LayoutDashboard size={18} className="shrink-0" />
          {!isMinimized && <span className="text-[13.5px]">{isThai ? "ภาพรวม" : "Overview"}</span>}
        </Link>
      </div>

      <div>
        {!isMinimized && (
          <p className={`mb-2 px-3.5 text-[10px] font-semibold tracking-[0.08em] ${isLight ? "text-[#737D88]" : "text-[#E4E4E7]"}`}>
            {isThai ? "ข้อมูลการขาย" : "Sales records"}
          </p>
        )}
        <ul className="space-y-1">
          {salesItems.map(({ icon: Icon, th, en, path }) => {
            const active = isItemActive(pathname, path);
            return (
              <li key={path}>
                <Link
                  href={path}
                  aria-current={active ? "page" : undefined}
                  title={isMinimized ? (isThai ? th : en) : undefined}
                  className={`flex h-10 items-center gap-3 rounded-xl border px-3.5 transition-colors duration-300 ${
                    active
                      ? isLight
                        ? "border-[#E4E4E7] bg-[#F1F5F9] font-semibold text-[#222222]"
                        : "border-[#444444] bg-[#383838] font-semibold text-white"
                      : isLight
                        ? "border-transparent text-[#222222] hover:bg-[#F1F5F9]"
                        : "border-transparent text-[#F4F4F5] hover:bg-[#383838]"
                  } ${isMinimized ? "justify-center px-0" : ""}`}
                >
                  <Icon size={17} className="shrink-0" />
                  {!isMinimized && <span className="min-w-0 flex-1 truncate text-[13px]">{isThai ? th : en}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>

      {userRole && !isMinimized && (
        <p className={`px-3.5 text-[11px] ${isLight ? "text-[#737D88]" : "text-[#E4E4E7]"}`}>
          {isThai ? "สิทธิ์ผู้ใช้งานจะกำหนดตามบทบาท" : "Access will follow your assigned role."}
        </p>
      )}
    </nav>
  );
}
