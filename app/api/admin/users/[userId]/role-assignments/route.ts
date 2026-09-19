import { requireAccess } from "@/lib/access/service";
import { assignRole } from "@/lib/admin/roles/service";
import { parseAssignRole } from "@/lib/admin/roles/validation";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";

export const runtime = "nodejs";
type Context = { params: Promise<{ userId: string }> };

export const POST = apiRoute(async (request, routeContext: Context) => {
  const context = await requireAccess(request, {
    permission: "admin.roles.manage",
  });
  const { userId } = await routeContext.params;
  const input = parseAssignRole(await parseJsonObject(request));
  return jsonOk(
    request,
    await assignRole(context, getRequestContext(request), userId, input),
    201,
  );
});
