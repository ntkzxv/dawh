import type { Metadata } from "next";
import { AuthView } from "@/components/auth";

export const metadata: Metadata = {
  title: "Authentication",
  description: "DAWH Enterprise Identity & Access Management",
};

export default function AuthPage() {
  return <AuthView initialMode="signin" />;
}
