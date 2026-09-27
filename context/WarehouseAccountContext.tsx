"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePathname } from "next/navigation";
import { ApiRequestError } from "@/lib/api/client";
import { warehouseApi, type Me } from "@/lib/api/warehouse";

type AccountContextValue = {
  me: Me | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  clear: () => void;
};

const AccountContext = createContext<AccountContextValue | null>(null);
const protectedPrefixes = [
  "/warehouse",
  "/workspace",
  "/account",
  "/settings",
  "/controlpanel",
];

function isProtectedPath(pathname: string) {
  return protectedPrefixes.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export function WarehouseAccountProvider({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const protectedPath = isProtectedPath(pathname);
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(protectedPath);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setMe(await warehouseApi.me());
    } catch (cause) {
      setMe(null);
      if (!(
        cause instanceof ApiRequestError && [401, 403].includes(cause.status)
      )) {
        setError(
          cause instanceof Error
            ? cause.message
            : "ไม่สามารถโหลดข้อมูลบัญชีได้",
        );
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setMe(null);
    setError(null);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!protectedPath) return;
    let active = true;
    queueMicrotask(() => {
      if (active) void refresh();
    });
    return () => {
      active = false;
    };
  }, [protectedPath, refresh]);

  const value = useMemo(
    () => ({ me, loading, error, refresh, clear }),
    [me, loading, error, refresh, clear],
  );
  return (
    <AccountContext.Provider value={value}>{children}</AccountContext.Provider>
  );
}

export function useOptionalWarehouseAccount() {
  return useContext(AccountContext);
}
