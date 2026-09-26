import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor, id } from "@/lib/warehouse/core";
import { getIssue } from "@/lib/warehouse/issues";
export const runtime = "nodejs";
export const GET = apiRoute<{ params: Promise<{ issueId: string }> }>(async (request, context) => jsonOk(request, await getIssue(await getActor(request), id((await context.params).issueId))));
