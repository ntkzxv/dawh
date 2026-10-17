import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk, jsonOkPage } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { listLedger, listLedgerPage } from "@/lib/warehouse/stock";
export const runtime = "nodejs";
export const GET = apiRoute(async (request) => {
  const actor = await getActor(request);
  const search = new URL(request.url).searchParams;
  if (search.has("page")) {
    const result = await listLedgerPage(actor, search);
    return jsonOkPage(request, result.items, result.page);
  }
  return jsonOk(request, await listLedger(actor, search));
});
