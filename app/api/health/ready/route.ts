import { dbPool } from "@/lib/core/db/pool";
import { ApiError } from "@/lib/core/http/errors";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";

export const runtime = "nodejs";

export const GET = apiRoute(async (request) => {
  try {
    await dbPool.query("SELECT 1");
  } catch {
    throw new ApiError(503, "DEPENDENCY_UNAVAILABLE", "Database is unavailable.");
  }

  return jsonOk(request, { status: "ready" });
});
