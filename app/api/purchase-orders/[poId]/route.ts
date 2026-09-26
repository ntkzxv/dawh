import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor, id } from "@/lib/warehouse/core";
import { getPurchaseOrder, updatePurchaseOrder } from "@/lib/warehouse/purchase-orders";
import { parseJsonObject } from "@/lib/core/http/body";
export const runtime = "nodejs";
export const GET = apiRoute<{ params: Promise<{ poId: string }> }>(async (request, context) => jsonOk(request, await getPurchaseOrder(await getActor(request), id((await context.params).poId))));
export const PATCH = apiRoute<{ params: Promise<{ poId: string }> }>(async (request, context) => jsonOk(request, await updatePurchaseOrder(await getActor(request), id((await context.params).poId), await parseJsonObject(request))));
