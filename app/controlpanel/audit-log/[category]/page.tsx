import { notFound, redirect } from "next/navigation";
import AuditCategoryPage from "@/components/warehouse/AuditCategoryPage";
import { AUDIT_CATEGORIES } from "@/components/warehouse/auditLog";
import { getActor } from "@/lib/warehouse/core";

export default async function AuditLogCategoryRoute({
  params,
}: {
  params: Promise<{ category: string }>;
}) {
  const { category } = await params;
  const selected = AUDIT_CATEGORIES.find((item) => item.id === category);
  if (!selected) notFound();
  const actor = await getActor();
  if (actor.role !== "ADMIN" && actor.role !== "CEO") redirect("/controlpanel");
  return <AuditCategoryPage categoryId={selected.id} />;
}
