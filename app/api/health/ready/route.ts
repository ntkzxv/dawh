import { dbPool } from "@/lib/core/db/pool";
import { ApiError } from "@/lib/core/http/errors";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  try {
    const result = await dbPool.query<{ users: string | null; orders: string | null }>("SELECT to_regclass('app.app_users')::text AS users, to_regclass('app.purchase_orders')::text AS orders");
    if (!result.rows[0]?.users || !result.rows[0]?.orders) throw new Error("Warehouse schema is missing.");
  } catch {
    throw new ApiError(503, "DEPENDENCY_UNAVAILABLE", "Database is unavailable.");
  }

  return jsonOk(request, { status: "ready" });
});
