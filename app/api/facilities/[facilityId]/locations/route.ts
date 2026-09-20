import {
  getAccessContext,
  ProfileIncompleteError,
  requireAccess,
} from "@/lib/access/service";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { parseRouteBigIntId } from "@/lib/core/ids/bigint";
import { createLocation, listLocations } from "@/lib/locations/service";
import { parseCreateLocation } from "@/lib/locations/validation";
export const runtime = "nodejs";
type Context = { params: Promise<{ facilityId: string }> };
export const GET = apiRoute(async (request, route: Context) => {
  const context = await getAccessContext(request);
  if (!context.profile?.is_complete) throw new ProfileIncompleteError();
  const { facilityId } = await route.params;
  return jsonOk(
    request,
    await listLocations(context, parseRouteBigIntId(facilityId, "facilityId")),
  );
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
      parseRouteBigIntId(facilityId, "facilityId"),
      input,
    ),
    201,
  );
});
