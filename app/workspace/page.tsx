import type { Metadata } from "next";
import Workspace from "@/components/warehouse/Workspace";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Enterprise Operations & Module Navigation Hub",
};

export default function WorkspacePage() {
  return <Workspace />;
}
