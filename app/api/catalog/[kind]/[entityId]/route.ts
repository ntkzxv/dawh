import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { updateCatalog } from "@/lib/warehouse/catalog";
import { getActor, id } from "@/lib/warehouse/core";
export const runtime = "nodejs";
export const PATCH = apiRoute<{ params: Promise<{ kind: string; entityId: string }> }>(async (request, context) => {
  const params = await context.params;
  return jsonOk(request, await updateCatalog(await getActor(request), params.kind, id(params.entityId), await parseJsonObject(request)));
});
