import { describe, expect, it } from "vitest";

import {
  formatBirthDate,
  formatMaritalStatus,
  formatPrefix,
  normalizePrefix,
  translateEducationLevel,
} from "@/types/user";

describe("User types and formatting utilities", () => {
  it("normalizes prefixes correctly", () => {
    expect(normalizePrefix("นาย")).toBe("mr");
    expect(normalizePrefix("Mr.")).toBe("mr");
    expect(normalizePrefix("นาง")).toBe("mrs");
    expect(normalizePrefix("นางสาว")).toBe("miss");
    expect(normalizePrefix("")).toBe("");
  });

  it("formats prefixes for display in Thai and English", () => {
    expect(formatPrefix("mr", "TH")).toBe("นาย");
    expect(formatPrefix("mr", "EN")).toBe("Mr.");
    expect(formatPrefix("mrs", "TH")).toBe("นาง");
    expect(formatPrefix("miss", "TH")).toBe("นางสาว");
  });

  it("formats birth dates consistently into DD/MM/YYYY", () => {
    expect(formatBirthDate("2004-08-29")).toBe("29/08/2004");
    expect(formatBirthDate("1995-12-05T00:00:00.000Z")).toBe("05/12/1995");
    expect(formatBirthDate(null)).toBe("—");
    expect(formatBirthDate("")).toBe("—");
  });

  it("formats marital status correctly", () => {
    expect(formatMaritalStatus("Single", "TH")).toBe("โสด (Single)");
    expect(formatMaritalStatus("Married", "TH")).toBe("สมรส (Married)");
    expect(formatMaritalStatus("Divorced", "EN")).toBe("Divorced");
  });

  it("translates education levels correctly", () => {
    expect(translateEducationLevel("ปริญญาตรี", "TH")).toContain("ปริญญาตรี");
    expect(translateEducationLevel("Bachelor's Degree", "EN")).toContain("Bachelor's Degree");
  });
});
