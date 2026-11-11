import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { requireModuleEnabled } from "@/lib/modules/status";
import { recordInstallmentPayment } from "@/lib/sales/payments";
import { getActor, id } from "@/lib/warehouse/core";
export const runtime = "nodejs";
export const POST = apiRoute<{ params: Promise<{ saleId: string }> }>(async (request, context) => {
  await requireModuleEnabled("sales");
  const actor = await getActor(request);
  const body = await parseJsonObject(request);
  const payment = await recordInstallmentPayment(
    actor, id((await context.params).saleId), body, request.headers.get("Idempotency-Key") ?? "",
  );
  return jsonOk(request, payment, payment.repeated ? 200 : 201);
});
