import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor, id } from "@/lib/warehouse/core";
import { postGoodsReceipt } from "@/lib/warehouse/goods-receipts";
export const runtime = "nodejs";
export const POST = apiRoute<{ params: Promise<{ receiptId: string }> }>(async (request, context) => jsonOk(request, await postGoodsReceipt(await getActor(request), id((await context.params).receiptId), request.headers.get("idempotency-key") ?? "")));
