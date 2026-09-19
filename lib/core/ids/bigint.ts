const positiveBigIntIdPattern = /^[1-9]\d*$/;
const postgresBigIntMax = "9223372036854775807";

export function isBigIntId(value: string): boolean {
  if (!positiveBigIntIdPattern.test(value)) return false;
  if (value.length !== postgresBigIntMax.length) return value.length < postgresBigIntMax.length;
  return value <= postgresBigIntMax;
}
