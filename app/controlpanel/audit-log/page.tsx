import { redirect } from "next/navigation";

export default function AuditLogIndexRoute() {
  redirect("/controlpanel/audit-log/catalog");
}
