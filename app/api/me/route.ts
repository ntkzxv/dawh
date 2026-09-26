import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";

export const runtime = "nodejs";
export const GET = apiRoute(async (request) => jsonOk(request, await getActor(request, true)));
