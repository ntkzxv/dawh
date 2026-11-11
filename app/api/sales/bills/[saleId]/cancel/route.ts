import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { requireModuleEnabled } from "@/lib/modules/status";
import { cancelSale } from "@/lib/sales/sales";
import { getActor, id } from "@/lib/warehouse/core";
export const runtime = "nodejs";
export const POST = apiRoute<{ params: Promise<{ saleId: string }> }>(async (request, context) => {
  await requireModuleEnabled("sales");
  const actor = await getActor(request);
  const body = await parseJsonObject(request);
  return jsonOk(request, await cancelSale(actor, id((await context.params).saleId), body.reason));
});
