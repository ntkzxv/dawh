import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { requireModuleEnabled } from "@/lib/modules/status";
import { voidInstallmentPayment } from "@/lib/sales/payments";
import { getActor, id } from "@/lib/warehouse/core";
export const runtime = "nodejs";
export const POST = apiRoute<{ params: Promise<{ paymentId: string }> }>(async (request, context) => {
  await requireModuleEnabled("sales");
  const actor = await getActor(request);
  const body = await parseJsonObject(request);
  return jsonOk(request, await voidInstallmentPayment(actor, id((await context.params).paymentId), body.reason));
});
