import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { postStockDocument } from "@/lib/warehouse/stock-documents";

export const runtime = "nodejs";

export const POST = apiRoute(async (request) => {
  const actor = await getActor(request);
  const body = await parseJsonObject(request);
  const result = await postStockDocument(
    actor,
    body,
    request.headers.get("Idempotency-Key") ?? "",
  );
  return jsonOk(request, result, 201);
});
