import { requireAccess } from "@/lib/access/service";
import { getUnit, updateUnit } from "@/lib/units-of-measure/service";
import { parseUpdateUnit } from "@/lib/units-of-measure/validation";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { parseRouteBigIntId } from "@/lib/core/ids/bigint";
export const runtime = "nodejs";
type C = { params: Promise<{ unitId: string }> };
export const GET = apiRoute(async (r, x: C) => {
  const c = await requireAccess(r, { permission: "admin.products.read" });
  return jsonOk(
    r,
    await getUnit(c, parseRouteBigIntId((await x.params).unitId, "unitId")),
  );
});
export const PATCH = apiRoute(async (r, x: C) => {
  const c = await requireAccess(r, { permission: "admin.products.manage" });
  return jsonOk(
    r,
    await updateUnit(
      c,
      getRequestContext(r),
      parseRouteBigIntId((await x.params).unitId, "unitId"),
      parseUpdateUnit(await parseJsonObject(r)),
    ),
  );
});
