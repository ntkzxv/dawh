import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor, id } from "@/lib/warehouse/core";
import { reverseStockDocument } from "@/lib/warehouse/stock-documents";
export const runtime = "nodejs";
export const POST = apiRoute<{ params: Promise<{ documentId: string }> }>(async (request, context) => {
  const body = await parseJsonObject(request);
  return jsonOk(request, await reverseStockDocument(await getActor(request), id((await context.params).documentId), body.reason));
});
