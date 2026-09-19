import {
  getAccessContext,
  ProfileIncompleteError,
  requireAccess,
} from "@/lib/access/service";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { ValidationError } from "@/lib/core/http/errors";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { isBigIntId } from "@/lib/core/ids/bigint";
import { createLocation, listLocations } from "@/lib/locations/service";
import { parseCreateLocation } from "@/lib/locations/validation";
export const runtime = "nodejs";
type Context = { params: Promise<{ facilityId: string }> };
function id(v: string) {
  if (!isBigIntId(v))
    throw new ValidationError({ facilityId: "Use a positive integer ID." });
  return v;
}
export const GET = apiRoute(async (request, route: Context) => {
  const context = await getAccessContext(request);
  if (!context.profile?.is_complete) throw new ProfileIncompleteError();
  const { facilityId } = await route.params;
  return jsonOk(request, await listLocations(context, id(facilityId)));
});
export const POST = apiRoute(async (request, route: Context) => {
  const context = await requireAccess(request, {
    permission: "admin.facilities.manage",
  });
  const { facilityId } = await route.params;
  const input = parseCreateLocation(await parseJsonObject(request));
  return jsonOk(
    request,
    await createLocation(
      context,
      getRequestContext(request),
      id(facilityId),
      input,
    ),
    201,
  );
});
