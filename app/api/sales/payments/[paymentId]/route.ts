import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { requireModuleEnabled } from "@/lib/modules/status";
import { getReceipt } from "@/lib/sales/payments";
import { getActor, id } from "@/lib/warehouse/core";
export const runtime = "nodejs";
export const GET = apiRoute<{ params: Promise<{ paymentId: string }> }>(async (request, context) => {
  await requireModuleEnabled("sales");
  return jsonOk(request, await getReceipt(await getActor(request), id((await context.params).paymentId)));
});
