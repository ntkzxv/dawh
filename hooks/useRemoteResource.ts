"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApiRequestError } from "@/lib/api/client";

function errorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.code === "STORAGE_NOT_CONFIGURED")
      return "ระบบเก็บรูปยังไม่ได้ตั้งค่า กรุณาแจ้งผู้ดูแลระบบ";
    if (error.code === "FORBIDDEN") return "บัญชีนี้ไม่มีสิทธิ์ทำรายการนี้";
    return error.message;
  }
  return error instanceof Error ? error.message : "ไม่สามารถทำรายการได้";
}

export function useRemote<T>(
  load: (signal: AbortSignal) => Promise<T>,
  options: { enabled?: boolean } = {},
) {
  const enabled = options.enabled ?? true;
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);

  const refresh = useCallback(async () => {
    controller.current?.abort();
    const nextController = new AbortController();
    controller.current = nextController;
    const nextId = ++requestId.current;
    setLoading(true);
    setError(null);
    try {
      const result = await load(nextController.signal);
      if (requestId.current === nextId && !nextController.signal.aborted)
        setData(result);
    } catch (cause) {
      if (requestId.current === nextId && !nextController.signal.aborted)
        setError(errorMessage(cause));
    } finally {
      if (requestId.current === nextId && !nextController.signal.aborted)
        setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    if (!enabled) return;
    let active = true;
    queueMicrotask(() => {
      if (active) void refresh();
    });
    return () => {
      active = false;
      requestId.current += 1;
      controller.current?.abort();
    };
  }, [enabled, refresh]);

  return { data, loading, error, refresh, setData };
}
