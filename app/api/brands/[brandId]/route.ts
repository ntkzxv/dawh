import { requireAccess } from "@/lib/access/service";
import { getBrand, updateBrand } from "@/lib/brands/service";
import { parseUpdateBrand } from "@/lib/brands/validation";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { parseRouteBigIntId } from "@/lib/core/ids/bigint";
export const runtime = "nodejs";
type C = { params: Promise<{ brandId: string }> };
export const GET = apiRoute(async (r, x: C) => {
  const c = await requireAccess(r, { permission: "admin.products.read" });
  return jsonOk(
    r,
    await getBrand(c, parseRouteBigIntId((await x.params).brandId, "brandId")),
  );
});
export const PATCH = apiRoute(async (r, x: C) => {
  const c = await requireAccess(r, { permission: "admin.products.manage" });
  return jsonOk(
    r,
    await updateBrand(
      c,
      getRequestContext(r),
      parseRouteBigIntId((await x.params).brandId, "brandId"),
      parseUpdateBrand(await parseJsonObject(r)),
    ),
  );
});
