import { requireAccess } from "@/lib/access/service";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { parseRouteBigIntId } from "@/lib/core/ids/bigint";
import {
  createProductUnit,
  listProductUnits,
} from "@/lib/product-units/service";
import { parseCreateProductUnit } from "@/lib/product-units/validation";
export const runtime = "nodejs";
type C = { params: Promise<{ productId: string }> };
export const GET = apiRoute(async (r, x: C) => {
  const c = await requireAccess(r, { permission: "admin.products.read" });
  return jsonOk(
    r,
    await listProductUnits(
      c,
      parseRouteBigIntId((await x.params).productId, "productId"),
    ),
  );
});
export const POST = apiRoute(async (r, x: C) => {
  const c = await requireAccess(r, { permission: "admin.products.manage" });
  return jsonOk(
    r,
    await createProductUnit(
      c,
      getRequestContext(r),
      parseRouteBigIntId((await x.params).productId, "productId"),
      parseCreateProductUnit(await parseJsonObject(r)),
    ),
    201,
  );
});
