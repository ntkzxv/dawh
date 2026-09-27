import { apiRoute } from "@/lib/core/http/handler";
import { jsonOkPage } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { outstandingReport } from "@/lib/warehouse/reports";
export const runtime = "nodejs";
export const GET = apiRoute(async (request) => {
  const result = await outstandingReport(await getActor(request), new URL(request.url).searchParams);
  return jsonOkPage(request, result.items, result.page);
});
