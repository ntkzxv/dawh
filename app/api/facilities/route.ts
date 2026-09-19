import {
  getAccessContext,
  ProfileIncompleteError,
  requireAccess,
} from "@/lib/access/service";
import { parseJsonObject } from "@/lib/core/http/body";
import { getRequestContext } from "@/lib/core/http/context";
import { parsePageRequest, nextCursor } from "@/lib/core/http/pagination";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonCollection, jsonOk } from "@/lib/core/http/response";
import {
  createFacility,
  listVisibleFacilities,
} from "@/lib/facilities/service";
import {
  parseCreateFacility,
  parseFacilityFilters,
} from "@/lib/facilities/validation";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  const context = await getAccessContext(request);
  if (!context.profile?.is_complete) throw new ProfileIncompleteError();

  const page = parsePageRequest(new URL(request.url));
  const facilities = await listVisibleFacilities(
    context,
    page,
    parseFacilityFilters(new URL(request.url)),
  );
  const hasMore = facilities.length > page.limit;
  const data = hasMore ? facilities.slice(0, page.limit) : facilities;

  return jsonCollection(request, data, {
    limit: page.limit,
    nextCursor: hasMore
      ? nextCursor(facilities, page.limit, (facility) => facility.createdAt)
      : null,
    hasMore,
  });
});

export const POST = apiRoute(async (request) => {
  const context = await requireAccess(request, {
    permission: "admin.facilities.manage",
  });
  const input = parseCreateFacility(await parseJsonObject(request));
  return jsonOk(
    request,
    await createFacility(context, getRequestContext(request), input),
    201,
  );
});
