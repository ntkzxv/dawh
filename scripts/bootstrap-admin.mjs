import pg from "pg";

const email = process.argv[2]?.trim().toLowerCase();
if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
  console.error("Usage: npm run bootstrap:admin -- admin@example.com");
  process.exitCode = 1;
} else if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exitCode = 1;
} else {
  const url = process.env.DATABASE_URL;
  const connectionString = url.replace(/[?&]sslmode=[^&]+/, "");
  const local = /(?:localhost|127\.0\.0\.1|\[::1\])/.test(url);
  const certificateAuthority = process.env.DATABASE_SSL_CA?.replaceAll("\\n", "\n").trim();
  const ssl = local ? false : certificateAuthority ? { ca: certificateAuthority, rejectUnauthorized: true } : { rejectUnauthorized: false };
  const client = new pg.Client({ connectionString, ssl });
  try {
    await client.connect();
    await client.query("BEGIN");
    const user = await client.query(`SELECT u.id FROM public."user" u
      JOIN public.account a ON a."userId"=u.id AND a."providerId"='credential'
      WHERE lower(u.email)=$1 LIMIT 2`, [email]);
    if (user.rowCount !== 1) throw new Error("Expected one existing Better Auth user with a password account.");
    await client.query(`INSERT INTO app.app_users(auth_user_id,role) VALUES ($1,'ADMIN')
      ON CONFLICT (auth_user_id) DO UPDATE SET role='ADMIN',deleted_at=NULL,deleted_by_id=NULL,updated_at=now()`, [user.rows[0].id]);
    await client.query(`UPDATE public."user" SET role='user',banned=false,"banReason"=NULL,"banExpires"=NULL WHERE id=$1`, [user.rows[0].id]);
    await client.query("COMMIT");
    console.log("Existing Better Auth account is an active warehouse ADMIN.");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}
