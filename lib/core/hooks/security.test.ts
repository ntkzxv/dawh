import { describe, expect, it } from "vitest";
import { evaluatePasswordStrength, isValidPin } from "@/hooks/useSecuritySettings";

describe("Security settings and password evaluation", () => {
  it("evaluates empty password as score 0", () => {
    const res = evaluatePasswordStrength("");
    expect(res.score).toBe(0);
    expect(res.color).toBe("bg-transparent");
  });

  it("evaluates simple password as weak (score 1)", () => {
    const res = evaluatePasswordStrength("simple");
    expect(res.score).toBe(1);
    expect(res.color).toContain("#E7");
  });

  it("evaluates strong password correctly (score 4)", () => {
    const res = evaluatePasswordStrength("StrongP@ssw0rd!2026");
    expect(res.score).toBe(4);
    expect(res.color).toBe("bg-[#2EC4B6]");
  });

  it("validates 6-digit PIN accurately", () => {
    expect(isValidPin("123456")).toBe(true);
    expect(isValidPin("000000")).toBe(true);
    expect(isValidPin("12345")).toBe(false);
    expect(isValidPin("1234567")).toBe(false);
    expect(isValidPin("abcdef")).toBe(false);
    expect(isValidPin("")).toBe(false);
  });
});
