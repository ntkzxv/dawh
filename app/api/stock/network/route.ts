import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { listBalances } from "@/lib/warehouse/stock";
export const runtime = "nodejs";
export const GET = apiRoute(async (request) => {
  const source = new URL(request.url).searchParams;
  const filters = new URLSearchParams();
  const warehouseId = source.get("warehouseId");
  const productId = source.get("productId");
  if (warehouseId) filters.set("warehouseId", warehouseId);
  if (productId) filters.set("productId", productId);
  return jsonOk(request, await listBalances(await getActor(request), filters));
});
