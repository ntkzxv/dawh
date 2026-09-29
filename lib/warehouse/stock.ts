import "server-only";

import { timedPoolQuery } from "@/lib/core/http/request-timing";
import { date, id, requireRole, type Actor } from "@/lib/warehouse/core";
import { pageResult, parsePage } from "@/lib/warehouse/pagination";
import { isGlobalRole } from "@/lib/contracts/warehouse-policy";

function balanceFilters(actor: Actor, search?: URLSearchParams) {
  const branchId = search?.get("branchId")
    ? id(search.get("branchId"), "branchId")
    : null;
  const warehouseId = search?.get("warehouseId")
    ? id(search.get("warehouseId"), "warehouseId")
    : null;
  const productId = search?.get("productId")
    ? id(search.get("productId"), "productId")
    : null;
  return [
    isGlobalRole(actor.role),
    actor.branchIds,
    branchId,
    warehouseId,
    productId,
  ];
}

const balanceSelect = `SELECT sb.warehouse_id,sb.product_id,sb.quantity::text AS quantity,sb.updated_at,w.branch_id,w.name AS warehouse_name,b.name AS branch_name,p.sku,p.name AS product_name,u.code AS unit_code
  FROM app.stock_balances sb JOIN app.warehouses w ON w.id=sb.warehouse_id JOIN app.branches b ON b.id=w.branch_id
  JOIN app.products p ON p.id=sb.product_id JOIN app.units u ON u.id=p.unit_id
  WHERE ($1::boolean OR w.branch_id=ANY($2::integer[])) AND ($3::integer IS NULL OR w.branch_id=$3)
    AND ($4::integer IS NULL OR sb.warehouse_id=$4) AND ($5::integer IS NULL OR sb.product_id=$5)`;

export async function listBalances(actor: Actor, search?: URLSearchParams) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const result = await timedPoolQuery(
    `${balanceSelect} ORDER BY b.name,p.sku,sb.warehouse_id,sb.product_id LIMIT 1000`,
    balanceFilters(actor, search),
  );
  return result.rows;
}
export async function listBalancesPage(actor: Actor, search: URLSearchParams) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const { page, limit, offset } = parsePage(search);
  const result = await timedPoolQuery<{
    total: number;
    items: Record<string, unknown>[];
  }>(
    `
    WITH filtered AS (${balanceSelect})
    SELECT (SELECT COUNT(*)::integer FROM filtered) AS total,
      COALESCE((SELECT jsonb_agg(to_jsonb(rows) ORDER BY rows.branch_name,rows.sku,rows.warehouse_id,rows.product_id)
        FROM (SELECT * FROM filtered ORDER BY branch_name,sku,warehouse_id,product_id LIMIT $6 OFFSET $7) rows),'[]'::jsonb) AS items
  `,
    [...balanceFilters(actor, search), limit, offset],
  );
  return pageResult(result.rows[0].items, result.rows[0].total, page, limit);
}

function ledgerFilters(actor: Actor, search?: URLSearchParams) {
  const warehouseId = search?.get("warehouseId")
    ? id(search.get("warehouseId"), "warehouseId")
    : null;
  const productId = search?.get("productId")
    ? id(search.get("productId"), "productId")
    : null;
  const from = search?.get("from") ? date(search.get("from"), "from") : null;
  const to = search?.get("to") ? date(search.get("to"), "to") : null;
  return [
    isGlobalRole(actor.role),
    actor.branchIds,
    warehouseId,
    productId,
    from,
    to,
  ];
}

const ledgerSelect = `SELECT sm.id,sm.product_id,sm.warehouse_id,sm.quantity_delta::text AS quantity_delta,sm.occurred_at,
  doc.id AS document_id,doc.record_no,doc.kind,doc.goods_receipt_id,doc.reason,w.branch_id,w.name AS warehouse_name,p.sku,p.name AS product_name
  FROM app.stock_movements sm JOIN app.inventory_document_lines dl ON dl.id=sm.document_line_id
  JOIN app.inventory_documents doc ON doc.id=dl.document_id JOIN app.warehouses w ON w.id=sm.warehouse_id
  JOIN app.products p ON p.id=sm.product_id
  WHERE ($1::boolean OR w.branch_id=ANY($2::integer[])) AND ($3::integer IS NULL OR sm.warehouse_id=$3)
    AND ($4::integer IS NULL OR sm.product_id=$4) AND ($5::date IS NULL OR sm.occurred_at >= $5::date)
    AND ($6::date IS NULL OR sm.occurred_at < $6::date+interval '1 day')`;
