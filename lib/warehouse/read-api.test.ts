import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@/lib/warehouse/core";
import { ApiError, ValidationError } from "@/lib/core/http/errors";
import { encodeWarehouseCursor } from "./cursor-pagination";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/lib/core/http/request-timing", () => ({ timedPoolQuery: query }));
vi.mock("@/lib/auth/session", () => ({ requireSession: vi.fn() }));

import { getPurchaseOrder, listPurchaseOrders } from "./purchase-orders";
import { getCarrierReceipt, listCarrierReceipts } from "./carrier-receipts";
import { listCatalog, listCatalogPage } from "./catalog";

const actor: Actor = {
  id: 1, authUserId: "user-1", role: "MANAGER", branchIds: [7],
  name: "Manager", email: "manager@example.test", image: null,
};
const result = (rows: Record<string, unknown>[] = []) => ({ rows, rowCount: rows.length });

beforeEach(() => {
  query.mockReset();
  query.mockResolvedValue(result());
});

describe("optional document list filters", () => {
  it("keeps the existing PO defaults and cursor metadata", async () => {
    query.mockResolvedValue(result([{ id: 9 }, { id: 8 }, { id: 7 }]));
    const page = await listPurchaseOrders(actor, new URLSearchParams("limit=2"));
    expect(query.mock.calls[0][1]).toEqual(["", null, 3]);
    expect(page.items).toEqual([{ id: 9 }, { id: 8 }]);
    expect(page.page.nextCursor).toBe(encodeWarehouseCursor({ parentId: 8 }));
  });

  it.each([true, false])("filters closed=%s before paging", async (closed) => {
    const cursor = encodeWarehouseCursor({ parentId: 30 });
    await listPurchaseOrders(actor, new URLSearchParams({ closed: String(closed), q: "PO-12", cursor, limit: "5" }));
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("(po.closed_at IS NOT NULL) = $3::boolean");
    expect(sql).toContain("LIMIT $4");
    expect(params).toEqual(["PO-12", 30, closed, 6]);
  });

  it("combines carrier eligibility filters with scope and cursor", async () => {
    const cursor = encodeWarehouseCursor({ parentId: 40 });
    await listCarrierReceipts(actor, new URLSearchParams({ received: "true", hasGoodsReceipt: "false", cursor }));
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("dc.receiving_branch_id=ANY($2::integer[])");
    expect(sql).toContain("(dc.received_at IS NOT NULL) = $4::boolean");
    expect(sql).toContain("gr.carrier_receipt_id=cr.id) = $5::boolean");
    expect(sql).toContain("LIMIT $6");
    expect(params).toEqual([false, [7], 40, true, false, 21]);
  });

  it.each(["received", "hasGoodsReceipt"])("supports false for %s without changing other filters", async (key) => {
    await listCarrierReceipts(actor, new URLSearchParams({ [key]: "false" }));
    expect(query.mock.calls[0][1]).toEqual([false, [7], null, false, 21]);
  });

  it("keeps unfiltered carrier request parameters unchanged", async () => {
    await listCarrierReceipts(actor, new URLSearchParams());
    expect(query.mock.calls[0][1]).toEqual([false, [7], null, 21]);
  });

  it.each(["", "1", "TRUE", "anything"])("rejects invalid boolean %j before querying", async (value) => {
    await expect(listPurchaseOrders(actor, new URLSearchParams({ closed: value }))).rejects.toBeInstanceOf(ValidationError);
    await expect(listCarrierReceipts(actor, new URLSearchParams({ received: value }))).rejects.toBeInstanceOf(ValidationError);
    await expect(listCarrierReceipts(actor, new URLSearchParams({ hasGoodsReceipt: value }))).rejects.toBeInstanceOf(ValidationError);
    expect(query).not.toHaveBeenCalled();
  });
});

