import { parseJsonObject } from "@/lib/core/http/body";
import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import { ApiError } from "@/lib/core/http/errors";
import { apiRoute } from "@/lib/core/http/handler";
import { jsonOk } from "@/lib/core/http/response";
import { audit, getActor, optionalText, requireRole, text } from "@/lib/warehouse/core";

export const runtime = "nodejs";
export const GET = apiRoute(async (request) => {
  await getActor(request);
  const result = await dbPool.query(`SELECT id,name,phone,address,created_at,updated_at FROM app.organization_settings WHERE id=1`);
  return jsonOk(request, result.rows[0] ?? null);
});
export const POST = apiRoute(async (request) => {
  const actor = await getActor(request);
  requireRole(actor, ["ADMIN"]);
  const body = await parseJsonObject(request);
  const name = text(body.name, "name", 160);
  const phone = optionalText(body.phone, "phone", 50);
  const address = optionalText(body.address, "address", 1000);
  const result = await withTransaction(async (client) => {
    const inserted = await client.query(`INSERT INTO app.organization_settings(name,phone,address) VALUES ($1,$2,$3) ON CONFLICT (id) DO NOTHING RETURNING *`, [name, phone, address]);
    if (!inserted.rowCount) throw new ApiError(409, "ORG_ALREADY_SETUP", "Organization is already configured.");
    await audit(client, actor, "ORGANIZATION_SETUP", "organization_settings", 1, inserted.rows[0]);
    return inserted.rows[0];
  });
  return jsonOk(request, result, 201);
});
export const PATCH = apiRoute(async (request) => {
  const actor = await getActor(request);
  requireRole(actor, ["ADMIN"]);
  const body = await parseJsonObject(request);
  const result = await withTransaction(async (client) => {
    const current = await client.query(`SELECT * FROM app.organization_settings WHERE id=1 FOR UPDATE`);
    if (!current.rowCount) throw new ApiError(404, "ORG_NOT_SETUP", "Configure the organization first.");
    const updated = await client.query(`UPDATE app.organization_settings SET name=$1,phone=$2,address=$3,updated_at=now() WHERE id=1 RETURNING *`, [body.name === undefined ? current.rows[0].name : text(body.name, "name", 160), body.phone === undefined ? current.rows[0].phone : optionalText(body.phone, "phone", 50), body.address === undefined ? current.rows[0].address : optionalText(body.address, "address", 1000)]);
    await audit(client, actor, "ORGANIZATION_UPDATED", "organization_settings", 1, updated.rows[0], current.rows[0]);
    return updated.rows[0];
  });
  return jsonOk(request, result);
});