export async function listLedger(actor: Actor, search?: URLSearchParams) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const result = await timedPoolQuery(
    `${ledgerSelect} ORDER BY sm.id DESC LIMIT 1000`,
    ledgerFilters(actor, search),
  );
  return result.rows;
}
export async function listLedgerPage(actor: Actor, search: URLSearchParams) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const { page, limit, offset } = parsePage(search);
  const result = await timedPoolQuery<{
    total: number;
    items: Record<string, unknown>[];
  }>(
    `
    WITH filtered AS (${ledgerSelect})
    SELECT (SELECT COUNT(*)::integer FROM filtered) AS total,
      COALESCE((SELECT jsonb_agg(to_jsonb(rows) ORDER BY rows.id DESC)
        FROM (SELECT * FROM filtered ORDER BY id DESC LIMIT $7 OFFSET $8) rows),'[]'::jsonb) AS items
  `,
    [...ledgerFilters(actor, search), limit, offset],
  );
  return pageResult(result.rows[0].items, result.rows[0].total, page, limit);
}
export async function listAudit(
  actor: Actor,
  filters: {
    actions: readonly string[];
    action?: string;
    entityType?: string;
    entityIdSearch?: number;
    actorQuery?: string;
    from?: string;
    to?: string;
    sort?: "date_desc" | "date_asc" | "name_asc" | "name_desc";
    page: number;
    limit: number;
  },
) {
  requireRole(actor, ["ADMIN", "CEO"]);
  const values: unknown[] = [filters.actions];
  const where = ["a.action = ANY($1::text[])"];
  if (filters.action) {
    values.push(filters.action);
    where.push(`a.action = $${values.length}`);
  }
  if (filters.entityType) {
    values.push(filters.entityType);
    where.push(`a.entity_type = $${values.length}`);
  }
  if (filters.actorQuery) {
    values.push(`%${filters.actorQuery}%`);
    const actorParameter = `$${values.length}`;
    if (filters.entityIdSearch) {
      values.push(filters.entityIdSearch);
      where.push(`(u.name ILIKE ${actorParameter} OR u.email ILIKE ${actorParameter} OR a.entity_id = $${values.length})`);
    } else {
      where.push(`(u.name ILIKE ${actorParameter} OR u.email ILIKE ${actorParameter})`);
    }
  }
  if (filters.from) {
    values.push(filters.from);
    where.push(`a.created_at >= ($${values.length}::date::timestamp AT TIME ZONE 'Asia/Bangkok')`);
  }
  if (filters.to) {
    values.push(filters.to);
    where.push(`a.created_at < (($${values.length}::date + INTERVAL '1 day')::timestamp AT TIME ZONE 'Asia/Bangkok')`);
  }
  const filterSql = where.join(" AND ");
  const count = await timedPoolQuery<{ total: string }>(
    `SELECT count(*)::text AS total FROM app.audit_events a LEFT JOIN app.app_users actor ON actor.id=a.actor_user_id LEFT JOIN public."user" u ON u.id=actor.auth_user_id WHERE ${filterSql}`,
    values,
  );
  const total = Number(count.rows[0]?.total ?? 0);
  const offset = (filters.page - 1) * filters.limit;
  const orderBy = {
    date_desc: "a.created_at DESC,a.id DESC",
    date_asc: "a.created_at ASC,a.id ASC",
    name_asc: "COALESCE(u.name,'') ASC,a.created_at DESC,a.id DESC",
    name_desc: "COALESCE(u.name,'') DESC,a.created_at DESC,a.id DESC",
  }[filters.sort ?? "date_desc"];
  const rows = await timedPoolQuery(
    `SELECT a.*,u.email AS actor_email,u.name AS actor_name FROM app.audit_events a LEFT JOIN app.app_users actor ON actor.id=a.actor_user_id LEFT JOIN public."user" u ON u.id=actor.auth_user_id WHERE ${filterSql} ORDER BY ${orderBy} LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
    [...values, filters.limit, offset],
  );
  return {
    items: rows.rows,
    page: filters.page,
    limit: filters.limit,
    total,
    hasMore: offset + rows.rows.length < total,
  };
}
