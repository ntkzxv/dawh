import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthView } from "@/components/auth";
import { getSession } from "@/lib/auth/session";
import AuthUnavailable from "@/app/_components/AuthUnavailable";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to DAWH Enterprise Portal",
};

export default async function LoginPage() {
  let session;
  try {
    session = await getSession();
  } catch {
    return <AuthUnavailable />;
  }
  if (session?.user) redirect("/workspace");
  return <AuthView initialMode="signin" />;
}
