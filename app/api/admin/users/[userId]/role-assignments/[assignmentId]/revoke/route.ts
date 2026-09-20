import { requireAccess } from "@/lib/access/service";
import { revokeRole } from "@/lib/admin/roles/service";
import { parseRevokeRole } from "@/lib/admin/roles/validation";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { parseRouteBigIntId } from "@/lib/core/ids/bigint";

export const runtime = "nodejs";
type Context = { params: Promise<{ userId: string; assignmentId: string }> };

export const POST = apiRoute(async (request, routeContext: Context) => {
  const context = await requireAccess(request, {
    permission: "admin.roles.manage",
  });
  const { userId, assignmentId } = await routeContext.params;
  const reason = parseRevokeRole(await parseJsonObject(request));
  return jsonOk(
    request,
    await revokeRole(
      context,
      getRequestContext(request),
      userId,
      parseRouteBigIntId(assignmentId, "assignmentId"),
      reason,
    ),
  );
});
