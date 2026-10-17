import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor, id } from "@/lib/warehouse/core";
import { reverseStockDocument } from "@/lib/warehouse/stock-documents";

export const runtime = "nodejs";

export const POST = apiRoute<{ params: Promise<{ documentId: string }> }>(
  async (request, context) => {
    const actor = await getActor(request);
    const documentId = id((await context.params).documentId);
    const body = await parseJsonObject(request);
    return jsonOk(request, await reverseStockDocument(actor, documentId, body.reason));
  },
);