describe("compact document views", () => {
  const head = { id: 10, closed_at: null, receiving_branch_id: 7 };
  const lines = [{ id: 20, quantity: "10", remaining_good_quantity: "4" }];
  beforeEach(() => {
    query.mockImplementation(async (sql: string) => {
      if (sql.includes("SELECT po.*") || (sql.includes("SELECT cr.*") && sql.includes("WHERE cr.id=$1"))) return result([head]);
      if (sql.includes("FROM app.purchase_order_lines")) return result(lines);
      if (sql.includes("SELECT * FROM app.delivery_confirmations")) return result([{ receiving_branch_id: 7 }]);
      return result();
    });
  });

  it("returns the same PO lines with two queries and omits related collections", async () => {
    const full = await getPurchaseOrder(actor, 10);
    expect(query).toHaveBeenCalledTimes(6);
    query.mockClear();
    const compact = await getPurchaseOrder(actor, 10, "lines");
    expect(compact).toEqual({ ...head, lines: full.lines });
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("preserves the Employee line projection in compact reads", async () => {
    await getPurchaseOrder({ ...actor, role: "EMPLOYEE" }, 10, "lines");
    expect(query).toHaveBeenCalledTimes(2);
    const sql = query.mock.calls[1][0];
    expect(sql).toContain("SELECT l.id,l.purchase_order_id,l.product_id,l.quantity");
    expect(sql).not.toContain("unit_price");
  });

  it("keeps the Employee full response shape and three-query path", async () => {
    const full = await getPurchaseOrder({ ...actor, role: "EMPLOYEE" }, 10);
    expect(query).toHaveBeenCalledTimes(3);
    expect(full).toMatchObject({ supplierReceipts: [], carrierReceipts: [], goodsReceipts: [], revisions: [] });
  });

  it("returns confirmation with two queries instead of five", async () => {
    const full = await getCarrierReceipt(actor, 10);
    expect(query).toHaveBeenCalledTimes(5);
    query.mockClear();
    const compact = await getCarrierReceipt(actor, 10, "confirmation");
    expect(compact).toEqual({ ...head, confirmation: full.confirmation });
    expect(query).toHaveBeenCalledTimes(2);
  });

  it("rejects an out-of-scope compact carrier before loading confirmation", async () => {
    await expect(getCarrierReceipt({ ...actor, branchIds: [8] }, 10, "confirmation")).rejects.toMatchObject({ code: "FORBIDDEN_BRANCH" });
    expect(query).toHaveBeenCalledTimes(1);
  });

  it("returns 404 for missing compact documents", async () => {
    query.mockResolvedValue(result());
    await expect(getPurchaseOrder(actor, 10, "lines")).rejects.toMatchObject({ status: 404 });
    await expect(getCarrierReceipt(actor, 10, "confirmation")).rejects.toMatchObject({ status: 404 });
    expect(query).toHaveBeenCalledTimes(2);
  });
});

describe("catalog lookups and warehouse filters", () => {
  it("keeps the original unpaginated warehouse request", async () => {
    await listCatalog(actor, "warehouses");
    expect(query.mock.calls[0][0]).toContain("SELECT * FROM app.warehouses WHERE branch_id = ANY($1::integer[])");
    expect(query.mock.calls[0][0]).toContain("LIMIT 500");
    expect(query.mock.calls[0][1]).toEqual([[7]]);
  });

  it("intersects a warehouse filter with the actor scope", async () => {
    await listCatalog(actor, "warehouses", new URLSearchParams("branchId=8"));
    expect(query.mock.calls[0][0]).toContain("branch_id = ANY($1::integer[])");
    expect(query.mock.calls[0][0]).toContain("branch_id=$2");
    expect(query.mock.calls[0][1]).toEqual([[7], 8]);
  });

  it("uses the branch filter in both count and paginated rows", async () => {
    query.mockImplementation(async (sql: string) => sql.includes("COUNT(*)") ? result([{ total: 0 }]) : result());
    const page = await listCatalogPage(actor, "warehouses", new URLSearchParams("branchId=7&page=2&limit=10"));
    expect(query).toHaveBeenCalledTimes(2);
    for (const [sql] of query.mock.calls) expect(sql).toContain("branch_id=$2");
    expect(query.mock.calls[0][1]).toEqual([[7], 7, ""]);
    expect(query.mock.calls[1][1]).toEqual([[7], 7, "", 10, 10]);
    expect(page.page).toMatchObject({ page: 2, limit: 10, total: 0 });
  });

  it.each(["0", "", "abc", "2147483648"])("rejects invalid warehouse branchId=%j", async (branchId) => {
    await expect(listCatalog(actor, "warehouses", new URLSearchParams({ branchId }))).rejects.toBeInstanceOf(ValidationError);
    await expect(listCatalogPage(actor, "warehouses", new URLSearchParams({ branchId, page: "1" }))).rejects.toBeInstanceOf(ValidationError);
    expect(query).not.toHaveBeenCalled();
  });

  it.each([
    ["branches", "id,code,name,active"], ["warehouses", "id,branch_id,code,name,active"],
    ["suppliers", "id,code,name,active"], ["units", "id,code,name"],
    ["product-groups", "id,name"], ["product-categories", "id,group_id,name"],
    ["brands", "id,name"], ["product-models", "id,brand_id,name"],
  ])("bounds %s lookups and returns only selector fields", async (kind, columns) => {
    await listCatalog(actor, kind, new URLSearchParams("lookup=1&q=test"));
    expect(query.mock.calls[0][0]).toContain(`SELECT ${columns} FROM app.`);
    expect(query.mock.calls[0][0]).toContain("LIMIT 50");
    expect(query.mock.calls[0][1]).toContain("test");
  });

  it("preserves the existing active product lookup", async () => {
    await listCatalog(actor, "products", new URLSearchParams("lookup=1&q=SKU"));
    expect(query.mock.calls[0][0]).toContain("SELECT id,sku,name,unit_id,serial_tracked,active FROM app.products");
    expect(query.mock.calls[0][0]).toContain("WHERE active AND");
    expect(query.mock.calls[0][1]).toEqual(["SKU"]);
  });

  it("keeps Employee catalog permissions and scoped branch lookup", async () => {
    const employee = { ...actor, role: "EMPLOYEE" as const };
    await expect(listCatalog(employee, "warehouses", new URLSearchParams("lookup=1"))).rejects.toBeInstanceOf(ApiError);
    expect(query).not.toHaveBeenCalled();
    await listCatalog(employee, "branches", new URLSearchParams("lookup=1"));
    expect(query.mock.calls[0][0]).toContain("id = ANY($1::integer[])");
    expect(query.mock.calls[0][1]).toEqual([[7], ""]);
  });

  it("rejects oversized lookup searches without querying", async () => {
    await expect(listCatalog(actor, "suppliers", new URLSearchParams({ lookup: "1", q: "x".repeat(101) }))).rejects.toBeInstanceOf(ValidationError);
    expect(query).not.toHaveBeenCalled();
  });
});
