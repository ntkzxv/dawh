import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { createCatalog, listCatalog } from "@/lib/warehouse/catalog";
import { getActor } from "@/lib/warehouse/core";
export const runtime = "nodejs";
type Context = { params: Promise<{ kind: string }> };
export const GET = apiRoute<Context>(async (request, context) => jsonOk(request, await listCatalog(await getActor(request), (await context.params).kind)));
export const POST = apiRoute<Context>(async (request, context) => jsonOk(request, await createCatalog(await getActor(request), (await context.params).kind, await parseJsonObject(request)), 201));
