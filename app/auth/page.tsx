import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthView } from "@/components/auth";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Authentication",
  description: "DAWH Enterprise Identity & Access Management",
};

export default async function AuthPage() {
  try {
    const session = await getSession();
    if (session?.user) {
      redirect("/workspace");
    }
  } catch (err) {
    if ((err as { digest?: string })?.digest?.startsWith("NEXT_REDIRECT")) {
      throw err;
    }
  }

  return <AuthView initialMode="signin" />;
}
