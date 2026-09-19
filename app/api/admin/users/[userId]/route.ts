import { requireAccess } from "@/lib/access/service";
import { getAdminUser } from "@/lib/admin/users/service";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";

export const runtime = "nodejs";

type UserRouteContext = { params: Promise<{ userId: string }> };

export const GET = apiRoute(async (request, routeContext: UserRouteContext) => {
  const context = await requireAccess(request, { permission: "admin.users.read" });
  const { userId } = await routeContext.params;
  return jsonOk(request, await getAdminUser(context, userId));
});
