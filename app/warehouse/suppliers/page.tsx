"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";
import WarehousePageTemplate from "../_components/WarehousePageTemplate";
import {
  Users,
  ShieldAlert,
  ArrowRight,
  Sparkles,
  Layers,
  ChevronRight,
  ExternalLink,
  Lock,
} from "lucide-react";
import { motion } from "framer-motion";

export default function SuppliersPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang.toLowerCase() === "th";

  return (
    <WarehousePageTemplate
      titleEn="Suppliers & Procurement"
      titleTh="ระบบคู่ค้าและจัดซื้อ"
      routePath="/warehouse/suppliers"
      iconName="suppliers"
    >
      <div className="w-full flex flex-col items-center justify-center py-6 sm:py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className={`w-full max-w-[620px] rounded-2xl border p-8 sm:p-10 shadow-lg text-center flex flex-col items-center transition-colors ${
            isLight
              ? "bg-white border-[#E4E4E7] text-[#222222]"
              : "bg-[#282828] border-[#444444] text-white"
          }`}
        >
          {/* Out-of-Scope Badge */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-bold tracking-wide uppercase bg-amber-500/10 text-amber-500 border border-amber-500/25 mb-6">
            <Lock size={12} className="shrink-0" />
            <span>{isThai ? "อยู่นอกขอบเขตเวอร์ชันแรก (Out-of-Scope MVP)" : "Out-of-Scope in MVP (v1)"}</span>
          </div>

          {/* Center Graphic / Icon */}
          <div
            className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${
              isLight ? "bg-slate-100 text-slate-700" : "bg-[#333333] text-[#E4E4E7]"
            }`}
          >
            <Users size={38} strokeWidth={1.75} />
          </div>

          {/* Heading */}
          <h2 className="text-[22px] sm:text-[24px] font-bold tracking-tight mb-3">
            {isThai ? "ระบบคู่ค้าและจัดซื้อสินค้า (Suppliers & Procurement)" : "Suppliers & Procurement Portal"}
          </h2>

          {/* Description based on DESIGN.md Section 2.2 */}
          <p
            className={`text-[14px] leading-relaxed max-w-[480px] mb-8 ${
              isLight ? "text-slate-600" : "text-[#A1A1AA]"
            }`}
          >
            {isThai
              ? "ตามข้อกำหนดในเอกสารสถาปัตยกรรม (DESIGN.md ข้อ 2.2) ระบบจัดซื้อและพอร์ทัลคู่ค้า (Procurement & Supplier Portal) ถูกกำหนดให้อยู่นอกขอบเขตของระบบ Horizon WMS ในเวอร์ชันแรก เพื่อเน้นความสมบูรณ์ของระบบคลังและโลจิสติกส์ระหว่างสาขา"
              : "As specified in DESIGN.md (Section 2.2), Full Procurement and Supplier Portal are excluded from the Horizon WMS MVP scope to prioritize core warehouse operations, stock ledgers, and multi-branch logistics."}
          </p>

          {/* Core Modules Info Card */}
          <div
            className={`w-full rounded-xl border p-4 text-left mb-8 text-[12.5px] leading-relaxed ${
              isLight
                ? "bg-slate-50 border-slate-200 text-slate-700"
                : "bg-[#202020] border-[#383838] text-zinc-300"
            }`}
          >
            <div className="flex items-center gap-2 font-semibold text-[13px] mb-2 text-emerald-500">
              <Sparkles size={14} />
              <span>{isThai ? "โมดูลหลักของ Horizon WMS ที่พร้อมใช้งาน:" : "Available Horizon WMS Core Modules:"}</span>
            </div>
            <ul className="list-disc list-inside space-y-1 pl-1 text-[12px] opacity-90">
              <li>{isThai ? "ข้อมูลสินค้าหลักและบาร์โค้ด (Product Master & Barcodes)" : "Product Master & Barcodes"}</li>
              <li>{isThai ? "ยอดสต็อกคงเหลือและประวัติบัญชีคลัง (Stock Balances & Ledger)" : "Stock Balances & Immutable Ledger"}</li>
              <li>{isThai ? "การรับสินค้าเข้าและโอนย้ายข้ามสาขา (Inbound Receiving & Transfers)" : "Goods Receiving & Multi-Branch Transfers"}</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="w-full flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => router.push("/warehouse/inventory")}
              className={`w-full sm:w-auto px-6 py-2.5 rounded-xl font-semibold text-[13.5px] transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm ${
                isLight
                  ? "bg-slate-900 hover:bg-black text-white"
                  : "bg-white hover:bg-zinc-200 text-black"
              }`}
            >
              <span>{isThai ? "ไปยังข้อมูลสินค้าหลัก" : "Go to Product Master"}</span>
              <ArrowRight size={14} />
            </button>

            <button
              type="button"
              onClick={() => router.push("/warehouse")}
              className={`w-full sm:w-auto px-5 py-2.5 rounded-xl font-medium text-[13.5px] border transition-colors cursor-pointer ${
                isLight
                  ? "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  : "bg-[#333333] border-[#444444] text-zinc-200 hover:bg-[#383838]"
              }`}
            >
              <span>{isThai ? "กลับหน้าภาพรวมคลัง" : "Back to Warehouse"}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </WarehousePageTemplate>
  );
}
