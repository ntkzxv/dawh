import { requireAccess } from "@/lib/access/service";
import { ValidationError } from "@/lib/core/http/errors";
import { apiRoute } from "@/lib/core/http/handler";
import { parsePageRequest, nextCursor } from "@/lib/core/http/pagination";
import { jsonCollection } from "@/lib/core/http/response";
import { isBigIntId } from "@/lib/core/ids/bigint";
import { listScopedStockBalances } from "@/lib/stock/service";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  const url = new URL(request.url);
  const facilityId = url.searchParams.get("facilityId") ?? undefined;
  if (facilityId && !isBigIntId(facilityId)) {
    throw new ValidationError({ facilityId: "Use a positive integer ID." });
  }

  const context = await requireAccess(request, {
    permission: "stock.read",
    facilityId,
    facilityScope: "READ",
  });
  const page = parsePageRequest(url);
  const balances = await listScopedStockBalances(context, page, facilityId);
  const hasMore = balances.length > page.limit;
  const data = hasMore ? balances.slice(0, page.limit) : balances;

  return jsonCollection(request, data, {
    limit: page.limit,
    nextCursor: hasMore ? nextCursor(balances, page.limit, (balance) => balance.updatedAt) : null,
    hasMore,
  });
});
