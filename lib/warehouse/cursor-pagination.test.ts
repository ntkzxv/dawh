import { describe, expect, it } from "vitest";
import { ValidationError } from "@/lib/core/http/errors";
import {
  cursorPageResult,
  encodeWarehouseCursor,
  parseCursorPage,
} from "@/lib/warehouse/cursor-pagination";

describe("warehouse cursor pagination", () => {
  it("uses a bounded default page size", () => {
    expect(parseCursorPage(new URLSearchParams())).toEqual({
      limit: 20,
      cursor: null,
    });
    expect(parseCursorPage(new URLSearchParams("limit=100")).limit).toBe(100);
  });

  it("rejects invalid limits and malformed cursors", () => {
    expect(() => parseCursorPage(new URLSearchParams("limit=101"))).toThrow(
      ValidationError,
    );
    expect(() => parseCursorPage(new URLSearchParams("limit=0"))).toThrow(
      ValidationError,
    );
    expect(() => parseCursorPage(new URLSearchParams("cursor=not-base64!"))).toThrow(
      ValidationError,
    );
    expect(() => parseCursorPage(new URLSearchParams("cursor="))).toThrow(
      ValidationError,
    );
  });

  it("round trips single and composite cursors", () => {
    const single = encodeWarehouseCursor({ parentId: 42 });
    const composite = encodeWarehouseCursor({ parentId: 42, childId: 9 });

    expect(parseCursorPage(new URLSearchParams({ cursor: single })).cursor).toEqual({
      parentId: 42,
    });
    expect(parseCursorPage(new URLSearchParams({ cursor: composite })).cursor).toEqual({
      parentId: 42,
      childId: 9,
    });
  });

  it("returns a continuation cursor only when another row exists", () => {
    const rows = [{ id: 5 }, { id: 4 }, { id: 3 }];
    const result = cursorPageResult(rows, 2, (row) => ({ parentId: row.id }));

    expect(result.items).toEqual(rows.slice(0, 2));
    expect(result.page.hasMore).toBe(true);
    expect(parseCursorPage(new URLSearchParams({ cursor: result.page.nextCursor! })).cursor)
      .toEqual({ parentId: 4 });
    expect(cursorPageResult(rows.slice(0, 2), 2, (row) => ({ parentId: row.id })).page)
      .toEqual({ limit: 2, hasMore: false, nextCursor: null });
  });
});
