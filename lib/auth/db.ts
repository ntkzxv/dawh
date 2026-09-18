import { Pool } from "pg";

const globalForAuth = globalThis as typeof globalThis & {
  dawhAuthPool?: Pool;
};

const rawDatabaseUrl = process.env.DATABASE_URL ?? "";
const isLocalDatabase = /(?:localhost|127\.0\.0\.1|\[::1\])/.test(rawDatabaseUrl);

// Strip sslmode from the connection string so pg does not force verify-full / rejectUnauthorized: true
const cleanDatabaseUrl = rawDatabaseUrl.replace(/[?&]sslmode=[^&]+/, "");

// Reset pool on reload to avoid holding onto outdated SSL/connection configs
if (globalForAuth.dawhAuthPool) {
  globalForAuth.dawhAuthPool.end().catch(() => {});
  delete globalForAuth.dawhAuthPool;
}

export const authPool = new Pool({
  connectionString:
    cleanDatabaseUrl ||
    "postgresql://invalid:invalid@127.0.0.1:5432/invalid",
  max: 5,
  ssl: isLocalDatabase ? false : { rejectUnauthorized: false },
});

if (process.env.NODE_ENV !== "production") {
  globalForAuth.dawhAuthPool = authPool;
}


