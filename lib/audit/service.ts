import "server-only";

import type { PoolClient } from "pg";

import { isBigIntId } from "@/lib/core/ids/bigint";
import { dbPool } from "@/lib/core/db/pool";
import { AuthorizationError } from "@/lib/access/service";
import type { AccessContext } from "@/lib/access/types";
import type { AuditInput, AuditLogFilters, AuditLogRecord } from "@/lib/audit/types";

const sensitiveKey = /password|token|secret|authorization|cookie|databaseurl/i;

function redact(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(redact);
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      sensitiveKey.test(key) ? "[REDACTED]" : redact(item),
    ]),
  );
}

export async function writeAuditLog(
  client: PoolClient,
  input: AuditInput,
): Promise<void> {
  if (input.entityId && !isBigIntId(input.entityId)) {
    throw new TypeError("Audit entityId must be a positive bigint string.");
  }
  if (input.facilityId && !isBigIntId(input.facilityId)) {
    throw new TypeError("Audit facilityId must be a positive bigint string.");
  }

  await client.query(
    `INSERT INTO public.audit_logs (
       organization_id, request_id, actor_user_id, action, entity_type, entity_id,
       facility_id, old_values, new_values, ip_address, user_agent
     )
     VALUES ($1, $2, $3, $4, $5, $6::bigint, $7::bigint, $8::jsonb, $9::jsonb, $10, $11)`,
    [
      input.organizationId,
      input.requestId,
      input.actorUserId,
      input.action,
      input.entityType,
      input.entityId ?? null,
      input.facilityId ?? null,
      input.oldData ? JSON.stringify(redact(input.oldData)) : null,
      input.newData ? JSON.stringify(redact(input.newData)) : null,
      input.ipAddress ?? null,
      input.userAgent ?? null,
    ],
  );
}

export async function listAuditLogs(
  context: AccessContext,
  filters: AuditLogFilters = {},
): Promise<AuditLogRecord[]> {
  const isAllowed =
    context.permissions.includes("audit.read") ||
    context.roles.includes("SYSTEM_ADMINISTRATOR") ||
    context.roles.includes("AUDITOR") ||
    context.roles.some((r) => r.toUpperCase().includes("ADMIN"));

  if (!isAllowed) {
    throw new AuthorizationError();
  }

  const values: unknown[] = [context.organization.id];
  const conditions: string[] = ["a.organization_id = $1"];

  if (filters.category && filters.category !== "all") {
    if (filters.category === "security") {
      conditions.push(
        `(a.entity_type IN ('admin.user', 'admin.role', 'admin.scope', 'user', 'user_profile', 'role', 'session')
          OR a.action LIKE 'user.%' OR a.action LIKE 'role.%' OR a.action LIKE 'facility_scope.%' OR a.action LIKE 'profile.%')`,
      );
    } else if (filters.category === "organization") {
      conditions.push(
        `(a.entity_type IN ('facility', 'warehouse_location', 'department', 'facility_route')
          OR a.action LIKE 'facility.%' OR a.action LIKE 'location.%' OR a.action LIKE 'department.%')`,
      );
    } else if (filters.category === "products") {
      conditions.push(
        `(a.entity_type IN ('product', 'product_category', 'brand', 'unit_of_measure', 'product_unit', 'product_barcode', 'reason_code')
          OR a.action LIKE 'product.%' OR a.action LIKE 'category.%' OR a.action LIKE 'brand.%' OR a.action LIKE 'uom.%' OR a.action LIKE 'reason_code.%')`,
      );
    } else if (filters.category === "inventory") {
      conditions.push(
        `(a.entity_type IN ('stock', 'stock_balance', 'inventory_transaction', 'safety_stock_rule', 'lot', 'serial_number')
          OR a.action LIKE 'stock.%' OR a.action LIKE 'inventory.%' OR a.action LIKE 'safety_stock.%')`,
      );
    }
  }

  if (filters.entityType) {
    values.push(filters.entityType);
    conditions.push(`a.entity_type = $${values.length}`);
  }

  if (filters.action) {
    values.push(filters.action);
    conditions.push(`a.action = $${values.length}`);
  }

  if (filters.facilityId) {
    values.push(filters.facilityId);
    conditions.push(`a.facility_id = $${values.length}::uuid`);
  }

  if (filters.actorUserId) {
    values.push(filters.actorUserId);
    conditions.push(`a.actor_user_id = $${values.length}`);
  }

  if (filters.search) {
    values.push(`%${filters.search}%`);
    const idx = values.length;
    conditions.push(
      `(a.action ILIKE $${idx} OR a.entity_type ILIKE $${idx} OR u.email ILIKE $${idx} OR u.name ILIKE $${idx} OR a.request_id ILIKE $${idx} OR a.ip_address ILIKE $${idx})`,
    );
  }

  const limit = Math.min(Math.max(Number(filters.limit) || 100, 1), 500);
  values.push(limit);
  const limitIdx = values.length;

  const offset = Math.max(Number(filters.offset) || 0, 0);
  values.push(offset);
  const offsetIdx = values.length;

  const query = `
    SELECT
      a.id::text,
      a.organization_id::text,
      a.request_id,
      a.actor_user_id,
      u.name AS actor_name,
      u.email AS actor_email,
      a.action,
      a.entity_type,
      a.entity_id::text,
      a.facility_id::text,
      f.code AS facility_code,
      f.name AS facility_name,
      a.old_values,
      a.new_values,
      a.ip_address,
      a.user_agent,
      a.occurred_at
    FROM public.audit_logs a
    LEFT JOIN public."user" u ON u.id = a.actor_user_id
    LEFT JOIN public.facilities f ON f.id = a.facility_id
    WHERE ${conditions.join(" AND ")}
    ORDER BY a.occurred_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const result = await dbPool.query<{
    id: string;
    organization_id: string;
    request_id: string;
    actor_user_id: string | null;
    actor_name: string | null;
    actor_email: string | null;
    action: string;
    entity_type: string;
    entity_id: string | null;
    facility_id: string | null;
    facility_code: string | null;
    facility_name: string | null;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent: string | null;
    occurred_at: Date;
  }>(query, values);

  return result.rows.map((row) => ({
    id: row.id,
    organizationId: row.organization_id,
    requestId: row.request_id,
    actorUserId: row.actor_user_id,
    actorName: row.actor_name,
    actorEmail: row.actor_email,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    facilityId: row.facility_id,
    facilityCode: row.facility_code,
    facilityName: row.facility_name,
    oldValues: row.old_values,
    newValues: row.new_values,
    ipAddress: row.ip_address,
    userAgent: row.user_agent,
    occurredAt: row.occurred_at.toISOString(),
  }));
}
