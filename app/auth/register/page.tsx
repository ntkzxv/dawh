import type { Metadata } from "next";
import { AuthView } from "@/components/auth";

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create staff account for DAWH Enterprise Portal",
};

export default function RegisterPage() {
  return <AuthView initialMode="signup" />;
}
