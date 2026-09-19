import { getAccessContext } from "@/lib/access/service";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  const context = await getAccessContext(request);

  return jsonOk(request, {
    user: context.user,
    organization: context.organization,
    profile: context.profile,
    profileComplete: context.profile?.is_complete ?? false,
    roles: context.roles,
    permissions: context.permissions,
    facilityScopes: context.facilityScopes,
  });
});
