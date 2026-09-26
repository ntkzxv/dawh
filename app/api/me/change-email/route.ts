import { changeOwnEmail } from "@/lib/auth/account-security";
import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor } from "@/lib/warehouse/core";

export const runtime = "nodejs";
export const POST = apiRoute(async (request) => {
  const actor = await getActor(request);
  const result = await changeOwnEmail(actor, await parseJsonObject(request));
  return jsonOk(request, result);
});
