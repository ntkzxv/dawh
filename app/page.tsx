import type { Metadata } from "next";
import { getSession } from "@/lib/auth/session";
import RootSessionGate from "./_components/RootSessionGate";

export const metadata: Metadata = {
  title: "DAWH Enterprise Platform",
  description: "Enterprise Operations & Module Navigation Hub",
};

export default async function Home() {
  let hasSession = false;
  try {
    const session = await getSession();
    hasSession = !!session?.user;
  } catch {
    hasSession = false;
  }

  return <RootSessionGate initialHasSession={hasSession} />;
}
