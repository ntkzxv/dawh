import type { Metadata } from "next";
import Settings from "@/components/warehouse/Settings";

export const metadata: Metadata = {
  title: "User Account Profile",
  description: "Employee Profile, Security, Credentials, and System Preferences",
};

export default function AccountPage() {
  return <Settings />;
}
