import type { Metadata } from "next";
import { SettingsView } from "@/components/users";

export const metadata: Metadata = {
  title: "Settings",
  description: "Account Profile, Security, Credentials, and System Preferences",
};

export default function SettingsPage() {
  return <SettingsView />;
}
