import type { Metadata } from "next";
import { PlaceholderBlockerView } from "@/components/common";

export const metadata: Metadata = {
  title: "Page Not Found",
  description: "The requested page is currently under development or does not exist.",
};

export default function NotFound() {
  return (
    <PlaceholderBlockerView
      numeral="404"
      badge="SYSTEM 404"
    />
  );
}
