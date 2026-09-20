import { requireAccess } from "@/lib/access/service";
import {
  getProductCategory,
  updateProductCategory,
} from "@/lib/product-categories/service";
import { parseUpdateProductCategory } from "@/lib/product-categories/validation";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { parseRouteBigIntId } from "@/lib/core/ids/bigint";
export const runtime = "nodejs";
type C = { params: Promise<{ categoryId: string }> };
export const GET = apiRoute(async (r, x: C) => {
  const c = await requireAccess(r, { permission: "admin.products.read" });
  return jsonOk(
    r,
    await getProductCategory(
      c,
      parseRouteBigIntId((await x.params).categoryId, "categoryId"),
    ),
  );
});
export const PATCH = apiRoute(async (r, x: C) => {
  const c = await requireAccess(r, { permission: "admin.products.manage" });
  return jsonOk(
    r,
    await updateProductCategory(
      c,
      getRequestContext(r),
      parseRouteBigIntId((await x.params).categoryId, "categoryId"),
      parseUpdateProductCategory(await parseJsonObject(r)),
    ),
  );
});
