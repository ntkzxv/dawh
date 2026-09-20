import { describe, expect, it } from "vitest";

import { isBigIntId, parseRouteBigIntId } from "@/lib/core/ids/bigint";
import { ValidationError } from "@/lib/core/http/errors";

describe("PostgreSQL bigint route identifiers", () => {
  it("accepts the full positive bigint range without coercing to number", () => {
    const value = "9223372036854775807";
    expect(isBigIntId(value)).toBe(true);
    expect(parseRouteBigIntId(value, "facilityId")).toBe(value);
  });

  it.each(["", "0", "-1", "1.5", "abc", "9223372036854775808"])(
    "rejects %s",
    (value) => {
      expect(isBigIntId(value)).toBe(false);
      expect(() => parseRouteBigIntId(value, "facilityId")).toThrow(
        ValidationError,
      );
    },
  );
});
