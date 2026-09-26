import fs from "node:fs/promises";
import path from "node:path";
import pg from "pg";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL is required.");

const migrationFiles = [
  "20260926000000_single_org_warehouse.sql",
  "20260926181053_member_profiles.sql",
];
const migrations = await Promise.all(migrationFiles.map((file) =>
  fs.readFile(path.join(process.cwd(), "supabase/migrations", file), "utf8"),
));
const connectionString = databaseUrl.replace(/[?&]sslmode=[^&]+/, "");
const local = /(?:localhost|127\.0\.0\.1|\[::1\])/.test(databaseUrl);
const certificateAuthority = process.env.DATABASE_SSL_CA?.replaceAll("\\n", "\n").trim();
const ssl = local ? false : certificateAuthority
  ? { ca: certificateAuthority, rejectUnauthorized: true }
  : { rejectUnauthorized: false };
const client = new pg.Client({ connectionString, ssl });

try {
  await client.connect();
  await client.query("BEGIN");
  const admins = await client.query(`
    SELECT DISTINCT u.id
    FROM public."user" u
    JOIN public.user_role_assignments a ON a.user_id = u.id AND a.revoked_at IS NULL
    JOIN public.roles r ON r.id = a.role_id AND r.code = 'SYSTEM_ADMINISTRATOR'
    JOIN public.account credential ON credential."userId" = u.id
      AND credential."providerId" = 'credential'
  `);
  if (admins.rowCount === 0) throw new Error("No existing administrator with a credential account; database left unchanged.");
  const adminIds = admins.rows.map((row) => row.id);
  const oldTables = await client.query(`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      AND table_name <> ALL(ARRAY['user','account','session','verification','rateLimit'])
    ORDER BY table_name
  `);
  for (const row of oldTables.rows) {
    await client.query(`DROP TABLE public.${pg.escapeIdentifier(row.table_name)} CASCADE`);
  }
  await client.query("DELETE FROM public.session");
  await client.query("DELETE FROM public.verification");
  await client.query('DELETE FROM public."rateLimit"');
  const removed = await client.query('DELETE FROM public."user" WHERE id <> ALL($1::text[])', [adminIds]);
  for (const sql of migrations) await client.query(sql);
  // Application roles live in app.app_users. Better Auth's public admin routes stay closed.
  await client.query('UPDATE public."user" SET role = $1, banned = false, "banReason" = NULL, "banExpires" = NULL WHERE id = ANY($2::text[])', ['user', adminIds]);
  await client.query(`INSERT INTO app.app_users(auth_user_id, role)
    SELECT id, 'ADMIN' FROM public."user" WHERE id = ANY($1::text[])`, [adminIds]);
  await client.query("COMMIT");
  console.log(JSON.stringify({ result: "committed", preservedAdmins: adminIds.length, removedUsers: removed.rowCount, removedBusinessTables: oldTables.rowCount, newSchema: "app" }));
} catch (error) {
  await client.query("ROLLBACK").catch(() => undefined);
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => undefined);
}
