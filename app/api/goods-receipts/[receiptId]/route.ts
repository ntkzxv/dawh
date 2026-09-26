import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor, id } from "@/lib/warehouse/core";
import { getGoodsReceipt } from "@/lib/warehouse/goods-receipts";
export const runtime = "nodejs";
export const GET = apiRoute<{ params: Promise<{ receiptId: string }> }>(async (request, context) => jsonOk(request, await getGoodsReceipt(await getActor(request), id((await context.params).receiptId))));
