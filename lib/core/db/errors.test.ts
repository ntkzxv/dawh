import { describe, expect, it } from "vitest";

import { rethrowUniqueViolation } from "@/lib/core/db/errors";
import { ConflictError } from "@/lib/core/http/errors";

describe("PostgreSQL error mapping", () => {
  it("maps SQLSTATE 23505 to the API conflict contract", () => {
    expect(() =>
      rethrowUniqueViolation({ code: "23505" }, "Duplicate department."),
    ).toThrow(ConflictError);
  });

  it("preserves unrecognised errors", () => {
    const source = new Error("connection lost");
    expect(() => rethrowUniqueViolation(source)).toThrow(source);
  });
});
