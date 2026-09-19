import { getAccessContext } from "@/lib/access/service";
import { listAuditLogs } from "@/lib/audit/service";
import type { AuditLogCategory } from "@/lib/audit/types";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  const context = await getAccessContext(request);
  const url = new URL(request.url);
  const category = (url.searchParams.get("category") || "all") as AuditLogCategory;
  const entityType = url.searchParams.get("entityType") || undefined;
  const action = url.searchParams.get("action") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const limit = url.searchParams.has("limit") ? Number(url.searchParams.get("limit")) : 100;
  const offset = url.searchParams.has("offset") ? Number(url.searchParams.get("offset")) : 0;

  const logs = await listAuditLogs(context, {
    category,
    entityType,
    action,
    search,
    limit,
    offset,
  });

  return jsonOk(request, logs);
});
