import { requireAccess } from "@/lib/access/service";
import { getReasonCode, updateReasonCode } from "@/lib/reason-codes/service";
import { parseUpdateReasonCode } from "@/lib/reason-codes/validation";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { parseRouteBigIntId } from "@/lib/core/ids/bigint";
export const runtime = "nodejs";
type C = { params: Promise<{ reasonCodeId: string }> };
export const GET = apiRoute(async (r, x: C) => {
  const c = await requireAccess(r, { permission: "admin.products.read" });
  return jsonOk(
    r,
    await getReasonCode(
      c,
      parseRouteBigIntId((await x.params).reasonCodeId, "reasonCodeId"),
    ),
  );
});
export const PATCH = apiRoute(async (r, x: C) => {
  const c = await requireAccess(r, { permission: "admin.reason_codes.manage" });
  return jsonOk(
    r,
    await updateReasonCode(
      c,
      getRequestContext(r),
      parseRouteBigIntId((await x.params).reasonCodeId, "reasonCodeId"),
      parseUpdateReasonCode(await parseJsonObject(r)),
    ),
  );
});
