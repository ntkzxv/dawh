import "server-only";

import type { PoolClient } from "pg";
import type { Actor } from "@/lib/warehouse/access";

export async function audit(
  client: PoolClient,
  actor: Actor,
  action: string,
  entityType: string,
  entityId: number,
  afterData?: unknown,
  beforeData?: unknown,
) {
  await client.query(`
    INSERT INTO app.audit_events(actor_user_id, action, entity_type, entity_id, before_data, after_data)
    VALUES ($1, $2, $3, $4, $5, $6)
  `, [
    actor.id,
    action,
    entityType,
    entityId,
    beforeData === undefined ? null : JSON.stringify(beforeData),
    afterData === undefined ? null : JSON.stringify(afterData),
  ]);
}

export async function recordRevision(
  client: PoolClient,
  actor: Actor,
  entityType: "PURCHASE_ORDER" | "SUPPLIER_RECEIPT" | "CARRIER_RECEIPT",
  entityId: number,
  beforeData: unknown,
  afterData: unknown,
) {
  await client.query(`
    INSERT INTO app.document_revisions(entity_type, entity_id, revision_no, before_data, after_data, changed_by_id)
    SELECT $1, $2, COALESCE(max(revision_no), 0) + 1, $3::jsonb, $4::jsonb, $5
    FROM app.document_revisions
    WHERE entity_type = $1 AND entity_id = $2
  `, [entityType, entityId, JSON.stringify(beforeData), JSON.stringify(afterData), actor.id]);
}
