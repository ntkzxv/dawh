import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { requireModuleEnabled } from "@/lib/modules/status";
import { getCustomer, updateCustomer } from "@/lib/sales/customers";
import { getActor, id } from "@/lib/warehouse/core";
export const runtime = "nodejs";
type Context = { params: Promise<{ customerId: string }> };
export const GET = apiRoute<Context>(async (request, context) => {
  await requireModuleEnabled("sales");
  return jsonOk(request, await getCustomer(await getActor(request), id((await context.params).customerId)));
});
export const PATCH = apiRoute<Context>(async (request, context) => {
  await requireModuleEnabled("sales");
  return jsonOk(request, await updateCustomer(await getActor(request), id((await context.params).customerId), await parseJsonObject(request)));
});
