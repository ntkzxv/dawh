import { listAdminUsers } from "@/lib/admin/users/service";
import { encodeUserCursor, parseUserQuery } from "@/lib/admin/users/validation";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonCollection } from "@/lib/core/http/response";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  const { page, filters } = parseUserQuery(new URL(request.url));
  const { users } = await listAdminUsers(request, page, filters);
  const hasMore = users.length > page.limit;
  const data = hasMore ? users.slice(0, page.limit) : users;
  return jsonCollection(request, data, {
    limit: page.limit,
    nextCursor: hasMore ? encodeUserCursor(data[data.length - 1]) : null,
    hasMore,
  });
});
