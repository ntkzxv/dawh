import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Actor } from "@/lib/warehouse/core";

const { query } = vi.hoisted(() => ({ query: vi.fn() }));
vi.mock("@/lib/core/http/request-timing", () => ({ timedPoolQuery: query }));
vi.mock("@/lib/auth/session", () => ({ requireSession: vi.fn() }));

import { arOverview, listOverdue, listPayments } from "./receivables";
import { bangkokToday } from "./sales";

const actorOf = (role: Actor["role"]): Actor => ({
  id: 1, authUserId: "u1", role, branchIds: [7], name: "T", email: "t@example.test", image: null,
});
const result = (rows: Record<string, unknown>[] = []) => ({ rows, rowCount: rows.length });

beforeEach(() => {
  query.mockReset();
  query.mockResolvedValue(result());
});

describe("A/R reads", () => {
  it("EMPLOYEE gets 403 on overview, overdue and payments", async () => {
    const employee = actorOf("EMPLOYEE");
    await expect(arOverview(employee)).rejects.toMatchObject({ status: 403 });
    await expect(listOverdue(employee, new URLSearchParams())).rejects.toMatchObject({ status: 403 });
    await expect(listPayments(employee, new URLSearchParams())).rejects.toMatchObject({ status: 403 });
  });
  it("overdue query excludes cancelled sales and binds today (Bangkok)", async () => {
    await listOverdue(actorOf("MANAGER"), new URLSearchParams());
    const [sql, params] = query.mock.calls[0];
    expect(sql).toContain("s.cancelled_at IS NULL");
    expect(sql).toContain("i.due_on < $3::date");
    expect(params[2]).toBe(bangkokToday());
  });
  it("non-global role passes its branch ids, global role bypasses", async () => {
    await arOverview(actorOf("COUNTER_STAFF"));
    expect(query.mock.calls[0][1].slice(0, 2)).toEqual([false, [7]]);
    await arOverview(actorOf("ADMIN"));
    expect(query.mock.calls[1][1][0]).toBe(true);
  });
  it("listPayments rejects a bad kind with 400 and passes valid filters", async () => {
    await expect(listPayments(actorOf("MANAGER"), new URLSearchParams({ kind: "NOPE" }))).rejects.toMatchObject({ status: 400 });
    await listPayments(actorOf("MANAGER"), new URLSearchParams({ kind: "INSTALLMENT", customerId: "3", includeVoided: "true" }));
    const params = query.mock.calls[0][1];
    expect(params.slice(2, 5)).toEqual(["INSTALLMENT", 3, true]);
  });
});
