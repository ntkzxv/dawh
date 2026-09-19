import { requireAccess } from "@/lib/access/service";
import { changeAccountStatus } from "@/lib/admin/users/service";
import { parseChangeAccountStatus } from "@/lib/admin/users/validation";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";

export const runtime = "nodejs";

type UserRouteContext = { params: Promise<{ userId: string }> };

export const PATCH = apiRoute(
  async (request, routeContext: UserRouteContext) => {
    const context = await requireAccess(request, {
      permission: "admin.users.manage",
    });
    const { userId } = await routeContext.params;
    const input = parseChangeAccountStatus(await parseJsonObject(request));
    return jsonOk(
      request,
      await changeAccountStatus(
        context,
        getRequestContext(request),
        userId,
        input,
      ),
    );
  },
);
