import { apiRoute } from "@/lib/core/http/handler";
import { jsonOkPage } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { listStockTransfersPage } from "@/lib/warehouse/stock";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  const actor = await getActor(request);
  const search = new URL(request.url).searchParams;
  const result = await listStockTransfersPage(actor, search);
  return jsonOkPage(
    request,
    { items: result.items, summary: result.summary },
    result.page,
  );
});
