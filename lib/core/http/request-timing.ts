import "server-only";

import { AsyncLocalStorage } from "node:async_hooks";
import { getRequestId } from "@/lib/core/http/request-id";
import { dbPool } from "@/lib/core/db/pool";
import type { PoolClient, QueryResultRow } from "pg";

type TimingKey = "authMs" | "actorMs" | "dbPoolWaitMs" | "dbQueryMs";
type CounterKey = "dbPoolTimeouts" | "dbQueryTimeouts";
type RequestTiming = {
  startedAt: number;
  values: Record<TimingKey, number>;
  counters: Record<CounterKey, number>;
};

const requestTiming = new AsyncLocalStorage<RequestTiming>();
const apiTimingLogsEnabled = process.env.API_TIMING_LOGS === "1";

export function addRequestTiming(key: TimingKey, durationMs: number) {
  const context = requestTiming.getStore();
  if (context && Number.isFinite(durationMs) && durationMs >= 0) {
    context.values[key] += durationMs;
  }
}

function incrementRequestTiming(key: CounterKey) {
  const context = requestTiming.getStore();
  if (context) context.counters[key] += 1;
}

function isTimeoutError(error: unknown) {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { code?: unknown; message?: unknown };
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const message = typeof candidate.message === "string" ? candidate.message : "";
  return ["ETIMEDOUT", "57014", "QUERY_TIMEOUT"].includes(code) ||
    message.toLowerCase().includes("timeout");
}

export async function timedPoolQuery<
  T extends QueryResultRow = Record<string, unknown>,
>(
  text: string,
  values: unknown[] = [],
) {
  const client = await timedPoolConnect();
  try {
    return await timedClientQuery<T>(client, text, values);
  } finally {
    client.release();
  }
}

export async function timedPoolConnect() {
  const waitingStartedAt = performance.now();
  let client: PoolClient;
  try {
    client = await dbPool.connect();
  } catch (error) {
    if (isTimeoutError(error)) incrementRequestTiming("dbPoolTimeouts");
    throw error;
  }
  addRequestTiming("dbPoolWaitMs", performance.now() - waitingStartedAt);
  return instrumentPoolClient(client);
}

export async function timedClientQuery<
  T extends QueryResultRow = Record<string, unknown>,
>(
  client: PoolClient,
  text: string,
  values: unknown[] = [],
) {
  const queryStartedAt = performance.now();
  try {
    return await client.query<T>(text, values);
  } catch (error) {
    if (isTimeoutError(error)) incrementRequestTiming("dbQueryTimeouts");
    throw error;
  } finally {
    addRequestTiming("dbQueryMs", performance.now() - queryStartedAt);
  }
}

export function instrumentPoolClient(client: PoolClient): PoolClient {
  return new Proxy(client, {
    get(target, property) {
      if (property === "query") {
        return <T extends QueryResultRow>(text: string, values: unknown[] = []) =>
          timedClientQuery<T>(target, text, values);
      }
      const value = Reflect.get(target, property, target);
      return typeof value === "function" ? value.bind(target) : value;
    },
  }) as PoolClient;
}

export async function withApiTiming(
  request: Request,
  work: () => Promise<Response>,
) {
  const context: RequestTiming = {
    startedAt: performance.now(),
    values: { authMs: 0, actorMs: 0, dbPoolWaitMs: 0, dbQueryMs: 0 },
    counters: { dbPoolTimeouts: 0, dbQueryTimeouts: 0 },
  };

  return requestTiming.run(context, async () => {
    const response = await work();
    const totalMs = performance.now() - context.startedAt;
    const timings = {
      authMs: round(context.values.authMs),
      actorMs: round(context.values.actorMs),
      dbPoolWaitMs: round(context.values.dbPoolWaitMs),
      dbQueryMs: round(context.values.dbQueryMs),
      totalMs: round(totalMs),
    };
    const requestId = getRequestId(request);

    if (apiTimingLogsEnabled) {
      console.info(JSON.stringify({
        level: "info",
        event: "api.request_timing",
        requestId,
        method: request.method,
        path: new URL(request.url).pathname,
        status: response.status,
        ...timings,
        ...context.counters,
        pool: {
          total: dbPool.totalCount,
          idle: dbPool.idleCount,
          waiting: dbPool.waitingCount,
        },
      }));
    }

    const headers = new Headers(response.headers);
    headers.set(
      "server-timing",
      `app;dur=${timings.totalMs}, auth;dur=${timings.authMs}, actor;dur=${timings.actorMs}, db-pool;dur=${timings.dbPoolWaitMs}, db-query;dur=${timings.dbQueryMs}`,
    );
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  });
}

function round(value: number) {
  return Math.round(value * 100) / 100;
}
