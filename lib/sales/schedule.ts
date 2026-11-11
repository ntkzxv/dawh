// Pure satang math shared by the server and the new-sale preview: no server-only imports.
import { ValidationError } from "@/lib/core/http/errors";

export type ScheduleInput = {
  priceSatang: bigint;
  ratePct: string;
  downSatang: bigint;
  months: number;
  firstDueOn: string;
};
export type ScheduleRow = { seq: number; dueOn: string; amountSatang: bigint };

const pad = (n: number) => String(n).padStart(2, "0");

export function buildSchedule({ priceSatang, ratePct, downSatang, months, firstDueOn }: ScheduleInput) {
  if (!/^\d{1,3}(?:\.\d{1,2})?$/.test(ratePct) || Number(ratePct) > 100)
    throw new ValidationError({ interestRate: "Use a rate from 0 to 100 with at most two decimals." });
  if (!Number.isInteger(months) || months < 1 || months > 120)
    throw new ValidationError({ months: "Use a whole number of months from 1 to 120." });
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(firstDueOn);
  if (!match || Number.isNaN(Date.parse(`${firstDueOn}T00:00:00Z`)))
    throw new ValidationError({ firstDueOn: "Use a date in YYYY-MM-DD format." });

  const [whole, fraction = ""] = ratePct.split(".");
  const rateHundredths = BigInt(whole) * BigInt(100) + BigInt(fraction.padEnd(2, "0"));
  const interestSatang = (priceSatang * rateHundredths + BigInt(5000)) / BigInt(10000);
  if (downSatang < BigInt(0) || downSatang >= priceSatang + interestSatang)
    throw new ValidationError({ downPayment: "Down payment must be at least 0 and less than price plus interest." });
  const financedSatang = priceSatang + interestSatang - downSatang;
  const count = BigInt(months);
  const installmentSatang = (BigInt(2) * financedSatang + count) / (BigInt(2) * count);
  const lastSatang = financedSatang - installmentSatang * (count - BigInt(1));
  if (installmentSatang <= BigInt(0) || lastSatang <= BigInt(0))
    throw new ValidationError({ months: "Too many months for the financed amount." });

  const year = Number(match[1]);
  const month0 = Number(match[2]) - 1;
  const day = Number(match[3]);
  const installments: ScheduleRow[] = Array.from({ length: months }, (_, index) => {
    const target = month0 + index;
    const y = year + Math.floor(target / 12);
    const m = target % 12;
    const clamped = Math.min(day, new Date(Date.UTC(y, m + 1, 0)).getUTCDate());
    return {
      seq: index + 1,
      dueOn: `${y}-${pad(m + 1)}-${pad(clamped)}`,
      amountSatang: index === months - 1 ? lastSatang : installmentSatang,
    };
  });
  return { interestSatang, financedSatang, installmentSatang, installments };
}
