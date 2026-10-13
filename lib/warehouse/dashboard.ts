import "server-only";

import { timedPoolQuery } from "@/lib/core/http/request-timing";
import { requireRole, type Actor } from "@/lib/warehouse/core";
import { isGlobalRole } from "@/lib/contracts/warehouse-policy";

export type WarehouseDashboard = {
  summary: {
    activeProducts: number | null;
    stockedProducts: number | null;
    receivedToday: number | null;
    issuedToday: number | null;
    lowStockProducts: number | null;
    outOfStockProducts: number | null;
    openIssues: number | null;
    overdueClaims: number | null;
  };
  monthlyMovements: Array<{ month: string; inbound: number; outbound: number }>;
  categoryMix: Array<{ category: string; products: number }>;
  branchStock: Array<{ branchId: number; branch: string; stockedProducts: number }>;
  lowStockItems: Array<{
    id: number;
    sku: string;
    name: string;
    onHand: string;
    reorderPoint: string;
    status: "low_stock" | "out_of_stock";
  }>;
  recentMovements: Array<{
    id: number;
    product_id: number;
    warehouse_id: number;
    quantity_delta: string;
    occurred_at: string;
    document_id: number;
    record_no: string;
    kind: string;
    reason: string | null;
    operator_id: number;
    operator_name: string | null;
    warehouse_name: string;
    sku: string;
    product_name: string;
  }>;
};

