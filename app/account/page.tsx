import type { Metadata } from "next";
import AccountProfile from "@/components/warehouse/AccountProfile";

export const metadata: Metadata = {
  title: "User Account Profile",
  description: "Employee profile, account security, and personal credentials",
};

export default function AccountPage() {
  return <AccountProfile />;
}
