import type { Metadata } from "next";
import Settings from "@/components/warehouse/Settings";

export const metadata: Metadata = {
  title: "Settings",
  description: "System settings and organization configuration",
};

export default function SettingsPage() {
  return <Settings />;
}
