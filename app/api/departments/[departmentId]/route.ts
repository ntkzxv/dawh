import { requireAccess } from "@/lib/access/service";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { parseRouteBigIntId } from "@/lib/core/ids/bigint";
import { getDepartment, updateDepartment } from "@/lib/departments/service";
import { parseUpdateDepartment } from "@/lib/departments/validation";
export const runtime = "nodejs";
type Context = { params: Promise<{ departmentId: string }> };
export const GET = apiRoute(async (request, route: Context) => {
  const context = await requireAccess(request, {
    permission: "admin.facilities.read",
  });
  const { departmentId } = await route.params;
  return jsonOk(
    request,
    await getDepartment(
      context,
      parseRouteBigIntId(departmentId, "departmentId"),
    ),
  );
});
export const PATCH = apiRoute(async (request, route: Context) => {
  const context = await requireAccess(request, {
    permission: "admin.facilities.manage",
  });
  const { departmentId } = await route.params;
  const input = parseUpdateDepartment(await parseJsonObject(request));
  return jsonOk(
    request,
    await updateDepartment(
      context,
      getRequestContext(request),
      parseRouteBigIntId(departmentId, "departmentId"),
      input,
    ),
  );
});
