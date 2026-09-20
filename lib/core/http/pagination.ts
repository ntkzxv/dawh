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

export type CursorIdKind = "bigint" | "text";

export type ParsePageRequestOptions = {
  /** Query-string key containing the cursor. Defaults to `cursor`. */
  cursorParam?: string;
  /** Better Auth user IDs are text; domain records use bigint IDs. */
  cursorIdKind?: CursorIdKind;
  defaultLimit?: number;
  maxLimit?: number;
};

export function parsePageRequest(
  url: URL,
  {
    cursorParam = "cursor",
    cursorIdKind = "bigint",
    defaultLimit = 50,
    maxLimit = 200,
  }: ParsePageRequestOptions = {},
): PageRequest {
  const rawLimit = url.searchParams.get("limit");
  const limit = rawLimit ? Number(rawLimit) : defaultLimit;

  if (!Number.isInteger(limit) || limit < 1 || limit > maxLimit) {
    throw new ValidationError({ limit: `Use an integer from 1 to ${maxLimit}.` });
  }

  const rawCursor = url.searchParams.get(cursorParam);
  if (!rawCursor) return { limit, cursor: null };

  try {
    const decoded = JSON.parse(Buffer.from(rawCursor, "base64url").toString("utf8")) as KeysetCursor;
    if (
      typeof decoded.timestamp !== "string" ||
      typeof decoded.id !== "string" ||
      Number.isNaN(Date.parse(decoded.timestamp)) ||
      (cursorIdKind === "bigint"
        ? !isBigIntId(decoded.id)
        : decoded.id.trim().length === 0 || decoded.id.length > 255)
    ) {
      throw new Error("Invalid cursor");
    }
    return { limit, cursor: decoded };
  } catch {
    throw new ValidationError({ [cursorParam]: "The cursor is invalid." });
  }
}

export function encodeCursor(cursor: KeysetCursor): string {
  return Buffer.from(JSON.stringify(cursor)).toString("base64url");
}

export function nextCursor<T extends { id: string }>(
  items: T[],
  limit: number,
  timestamp: (item: T) => string,
) {
  if (items.length <= limit) return null;
  const item = items[limit - 1];
  return encodeCursor({ timestamp: timestamp(item), id: item.id });
}
