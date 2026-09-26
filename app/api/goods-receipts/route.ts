import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { createGoodsReceipt, listGoodsReceipts } from "@/lib/warehouse/goods-receipts";
export const runtime = "nodejs";
export const GET = apiRoute(async (request) => jsonOk(request, await listGoodsReceipts(await getActor(request))));
export const POST = apiRoute(async (request) => jsonOk(request, await createGoodsReceipt(await getActor(request), await parseJsonObject(request)), 201));
