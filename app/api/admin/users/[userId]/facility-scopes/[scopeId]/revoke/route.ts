import { requireAccess } from "@/lib/access/service";
import { revokeFacilityScope } from "@/lib/admin/scopes/service";
import { parseRevokeFacilityScope } from "@/lib/admin/scopes/validation";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { parseRouteBigIntId } from "@/lib/core/ids/bigint";

export const runtime = "nodejs";
type Context = { params: Promise<{ userId: string; scopeId: string }> };

export const POST = apiRoute(async (request, routeContext: Context) => {
  const context = await requireAccess(request, {
    permission: "admin.users.manage",
  });
  const { userId, scopeId } = await routeContext.params;
  const input = parseRevokeFacilityScope(await parseJsonObject(request));
  return jsonOk(
    request,
    await revokeFacilityScope(
      context,
      getRequestContext(request),
      userId,
      parseRouteBigIntId(scopeId, "scopeId"),
      input,
    ),
  );
});
