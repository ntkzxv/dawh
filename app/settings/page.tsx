import type { Metadata } from "next";
import Settings from "@/components/warehouse/Settings";

export const metadata: Metadata = {
  title: "Settings",
  description: "Account Profile, Security, Credentials, and System Preferences",
};

export default function SettingsPage() {
  return <Settings />;
}
