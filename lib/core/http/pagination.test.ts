import { describe, expect, it } from "vitest";

import { ValidationError } from "@/lib/core/http/errors";
import {
  encodeCursor,
  nextCursor,
  parsePageRequest,
} from "@/lib/core/http/pagination";

describe("keyset pagination", () => {
  it("parses a bigint cursor and preserves the identifier as text", () => {
    const cursor = encodeCursor({
      timestamp: "2026-09-20T00:00:00.000Z",
      id: "9223372036854775807",
    });

    expect(
      parsePageRequest(new URL(`https://example.test?limit=25&cursor=${cursor}`)),
    ).toEqual({
      limit: 25,
      cursor: {
        timestamp: "2026-09-20T00:00:00.000Z",
        id: "9223372036854775807",
      },
    });
  });

  it("accepts Better Auth text identifiers only when requested", () => {
    const cursor = encodeCursor({
      timestamp: "2026-09-20T00:00:00.000Z",
      id: "user_a1b2c3",
    });
    const url = new URL(`https://example.test?cursor=${cursor}`);

    expect(() => parsePageRequest(url)).toThrow(ValidationError);
    expect(parsePageRequest(url, { cursorIdKind: "text" }).cursor?.id).toBe(
      "user_a1b2c3",
    );
  });

  it("uses the limit plus one row to create a next cursor", () => {
    const rows = [
      { id: "3", createdAt: "2026-09-20T03:00:00.000Z" },
      { id: "2", createdAt: "2026-09-20T02:00:00.000Z" },
      { id: "1", createdAt: "2026-09-20T01:00:00.000Z" },
    ];

    expect(nextCursor(rows, 2, (row) => row.createdAt)).toBe(
      encodeCursor({ timestamp: rows[1].createdAt, id: rows[1].id }),
    );
    expect(nextCursor(rows.slice(0, 2), 2, (row) => row.createdAt)).toBeNull();
  });
});
