import type { Metadata } from "next";
import { PlaceholderBlockerView } from "@/components/common";

export const metadata: Metadata = {
  title: "Feature Not Available",
  description: "This feature is currently under development and not yet available for use.",
};

export default function NotFound() {
  return (
    <PlaceholderBlockerView
      code="404"
      badgeTh="กำลังพัฒนาฟีเจอร์"
      badgeEn="FEATURE IN DEVELOPMENT"
      headingTh="ฟีเจอร์นี้ยังไม่พร้อมใช้งาน"
      headingEn="Feature Not Available Yet"
      subtextTh="ฟังก์ชันหรือระบบนี้กำลังอยู่ในขั้นตอนการพัฒนา และยังไม่พร้อมเปิดให้ใช้งานในขณะนี้ ขออภัยในความไม่สะดวก"
      subtextEn="This feature is currently under development and not yet available for use. Please check back later."
      returnPath="/workspace"
    />
  );
}
