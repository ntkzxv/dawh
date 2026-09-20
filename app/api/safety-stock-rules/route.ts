import { requireAccess } from "@/lib/access/service";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { nextCursor, parsePageRequest } from "@/lib/core/http/pagination";
import { jsonCollection, jsonOk } from "@/lib/core/http/response";
import { createSafetyStock, listSafetyStock } from "@/lib/safety-stock/service";
import { parseCreateSafetyStock } from "@/lib/safety-stock/validation";
export const runtime = "nodejs";
export const GET = apiRoute(async (r) => {
  const c = await requireAccess(r, { permission: "product.read" });
  const page = parsePageRequest(new URL(r.url));
  const rules = await listSafetyStock(c, page);
  const hasMore = rules.length > page.limit;
  const data = hasMore ? rules.slice(0, page.limit) : rules;
  return jsonCollection(r, data, {
    limit: page.limit,
    hasMore,
    nextCursor: hasMore
      ? nextCursor(rules, page.limit, (rule) => rule.createdAt)
      : null,
  });
});
export const POST = apiRoute(async (r) => {
  const c = await requireAccess(r, { permission: "admin.products.manage" });
  return jsonOk(
    r,
    await createSafetyStock(
      c,
      getRequestContext(r),
      parseCreateSafetyStock(await parseJsonObject(r)),
    ),
    201,
  );
});
