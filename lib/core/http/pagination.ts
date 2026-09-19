import "server-only";

import { ValidationError } from "@/lib/core/http/errors";
import { isBigIntId } from "@/lib/core/ids/bigint";

export type KeysetCursor = {
  timestamp: string;
  id: string;
};

export type PageRequest = {
  limit: number;
  cursor: KeysetCursor | null;
};

export function parsePageRequest(url: URL): PageRequest {
  const rawLimit = url.searchParams.get("limit");
  const limit = rawLimit ? Number(rawLimit) : 50;

  if (!Number.isInteger(limit) || limit < 1 || limit > 200) {
    throw new ValidationError({ limit: "Use an integer from 1 to 200." });
  }

  const rawCursor = url.searchParams.get("cursor");
  if (!rawCursor) return { limit, cursor: null };

  try {
    const decoded = JSON.parse(Buffer.from(rawCursor, "base64url").toString("utf8")) as KeysetCursor;
    if (
      typeof decoded.timestamp !== "string" ||
      typeof decoded.id !== "string" ||
      Number.isNaN(Date.parse(decoded.timestamp)) ||
      !isBigIntId(decoded.id)
    ) {
      throw new Error("Invalid cursor");
    }
    return { limit, cursor: decoded };
  } catch {
    throw new ValidationError({ cursor: "The cursor is invalid." });
  }
}

export function nextCursor<T extends { id: string }>(items: T[], limit: number, timestamp: (item: T) => string) {
  if (items.length <= limit) return null;
  const item = items[limit - 1];
  return Buffer.from(JSON.stringify({ timestamp: timestamp(item), id: item.id })).toString("base64url");
}
