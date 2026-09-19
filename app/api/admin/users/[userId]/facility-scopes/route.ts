import { requireAccess } from "@/lib/access/service";
import { createFacilityScope } from "@/lib/admin/scopes/service";
import { parseCreateFacilityScope } from "@/lib/admin/scopes/validation";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";

export const runtime = "nodejs";
type Context = { params: Promise<{ userId: string }> };

export const POST = apiRoute(async (request, routeContext: Context) => {
  const context = await requireAccess(request, { permission: "admin.users.manage" });
  const { userId } = await routeContext.params;
  const input = parseCreateFacilityScope(await parseJsonObject(request));
  return jsonOk(request, await createFacilityScope(context, getRequestContext(request), userId, input), 201);
});
