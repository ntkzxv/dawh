import { requireAccess } from "@/lib/access/service";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { createSafetyStock, listSafetyStock } from "@/lib/safety-stock/service";
import { parseCreateSafetyStock } from "@/lib/safety-stock/validation";
export const runtime = "nodejs";
export const GET = apiRoute(async (r) => {
  const c = await requireAccess(r, { permission: "product.read" });
  return jsonOk(r, await listSafetyStock(c));
});
export const POST = apiRoute(async (r) => {
  const c = await requireAccess(r, { permission: "admin.products.manage" });
  return jsonOk(
    r,
    await createSafetyStock(
      c,
      getRequestContext(r),
      parseCreateSafetyStock(await parseJsonObject(r)),
    ),
    201,
  );
});
