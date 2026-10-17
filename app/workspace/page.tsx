import type { Metadata } from "next";
import { redirect } from "next/navigation";
import Workspace from "@/components/warehouse/Workspace";
import AuthUnavailable from "@/app/_components/AuthUnavailable";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Enterprise Operations & Module Navigation Hub",
};

export default async function WorkspacePage() {
  let session;
  try {
    session = await getSession();
  } catch {
    return <AuthUnavailable />;
  }

  if (!session?.user) redirect("/auth/login?from=/workspace");

  return <Workspace />;
}
