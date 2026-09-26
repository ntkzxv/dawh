import { auth } from "@/lib/auth";
import { parseJsonObject } from "@/lib/core/http/body";
import { withTransaction } from "@/lib/core/db/transaction";
import { ApiError, ValidationError } from "@/lib/core/http/errors";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { audit, getActor } from "@/lib/warehouse/core";

export const runtime = "nodejs";
export const POST = apiRoute(async (request) => {
  const actor = await getActor(request, true);
  const body = await parseJsonObject(request);
  if (typeof body.currentPassword !== "string" || typeof body.newPassword !== "string" || body.newPassword.length < 8 || body.newPassword.length > 128) {
    throw new ValidationError({ password: "Provide the current password and a new password of 8–128 characters." });
  }
  try {
    await auth.api.changePassword({ headers: request.headers, body: { currentPassword: body.currentPassword, newPassword: body.newPassword, revokeOtherSessions: true } });
  } catch {
    throw new ApiError(400, "PASSWORD_CHANGE_FAILED", "Current password is incorrect or the new password is invalid.");
  }
  await withTransaction(async (client) => {
    await client.query(`UPDATE app.app_users SET must_change_password=false,updated_at=now() WHERE id=$1`, [actor.id]);
    await audit(client, actor, "INITIAL_PASSWORD_CHANGED", "app_users", actor.id);
  });
  return jsonOk(request, { changed: true });
});
