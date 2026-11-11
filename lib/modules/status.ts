import "server-only";

import { ApiError, ValidationError } from "@/lib/core/http/errors";
import { withTransaction } from "@/lib/core/db/transaction";
import type { Actor } from "@/lib/warehouse/access";
import { requireRole } from "@/lib/warehouse/access";
import {
  MANAGED_MODULE_KEYS,
  type ManagedModuleKey,
  type ModuleStatus,
  type ModuleStatusHistoryItem,
} from "@/lib/contracts/module-status";
import { timedPoolQuery } from "@/lib/core/http/request-timing";

const isManagedModuleKey = (value: unknown): value is ManagedModuleKey =>
  typeof value === "string" &&
  MANAGED_MODULE_KEYS.includes(value as ManagedModuleKey);

export async function listModuleStatuses(): Promise<ModuleStatus[]> {
  const result = await timedPoolQuery<{
    module_key: ManagedModuleKey;
    is_enabled: boolean;
    maintenance_reason: string | null;
    updated_at: Date;
  }>(`
    SELECT module_key, is_enabled, maintenance_reason, updated_at
    FROM app.module_statuses
    ORDER BY module_key
  `);

  return result.rows.map((row) => ({
    moduleKey: row.module_key,
    isEnabled: row.is_enabled,
    maintenanceReason: row.maintenance_reason,
    updatedAt: row.updated_at.toISOString(),
  }));
}

export async function listModuleStatusHistory(): Promise<ModuleStatusHistoryItem[]> {
  const result = await timedPoolQuery<{
    id: number;
    before_data: { moduleKey?: unknown; isEnabled?: unknown } | null;
    after_data: { moduleKey?: unknown; isEnabled?: unknown; maintenanceReason?: unknown } | null;
    actor_name: string | null;
    actor_email: string | null;
    created_at: Date;
  }>(`
    SELECT a.id, a.before_data, a.after_data, u.name AS actor_name,
           u.email AS actor_email, a.created_at
    FROM app.audit_events a
    LEFT JOIN app.app_users actor ON actor.id = a.actor_user_id
    LEFT JOIN public."user" u ON u.id = actor.auth_user_id
    WHERE a.action = 'MODULE_STATUS_UPDATED'
      AND a.entity_type = 'MODULE'
    ORDER BY a.created_at DESC, a.id DESC
    LIMIT 50
  `);

  return result.rows.flatMap((row) => {
    const item = toModuleStatusHistoryItem(row);
    return item ? [item] : [];
  });
}

type ModuleStatusHistoryRow = {
  id: number;
  before_data: { moduleKey?: unknown; isEnabled?: unknown } | null;
  after_data: { moduleKey?: unknown; isEnabled?: unknown; maintenanceReason?: unknown } | null;
  actor_name: string | null;
  actor_email: string | null;
  created_at: Date;
};

function toModuleStatusHistoryItem(row: ModuleStatusHistoryRow): ModuleStatusHistoryItem | null {
  const before = row.before_data;
  const after = row.after_data;
  if (
    !before || !after ||
    !isManagedModuleKey(after.moduleKey) ||
    typeof before.isEnabled !== "boolean" ||
    typeof after.isEnabled !== "boolean"
  ) return null;

  return {
    id: row.id,
    moduleKey: after.moduleKey,
    previousEnabled: before.isEnabled,
    isEnabled: after.isEnabled,
    reason: typeof after.maintenanceReason === "string" ? after.maintenanceReason : null,
    actor: row.actor_name || row.actor_email || "Administrator",
    changedAt: row.created_at.toISOString(),
  };
}

