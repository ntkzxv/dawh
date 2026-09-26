import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { listAudit } from "@/lib/warehouse/stock";
export const runtime = "nodejs";
export const GET = apiRoute(async (request) => jsonOk(request, await listAudit(await getActor(request))));
