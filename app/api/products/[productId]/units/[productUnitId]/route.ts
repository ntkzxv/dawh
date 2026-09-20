import { requireAccess } from "@/lib/access/service";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { parseRouteBigIntId } from "@/lib/core/ids/bigint";
import { updateProductUnit } from "@/lib/product-units/service";
import { parseUpdateProductUnit } from "@/lib/product-units/validation";
export const runtime = "nodejs";
type C = { params: Promise<{ productId: string; productUnitId: string }> };
export const PATCH = apiRoute(async (r, x: C) => {
  const c = await requireAccess(r, { permission: "admin.products.manage" }),
    p = await x.params;
  return jsonOk(
    r,
    await updateProductUnit(
      c,
      getRequestContext(r),
      parseRouteBigIntId(p.productId, "productId"),
      parseRouteBigIntId(p.productUnitId, "productUnitId"),
      parseUpdateProductUnit(await parseJsonObject(r)),
    ),
  );
});
