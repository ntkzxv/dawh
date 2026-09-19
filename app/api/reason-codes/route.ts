import { requireAccess } from "@/lib/access/service";
import { createReasonCode, listReasonCodes } from "@/lib/reason-codes/service";
import { parseCreateReasonCode } from "@/lib/reason-codes/validation";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
export const runtime = "nodejs";
export const GET = apiRoute(async (r) => {
  const c = await requireAccess(r, { permission: "admin.products.read" });
  return jsonOk(r, await listReasonCodes(c));
});
export const POST = apiRoute(async (r) => {
  const c = await requireAccess(r, { permission: "admin.reason_codes.manage" });
  return jsonOk(
    r,
    await createReasonCode(
      c,
      getRequestContext(r),
      parseCreateReasonCode(await parseJsonObject(r)),
    ),
    201,
  );
});
