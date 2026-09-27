import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import AuthUnavailable from "./_components/AuthUnavailable";
import DawhLandingPage from "./landing-page/page";

export const metadata: Metadata = {
  title: "DAWH Enterprise Platform",
  description: "Enterprise Operations & Module Navigation Hub",
};

export default async function Home() {
  let session;
  try {
    session = await getSession();
  } catch {
    return <AuthUnavailable />;
  }
  if (session?.user) redirect("/workspace");
  return <DawhLandingPage />;
}
