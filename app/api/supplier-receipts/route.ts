import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { createSupplierReceipt, listSupplierReceipts } from "@/lib/warehouse/supplier-receipts";
export const runtime = "nodejs";
export const GET = apiRoute(async (request) => jsonOk(request, await listSupplierReceipts(await getActor(request))));
export const POST = apiRoute(async (request) => jsonOk(request, await createSupplierReceipt(await getActor(request), await parseJsonObject(request)), 201));
