import { ValidationError } from "@/lib/core/http/errors";
import { parsePageRequest } from "@/lib/core/http/pagination";
import { isBigIntId } from "@/lib/core/ids/bigint";
import type {
  StockBalanceFilters,
  StockLedgerFilters,
} from "@/lib/stock/types";
const statuses = new Set([
  "AVAILABLE",
  "RESERVED",
  "PICKED",
  "PACKED",
  "IN_TRANSIT",
  "QUARANTINE",
  "DAMAGED",
  "CLAIM_PENDING",
  "EXPIRED",
  "LOST",
]);
const transactionTypes = new Set([
  "RECEIVE",
  "PUTAWAY",
  "MOVE",
  "RESERVE",
  "RELEASE_RESERVATION",
  "PICK",
  "PACK",
  "DISPATCH",
  "RECEIVE_TRANSFER",
  "QUARANTINE",
  "CLAIM_HOLD",
  "ADJUST",
  "WRITE_OFF",
  "RETURN",
  "REVERSE",
]);
function id(url: URL, key: string) {
  const v = url.searchParams.get(key);
  if (v && !isBigIntId(v))
    throw new ValidationError({ [key]: "Use a positive integer ID." });
  return v;
}
function timestamp(url: URL, key: string) {
  const v = url.searchParams.get(key);
  if (!v) return null;
  const d = new Date(v);
  if (Number.isNaN(d.valueOf()))
    throw new ValidationError({ [key]: "Use a valid ISO-8601 timestamp." });
  return d.toISOString();
}
export function parseStockBalanceFilters(url: URL): StockBalanceFilters {
  const stockStatus =
    url.searchParams.get("stockStatus")?.toUpperCase() ?? null;
  if (stockStatus && !statuses.has(stockStatus))
    throw new ValidationError({ stockStatus: "Unsupported stock status." });
  return {
    facilityId: id(url, "facilityId"),
    locationId: id(url, "locationId"),
    productId: id(url, "productId"),
    stockStatus,
    lotId: id(url, "lotId"),
    serialId: id(url, "serialId"),
    search:
      url.searchParams
        .get("search")
        ?.trim()
        .replace(/([%_\\])/g, "\\$1") || null,
    page: parsePageRequest(url),
  };
}
export function parseStockLedgerFilters(url: URL): StockLedgerFilters {
  const transactionType =
    url.searchParams.get("transactionType")?.toUpperCase() ?? null;
  if (transactionType && !transactionTypes.has(transactionType))
    throw new ValidationError({
      transactionType: "Unsupported transaction type.",
    });
  const postedFrom = timestamp(url, "postedFrom"),
    postedTo = timestamp(url, "postedTo");
  if (postedFrom && postedTo && postedFrom > postedTo)
    throw new ValidationError({ postedTo: "Must be on or after postedFrom." });
  const referenceType =
    url.searchParams.get("referenceType")?.trim().toUpperCase() || null;
  if (referenceType && !/^[A-Z0-9_]{1,64}$/.test(referenceType))
    throw new ValidationError({
      referenceType: "Use uppercase letters, numbers, or underscores.",
    });
  return {
    facilityId: id(url, "facilityId"),
    productId: id(url, "productId"),
    locationId: id(url, "locationId"),
    transactionType,
    referenceType,
    referenceId: id(url, "referenceId"),
    postedFrom,
    postedTo,
    page: parsePageRequest(url),
  };
}
