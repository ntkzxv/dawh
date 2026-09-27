import "server-only";

import type { PoolClient } from "pg";
import type { MemberProfile } from "@/lib/contracts/warehouse";
import { ValidationError } from "@/lib/core/http/errors";
import { optionalText, text } from "@/lib/warehouse/validation";

export type Profile = Required<MemberProfile>;
const profileKeys = [
  "employeeCode",
  "username",
  "prefix",
  "firstNameTh",
  "lastNameTh",
  "nicknameTh",
  "firstNameEn",
  "lastNameEn",
  "nicknameEn",
  "citizenId",
  "birthDate",
  "gender",
  "bloodType",
  "maritalStatus",
  "nationality",
  "religion",
  "department",
  "employmentStatus",
  "startedOn",
  "endedOn",
  "educationLevel",
  "majorSubject",
  "universityNameTh",
  "universityNameEn",
  "contactEmail",
  "phone",
  "emergencyContactName",
  "emergencyContactNameEn",
  "emergencyContactRelationship",
  "emergencyContactPhone",
  "address",
  "registeredAddress",
] as const;
type ProfileKey = (typeof profileKeys)[number];
const profileColumns: Record<ProfileKey, string> = {
  employeeCode: "employee_code",
  username: "username",
  prefix: "prefix",
  firstNameTh: "first_name_th",
  lastNameTh: "last_name_th",
  nicknameTh: "nickname_th",
  firstNameEn: "first_name_en",
  lastNameEn: "last_name_en",
  nicknameEn: "nickname_en",
  citizenId: "citizen_id",
  birthDate: "birth_date",
  gender: "gender",
  bloodType: "blood_type",
  maritalStatus: "marital_status",
  nationality: "nationality",
  religion: "religion",
  department: "department",
  employmentStatus: "employment_status",
  startedOn: "started_on",
  endedOn: "ended_on",
  educationLevel: "education_level",
  majorSubject: "major_subject",
  universityNameTh: "university_name_th",
  universityNameEn: "university_name_en",
  contactEmail: "contact_email",
  phone: "phone",
  emergencyContactName: "emergency_contact_name",
  emergencyContactNameEn: "emergency_contact_name_en",
  emergencyContactRelationship: "emergency_contact_relationship",
  emergencyContactPhone: "emergency_contact_phone",
  address: "address",
  registeredAddress: "registered_address",
};
const profileTextLimits: Partial<Record<ProfileKey, number>> = {
  employeeCode: 50,
  username: 80,
  prefix: 40,
  firstNameTh: 120,
  lastNameTh: 120,
  nicknameTh: 80,
  firstNameEn: 120,
  lastNameEn: 120,
  nicknameEn: 80,
  citizenId: 64,
  gender: 40,
  bloodType: 16,
  maritalStatus: 40,
  nationality: 100,
  religion: 100,
  department: 160,
  employmentStatus: 80,
  educationLevel: 100,
  majorSubject: 160,
  universityNameTh: 200,
  universityNameEn: 200,
  phone: 30,
  emergencyContactName: 160,
  emergencyContactNameEn: 160,
  emergencyContactRelationship: 100,
  emergencyContactPhone: 30,
  address: 1000,
  registeredAddress: 1000,
};
const profileDateKeys = new Set<ProfileKey>([
  "birthDate",
  "startedOn",
  "endedOn",
]);
export const emptyProfile = Object.fromEntries(
  profileKeys.map((key) => [key, null]),
) as Profile;

export function parseEmail(value: unknown, field = "email"): string {
  const email = text(value, field, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    throw new ValidationError({ [field]: "Use a valid email address." });
  return email;
}
function optionalProfileText(
  value: unknown,
  field: string,
  max: number,
): string | null {
  if (value == null || (typeof value === "string" && value.trim() === ""))
    return null;
  return optionalText(value, field, max);
}
function optionalProfileEmail(value: unknown, field: string): string | null {
  if (value == null || (typeof value === "string" && value.trim() === ""))
    return null;
  return parseEmail(value, field);
}
function optionalProfileDate(value: unknown, field: string): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError({
      [field]: "Use a valid date in YYYY-MM-DD format.",
    });
  }
  if (Number(value.slice(0, 4)) < 1) {
    throw new ValidationError({
      [field]: "Use a valid date in YYYY-MM-DD format.",
    });
  }
  const parsed = new Date(`${value}T00:00:00Z`);
  if (
    Number.isNaN(parsed.getTime()) ||
    parsed.toISOString().slice(0, 10) !== value
  ) {
    throw new ValidationError({
      [field]: "Use a valid date in YYYY-MM-DD format.",
    });
  }
  return value;
}
export function parseProfile(value: unknown): Partial<Profile> | null {
  if (value === undefined) return null;
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new ValidationError({ profile: "Use a profile object." });
  const input = value as Record<string, unknown>;
  for (const key of Object.keys(input)) {
    if (!profileKeys.includes(key as ProfileKey))
      throw new ValidationError({ profile: `Unknown profile field: ${key}.` });
  }
  if (!Object.keys(input).length) return null;
  const result: Partial<Profile> = {};
  for (const key of profileKeys) {
    if (!(key in input)) continue;
    if (profileDateKeys.has(key)) {
      result[key] = optionalProfileDate(input[key], key);
    } else if (key === "contactEmail") {
      result.contactEmail = optionalProfileEmail(input[key], key);
    } else {
      result[key] = optionalProfileText(
        input[key],
        key,
        profileTextLimits[key] ?? 500,
      );
    }
  }
  return result;
}

export async function saveProfile(
  client: PoolClient,
  memberId: number,
  profile: Partial<Profile>,
) {
  const keys = Object.keys(profile) as Array<(typeof profileKeys)[number]>;
  const columns = keys.map((key) => profileColumns[key]);
  const placeholders = keys.map((_, index) => `$${index + 2}`);
  const updates = columns.map((column) => `${column}=EXCLUDED.${column}`);
  await client.query(
    `INSERT INTO app.member_profiles (app_user_id,${columns.join(",")})
    VALUES ($1,${placeholders.join(",")}) ON CONFLICT (app_user_id)
    DO UPDATE SET ${updates.join(",")},updated_at=now()`,
    [memberId, ...keys.map((key) => profile[key])],
  );
}
