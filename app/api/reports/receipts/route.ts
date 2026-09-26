import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { receiptReport } from "@/lib/warehouse/reports";
export const runtime = "nodejs";
export const GET = apiRoute(async (request) => jsonOk(request, await receiptReport(await getActor(request), new URL(request.url).searchParams)));
