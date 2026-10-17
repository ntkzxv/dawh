import "server-only";

import { timedPoolQuery } from "@/lib/core/http/request-timing";
import { requireRole, type Actor } from "@/lib/warehouse/core";

export type WarehouseOverview = {
  purchaseOrderCount: number;
  carrierReceiptCount: number;
  openPurchaseOrders: number;
  awaitingDelivery: number;
  stockItems: number;
  openIssues: number;
};

export async function getWarehouseOverview(
  actor: Actor,
): Promise<WarehouseOverview> {
  requireRole(actor, ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF", "EMPLOYEE"]);

  const global = actor.role === "ADMIN" || actor.role === "CEO";
  const employee = actor.role === "EMPLOYEE";
  const result = await timedPoolQuery<WarehouseOverview>(
    `SELECT
      (SELECT count(*)::integer FROM app.purchase_orders) AS "purchaseOrderCount",
      (SELECT count(*)::integer FROM app.carrier_receipts) AS "carrierReceiptCount",
      (SELECT count(*)::integer
       FROM app.purchase_orders po
       WHERE po.closed_at IS NULL) AS "openPurchaseOrders",
      (SELECT count(*)::integer
       FROM app.carrier_receipts cr
       WHERE NOT EXISTS (
         SELECT 1 FROM app.delivery_confirmations dc
         WHERE dc.carrier_receipt_id = cr.id
       )) AS "awaitingDelivery",
      CASE WHEN $3::boolean THEN 0 ELSE (
        SELECT count(*)::integer
        FROM app.stock_balances sb
        JOIN app.warehouses w ON w.id = sb.warehouse_id
        JOIN app.branches b ON b.id = w.branch_id
        JOIN app.products p ON p.id = sb.product_id
        JOIN app.units u ON u.id = p.unit_id
        WHERE $1::boolean OR w.branch_id = ANY($2::integer[])
      ) END AS "stockItems",
      CASE WHEN $3::boolean THEN 0 ELSE (
        SELECT count(*)::integer
        FROM app.issue_reports i
        LEFT JOIN app.goods_receipts gr ON gr.id = i.goods_receipt_id
        LEFT JOIN app.delivery_confirmations dc ON dc.carrier_receipt_id = i.carrier_receipt_id
        WHERE i.status <> 'CLOSED'
          AND (
            $1::boolean
            OR COALESCE(gr.receiving_branch_id, dc.receiving_branch_id) IS NULL
            OR COALESCE(gr.receiving_branch_id, dc.receiving_branch_id) = ANY($2::integer[])
          )
      ) END AS "openIssues"`,
    [global, actor.branchIds, employee],
  );

  return result.rows[0];
}
