import { requireAccess } from "@/lib/access/service";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { ValidationError } from "@/lib/core/http/errors";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { isBigIntId } from "@/lib/core/ids/bigint";
import { updateProductUnit } from "@/lib/product-units/service";
import { parseUpdateProductUnit } from "@/lib/product-units/validation";
export const runtime = "nodejs";
type C = { params: Promise<{ productId: string; productUnitId: string }> };
const id = (v: string, k: string) => {
  if (!isBigIntId(v))
    throw new ValidationError({ [k]: "Use a positive integer ID." });
  return v;
};
export const PATCH = apiRoute(async (r, x: C) => {
  const c = await requireAccess(r, { permission: "admin.products.manage" }),
    p = await x.params;
  return jsonOk(
    r,
    await updateProductUnit(
      c,
      getRequestContext(r),
      id(p.productId, "productId"),
      id(p.productUnitId, "productUnitId"),
      parseUpdateProductUnit(await parseJsonObject(r)),
    ),
  );
});
