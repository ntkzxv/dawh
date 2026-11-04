import { redirect } from "next/navigation";
import { getActor } from "@/lib/warehouse/core";
import ModuleStatusHistoryPage from "@/components/warehouse/ModuleStatusHistoryPage";

export default async function ModuleStatusHistoryRoute() {
  const actor = await getActor();
  if (actor.role !== "ADMIN") redirect("/controlpanel/users");
  return <ModuleStatusHistoryPage />;
}
