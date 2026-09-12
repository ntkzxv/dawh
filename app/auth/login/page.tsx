import type { Metadata } from "next";
import { AuthView } from "@/components/auth";

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to DAWH Enterprise Portal",
};

export default function LoginPage() {
  return <AuthView initialMode="signin" />;
}
