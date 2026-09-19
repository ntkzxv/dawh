CREATE TABLE IF NOT EXISTS public.employee_profiles (
  user_id text PRIMARY KEY REFERENCES public."user" (id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE CHECK (btrim(username) <> ''),
  prefix text,
  first_name_th text,
  last_name_th text,
  nickname_th text,
  first_name_en text NOT NULL CHECK (btrim(first_name_en) <> ''),
  last_name_en text NOT NULL CHECK (btrim(last_name_en) <> ''),
  nickname_en text,
  citizen_id text UNIQUE,
  birth_date date,
  gender text,
  blood_type text,
  marital_status text,
  nationality text,
  religion text,
  education_level text,
  major_subject text,
  university_name_th text,
  university_name_en text,
  phone text NOT NULL CHECK (btrim(phone) <> ''),
  emergency_contact_name_th text,
  emergency_contact_name_en text,
  emergency_contact_relationship text,
  emergency_contact_phone text,
  current_house_no text,
  current_village text,
  current_soi text,
  current_province text,
  current_district text,
  current_subdistrict text,
  current_postal_code text,
  registered_house_no text,
  registered_village text,
  registered_soi text,
  registered_province text,
  registered_district text,
  registered_subdistrict text,
  registered_postal_code text,
  department text,
  branch_name text,
  branch_code text,
  terms_version text,
  terms_accepted_at timestamptz,
  profile_completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.set_employee_profile_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS employee_profiles_set_updated_at ON public.employee_profiles;
CREATE TRIGGER employee_profiles_set_updated_at
BEFORE UPDATE ON public.employee_profiles
FOR EACH ROW EXECUTE FUNCTION public.set_employee_profile_updated_at();

ALTER TABLE public.employee_profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.employee_profiles FROM anon, authenticated;
