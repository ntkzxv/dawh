import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor, id } from "@/lib/warehouse/core";
import { confirmDelivery } from "@/lib/warehouse/carrier-receipts";
export const runtime = "nodejs";
export const POST = apiRoute<{ params: Promise<{ receiptId: string }> }>(async (request, context) => jsonOk(request, await confirmDelivery(await getActor(request), id((await context.params).receiptId), await parseJsonObject(request)), 201));
