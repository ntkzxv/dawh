import type { Metadata } from "next";
import { PlaceholderBlockerView } from "@/components/common";

export const metadata: Metadata = {
  title: "Integration Services",
  description: "Integration Services module is currently under development.",
};

export default function IntegrationPage() {
  return (
    <PlaceholderBlockerView
      numeral="404"
      badge="UNDER DEVELOPMENT"
      heading="Integration Services"
      subtext="โมดูล Integration Services ยังไม่ได้เปิดให้บริการ หรือกำลังอยู่ในขั้นตอนการพัฒนา"
      returnPath="/workspace"
    />
  );
}
