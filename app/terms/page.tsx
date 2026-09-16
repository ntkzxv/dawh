"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ShieldCheck,
  FileText,
  Lock,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  X,
  ExternalLink,
  ChevronDown,
  Building2,
  HelpCircle,
  Eye,
  Sun,
  Moon,
  Globe,
} from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { getDawhLogo } from "@/config/brand";

export default function TermsPage() {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const [lang, setLang] = useState<"TH" | "EN">("TH");
  const isThai = lang === "TH";

  const handleClose = () => {
    if (typeof window !== "undefined") {
      window.close();
      setTimeout(() => {
        if (!window.closed) {
          window.location.href = "/account";
        }
      }, 150);
    }
  };

  return (
    <div
      className={`h-screen flex flex-col overflow-hidden selection:bg-[#2EC4B6]/20 ${
        isLight ? "bg-[#F8FAFC] text-[#222222]" : "bg-[#181818] text-[#FFFFFF]"
      }`}
      style={{
        fontFamily: isThai
          ? "var(--font-prompt), sans-serif"
          : "var(--font-outfit), sans-serif",
      }}
    >
      {/* Top Header */}
      <header
        className={`shrink-0 z-40 w-full border-b backdrop-blur-md transition-colors ${
          isLight
            ? "bg-white/90 border-[#E2E8F0] shadow-xs"
            : "bg-[#222222]/90 border-[#383838]"
        }`}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src={getDawhLogo(theme, "horizontal")}
              alt="DAWH Logo"
              width={160}
              height={40}
              className="h-[34px] sm:h-[38px] w-auto object-contain cursor-pointer"
              priority
            />
          </Link>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Language Switcher */}
            <button
              type="button"
              onClick={() => setLang(isThai ? "EN" : "TH")}
              className={`h-[34px] w-[74px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
                isLight
                  ? "bg-white border-[#E2E8F0] text-zinc-700 hover:bg-slate-50"
                  : "bg-[#282828] border-[#444444] text-zinc-300 hover:bg-[#333333]"
              }`}
              title={isThai ? "Switch to English" : "เปลี่ยนเป็นภาษาไทย"}
            >
              <Globe size={13} />
              <span>{isThai ? "EN" : "TH"}</span>
            </button>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className={`h-[34px] w-[74px] flex items-center justify-center gap-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer shrink-0 ${
                isLight
                  ? "bg-white border-[#E2E8F0] text-zinc-700 hover:bg-slate-50"
                  : "bg-[#282828] border-[#444444] text-zinc-300 hover:bg-[#333333]"
              }`}
              title={isLight ? "Dark Mode" : "Light Mode"}
            >
              {isLight ? <Moon size={13} /> : <Sun size={13} />}
              <span>{isLight ? "Dark" : "Light"}</span>
            </button>

            {/* Divider */}
            <div
              className={`h-4 w-[1px] mx-0.5 sm:mx-1 ${
                isLight ? "bg-zinc-200" : "bg-[#444444]"
              }`}
            />

            {/* Close Tab / Back Button */}
            <button
              type="button"
              onClick={handleClose}
              className={`h-[34px] inline-flex items-center justify-center gap-1.5 px-3.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer shrink-0 leading-none ${
                isLight
                  ? "bg-[#222222] hover:bg-black text-white border-transparent shadow-sm"
                  : "bg-white hover:bg-zinc-100 text-[#222222] border-transparent shadow-sm"
              }`}
            >
              <X size={14} className="shrink-0" />
              <span className="leading-none flex items-center">{isThai ? "ปิดหน้านี้" : "Close Window"}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Scroll Area */}
      <div className="flex-1 w-full overflow-y-auto min-h-0">
        <main className="max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col gap-8">
        {/* Title Header Section (No Box, Divider with Right-Aligned Date) */}
        <div className="flex flex-col gap-2 pt-2">
          <div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight"
              style={{
                fontFamily: isThai
                  ? "var(--font-prompt), sans-serif"
                  : "var(--font-outfit), sans-serif",
              }}
            >
              {isThai
                ? "ข้อกำหนดการให้บริการและนโยบายการคุ้มครองข้อมูลส่วนบุคคล"
                : "Terms of Service & Personal Data Protection Policy"}
            </h1>
            <p
              className={`mt-2 text-xs sm:text-sm leading-relaxed max-w-2xl ${
                isLight ? "text-zinc-600" : "text-zinc-400"
              }`}
            >
              {isThai
                ? "เอกสารนี้กำหนดข้อตกลง สิทธิ หน้าที่ และมาตรฐานความปลอดภัยในการเข้าถึงและการใช้งานระบบงานองค์กร DAWH ของบุคลากรและเจ้าหน้าที่ทุกระดับ"
                : "This policy outlines terms, rights, security responsibilities, and standards governing employee access to the DAWH enterprise ecosystem."}
            </p>
          </div>

          {/* Date aligned to the right, directly above the divider line */}
          <div className="flex justify-end items-center w-full pt-1 pb-1">
            <span
              className={`text-xs font-medium ${
                isLight ? "text-zinc-500" : "text-zinc-400"
              }`}
            >
              {isThai ? "ฉบับปรับปรุง: กันยายน 2026" : "Effective Date: September 2026"}
            </span>
          </div>

          {/* Divider line separating title from content below */}
          <div
            className={`w-full border-b ${
              isLight ? "border-zinc-200" : "border-[#383838]"
            }`}
          />
        </div>

        {/* Policy Content Sections (No Boxes, Pure Text Content) */}
        <div className="flex flex-col gap-8">
          {/* Section 1 */}
          <div className="flex flex-col gap-2">
            <h2 className="text-base sm:text-lg font-bold leading-tight">
              {isThai
                ? "1. วัตถุประสงค์และการคุ้มครองข้อมูลส่วนบุคคล"
                : "1. Purpose & PDPA Compliance"}
            </h2>
            <div
              className={`text-xs sm:text-[13px] leading-relaxed space-y-2 ${
                isLight ? "text-zinc-600" : "text-zinc-300"
              }`}
            >
              <p>
                {isThai
                  ? "องค์กรจัดเก็บ รวบรวม และประมวลผลข้อมูลส่วนบุคคลของท่าน (รวมถึง ชื่อ นามสกุล เลขบัตรประชาชน วันเดือนปีเกิด ข้อมูลการศึกษา ประวัติการติดต่อ และที่อยู่) เพื่อวัตถุประสงค์ในการระบุตัวตน การบริหารงานบุคคล สิทธิประโยชน์พนักงาน และการอนุญาตเข้าถึงระบบงานตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)"
                  : "The enterprise collects, stores, and processes your personal data (including full name, citizen ID, birth date, educational qualifications, contact records, and addresses) strictly for identification, human resources management, authorized clearances, and compliance with data protection laws."}
              </p>
              <p>
                {isThai
                  ? "ข้อมูลส่วนบุคคลทั้งหมดจะได้รับการคุ้มครองด้วยการเข้ารหัสในระดับฐานข้อมูลและจำกัดสิทธิ์การเข้าถึงเฉพาะบุคลากรที่ได้รับมอบหมายตามหน้าที่เท่านั้น"
                  : "All personal records are encrypted at rest and access is restricted strictly on a need-to-know basis according to role assignments."}
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="flex flex-col gap-2">
            <h2 className="text-base sm:text-lg font-bold leading-tight">
              {isThai
                ? "2. การรับรองความถูกต้องของข้อมูล"
                : "2. Data Authenticity & Verification"}
            </h2>
            <div
              className={`text-xs sm:text-[13px] leading-relaxed space-y-2 ${
                isLight ? "text-zinc-600" : "text-zinc-300"
              }`}
            >
              <p>
                {isThai
                  ? "พนักงานผู้ลงทะเบียนรับรองว่าข้อมูลทุกรายการที่บันทึกในระบบเป็นความจริง ถูกต้อง และเป็นปัจจุบัน การปลอมแปลงข้อมูลหรือจงใจระบุข้อมูลอันเป็นเท็จถือเป็นการกระทำผิดวินัยและอาจมีผลตามกฎหมาย"
                  : "The registered personnel explicitly certifies that all submitted records are truthful, accurate, and up-to-date. Misrepresentation, falsification, or fraudulent input constitutes disciplinary violation subject to corrective measures."}
              </p>
              <p>
                {isThai
                  ? "หากมีการเปลี่ยนแปลงข้อมูลส่วนบุคคล เช่น เบอร์โทรศัพท์ ที่อยู่ หรือผู้ติดต่อฉุกเฉิน พนักงานมีหน้าที่ต้องปรับปรุงข้อมูลในระบบให้เป็นปัจจุบันอย่างสม่ำเสมอ"
                  : "Should your personal contact details, residential address, or emergency contacts change, you are required to promptly update your profile records accordingly."}
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="flex flex-col gap-2">
            <h2 className="text-base sm:text-lg font-bold leading-tight">
              {isThai
                ? "3. ความปลอดภัยของบัญชีและรหัสผ่าน PIN 6 หลัก"
                : "3. Quick PIN & Credential Security"}
            </h2>
            <div
              className={`text-xs sm:text-[13px] leading-relaxed space-y-2 ${
                isLight ? "text-zinc-600" : "text-zinc-300"
              }`}
            >
              <p>
                {isThai
                  ? "รหัสผ่านและรหัส PIN 6 หลักที่ท่านกำหนด เป็นสิทธิ์เฉพาะบุคคลในการอนุมัติรายการและเข้าถึงระบบงานที่มีความสำคัญ ห้ามเปิดเผย บันทึกในที่สาธารณะ หรือยินยอมให้บุคคลอื่นนำไปใช้โดยเด็ดขาด"
                  : "Your account password and the 6-digit Quick PIN are strictly confidential and non-transferable personal credentials used for fast authentication and transaction clearances. Do not disclose or share your credentials under any circumstances."}
              </p>
              <p>
                {isThai
                  ? "การทำธุรกรรมหรือกิจกรรมใดๆ ที่กระทำภายใต้บัญชีและรหัส PIN ของท่าน จะถือว่ากระทำโดยความรับผิดชอบของเจ้าของบัญชี"
                  : "Any operations or transactions executed under your authenticated session and verified PIN code are deemed to be authorized by you."}
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="flex flex-col gap-2">
            <h2 className="text-base sm:text-lg font-bold leading-tight">
              {isThai
                ? "4. การรักษาความลับของข้อมูลองค์กร"
                : "4. Enterprise Confidentiality & Non-Disclosure"}
            </h2>
            <div
              className={`text-xs sm:text-[13px] leading-relaxed space-y-2 ${
                isLight ? "text-zinc-600" : "text-zinc-300"
              }`}
            >
              <p>
                {isThai
                  ? "ข้อมูลสต็อกคลังสินค้า เอกสารบัญชี สถิติลูกค้า รายการคำสั่งซื้อ และข้อมูลธุรกิจทั้งหมดภายในระบบ DAWH ถือเป็นทรัพย์สินทางปัญญาและความลับทางการค้าของบริษัท ห้ามคัดลอก เผยแพร่ หรือนำออกไปใช้ภายนอกองค์กรโดยไม่ได้รับอนุญาตเป็นลายลักษณ์อักษร"
                  : "All inventory ledger balances, warehouse stock transactions, customer data, and operational records inside DAWH are proprietary enterprise assets. Copying, exporting, or disseminating enterprise data without authorization is strictly prohibited."}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Footer Note (No Box, No Background, No Border) */}
        <div
          className={`pt-8 pb-12 text-center flex flex-col items-center gap-2 border-t ${
            isLight
              ? "border-zinc-200 text-zinc-500"
              : "border-[#383838] text-zinc-400"
          }`}
        >
          <span className="text-xs font-bold">DAWH Enterprise System</span>
          <p className="text-xs max-w-md mx-auto leading-relaxed">
            {isThai
              ? "หากมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัวหรือต้องการสอบถามข้อมูลเพิ่มเติม สามารถติดต่อฝ่ายบริหารทรัพยากรบุคคล (HR) หรือผู้ดูแลระบบสารสนเทศ (IT Support)"
              : "For inquiries regarding terms or data privacy rights, please contact the Human Resources Department or IT Operations Support."}
          </p>
        </div>
      </main>
      </div>
    </div>
  );
}
