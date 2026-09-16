import type { Metadata } from "next";
import { PlaceholderBlockerView } from "@/components/common";

export const metadata: Metadata = {
  title: "Reports & Auditing",
  description: "Reports & Auditing module is currently under development.",
};

export default function ReportsPage() {
  return (
    <PlaceholderBlockerView
      numeral="404"
      badge="UNDER DEVELOPMENT"
      heading="Reports & Auditing"
      subtext="โมดูล Reports & Auditing ยังไม่ได้เปิดให้บริการ หรือกำลังอยู่ในขั้นตอนการพัฒนา"
      returnPath="/workspace"
    />
  );
}