export async function listModuleStatusHistoryPage(input: {
  page: number;
  limit: number;
  enabled?: boolean;
  moduleKey?: ManagedModuleKey;
  from?: string;
  to?: string;
}): Promise<{ items: ModuleStatusHistoryItem[]; total: number }> {
  const values: unknown[] = [];
  const filters = [
    "a.action = 'MODULE_STATUS_UPDATED'",
    "a.entity_type = 'MODULE'",
    "a.before_data IS NOT NULL",
    "a.after_data IS NOT NULL",
    "a.after_data->>'moduleKey' IN ('datacenter', 'warehouse', 'sales', 'reports')",
    "a.before_data->>'isEnabled' IN ('true', 'false')",
    "a.after_data->>'isEnabled' IN ('true', 'false')",
  ];

  if (input.enabled !== undefined) {
    values.push(input.enabled ? "true" : "false");
    filters.push(`a.after_data->>'isEnabled' = $${values.length}`);
  }
  if (input.moduleKey) {
    values.push(input.moduleKey);
    filters.push(`a.after_data->>'moduleKey' = $${values.length}`);
  }
  if (input.from) {
    values.push(input.from);
    filters.push(`a.created_at >= ($${values.length}::date::timestamp AT TIME ZONE 'Asia/Bangkok')`);
  }
  if (input.to) {
    values.push(input.to);
    filters.push(`a.created_at < (($${values.length}::date + 1)::timestamp AT TIME ZONE 'Asia/Bangkok')`);
  }

  const where = filters.join(" AND ");
  const countValues = [...values];
  const countPromise = timedPoolQuery<{ total: string }>(
    `SELECT count(*)::text AS total FROM app.audit_events a WHERE ${where}`,
    countValues,
  );

  const limitPosition = values.push(input.limit);
  const offsetPosition = values.push((input.page - 1) * input.limit);
  const itemsPromise = timedPoolQuery<ModuleStatusHistoryRow>(
    `SELECT a.id, a.before_data, a.after_data, u.name AS actor_name,
            u.email AS actor_email, a.created_at
     FROM app.audit_events a
     LEFT JOIN app.app_users actor ON actor.id = a.actor_user_id
     LEFT JOIN public."user" u ON u.id = actor.auth_user_id
     WHERE ${where}
     ORDER BY a.created_at DESC, a.id DESC
     LIMIT $${limitPosition} OFFSET $${offsetPosition}`,
    values,
  );

  const [count, result] = await Promise.all([countPromise, itemsPromise]);
  return {
    items: result.rows.flatMap((row) => {
      const item = toModuleStatusHistoryItem(row);
      return item ? [item] : [];
    }),
    total: Number(count.rows[0]?.total ?? 0),
  };
}

export async function updateModuleStatus(
  actor: Actor,
  input: { moduleKey?: unknown; isEnabled?: unknown; maintenanceReason?: unknown },
): Promise<ModuleStatus> {
  requireRole(actor, ["ADMIN"]);

  const maintenanceReason = typeof input.maintenanceReason === "string"
    ? input.maintenanceReason.trim()
    : "";
  if (
    !isManagedModuleKey(input.moduleKey) ||
    typeof input.isEnabled !== "boolean" ||
    (!input.isEnabled && maintenanceReason.length === 0) ||
    maintenanceReason.length > 500
  ) {
    throw new ValidationError({
      moduleStatus: "Choose a supported module, an enabled status, and a maintenance reason of up to 500 characters when closing it.",
    });
  }
  const nextReason = input.isEnabled ? null : maintenanceReason;

  return withTransaction(async (client) => {
    const previous = await client.query<{
      is_enabled: boolean;
      maintenance_reason: string | null;
    }>(
      `SELECT is_enabled, maintenance_reason FROM app.module_statuses WHERE module_key = $1 FOR UPDATE`,
      [input.moduleKey],
    );
    if (!previous.rows[0]) {
      throw new ApiError(404, "MODULE_STATUS_NOT_FOUND", "Module status was not found.");
    }

    const updated = await client.query<{
      module_key: ManagedModuleKey;
      is_enabled: boolean;
      maintenance_reason: string | null;
      updated_at: Date;
    }>(
      `UPDATE app.module_statuses
       SET is_enabled = $2, maintenance_reason = $3, updated_by_id = $4, updated_at = now()
       WHERE module_key = $1
       RETURNING module_key, is_enabled, maintenance_reason, updated_at`,
      [input.moduleKey, input.isEnabled, nextReason, actor.id],
    );
    const status = updated.rows[0];

    if (
      previous.rows[0].is_enabled !== input.isEnabled ||
      previous.rows[0].maintenance_reason !== nextReason
    ) {
      await client.query(
        `INSERT INTO app.audit_events(actor_user_id, action, entity_type, entity_id, before_data, after_data)
         VALUES ($1, 'MODULE_STATUS_UPDATED', 'MODULE', NULL, $2::jsonb, $3::jsonb)`,
        [
          actor.id,
          JSON.stringify({
            moduleKey: input.moduleKey,
            isEnabled: previous.rows[0].is_enabled,
            maintenanceReason: previous.rows[0].maintenance_reason,
          }),
          JSON.stringify({
            moduleKey: input.moduleKey,
            isEnabled: input.isEnabled,
            maintenanceReason: nextReason,
          }),
        ],
      );
    }

    return {
      moduleKey: status.module_key,
      isEnabled: status.is_enabled,
      maintenanceReason: status.maintenance_reason,
      updatedAt: status.updated_at.toISOString(),
    };
  });
}

export async function requireModuleEnabled(key: ManagedModuleKey) {
  const result = await timedPoolQuery<{ is_enabled: boolean }>(
    `SELECT is_enabled FROM app.module_statuses WHERE module_key = $1`,
    [key],
  );
  if (result.rows[0]?.is_enabled === false) {
    throw new ApiError(503, "MODULE_DISABLED", "This module is currently unavailable.");
  }
}
