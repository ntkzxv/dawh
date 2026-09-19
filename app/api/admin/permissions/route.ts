import { requireAccess } from "@/lib/access/service";
import { listPermissions } from "@/lib/admin/roles/service";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  const context = await requireAccess(request, {
    permission: "admin.roles.read",
  });
  return jsonOk(request, await listPermissions(context));
});