export async function getWarehouseDashboard(actor: Actor): Promise<WarehouseDashboard> {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF", "EMPLOYEE"]);
  const global = isGlobalRole(actor.role);
  const scope = [global, actor.branchIds];

  const [summary, daily, monthly, categories, branches, lowStockItems, recentMovements] = await Promise.all([
    timedPoolQuery<WarehouseDashboard["summary"]>(`
      WITH scoped_stock AS (
        SELECT sb.product_id, SUM(sb.quantity) AS on_hand
        FROM app.stock_balances sb
        JOIN app.warehouses w ON w.id=sb.warehouse_id
        WHERE $1::boolean OR w.branch_id=ANY($2::integer[])
        GROUP BY sb.product_id
      )
      SELECT
        (SELECT COUNT(*)::integer FROM app.products WHERE active) AS "activeProducts",
        CASE WHEN $3::boolean THEN NULL ELSE
          (SELECT COUNT(*)::integer FROM scoped_stock WHERE on_hand>0) END AS "stockedProducts",
        CASE WHEN $3::boolean THEN NULL ELSE (
          SELECT COUNT(*)::integer FROM app.products p
          LEFT JOIN scoped_stock ss ON ss.product_id=p.id
          WHERE p.active AND COALESCE(ss.on_hand,0)>0
            AND p.reorder_point IS NOT NULL AND COALESCE(ss.on_hand,0)<p.reorder_point
        ) END AS "lowStockProducts",
        CASE WHEN $3::boolean THEN NULL ELSE (
          SELECT COUNT(*)::integer FROM app.products p
          LEFT JOIN scoped_stock ss ON ss.product_id=p.id
          WHERE p.active AND COALESCE(ss.on_hand,0)<=0
        ) END AS "outOfStockProducts",
        CASE WHEN $3::boolean THEN NULL ELSE (
          SELECT COUNT(*)::integer FROM app.issue_reports i
          LEFT JOIN app.goods_receipts gr ON gr.id=i.goods_receipt_id
          LEFT JOIN app.delivery_confirmations dc ON dc.carrier_receipt_id=i.carrier_receipt_id
          WHERE i.status NOT IN ('RESOLVED','CLOSED')
            AND COALESCE(gr.receiving_branch_id,dc.receiving_branch_id) IS NOT NULL
            AND ($1::boolean OR COALESCE(gr.receiving_branch_id,dc.receiving_branch_id)=ANY($2::integer[]))
        ) END AS "openIssues",
        CASE WHEN $3::boolean THEN NULL ELSE (
          SELECT COUNT(DISTINCT ct.id)::integer
          FROM app.claim_tracking ct
          JOIN app.issue_reports i ON i.id=ct.issue_report_id
          LEFT JOIN app.goods_receipts gr ON gr.id=i.goods_receipt_id
          LEFT JOIN app.delivery_confirmations dc ON dc.carrier_receipt_id=i.carrier_receipt_id
          WHERE ct.follow_up_at < now() AND i.status IN ('OPEN','FOLLOWING_UP')
            AND COALESCE(gr.receiving_branch_id,dc.receiving_branch_id) IS NOT NULL
            AND ($1::boolean OR COALESCE(gr.receiving_branch_id,dc.receiving_branch_id)=ANY($2::integer[]))
        ) END AS "overdueClaims"`, [...scope, actor.role === "EMPLOYEE"]),
    timedPoolQuery<{ receivedToday: number; issuedToday: number }>(`
      SELECT
        COUNT(DISTINCT doc.id) FILTER (WHERE doc.kind='GOODS_RECEIPT')::integer AS "receivedToday",
        COUNT(DISTINCT doc.id) FILTER (WHERE doc.kind='ISSUE')::integer AS "issuedToday"
      FROM app.stock_movements sm
      JOIN app.inventory_document_lines dl ON dl.id=sm.document_line_id
      JOIN app.inventory_documents doc ON doc.id=dl.document_id
      JOIN app.warehouses w ON w.id=sm.warehouse_id
      WHERE ($1::boolean OR w.branch_id=ANY($2::integer[]))
        AND sm.occurred_at >= ((now() AT TIME ZONE 'Asia/Bangkok')::date::timestamp AT TIME ZONE 'Asia/Bangkok')
        AND sm.occurred_at < (((now() AT TIME ZONE 'Asia/Bangkok')::date + 1)::timestamp AT TIME ZONE 'Asia/Bangkok')`, scope),
    timedPoolQuery<WarehouseDashboard["monthlyMovements"][number]>(`
      WITH month_range AS (
        SELECT generate_series(
          date_trunc('month',now() AT TIME ZONE 'Asia/Bangkok') - INTERVAL '11 months',
          date_trunc('month',now() AT TIME ZONE 'Asia/Bangkok'),
          INTERVAL '1 month'
        )::date AS month
      ), movement_totals AS (
        SELECT date_trunc('month',sm.occurred_at AT TIME ZONE 'Asia/Bangkok')::date AS month,
          COUNT(DISTINCT doc.id) FILTER (WHERE doc.kind='GOODS_RECEIPT')::integer AS inbound,
          COUNT(DISTINCT doc.id) FILTER (WHERE doc.kind='ISSUE')::integer AS outbound
        FROM app.stock_movements sm
        JOIN app.inventory_document_lines dl ON dl.id=sm.document_line_id
        JOIN app.inventory_documents doc ON doc.id=dl.document_id
        JOIN app.warehouses w ON w.id=sm.warehouse_id
        WHERE ($1::boolean OR w.branch_id=ANY($2::integer[]))
          AND sm.occurred_at >= ((date_trunc('month',now() AT TIME ZONE 'Asia/Bangkok') - INTERVAL '11 months') AT TIME ZONE 'Asia/Bangkok')
        GROUP BY 1
      )
      SELECT to_char(m.month,'YYYY-MM') AS month,
        COALESCE(t.inbound,0)::integer AS inbound, COALESCE(t.outbound,0)::integer AS outbound
      FROM month_range m LEFT JOIN movement_totals t ON t.month=m.month
      ORDER BY m.month`, scope),
    timedPoolQuery<WarehouseDashboard["categoryMix"][number]>(`
      SELECT COALESCE(c.name,'ไม่ระบุหมวดหมู่') AS category, COUNT(*)::integer AS products
      FROM app.products p LEFT JOIN app.product_categories c ON c.id=p.category_id
      WHERE p.active
      GROUP BY COALESCE(c.name,'ไม่ระบุหมวดหมู่')
      ORDER BY products DESC,category ASC`),
    timedPoolQuery<WarehouseDashboard["branchStock"][number]>(`
      SELECT b.id AS "branchId",b.name AS branch,
        COUNT(DISTINCT sb.product_id) FILTER (WHERE sb.quantity>0)::integer AS "stockedProducts"
      FROM app.branches b
      LEFT JOIN app.warehouses w ON w.branch_id=b.id
      LEFT JOIN app.stock_balances sb ON sb.warehouse_id=w.id
      WHERE b.active AND ($1::boolean OR b.id=ANY($2::integer[]))
      GROUP BY b.id,b.name
      ORDER BY COUNT(DISTINCT sb.product_id) FILTER (WHERE sb.quantity>0) DESC,b.name`, scope),
    timedPoolQuery<WarehouseDashboard["lowStockItems"][number]>(`
      WITH scoped_stock AS (
        SELECT sb.product_id,SUM(sb.quantity) AS on_hand
        FROM app.stock_balances sb JOIN app.warehouses w ON w.id=sb.warehouse_id
        WHERE $1::boolean OR w.branch_id=ANY($2::integer[])
        GROUP BY sb.product_id
      )
      SELECT p.id,p.sku,p.name,COALESCE(ss.on_hand,0)::text AS "onHand",
        COALESCE(p.reorder_point,0)::text AS "reorderPoint",
        CASE WHEN COALESCE(ss.on_hand,0)<=0 THEN 'out_of_stock' ELSE 'low_stock' END AS status
      FROM app.products p LEFT JOIN scoped_stock ss ON ss.product_id=p.id
      WHERE p.active AND (COALESCE(ss.on_hand,0)<=0 OR
        (p.reorder_point IS NOT NULL AND COALESCE(ss.on_hand,0)<p.reorder_point))
      ORDER BY CASE WHEN COALESCE(ss.on_hand,0)<=0 THEN 0 ELSE 1 END,
        COALESCE(ss.on_hand,0)/NULLIF(p.reorder_point,0),p.sku
      LIMIT 6`, scope),
    timedPoolQuery<WarehouseDashboard["recentMovements"][number]>(`
      SELECT sm.id,sm.product_id,sm.warehouse_id,sm.quantity_delta::text AS quantity_delta,
        sm.occurred_at,doc.id AS document_id,doc.record_no,doc.kind,doc.reason,
        doc.posted_by_id AS operator_id,operator_user.name AS operator_name,
        w.name AS warehouse_name,p.sku,p.name AS product_name
      FROM app.stock_movements sm
      JOIN app.inventory_document_lines dl ON dl.id=sm.document_line_id
      JOIN app.inventory_documents doc ON doc.id=dl.document_id
      JOIN app.warehouses w ON w.id=sm.warehouse_id
      JOIN app.products p ON p.id=sm.product_id
      LEFT JOIN app.app_users posted_user ON posted_user.id=doc.posted_by_id
      LEFT JOIN public."user" operator_user ON operator_user.id=posted_user.auth_user_id
      WHERE $1::boolean OR w.branch_id=ANY($2::integer[])
      ORDER BY sm.occurred_at DESC,sm.id DESC LIMIT 8`, scope),
  ]);

  const dailyTotals = daily.rows[0];
  const employee = actor.role === "EMPLOYEE";
  return {
    summary: employee
      ? {
          ...summary.rows[0],
          activeProducts: null,
          receivedToday: null,
          issuedToday: null,
        }
      : { ...summary.rows[0], ...dailyTotals },
    monthlyMovements: employee ? [] : monthly.rows,
    categoryMix: employee ? [] : categories.rows,
    branchStock: employee ? [] : branches.rows,
    lowStockItems: employee ? [] : lowStockItems.rows,
    recentMovements: employee ? [] : recentMovements.rows,
  };
}
