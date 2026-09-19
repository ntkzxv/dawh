import { requireAccess } from "@/lib/access/service";
import { revokeRole } from "@/lib/admin/roles/service";
import { parseRevokeRole } from "@/lib/admin/roles/validation";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { ValidationError } from "@/lib/core/http/errors";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { isBigIntId } from "@/lib/core/ids/bigint";

export const runtime = "nodejs";
type Context = { params: Promise<{ userId: string; assignmentId: string }> };

export const POST = apiRoute(async (request, routeContext: Context) => {
  const context = await requireAccess(request, { permission: "admin.roles.manage" });
  const { userId, assignmentId } = await routeContext.params;
  if (!isBigIntId(assignmentId)) throw new ValidationError({ assignmentId: "Use a positive integer ID." });
  const reason = parseRevokeRole(await parseJsonObject(request));
  return jsonOk(request, await revokeRole(context, getRequestContext(request), userId, assignmentId, reason));
});
