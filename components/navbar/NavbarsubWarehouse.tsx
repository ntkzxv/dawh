"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Boxes, ArrowDownLeft, History, Building2, Users, ArrowLeftRight, AlertTriangle, ChartNoAxesCombined } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";

export interface NavbarsubWarehouseProps { isMinimized?: boolean; lang?: "th" | "en"; userRole?: string | null; onNavigate?: (path: string) => void }
const items = [
  { path: "/warehouse", th: "ภาพรวมคลังสินค้า", en: "Overview", icon: LayoutDashboard, employee: true },
  { path: "/warehouse/inventory", th: "ข้อมูลสินค้า", en: "Products", icon: Boxes },
  { path: "/warehouse/branches", th: "สาขาและคลัง", en: "Branches", icon: Building2 },
  { path: "/warehouse/suppliers", th: "ผู้ขาย", en: "Suppliers", icon: Users },
  { path: "/warehouse/receive", th: "สั่งและรับสินค้า", en: "Receiving", icon: ArrowDownLeft, employee: true },
  { path: "/warehouse/stock", th: "ยอดสต๊อก", en: "Stock", icon: Boxes },
  { path: "/warehouse/transfer", th: "โอนและปรับยอด", en: "Movements", icon: ArrowLeftRight },
  { path: "/warehouse/movements", th: "ประวัติเคลื่อนไหว", en: "Stock history", icon: History },
  { path: "/warehouse/issues", th: "ปัญหาและเคลม", en: "Issues", icon: AlertTriangle },
  { path: "/warehouse/reports", th: "รายงาน", en: "Reports", icon: ChartNoAxesCombined },
];

export default function NavbarsubWarehouse({ isMinimized = false, lang, userRole, onNavigate }: NavbarsubWarehouseProps) {
  const pathname = usePathname();
  const { theme } = useTheme();
  const appLanguage = useAppLanguage();
  const isThai = (lang ?? appLanguage.toLowerCase()) === "th";
  const isLight = theme === "light";
  const visible = items.filter((item) => userRole !== "EMPLOYEE" || item.employee);
  return <nav aria-label="เมนูคลังสินค้า" className={`flex w-full flex-col gap-1 px-2 py-4 ${isLight ? "text-slate-700" : "text-zinc-200"}`}>
    {visible.map((item) => { const Icon = item.icon; const active = pathname === item.path; return <Link key={item.path} href={item.path} onClick={(event) => { if (onNavigate) { event.preventDefault(); onNavigate(item.path); } }} title={isThai ? item.th : item.en} aria-current={active ? "page" : undefined} className={`flex min-h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${active ? "bg-indigo-600 text-white" : isLight ? "hover:bg-slate-100" : "hover:bg-white/10"}`}><Icon size={17} className="shrink-0" />{!isMinimized && <span className="truncate">{isThai ? item.th : item.en}</span>}</Link>; })}
  </nav>;
}
