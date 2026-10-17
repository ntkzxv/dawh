-- Extend the optional employee profile without replacing existing member data.
-- Assigned branches continue to come from app.branch_memberships.
ALTER TABLE app.member_profiles
  ADD COLUMN username text,
  ADD COLUMN prefix text,
  ADD COLUMN first_name_th text,
  ADD COLUMN last_name_th text,
  ADD COLUMN nickname_th text,
  ADD COLUMN first_name_en text,
  ADD COLUMN last_name_en text,
  ADD COLUMN nickname_en text,
  ADD COLUMN citizen_id text,
  ADD COLUMN birth_date date,
  ADD COLUMN gender text,
  ADD COLUMN blood_type text,
  ADD COLUMN marital_status text,
  ADD COLUMN nationality text,
  ADD COLUMN religion text,
  ADD COLUMN department text,
  ADD COLUMN employment_status text,
  ADD COLUMN ended_on date,
  ADD COLUMN education_level text,
  ADD COLUMN major_subject text,
  ADD COLUMN university_name_th text,
  ADD COLUMN university_name_en text,
  ADD COLUMN contact_email text,
  ADD COLUMN emergency_contact_name_en text,
  ADD COLUMN emergency_contact_relationship text,
  ADD COLUMN registered_address text;

-- app.member_profiles is private to the server-side PostgreSQL connection.
ALTER TABLE app.member_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON app.member_profiles FROM PUBLIC, anon, authenticated;
