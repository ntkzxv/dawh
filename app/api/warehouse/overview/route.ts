import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { getWarehouseOverview } from "@/lib/warehouse/overview";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) =>
  jsonOk(request, await getWarehouseOverview(await getActor(request))),
);
