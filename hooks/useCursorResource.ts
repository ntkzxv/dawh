"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ApiListPage } from "@/lib/api/warehouse";

export function useCursorResource<T>(
  loadPage: (
    cursor: string | null,
    signal: AbortSignal,
  ) => Promise<ApiListPage<T>>,
  enabled = true,
) {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState<ApiListPage<T>["page"] | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const generationRef = useRef(0);

  const refresh = useCallback(async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const generation = ++generationRef.current;
    setLoading(true);
    setError(null);
    try {
      const result = await loadPage(null, controller.signal);
      if (generation !== generationRef.current) return;
      setItems(result.items);
      setPage(result.page);
    } catch (cause) {
      if (!controller.signal.aborted && generation === generationRef.current) {
        setError(cause instanceof Error ? cause.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    } finally {
      if (generation === generationRef.current) setLoading(false);
    }
  }, [loadPage]);

  const loadMore = useCallback(async () => {
    if (!page?.hasMore || !page.nextCursor || loadingMore) return;
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    const generation = ++generationRef.current;
    setLoadingMore(true);
    setError(null);
    try {
      const result = await loadPage(page.nextCursor, controller.signal);
      if (generation !== generationRef.current) return;
      setItems((current) => [...current, ...result.items]);
      setPage(result.page);
    } catch (cause) {
      if (!controller.signal.aborted && generation === generationRef.current) {
        setError(cause instanceof Error ? cause.message : "โหลดข้อมูลไม่สำเร็จ");
      }
    } finally {
      if (generation === generationRef.current) setLoadingMore(false);
    }
  }, [loadPage, loadingMore, page]);

  useEffect(() => {
    if (!enabled) {
      controllerRef.current?.abort();
      return;
    }
    let active = true;
    queueMicrotask(() => {
      if (active) void refresh();
    });
    return () => {
      active = false;
      controllerRef.current?.abort();
    };
  }, [enabled, refresh]);

  return { items, setItems, page, loading, loadingMore, error, refresh, loadMore };
}
