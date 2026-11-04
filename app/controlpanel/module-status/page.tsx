import { redirect } from "next/navigation";
import { getActor } from "@/lib/warehouse/core";
import ControlPanelModuleStatusPage from "@/components/warehouse/ControlPanelModuleStatusPage";

export default async function ModuleStatusPage() {
  const actor = await getActor();
  if (actor.role !== "ADMIN") redirect("/controlpanel/users");
  return <ControlPanelModuleStatusPage />;
}
