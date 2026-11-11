const DIGITS = ["", "หนึ่ง", "สอง", "สาม", "สี่", "ห้า", "หก", "เจ็ด", "แปด", "เก้า"];
const PLACES = ["", "สิบ", "ร้อย", "พัน", "หมื่น", "แสน"];

// Reads a digit string of at most 6 digits; `hasHigher` makes a trailing 1 read "เอ็ด".
function chunk(digits: string, hasHigher: boolean): string {
  const n = digits.length;
  let out = "";
  for (let i = 0; i < n; i++) {
    const d = Number(digits[i]);
    const pos = n - 1 - i;
    if (d === 0) continue;
    if (pos === 0) out += d === 1 && (n > 1 || hasHigher) ? "เอ็ด" : DIGITS[d];
    else if (pos === 1) out += (d === 1 ? "" : d === 2 ? "ยี่" : DIGITS[d]) + "สิบ";
    else out += DIGITS[d] + PLACES[pos];
  }
  return out;
}

function integerText(digits: string): string {
  digits = digits.replace(/^0+/, "");
  if (!digits) return "ศูนย์";
  if (digits.length <= 6) return chunk(digits, false);
  const cut = digits.length - 6;
  const rest = digits.slice(cut);
  return integerText(digits.slice(0, cut)) + "ล้าน" + chunk(rest.replace(/^0+/, ""), true);
}

// amount: decimal string with at most 2 decimals, e.g. "115.44".
export function bahtText(amount: string): string {
  const [whole = "0", frac = ""] = amount.trim().replace(/,/g, "").split(".");
  const satang = frac.padEnd(2, "0").slice(0, 2);
  const hasSatang = Number(satang) > 0;
  const hasBaht = Number(whole) > 0;
  const baht = hasBaht || !hasSatang ? integerText(whole) + "บาท" : "";
  return hasSatang ? `${baht}${chunk(satang.replace(/^0+/, ""), false)}สตางค์` : `${baht}ถ้วน`;
}
