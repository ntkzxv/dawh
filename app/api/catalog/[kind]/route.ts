import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk, jsonOkPage } from "@/lib/core/http/response";
import {
  createCatalog,
  listCatalog,
  listCatalogPage,
} from "@/lib/warehouse/catalog";
import { getActor } from "@/lib/warehouse/core";
export const runtime = "nodejs";
type Context = { params: Promise<{ kind: string }> };
export const GET = apiRoute<Context>(async (request, context) => {
  const actor = await getActor(request);
  const kind = (await context.params).kind;
  const search = new URL(request.url).searchParams;
  if (search.has("page")) {
    const result = await listCatalogPage(actor, kind, search);
    return jsonOkPage(request, result.items, result.page);
  }
  return jsonOk(request, await listCatalog(actor, kind, search));
});
export const POST = apiRoute<Context>(async (request, context) =>
  jsonOk(
    request,
    await createCatalog(
      await getActor(request),
      (await context.params).kind,
      await parseJsonObject(request),
    ),
    201,
  ),
);
