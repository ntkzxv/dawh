import { getAccessContext } from "@/lib/access/service";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { toEmployeeProfileDto } from "@/lib/profiles/service";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  const context = await getAccessContext(request);
  const profile = context.profile?.is_complete
    ? await toEmployeeProfileDto(context.profile)
    : null;

  return jsonOk(request, {
    user: context.user,
    organization: context.organization,
    accountStatus: context.accountStatus,
    profile,
    profileComplete: profile?.isComplete ?? false,
    roles: context.roles,
    permissions: context.permissions,
    facilityScopes: context.facilityScopes,
  });
});
