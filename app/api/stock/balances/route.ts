import { requireAccess } from "@/lib/access/service";
import { apiRoute } from "@/lib/core/http/handler";
import { nextCursor } from "@/lib/core/http/pagination";
import { jsonCollection } from "@/lib/core/http/response";
import { listScopedStockBalances } from "@/lib/stock/service";
import { parseStockBalanceFilters } from "@/lib/stock/validation";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  const url = new URL(request.url);
  const filters = parseStockBalanceFilters(url);

  const context = await requireAccess(request, {
    permission: "stock.read",
    facilityId: filters.facilityId ?? undefined,
    facilityScope: "READ",
  });
  const page = filters.page;
  const balances = await listScopedStockBalances(context, filters);
  const hasMore = balances.length > page.limit;
  const data = hasMore ? balances.slice(0, page.limit) : balances;

  return jsonCollection(request, data, {
    limit: page.limit,
    nextCursor: hasMore
      ? nextCursor(balances, page.limit, (balance) => balance.updatedAt)
      : null,
    hasMore,
  });
});
