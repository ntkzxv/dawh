import type { Metadata } from "next";
import { PlaceholderBlockerView } from "@/components/common";

export const metadata: Metadata = {
  title: "HP Datacenter",
  description: "HP Datacenter module is currently under development.",
};

export default function DatacenterPage() {
  return (
    <PlaceholderBlockerView
      numeral="404"
      badge="UNDER DEVELOPMENT"
      heading="HP Datacenter"
      subtext="โมดูล HP Datacenter ยังไม่ได้เปิดให้บริการ หรือกำลังอยู่ในขั้นตอนการพัฒนา"
      returnPath="/workspace"
    />
  );
}
