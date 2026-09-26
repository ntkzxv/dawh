import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor, id } from "@/lib/warehouse/core";
import { restoreMember } from "@/lib/warehouse/members";
export const runtime = "nodejs";
export const POST = apiRoute<{ params: Promise<{ memberId: string }> }>(async (request, context) => jsonOk(request, await restoreMember(await getActor(request), id((await context.params).memberId))));
