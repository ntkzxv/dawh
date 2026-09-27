import { apiRoute } from "@/lib/core/http/handler";
import { jsonOkPage } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { listInventoryProducts } from "@/lib/warehouse/inventory-read";

export const runtime = "nodejs";
export const GET = apiRoute(async (request) => {
  const result = await listInventoryProducts(await getActor(request), new URL(request.url).searchParams);
  return jsonOkPage(request, result.items, result.page);
});
