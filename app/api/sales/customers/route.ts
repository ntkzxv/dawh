import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk, jsonOkPage } from "@/lib/core/http/response";
import { requireModuleEnabled } from "@/lib/modules/status";
import { createCustomer, listCustomers } from "@/lib/sales/customers";
import { getActor } from "@/lib/warehouse/core";
export const runtime = "nodejs";
export const GET = apiRoute(async (request) => {
  await requireModuleEnabled("sales");
  const result = await listCustomers(await getActor(request), new URL(request.url).searchParams);
  return jsonOkPage(request, result.items, result.page);
});
export const POST = apiRoute(async (request) => {
  await requireModuleEnabled("sales");
  return jsonOk(request, await createCustomer(await getActor(request), await parseJsonObject(request)), 201);
});
