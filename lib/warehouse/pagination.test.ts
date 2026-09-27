import { describe, expect, it } from "vitest";
import { pageResult, parsePage } from "@/lib/warehouse/pagination";

describe("warehouse page pagination", () => {
  it("calculates offsets past 1,000 rows without losing page metadata", () => {
    const rows = Array.from({ length: 1_001 }, (_, index) => index + 1);
    const request = new URLSearchParams("page=51&limit=20");
    const { page, limit, offset } = parsePage(request);
    const result = pageResult(rows.slice(offset, offset + limit), rows.length, page, limit);

    expect(offset).toBe(1_000);
    expect(result.items).toEqual([1_001]);
    expect(result.page).toEqual({
      page: 51,
      limit: 20,
      total: 1_001,
      hasMore: false,
      nextCursor: null,
    });
  });

  it("marks a page before the final page as having more rows", () => {
    const rows = Array.from({ length: 1_001 }, (_, index) => index + 1);
    const { page, limit, offset } = parsePage(
      new URLSearchParams("page=50&limit=20"),
    );
    const result = pageResult(rows.slice(offset, offset + limit), rows.length, page, limit);

    expect(result.items).toHaveLength(20);
    expect(result.page.hasMore).toBe(true);
  });
});
