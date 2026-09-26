import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { outstandingReport } from "@/lib/warehouse/reports";
export const runtime = "nodejs";
export const GET = apiRoute(async (request) => jsonOk(request, await outstandingReport(await getActor(request))));
