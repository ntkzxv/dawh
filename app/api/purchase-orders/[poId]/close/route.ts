import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor, id } from "@/lib/warehouse/core";
import { closePurchaseOrder } from "@/lib/warehouse/purchase-orders";
export const runtime = "nodejs";
export const POST = apiRoute<{ params: Promise<{ poId: string }> }>(async (request, context) => jsonOk(request, await closePurchaseOrder(await getActor(request), id((await context.params).poId))));
