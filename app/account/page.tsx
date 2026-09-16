import type { Metadata } from "next";
import { AccountView } from "@/components/users";

export const metadata: Metadata = {
  title: "User Account Profile",
  description: "Employee Profile, Security, Credentials, and System Preferences",
};

export default function AccountPage() {
  return <AccountView />;
}
