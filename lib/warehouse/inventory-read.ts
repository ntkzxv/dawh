import "server-only";

import { timedPoolQuery } from "@/lib/core/http/request-timing";
import { ValidationError } from "@/lib/core/http/errors";
import { requireRole, type Actor } from "@/lib/warehouse/core";
import { parsePage, pageResult } from "@/lib/warehouse/pagination";
import { isGlobalRole } from "@/lib/contracts/warehouse-policy";

export type InventoryProductRow = {
  id: number;
  sku: string;
  name: string;
  active: boolean;
  category_id: number | null;
  category_name: string | null;
  brand_id: number | null;
  brand_name: string | null;
  unit_id: number;
  unit_code: string;
  cost: string | null;
  sale_price: string | null;
  reorder_point: string | null;
  on_hand: string;
  warehouse_names: string | null;
  status: "in_stock" | "low_stock" | "out_of_stock";
};

function optionalId(raw: string | null, field: string) {
  if (!raw || raw === "all") return null;
  const value = Number(raw);
  if (!Number.isSafeInteger(value) || value < 1)
    throw new ValidationError({ [field]: "Use a positive integer." });
  return value;
}

export async function listInventoryProducts(
  actor: Actor,
  search: URLSearchParams,
) {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"]);
  const { page, limit, offset } = parsePage(search);
  const categoryId = optionalId(search.get("categoryId"), "categoryId");
  const warehouseId = optionalId(search.get("warehouseId"), "warehouseId");
  const query = search.get("q")?.trim() ?? "";
  if (query.length > 100)
    throw new ValidationError({ q: "Use at most 100 characters." });
  const status = search.get("status") || null;
  if (status && !["in_stock", "low_stock", "out_of_stock"].includes(status)) {
    throw new ValidationError({ status: "Unknown stock status." });
  }
  const global = isGlobalRole(actor.role);
  const result = await timedPoolQuery<{
    total: number;
    items: InventoryProductRow[];
  }>(
    `
    WITH scoped_stock AS (
      SELECT sb.product_id, SUM(sb.quantity) AS on_hand,
        string_agg(DISTINCT w.name, ', ' ORDER BY w.name) AS warehouse_names
      FROM app.stock_balances sb
      JOIN app.warehouses w ON w.id=sb.warehouse_id
      WHERE ($1::boolean OR w.branch_id=ANY($2::integer[]))
        AND ($3::integer IS NULL OR w.id=$3)
      GROUP BY sb.product_id
    ), inventory AS (
      SELECT p.id,p.sku,p.name,p.active,p.category_id,c.name AS category_name,
        p.brand_id,br.name AS brand_name,p.unit_id,u.code AS unit_code,
        p.cost::text AS cost,p.sale_price::text AS sale_price,p.reorder_point::text AS reorder_point,
        COALESCE(s.on_hand,0)::text AS on_hand,s.warehouse_names,
        CASE WHEN COALESCE(s.on_hand,0)<=0 THEN 'out_of_stock'
          WHEN p.reorder_point IS NOT NULL AND s.on_hand<p.reorder_point THEN 'low_stock'
          ELSE 'in_stock' END AS status
      FROM app.products p
      JOIN app.units u ON u.id=p.unit_id
      LEFT JOIN app.product_categories c ON c.id=p.category_id
      LEFT JOIN app.brands br ON br.id=p.brand_id
      LEFT JOIN scoped_stock s ON s.product_id=p.id
      WHERE ($3::integer IS NULL OR s.product_id IS NOT NULL)
        AND ($4::integer IS NULL OR p.category_id=$4)
        AND ($5::text='' OR p.sku ILIKE '%'||$5||'%' OR p.name ILIKE '%'||$5||'%' OR c.name ILIKE '%'||$5||'%')
    ), filtered AS (
      SELECT * FROM inventory WHERE ($6::text IS NULL OR status=$6)
    )
    SELECT (SELECT COUNT(*)::integer FROM filtered) AS total,
      COALESCE((SELECT jsonb_agg(to_jsonb(rows) ORDER BY rows.id DESC) FROM (
        SELECT * FROM filtered ORDER BY id DESC LIMIT $7 OFFSET $8
      ) rows),'[]'::jsonb) AS items
  `,
    [
      global,
      actor.branchIds,
      warehouseId,
      categoryId,
      query,
      status,
      limit,
      offset,
    ],
  );
  const { total, items } = result.rows[0];
  return pageResult(items, total, page, limit);
}
