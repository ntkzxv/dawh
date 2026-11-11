import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk, jsonOkPage } from "@/lib/core/http/response";
import { requireModuleEnabled } from "@/lib/modules/status";
import { createSale, listSales } from "@/lib/sales/sales";
import { getActor } from "@/lib/warehouse/core";
export const runtime = "nodejs";
export const GET = apiRoute(async (request) => {
  await requireModuleEnabled("sales");
  const result = await listSales(await getActor(request), new URL(request.url).searchParams);
  return jsonOkPage(request, result.items, result.page);
});
export const POST = apiRoute(async (request) => {
  await requireModuleEnabled("sales");
  const actor = await getActor(request);
  const sale = await createSale(actor, await parseJsonObject(request), request.headers.get("Idempotency-Key") ?? "");
  return jsonOk(request, sale, sale.repeated ? 200 : 201);
});
