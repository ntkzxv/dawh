import type { Metadata } from "next";
import { WorkspaceView } from "@/components/users";

export const metadata: Metadata = {
  title: "Workspace",
  description: "Enterprise Operations & Module Navigation Hub",
};

export default function WorkspacePage() {
  return <WorkspaceView />;
}
