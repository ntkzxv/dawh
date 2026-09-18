import "server-only";

import { authPool } from "@/lib/auth/db";
import type { CompleteEmployeeProfileInput, EmployeeProfileResponse } from "@/lib/profiles/types";

const columns = `
  p.user_id, p.username, p.prefix, p.first_name_th, p.last_name_th, p.nickname_th,
  p.first_name_en, p.last_name_en, p.nickname_en, p.citizen_id, p.birth_date,
  p.gender, p.blood_type, p.marital_status, p.nationality, p.religion,
  p.education_level, p.major_subject, p.university_name_th, p.university_name_en,
  p.phone, p.emergency_contact_name_th, p.emergency_contact_name_en,
  p.emergency_contact_relationship, p.emergency_contact_phone,
  p.current_house_no, p.current_village, p.current_soi, p.current_province,
  p.current_district, p.current_subdistrict, p.current_postal_code,
  p.registered_house_no, p.registered_village, p.registered_soi, p.registered_province,
  p.registered_district, p.registered_subdistrict, p.registered_postal_code,
  p.department, p.branch_name, p.branch_code, p.terms_version, p.terms_accepted_at,
  p.profile_completed_at, p.created_at, p.updated_at, u.email,
  (p.profile_completed_at IS NOT NULL) AS is_complete`;

export async function getEmployeeProfile(userId: string): Promise<EmployeeProfileResponse | null> {
  const result = await authPool.query<EmployeeProfileResponse>(
    `SELECT ${columns}
     FROM public.employee_profiles p
     JOIN public."user" u ON u.id = p.user_id
     WHERE p.user_id = $1`,
    [userId]
  );
  return result.rows[0] ?? null;
}

export async function completeEmployeeProfile(
  userId: string,
  input: CompleteEmployeeProfileInput
): Promise<EmployeeProfileResponse> {
  const fieldNames = Object.keys(input) as (keyof CompleteEmployeeProfileInput)[];
  const values = fieldNames.map((field) => input[field]);
  const insertColumns = ["user_id", ...fieldNames].join(", ");
  const placeholders = ["$1", ...fieldNames.map((_, index) => `$${index + 2}`)].join(", ");
  const updates = fieldNames.map((field) => `${field} = EXCLUDED.${field}`).join(", ");
  const result = await authPool.query<EmployeeProfileResponse>(
    `INSERT INTO public.employee_profiles (${insertColumns}, terms_accepted_at, profile_completed_at)
     VALUES (${placeholders}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     ON CONFLICT (user_id) DO UPDATE SET
       ${updates}, terms_accepted_at = CURRENT_TIMESTAMP,
       profile_completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
     RETURNING ${columns.replaceAll("p.", "employee_profiles.").replace("u.email,", "(SELECT email FROM public.\"user\" WHERE id = employee_profiles.user_id) AS email,")}`,
    [userId, ...values]
  );
  return result.rows[0];
}
