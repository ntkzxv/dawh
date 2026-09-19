import { requireAccess } from "@/lib/access/service";
import { updateFacilityScope } from "@/lib/admin/scopes/service";
import { parseUpdateFacilityScope } from "@/lib/admin/scopes/validation";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { ValidationError } from "@/lib/core/http/errors";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { isBigIntId } from "@/lib/core/ids/bigint";

export const runtime = "nodejs";
type Context = { params: Promise<{ userId: string; scopeId: string }> };

export const PATCH = apiRoute(async (request, routeContext: Context) => {
  const context = await requireAccess(request, { permission: "admin.users.manage" });
  const { userId, scopeId } = await routeContext.params;
  if (!isBigIntId(scopeId)) throw new ValidationError({ scopeId: "Use a positive integer ID." });
  const input = parseUpdateFacilityScope(await parseJsonObject(request));
  return jsonOk(request, await updateFacilityScope(context, getRequestContext(request), userId, scopeId, input));
});
