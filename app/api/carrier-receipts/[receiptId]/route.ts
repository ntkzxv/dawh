import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor, id } from "@/lib/warehouse/core";
import { getCarrierReceipt, updateCarrierReceipt } from "@/lib/warehouse/carrier-receipts";
import { parseJsonObject } from "@/lib/core/http/body";
export const runtime = "nodejs";
export const GET = apiRoute<{ params: Promise<{ receiptId: string }> }>(async (request, context) => jsonOk(request, await getCarrierReceipt(await getActor(request), id((await context.params).receiptId))));
export const PATCH = apiRoute<{ params: Promise<{ receiptId: string }> }>(async (request, context) => jsonOk(request, await updateCarrierReceipt(await getActor(request), id((await context.params).receiptId), await parseJsonObject(request))));
