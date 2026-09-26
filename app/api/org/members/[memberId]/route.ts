import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor, id } from "@/lib/warehouse/core";
import { getMember, softDeleteMember, updateMember } from "@/lib/warehouse/members";

export const runtime = "nodejs";
type Context = { params: Promise<{ memberId: string }> };
export const GET = apiRoute<Context>(async (request, context) => {
  const actor = await getActor(request);
  return jsonOk(request, await getMember(actor, id((await context.params).memberId)));
});
export const PATCH = apiRoute<Context>(async (request, context) => jsonOk(request, await updateMember(await getActor(request), id((await context.params).memberId), await parseJsonObject(request))));
export const DELETE = apiRoute<Context>(async (request, context) => jsonOk(request, await softDeleteMember(await getActor(request), id((await context.params).memberId))));
