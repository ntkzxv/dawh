import "server-only";

import type { PoolClient } from "pg";

import { isBigIntId } from "@/lib/core/ids/bigint";
import type { AuditInput } from "@/lib/audit/types";

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
