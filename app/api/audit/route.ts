import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor, requireRole } from "@/lib/warehouse/core";
import { listAudit } from "@/lib/warehouse/stock";
import { AUDIT_CATEGORIES } from "@/components/warehouse/auditLog";
import { ValidationError } from "@/lib/core/http/errors";

export const runtime = "nodejs";
const PAGE_SIZE = 25;

function validDate(value: string | null, field: string) {
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError({ [field]: "Use a valid date in YYYY-MM-DD format." });
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new ValidationError({ [field]: "Choose a valid date." });
  }
  return value;
}

export const GET = apiRoute(async (request) => {
  const actor = await getActor(request);
  requireRole(actor, ["ADMIN", "CEO"]);
  const params = new URL(request.url).searchParams;
  const categoryId = params.get("category");
  const category = AUDIT_CATEGORIES.find((item) => item.id === categoryId);
  if (!category) throw new ValidationError({ category: "Choose a valid audit category." });

  const actorQuery = (params.get("q") ?? "").trim().slice(0, 120);
  const numericSearch = /^\d+$/.test(actorQuery) ? Number(actorQuery) : undefined;
  const entityIdSearch = Number.isSafeInteger(numericSearch) && (numericSearch ?? 0) > 0
    ? numericSearch
    : undefined;
  const action = params.get("action") ?? undefined;
  if (action && !category.actions.includes(action)) {
    throw new ValidationError({ action: "Choose an event in this category." });
  }
  const entityType = params.get("entityType") ?? undefined;
  if (entityType && !category.entityTypes.includes(entityType)) {
    throw new ValidationError({ entityType: "Choose a record type in this category." });
  }
  const sortValue = params.get("sort") ?? "date_desc";
  const allowedSorts = ["date_desc", "date_asc", "name_asc", "name_desc"] as const;
  if (!allowedSorts.includes(sortValue as (typeof allowedSorts)[number])) {
    throw new ValidationError({ sort: "Choose a valid sort order." });
  }
  const from = validDate(params.get("from"), "from");
  const to = validDate(params.get("to"), "to");
  if (from && to && from > to) {
    throw new ValidationError({ to: "End date must be on or after start date." });
  }
  const parsedPage = Number(params.get("page") ?? "1");
  const page = Number.isSafeInteger(parsedPage) && parsedPage > 0
    ? Math.min(parsedPage, 1_000_000)
    : 1;
  const result = await listAudit(actor, {
    actions: category.actions,
    action,
    entityType,
    entityIdSearch,
    actorQuery,
    from,
    to,
    sort: sortValue as (typeof allowedSorts)[number],
    page,
    limit: PAGE_SIZE,
  });
  return jsonOk(request, result);
});
