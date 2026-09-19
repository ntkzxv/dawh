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
import { getLocation, updateLocation } from "@/lib/locations/service";
import { parseUpdateLocation } from "@/lib/locations/validation";
export const runtime = "nodejs";
type Context = { params: Promise<{ locationId: string }> };
function id(v: string) {
  if (!isBigIntId(v))
    throw new ValidationError({ locationId: "Use a positive integer ID." });
  return v;
}
export const GET = apiRoute(async (request, route: Context) => {
  const context = await getAccessContext(request);
  if (!context.profile?.is_complete) throw new ProfileIncompleteError();
  const { locationId } = await route.params;
  return jsonOk(request, await getLocation(context, id(locationId)));
});
export const PATCH = apiRoute(async (request, route: Context) => {
  const context = await requireAccess(request, {
    permission: "admin.facilities.manage",
  });
  const { locationId } = await route.params;
  const input = parseUpdateLocation(await parseJsonObject(request));
  return jsonOk(
    request,
    await updateLocation(
      context,
      getRequestContext(request),
      id(locationId),
      input,
    ),
  );
});
