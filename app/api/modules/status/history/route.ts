import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { requireRole } from "@/lib/warehouse/access";
import { listModuleStatusHistory } from "@/lib/modules/status";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  requireRole(await getActor(request), ["ADMIN"]);
  return jsonOk(request, await listModuleStatusHistory());
});
