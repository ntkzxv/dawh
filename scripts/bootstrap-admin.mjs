import pg from "pg";

const email = process.argv[2]?.trim().toLowerCase();

if (!email || !email.includes("@")) {
  console.error("Usage: npm run bootstrap:admin -- admin@example.com");
  process.exitCode = 1;
} else if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is required.");
  process.exitCode = 1;
} else {
  const connectionString = process.env.DATABASE_URL.replace(/[?&]sslmode=[^&]+/, "");
  const isLocal = /(?:localhost|127\.0\.0\.1|\[::1\])/.test(connectionString);
  const certificateAuthority = process.env.DATABASE_SSL_CA?.replaceAll("\\n", "\n").trim();
  const ssl = isLocal
    ? false
    : certificateAuthority
      ? { ca: certificateAuthority, rejectUnauthorized: true }
      : { rejectUnauthorized: false };
  const client = new pg.Client({ connectionString, ssl });

  try {
    await client.connect();
    await client.query("BEGIN");

    const user = await client.query(
      `SELECT id, email FROM public."user" WHERE lower(email) = $1 LIMIT 2`,
      [email]
    );
    if (user.rowCount !== 1) throw new Error(`Expected one Better Auth user for ${email}.`);

    const role = await client.query(
      `SELECT id FROM public.roles WHERE code = 'SYSTEM_ADMINISTRATOR' AND is_active = true`
    );
    if (role.rowCount !== 1) throw new Error("SYSTEM_ADMINISTRATOR role is missing. Run migrations first.");

    const facility = await client.query(
      `SELECT facility.id
       FROM public.facilities AS facility
       JOIN public.organizations AS organization
         ON organization.id = facility.organization_id
       WHERE organization.code = 'HORIZON'
         AND organization.is_active = true
         AND facility.code = 'HQ-01'
         AND facility.is_active = true`
    );
    if (facility.rowCount !== 1) throw new Error("HORIZON/HQ-01 is missing. Run the production seed first.");

    await client.query(
      `INSERT INTO public.user_role_assignments (user_id, role_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, role_id) WHERE revoked_at IS NULL DO NOTHING`,
      [user.rows[0].id, role.rows[0].id]
    );

    await client.query(
      `INSERT INTO public.user_facility_scopes (
         user_id, facility_id, scope_type, valid_from, valid_until
       )
       VALUES ($1, $2, 'ADMIN', NULL, NULL)
       ON CONFLICT (user_id, facility_id) DO UPDATE SET
         scope_type = 'ADMIN',
         valid_from = NULL,
         valid_until = NULL,
         updated_at = now()`,
      [user.rows[0].id, facility.rows[0].id]
    );

    await client.query("COMMIT");
    console.log(`SYSTEM_ADMINISTRATOR and HQ-01 ADMIN scope assigned to ${user.rows[0].email}.`);
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => undefined);
  }
}
