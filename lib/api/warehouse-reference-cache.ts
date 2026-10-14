import type { Me, CatalogItem } from "@/lib/api/warehouse";
import { warehouseApi } from "@/lib/api/warehouse";

const REFERENCE_TTL_MS = 60_000;
export type CachedCatalogReferenceKind = "branches" | "warehouses";

type CacheEntry = {
  data: CatalogItem[];
  expiresAt: number;
  kind: CachedCatalogReferenceKind;
  scope: string;
};

type PendingRequest = {
  controller: AbortController;
  promise: Promise<CatalogItem[]>;
  kind: CachedCatalogReferenceKind;
  scope: string;
};

const entries = new Map<string, CacheEntry>();
const pendingRequests = new Map<string, PendingRequest>();

export function getWarehouseReferenceScope(me: Me | null | undefined) {
  if (!me) return null;

  return JSON.stringify([
    me.authUserId,
    me.id,
    me.role,
    [...me.branchIds].sort((left, right) => left - right),
  ]);
}

function cacheKey(kind: CachedCatalogReferenceKind, scope: string) {
  return JSON.stringify([kind, scope]);
}

function withCallerAbort<T>(promise: Promise<T>, signal?: AbortSignal) {
  if (!signal) return promise;
  if (signal.aborted) {
    return Promise.reject(new DOMException("The operation was aborted.", "AbortError"));
  }

  return new Promise<T>((resolve, reject) => {
    const cleanup = () => signal.removeEventListener("abort", onAbort);
    const onAbort = () => {
      cleanup();
      reject(new DOMException("The operation was aborted.", "AbortError"));
    };

    signal.addEventListener("abort", onAbort, { once: true });
    promise.then(
      (value) => {
        cleanup();
        resolve(value);
      },
      (error: unknown) => {
        cleanup();
        reject(error);
      },
    );
  });
}

export function getCachedCatalogReference(
  kind: CachedCatalogReferenceKind,
  scope: string | null,
  signal?: AbortSignal,
) {
  if (!scope) return warehouseApi.catalog(kind, signal);

  const key = cacheKey(kind, scope);
  const cached = entries.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return withCallerAbort(Promise.resolve(cached.data), signal);
  }
  if (cached) entries.delete(key);

  let request = pendingRequests.get(key);
  if (!request) {
    const controller = new AbortController();
    request = { controller, promise: Promise.resolve([]), kind, scope };
    request.promise = warehouseApi
      .catalog(kind, controller.signal)
      .then((data) => {
        if (pendingRequests.get(key) === request) {
          entries.set(key, {
            data,
            expiresAt: Date.now() + REFERENCE_TTL_MS,
            kind,
            scope,
          });
        }
        return data;
      })
      .finally(() => {
        if (pendingRequests.get(key) === request) {
          pendingRequests.delete(key);
        }
      });
    pendingRequests.set(key, request);
  }

  return withCallerAbort(request.promise, signal);
}

function clearMatchingReferences(matches: (entry: { kind: CachedCatalogReferenceKind; scope: string }) => boolean) {
  for (const [key, entry] of entries) {
    if (matches(entry)) entries.delete(key);
  }
  for (const [key, request] of pendingRequests) {
    if (!matches(request)) continue;
    request.controller.abort();
    pendingRequests.delete(key);
  }
}

export function invalidateCatalogReference(kind: CachedCatalogReferenceKind) {
  clearMatchingReferences((entry) => entry.kind === kind);
}

export function clearWarehouseReferenceCache(scope?: string | null) {
  clearMatchingReferences((entry) => scope == null || entry.scope === scope);
}
