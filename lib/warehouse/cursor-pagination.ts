import { ValidationError } from "@/lib/core/http/errors";

export type WarehouseCursor = {
  parentId: number;
  childId?: number;
};

export type CursorPageInfo = {
  limit: number;
  nextCursor: string | null;
  hasMore: boolean;
};

export function parseCursorPage(search: URLSearchParams, defaultLimit = 20) {
  const rawLimit = search.get("limit");
  const limit = Number(rawLimit ?? defaultLimit);
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new ValidationError({ limit: "Use a limit from 1 to 100." });
  }

  const rawCursor = search.get("cursor");
  if (!search.has("cursor")) return { limit, cursor: null as WarehouseCursor | null };
  if (!rawCursor) throw new ValidationError({ cursor: "The cursor is invalid." });
  if (rawCursor.length > 256) {
    throw new ValidationError({ cursor: "The cursor is invalid." });
  }

  try {
    const bytes = Buffer.from(rawCursor, "base64url");
    if (bytes.toString("base64url") !== rawCursor) throw new Error("Invalid encoding");
    const value: unknown = JSON.parse(bytes.toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error("Invalid payload");
    }
    const candidate = value as Record<string, unknown>;
    const parentId = Number(candidate.parentId);
    const childId = candidate.childId == null ? undefined : Number(candidate.childId);
    if (
      candidate.version !== 1 ||
      !Number.isSafeInteger(parentId) || parentId < 1 ||
      (childId !== undefined && (!Number.isSafeInteger(childId) || childId < 1)) ||
      Object.keys(candidate).some((key) => !["version", "parentId", "childId"].includes(key))
    ) {
      throw new Error("Invalid payload");
    }
    return { limit, cursor: { parentId, ...(childId === undefined ? {} : { childId }) } };
  } catch {
    throw new ValidationError({ cursor: "The cursor is invalid." });
  }
}

export function encodeWarehouseCursor(cursor: WarehouseCursor): string {
  return Buffer.from(JSON.stringify({ version: 1, ...cursor })).toString("base64url");
}

export function cursorPageResult<T>(
  rows: T[],
  limit: number,
  getCursor: (row: T) => WarehouseCursor,
) {
  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items.at(-1);
  return {
    items,
    page: {
      limit,
      hasMore,
      nextCursor: hasMore && last ? encodeWarehouseCursor(getCursor(last)) : null,
    } satisfies CursorPageInfo,
  };
}
