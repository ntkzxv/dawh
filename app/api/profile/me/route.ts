import { getAccessContext, ProfileIncompleteError } from "@/lib/access/service";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { toEmployeeProfileDto, updateEmployeeProfile } from "@/lib/profiles/service";
import { parseUpdateEmployeeProfile } from "@/lib/profiles/validation";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  const context = await getAccessContext(request);
  const profile = context.profile ? await toEmployeeProfileDto(context.profile) : null;
  return jsonOk(request, { profile, profileComplete: profile?.isComplete ?? false });
});

export const PATCH = apiRoute(async (request) => {
  const context = await getAccessContext(request);
  if (!context.profile?.is_complete) throw new ProfileIncompleteError();
  const input = parseUpdateEmployeeProfile(await parseJsonObject(request));
  return jsonOk(request, await updateEmployeeProfile(context, getRequestContext(request), input));
});
