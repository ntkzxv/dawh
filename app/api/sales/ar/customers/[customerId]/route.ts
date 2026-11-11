import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { requireModuleEnabled } from "@/lib/modules/status";
import { getCustomerProfile } from "@/lib/sales/receivables";
import { getActor, id } from "@/lib/warehouse/core";
export const runtime = "nodejs";
type Context = { params: Promise<{ customerId: string }> };
export const GET = apiRoute<Context>(async (request, context) => {
  await requireModuleEnabled("sales");
  return jsonOk(request, await getCustomerProfile(await getActor(request), id((await context.params).customerId)));
});
