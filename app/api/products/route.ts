import { requireAccess } from "@/lib/access/service";
import { nextCursor } from "@/lib/core/http/pagination";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonCollection, jsonOk } from "@/lib/core/http/response";
import { createProduct, listProducts } from "@/lib/products/service";
import { parseCreateProduct, parseProductFilters } from "@/lib/products/validation";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  const context = await requireAccess(request, { permission: "product.read" });

  const filters = parseProductFilters(new URL(request.url));
  const page = filters.page;
  const products = await listProducts(context, filters);
  const hasMore = products.length > page.limit;
  const data = hasMore ? products.slice(0, page.limit) : products;

  return jsonCollection(request, data, {
    limit: page.limit,
    nextCursor: hasMore ? nextCursor(products, page.limit, (product) => product.createdAt) : null,
    hasMore,
  });
});

export const POST = apiRoute(async (request) => {
  const context = await requireAccess(request, { permission: "admin.products.manage" });
  return jsonOk(request, await createProduct(context, getRequestContext(request), parseCreateProduct(await parseJsonObject(request))), 201);
});
