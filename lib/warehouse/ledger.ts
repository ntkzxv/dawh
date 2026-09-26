import "server-only";

import type { PoolClient } from "pg";
import { ApiError } from "@/lib/core/http/errors";

type InventoryLine = {
  documentId: number;
  warehouseId: number;
  productId: number;
  quantity: string;
  unitCost?: string | null;
  serialNumbers?: string[];
};

// The balance and immutable movement are written in the caller's transaction.
export async function postInventoryLine(client: PoolClient, line: InventoryLine): Promise<number> {
  const { documentId, warehouseId, productId, quantity } = line;
  await client.query(`
    INSERT INTO app.stock_balances(warehouse_id, product_id, quantity)
    VALUES ($1, $2, 0)
    ON CONFLICT DO NOTHING
  `, [warehouseId, productId]);

  const balance = await client.query(`
    UPDATE app.stock_balances
    SET quantity = quantity + $3::numeric, updated_at = now()
    WHERE warehouse_id = $1 AND product_id = $2 AND quantity + $3::numeric >= 0
    RETURNING quantity
  `, [warehouseId, productId, quantity]);
  if (!balance.rowCount) {
    throw new ApiError(409, "INSUFFICIENT_STOCK", "This movement would make stock negative.");
  }

  const saved = await client.query<{ id: number }>(`
    INSERT INTO app.inventory_document_lines(document_id, product_id, quantity, unit_cost, serial_numbers)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [documentId, productId, quantity, line.unitCost ?? null, line.serialNumbers ?? []]);

  await client.query(`
    INSERT INTO app.stock_movements(document_line_id, warehouse_id, product_id, quantity_delta)
    VALUES ($1, $2, $3, $4)
  `, [saved.rows[0].id, warehouseId, productId, quantity]);
  return saved.rows[0].id;
}
