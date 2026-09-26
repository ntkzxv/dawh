import type { Metadata } from "next";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
  title: "User Account Profile",
  description: "Employee Profile, Security, Credentials, and System Preferences",
};

export default function AccountPage() {
  redirect("/settings");
}
