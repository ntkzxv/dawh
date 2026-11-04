import { apiRoute } from "@/lib/core/http/handler";
import { ValidationError } from "@/lib/core/http/errors";
import { jsonOkPage } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { requireRole } from "@/lib/warehouse/access";
import { listModuleStatusHistoryPage } from "@/lib/modules/status";
import { MANAGED_MODULE_KEYS, type ManagedModuleKey } from "@/lib/contracts/module-status";

export const runtime = "nodejs";

const isIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export const GET = apiRoute(async (request) => {
  requireRole(await getActor(request), ["ADMIN"]);
  const params = new URL(request.url).searchParams;
  const status = params.get("status") ?? "all";
  const moduleKeyValue = params.get("module") ?? "all";
  const pageValue = params.get("page") ?? "1";
  const limitValue = params.get("limit") ?? "25";
  const from = params.get("from") || undefined;
  const to = params.get("to") || undefined;
  const page = Number(pageValue);
  const limit = Number(limitValue);

  if (!Number.isSafeInteger(page) || page < 1) {
    throw new ValidationError({ page: "Page must be a positive integer." });
  }
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new ValidationError({ limit: "Limit must be between 1 and 100." });
  }
  if (status !== "all" && status !== "enabled" && status !== "disabled") {
    throw new ValidationError({ status: "Choose all, enabled, or disabled." });
  }
  if (moduleKeyValue !== "all" && !MANAGED_MODULE_KEYS.includes(moduleKeyValue as ManagedModuleKey)) {
    throw new ValidationError({ module: "Choose a supported module." });
  }
  if (from && !isIsoDate(from)) {
    throw new ValidationError({ from: "Start date must be a valid YYYY-MM-DD date." });
  }
  if (to && !isIsoDate(to)) {
    throw new ValidationError({ to: "End date must be a valid YYYY-MM-DD date." });
  }
  if (from && to && from > to) {
    throw new ValidationError({ dateRange: "Start date must be on or before end date." });
  }

  const result = await listModuleStatusHistoryPage({
    page,
    limit,
    enabled: status === "all" ? undefined : status === "enabled",
    moduleKey: moduleKeyValue === "all" ? undefined : moduleKeyValue as ManagedModuleKey,
    from,
    to,
  });

  return jsonOkPage(request, result.items, {
    limit,
    page,
    total: result.total,
    nextCursor: null,
    hasMore: page * limit < result.total,
  });
});
