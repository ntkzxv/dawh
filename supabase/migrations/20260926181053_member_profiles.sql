-- Personal and employment details are separate from Better Auth credentials and role grants.
-- A profile is optional so existing administrators remain usable without backfilling data.
CREATE TABLE app.member_profiles (
  id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  app_user_id integer NOT NULL UNIQUE REFERENCES app.app_users(id) ON DELETE CASCADE,
  employee_code text UNIQUE CHECK (employee_code IS NULL OR (length(trim(employee_code)) BETWEEN 1 AND 50)),
  phone text CHECK (phone IS NULL OR (length(trim(phone)) BETWEEN 1 AND 30)),
  address text CHECK (address IS NULL OR (length(trim(address)) BETWEEN 1 AND 1000)),
  started_on date,
  emergency_contact_name text CHECK (emergency_contact_name IS NULL OR (length(trim(emergency_contact_name)) BETWEEN 1 AND 160)),
  emergency_contact_phone text CHECK (emergency_contact_phone IS NULL OR (length(trim(emergency_contact_phone)) BETWEEN 1 AND 30)),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- The service uses its PostgreSQL connection; no browser role can query private profiles directly.
ALTER TABLE app.member_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app.member_profiles FROM PUBLIC, anon, authenticated;
REVOKE ALL ON SEQUENCE app.member_profiles_id_seq FROM PUBLIC, anon, authenticated;
