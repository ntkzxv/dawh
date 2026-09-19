import { requireAccess } from "@/lib/access/service";
import { parsePageRequest, nextCursor } from "@/lib/core/http/pagination";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonCollection } from "@/lib/core/http/response";
import { listProducts } from "@/lib/products/service";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  const context = await requireAccess(request, { permission: "product.read" });

  const page = parsePageRequest(new URL(request.url));
  const products = await listProducts(context.organization.id, page);
  const hasMore = products.length > page.limit;
  const data = hasMore ? products.slice(0, page.limit) : products;

  return jsonCollection(request, data, {
    limit: page.limit,
    nextCursor: hasMore ? nextCursor(products, page.limit, (product) => product.createdAt) : null,
    hasMore,
  });
});
