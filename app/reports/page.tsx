"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Construction } from "lucide-react";
import { PlaceholderBlockerView } from "@/components/common";
import { useTheme } from "@/context/ThemeContext";
import { useAppLanguage } from "@/utils/language";

export default function ReportsPage() {
  const { theme } = useTheme();
  const isLight = theme === "light";
  const appLang = useAppLanguage();
  const isThai = appLang === "TH";
  const router = useRouter();
  const [count, setCount] = useState(10);

  useEffect(() => {
    if (count <= 0) {
      router.replace("/workspace");
      return;
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, router]);

  return (
    <PlaceholderBlockerView
      icon={
        <motion.div
          animate={{ x: [-5, 5, -5, 5, 0] }}
          transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 3, ease: "easeInOut" }}
        >
          <Construction
            size={56}
            strokeWidth={2.2}
            className={isLight ? "text-slate-900" : "text-white"}
          />
        </motion.div>
      }
      code="UNDER DEVELOPMENT"
      badgeTh="กำลังพัฒนา"
      badgeEn="UNDER DEVELOPMENT"
      headingTh="รายงานและตรวจสอบ"
      headingEn="Reports & Auditing"
      subtextTh="โมดูล Reports & Auditing ยังไม่ได้เปิดให้บริการ หรือกำลังอยู่ในขั้นตอนการพัฒนา"
      subtextEn="The Reports & Auditing module is currently under development and will be available in an upcoming update."
      returnPath="/workspace"
      bottomNote={
        <p className={`text-[12.5px] font-medium ${isLight ? "text-slate-400" : "text-zinc-500"}`}>
          {isThai
            ? `ระบบจะนำคุณกลับอัตโนมัติใน (${count}) วินาที`
            : `Redirecting to Workspace in (${count}) seconds`}
        </p>
      }
    />
  );
}
