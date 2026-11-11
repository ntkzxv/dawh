import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { requireModuleEnabled } from "@/lib/modules/status";
import { getSale } from "@/lib/sales/sales";
import { getActor, id } from "@/lib/warehouse/core";
export const runtime = "nodejs";
export const GET = apiRoute<{ params: Promise<{ saleId: string }> }>(async (request, context) => {
  await requireModuleEnabled("sales");
  return jsonOk(request, await getSale(await getActor(request), id((await context.params).saleId)));
});
