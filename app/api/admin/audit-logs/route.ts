import { getAccessContext } from "@/lib/access/service";
import { listAuditLogs } from "@/lib/audit/service";
import type { AuditLogCategory } from "@/lib/audit/types";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonCollection } from "@/lib/core/http/response";
import { parsePageRequest } from "@/lib/core/http/pagination";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  const context = await getAccessContext(request);
  const url = new URL(request.url);
  const category = (url.searchParams.get("category") || "all") as AuditLogCategory;
  const entityType = url.searchParams.get("entityType") || undefined;
  const action = url.searchParams.get("action") || undefined;
  const search = url.searchParams.get("search") || undefined;
  const page = parsePageRequest(url);
  const facilityId = url.searchParams.get("facilityId") || undefined;

  const logs = await listAuditLogs(context, {
    category,
    entityType,
    action,
    search,
    facilityId,
    limit: page.limit,
    cursor: page.cursor,
  });

  return jsonCollection(request, logs.data, {
    limit: logs.limit,
    nextCursor: logs.nextCursor,
    hasMore: logs.hasMore,
  });
});
