import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { listModuleStatuses, updateModuleStatus } from "@/lib/modules/status";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  await getActor(request);
  return jsonOk(request, await listModuleStatuses());
});

export const PATCH = apiRoute(async (request) =>
  jsonOk(
    request,
    await updateModuleStatus(await getActor(request), await parseJsonObject(request)),
  ),
);
