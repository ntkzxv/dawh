import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthView } from "@/components/auth";
import { getSession } from "@/lib/auth/session";
import AuthUnavailable from "@/app/_components/AuthUnavailable";

export const metadata: Metadata = {
  title: "Authentication",
  description: "DAWH Enterprise Identity & Access Management",
};

export default async function AuthPage() {
  let session;
  try {
    session = await getSession();
  } catch {
    return <AuthUnavailable />;
  }
  if (session?.user) redirect("/workspace");
  return <AuthView initialMode="signin" />;
}
