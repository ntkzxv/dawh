import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { requireModuleEnabled } from "@/lib/modules/status";
import { arOverview } from "@/lib/sales/receivables";
import { getActor } from "@/lib/warehouse/core";
export const runtime = "nodejs";
export const GET = apiRoute(async (request) => {
  await requireModuleEnabled("sales");
  return jsonOk(request, await arOverview(await getActor(request)));
});
