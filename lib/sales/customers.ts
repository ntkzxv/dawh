import "server-only";

import { timedPoolQuery } from "@/lib/core/http/request-timing";
import { NotFoundError, ValidationError } from "@/lib/core/http/errors";
import {
  optionalText,
  requireRole,
  text,
  type Actor,
  type Role,
} from "@/lib/warehouse/core";
import { cursorPageResult, parseCursorPage } from "@/lib/warehouse/cursor-pagination";

export const salesRoles: readonly Role[] = ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"];

function citizenId(value: unknown) {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !/^\d{13}$/.test(value.trim()))
    throw new ValidationError({ citizenId: "Use exactly 13 digits." });
  return value.trim();
}

function parseCustomer(body: Record<string, unknown>, partial: boolean) {
  const fields: Record<string, unknown> = {};
  const has = (key: string) => !partial || body[key] !== undefined;
  if (has("fullName")) fields.full_name = text(body.fullName, "fullName", 200);
  if (has("phone")) fields.phone = text(body.phone, "phone", 30);
  if (has("citizenId")) fields.citizen_id = citizenId(body.citizenId);
  if (has("address")) fields.address = optionalText(body.address, "address", 1000);
  if (has("note")) fields.note = optionalText(body.note, "note", 2000);
  return fields;
}

export async function listCustomers(actor: Actor, search: URLSearchParams) {
  requireRole(actor, salesRoles);
  const { limit, cursor } = parseCursorPage(search);
  const query = search.get("q")?.trim() ?? "";
  if (query.length > 100) throw new ValidationError({ q: "Use at most 100 characters." });
  const result = await timedPoolQuery<Record<string, unknown> & { id: number }>(
    `SELECT id,full_name,phone,citizen_id,address,note,created_at
    FROM app.customers
    WHERE ($1::text = '' OR full_name ILIKE '%' || $1 || '%' OR phone ILIKE '%' || $1 || '%' OR citizen_id ILIKE '%' || $1 || '%')
      AND ($2::bigint IS NULL OR id < $2)
    ORDER BY id DESC LIMIT $3`,
    [query, cursor?.parentId ?? null, limit + 1],
  );
  return cursorPageResult(result.rows, limit, (row) => ({ parentId: row.id }));
}

export async function getCustomer(actor: Actor, customerId: number) {
  requireRole(actor, salesRoles);
  const result = await timedPoolQuery(
    `SELECT id,full_name,phone,citizen_id,address,note,created_branch_id,created_at,updated_at FROM app.customers WHERE id=$1`,
    [customerId],
  );
  if (!result.rowCount) throw new NotFoundError("Customer");
  return result.rows[0];
}

export async function createCustomer(actor: Actor, body: Record<string, unknown>) {
  requireRole(actor, salesRoles);
  const f = parseCustomer(body, false);
  const result = await timedPoolQuery(
    `INSERT INTO app.customers(full_name,phone,citizen_id,address,note,created_branch_id,created_by_id)
    VALUES ($1,$2,$3,$4,$5,$6,$7)
    RETURNING id,full_name,phone,citizen_id,address,note,created_at,updated_at`,
    [f.full_name, f.phone, f.citizen_id, f.address, f.note, actor.branchIds[0] ?? null, actor.id],
  );
  return result.rows[0];
}

export async function updateCustomer(actor: Actor, customerId: number, body: Record<string, unknown>) {
  requireRole(actor, salesRoles);
  const f = parseCustomer(body, true);
  const keys = Object.keys(f);
  if (!keys.length) throw new ValidationError({ body: "Send at least one field to update." });
  const result = await timedPoolQuery(
    `UPDATE app.customers SET ${keys.map((key, i) => `${key}=$${i + 2}`).join(",")},updated_at=now()
    WHERE id=$1 RETURNING id,full_name,phone,citizen_id,address,note,created_at,updated_at`,
    [customerId, ...keys.map((key) => f[key])],
  );
  if (!result.rowCount) throw new NotFoundError("Customer");
  return result.rows[0];
}
