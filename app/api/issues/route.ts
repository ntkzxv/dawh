import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";
import { createIssue, listIssues } from "@/lib/warehouse/issues";
export const runtime = "nodejs";
export const GET = apiRoute(async (request) => jsonOk(request, await listIssues(await getActor(request))));
export const POST = apiRoute(async (request) => jsonOk(request, await createIssue(await getActor(request), await parseJsonObject(request)), 201));
