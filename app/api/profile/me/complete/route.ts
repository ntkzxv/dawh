import { getAccessContext } from "@/lib/access/service";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { completeEmployeeProfile } from "@/lib/profiles/service";
import { parseCompleteEmployeeProfile } from "@/lib/profiles/validation";

export const runtime = "nodejs";

export const PUT = apiRoute(async (request) => {
  const context = await getAccessContext(request);
  const input = parseCompleteEmployeeProfile(await parseJsonObject(request));
  return jsonOk(request, await completeEmployeeProfile(context, getRequestContext(request), input));
});
