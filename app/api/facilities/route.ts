import { getAccessContext, ProfileIncompleteError } from "@/lib/access/service";
import { parsePageRequest, nextCursor } from "@/lib/core/http/pagination";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonCollection } from "@/lib/core/http/response";
import { listVisibleFacilities } from "@/lib/facilities/service";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  const context = await getAccessContext(request);
  if (!context.profile?.is_complete) throw new ProfileIncompleteError();

  const page = parsePageRequest(new URL(request.url));
  const facilities = await listVisibleFacilities(context, page);
  const hasMore = facilities.length > page.limit;
  const data = hasMore ? facilities.slice(0, page.limit) : facilities;

  return jsonCollection(request, data, {
    limit: page.limit,
    nextCursor: hasMore ? nextCursor(facilities, page.limit, (facility) => facility.createdAt) : null,
    hasMore,
  });
});
