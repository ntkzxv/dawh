import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { getWarehouseDashboard } from "@/lib/warehouse/dashboard";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  const search = new URL(request.url).searchParams;
  return jsonOk(request, await getWarehouseDashboard(await getActor(request), search));
});
