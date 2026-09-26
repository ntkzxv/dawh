import { parseJsonObject } from "@/lib/core/http/body";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor, id } from "@/lib/warehouse/core";
import { resetMemberPassword } from "@/lib/warehouse/members";
export const runtime = "nodejs";
export const POST = apiRoute<{ params: Promise<{ memberId: string }> }>(async (request, context) => {
  const body = await parseJsonObject(request);
  await resetMemberPassword(await getActor(request), id((await context.params).memberId), body.initialPassword);
  return jsonOk(request, { reset: true });
});
