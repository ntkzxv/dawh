import type { Metadata } from "next";
import { SettingsView } from "@/components/users";

export const metadata: Metadata = {
  title: "Account Settings",
  description: "Account Profile, Security, Credentials, and System Preferences",
};

export default function AccountPage() {
  return <SettingsView />;
}
