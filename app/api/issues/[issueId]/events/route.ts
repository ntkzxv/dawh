import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor, id } from "@/lib/warehouse/core";
import { addIssueEvent } from "@/lib/warehouse/issues";
export const runtime = "nodejs";
export const POST = apiRoute<{ params: Promise<{ issueId: string }> }>(async (request, context) => jsonOk(request, await addIssueEvent(await getActor(request), id((await context.params).issueId), await parseJsonObject(request))));
