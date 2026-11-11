import { describe, expect, it } from "vitest";
import { buildSchedule } from "./schedule";

const S = (baht: number) => BigInt(baht * 100);
const base = { priceSatang: S(10000), ratePct: "10", downSatang: S(2000), months: 12, firstDueOn: "2027-01-15" };

describe("buildSchedule", () => {
  it("10,000 / 10% / 2,000 down / 12 months", () => {
    const r = buildSchedule(base);
    expect(r.interestSatang).toBe(S(1000));
    expect(r.financedSatang).toBe(S(9000));
    expect(r.installmentSatang).toBe(S(750));
    expect(r.installments).toHaveLength(12);
    expect(r.installments.every((row) => row.amountSatang === S(750))).toBe(true);
  });
  it("puts the remainder on the last installment", () => {
    const r = buildSchedule({ ...base, ratePct: "0", downSatang: BigInt(0), priceSatang: S(9000), months: 7 });
    expect(r.installments.slice(0, 6).every((row) => row.amountSatang === BigInt(128571))).toBe(true);
    expect(r.installments[6].amountSatang).toBe(BigInt(128574));
    expect(r.installments.reduce((sum, row) => sum + row.amountSatang, BigInt(0))).toBe(r.financedSatang);
  });
  it("clamps month-end dates and returns to the original day", () => {
    const d = buildSchedule({ ...base, firstDueOn: "2027-01-31", months: 3 }).installments.map((row) => row.dueOn);
    expect(d).toEqual(["2027-01-31", "2027-02-28", "2027-03-31"]);
  });
  it("uses 29 Feb in a leap year and rolls over the year", () => {
    expect(buildSchedule({ ...base, firstDueOn: "2028-01-31", months: 2 }).installments[1].dueOn).toBe("2028-02-29");
    expect(buildSchedule({ ...base, firstDueOn: "2027-12-10", months: 2 }).installments[1].dueOn).toBe("2028-01-10");
  });
  it("rejects down payment >= price + interest", () => {
    expect(() => buildSchedule({ ...base, downSatang: S(11000) })).toThrow();
    expect(() => buildSchedule({ ...base, downSatang: S(12000) })).toThrow();
  });
  it("rejects months outside 1..120", () => {
    expect(() => buildSchedule({ ...base, months: 0 })).toThrow();
    expect(() => buildSchedule({ ...base, months: 121 })).toThrow();
  });
});
