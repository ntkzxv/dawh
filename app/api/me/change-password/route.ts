import { changeOwnPassword } from "@/lib/auth/account-security";
import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";

export const runtime = "nodejs";
export const POST = apiRoute(async (request) => {
  const actor = await getActor(request, true);
  const result = await changeOwnPassword(actor, request.headers, await parseJsonObject(request), {
    requireConfirmation: true,
    auditAction: "PASSWORD_CHANGED",
  });
  return jsonOk(request, result);
});
