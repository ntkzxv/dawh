import { dbPool } from "@/lib/core/db/pool";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { getActor, requireRole } from "@/lib/warehouse/core";

export const runtime = "nodejs";
export const GET = apiRoute(async (request) => {
  requireRole(await getActor(request), ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const result = await dbPool.query(`SELECT a.id,u.name FROM app.app_users a JOIN public."user" u ON u.id=a.auth_user_id WHERE a.role='CEO' AND a.deleted_at IS NULL ORDER BY u.name`);
  return jsonOk(request, result.rows);
});
