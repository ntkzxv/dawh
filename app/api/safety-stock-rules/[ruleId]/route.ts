import { requireAccess } from "@/lib/access/service";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { ValidationError } from "@/lib/core/http/errors";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { isBigIntId } from "@/lib/core/ids/bigint";
import { getSafetyStock, updateSafetyStock } from "@/lib/safety-stock/service";
import { parseUpdateSafetyStock } from "@/lib/safety-stock/validation";
export const runtime = "nodejs";
type C = { params: Promise<{ ruleId: string }> };
const id = (v: string) => {
  if (!isBigIntId(v))
    throw new ValidationError({ ruleId: "Use a positive integer ID." });
  return v;
};
export const GET = apiRoute(async (r, x: C) => {
  const c = await requireAccess(r, { permission: "product.read" });
  return jsonOk(r, await getSafetyStock(c, id((await x.params).ruleId)));
});
export const PATCH = apiRoute(async (r, x: C) => {
  const c = await requireAccess(r, { permission: "admin.products.manage" });
  return jsonOk(
    r,
    await updateSafetyStock(
      c,
      getRequestContext(r),
      id((await x.params).ruleId),
      parseUpdateSafetyStock(await parseJsonObject(r)),
    ),
  );
});
