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
const configuredPoolSize = Number(process.env.DATABASE_POOL_MAX ?? "1");
const poolSize = Number.isInteger(configuredPoolSize) && configuredPoolSize > 0 ? configuredPoolSize : 1;
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
    ssl,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDatabase.dawhDatabasePool = dbPool;
}
