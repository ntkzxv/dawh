import { ValidationError } from "@/lib/core/http/errors";

export function parsePage(search: URLSearchParams, defaultLimit = 20) {
  const page = Number(search.get("page") ?? 1);
  const limit = Number(search.get("limit") ?? defaultLimit);
  if (!Number.isSafeInteger(page) || page < 1 || page > 1_000_000) {
    throw new ValidationError({ page: "Use a page from 1 to 1000000." });
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    throw new ValidationError({ limit: "Use a limit from 1 to 100." });
  }
  return { page, limit, offset: (page - 1) * limit };
}

export function pageResult<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
) {
  return {
    items,
    page: {
      page,
      limit,
      total,
      hasMore: page * limit < total,
      nextCursor: null,
    },
  };
}
