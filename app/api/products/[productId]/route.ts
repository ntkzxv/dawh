import { requireAccess } from "@/lib/access/service";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { parseRouteBigIntId } from "@/lib/core/ids/bigint";
import { getProduct, updateProduct } from "@/lib/products/service";
import { parseUpdateProduct } from "@/lib/products/validation";
export const runtime = "nodejs";
type C = { params: Promise<{ productId: string }> };
export const GET = apiRoute(async (r, x: C) => {
  const c = await requireAccess(r, { permission: "product.read" });
  return jsonOk(
    r,
    await getProduct(
      c,
      parseRouteBigIntId((await x.params).productId, "productId"),
    ),
  );
});
export const PATCH = apiRoute(async (r, x: C) => {
  const c = await requireAccess(r, { permission: "admin.products.manage" });
  return jsonOk(
    r,
    await updateProduct(
      c,
      getRequestContext(r),
      parseRouteBigIntId((await x.params).productId, "productId"),
      parseUpdateProduct(await parseJsonObject(r)),
    ),
  );
});
