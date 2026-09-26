import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { postStockDocument } from "@/lib/warehouse/stock-documents";
export const runtime = "nodejs";
export const POST = apiRoute(async (request) => jsonOk(request, await postStockDocument(await getActor(request), await parseJsonObject(request), request.headers.get("idempotency-key") ?? ""), 201));
