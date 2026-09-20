import "server-only";

import { Pool, types } from "pg";

// Ensure DATE columns (PostgreSQL OID 1082) are returned as raw "YYYY-MM-DD" strings
// instead of JavaScript Date objects that serialize into "YYYY-MM-DDT00:00:00.000Z"
types.setTypeParser(1082, (str: string) => str);

const globalForDatabase = globalThis as typeof globalThis & {
  dawhDatabasePool?: Pool;
};

const rawDatabaseUrl = process.env.DATABASE_URL ?? "";
const isLocalDatabase = /(?:localhost|127\.0\.0\.1|\[::1\])/.test(rawDatabaseUrl);
const connectionString = rawDatabaseUrl.replace(/[?&]sslmode=[^&]+/, "");
function readPositiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const poolSize = readPositiveInt(process.env.DATABASE_POOL_MAX, 1);
const idleTimeoutMillis = readPositiveInt(
  process.env.DATABASE_POOL_IDLE_TIMEOUT_MS,
  10_000,
);
const connectionTimeoutMillis = readPositiveInt(
  process.env.DATABASE_POOL_CONNECTION_TIMEOUT_MS,
  5_000,
);
const queryTimeoutMillis = readPositiveInt(
  process.env.DATABASE_QUERY_TIMEOUT_MS,
  15_000,
);
const certificateAuthority = process.env.DATABASE_SSL_CA?.replaceAll("\\n", "\n").trim();
const ssl = isLocalDatabase
  ? false
  : certificateAuthority
    ? { ca: certificateAuthority, rejectUnauthorized: true }
    : { rejectUnauthorized: false };

export const dbPool =
  globalForDatabase.dawhDatabasePool ??
  new Pool({
    connectionString: connectionString || "postgresql://invalid:invalid@127.0.0.1:5432/invalid",
    max: poolSize,
    idleTimeoutMillis,
    connectionTimeoutMillis,
    query_timeout: queryTimeoutMillis,
    ssl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.dawhDatabasePool = dbPool;
}
