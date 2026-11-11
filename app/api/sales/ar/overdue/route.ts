import { apiRoute } from "@/lib/core/http/handler";
import { jsonOkPage } from "@/lib/core/http/response";
import { requireModuleEnabled } from "@/lib/modules/status";
import { listOverdue } from "@/lib/sales/receivables";
import { getActor } from "@/lib/warehouse/core";
export const runtime = "nodejs";
export const GET = apiRoute(async (request) => {
  await requireModuleEnabled("sales");
  const result = await listOverdue(await getActor(request), new URL(request.url).searchParams);
  return jsonOkPage(request, result.items, result.page);
});
