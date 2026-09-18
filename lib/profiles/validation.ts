import type { CompleteEmployeeProfileInput } from "@/lib/profiles/types";

export class ProfileValidationError extends Error {
  constructor(public readonly fields: string[]) {
    super(`Missing or invalid profile fields: ${fields.join(", ")}`);
    this.name = "ProfileValidationError";
  }
}

const requiredFields = [
  "prefix", "first_name_th", "last_name_th", "nickname_th",
  "first_name_en", "last_name_en", "nickname_en", "citizen_id",
  "gender", "blood_type", "marital_status", "nationality", "religion",
  "education_level", "major_subject", "university_name_th", "university_name_en",
  "phone", "emergency_contact_name_th", "emergency_contact_name_en",
  "emergency_contact_relationship", "emergency_contact_phone", "current_house_no",
  "current_province", "current_district", "current_subdistrict", "current_postal_code",
  "registered_house_no", "registered_province", "registered_district",
  "registered_subdistrict", "registered_postal_code", "branch_name", "branch_code",
  "terms_version",
] as const;

function readText(body: Record<string, unknown>, key: string, required = false) {
  const value = body[key];
  if (typeof value !== "string") return required ? "" : null;
  const normalized = value.trim();
  return normalized || (required ? "" : null);
}

export function parseCompleteEmployeeProfile(body: unknown): CompleteEmployeeProfileInput {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ProfileValidationError(["body"]);
  }

  const input = body as Record<string, unknown>;
  const required = (key: string) => readText(input, key, true) ?? "";
  const missing: string[] = requiredFields.filter((key) => !required(key));

  const citizenId = required("citizen_id");
  const rawUsername = readText(input, "username", false) || "";
  const username = (rawUsername || "employee").toLowerCase();
  const birthDate = readText(input, "birth_date", false);
  const phone = required("phone");

  if (rawUsername && !/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) missing.push("username");
  if (!/^\d{13}$/.test(citizenId.replace(/\D/g, ""))) missing.push("citizen_id");
  if (birthDate && !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) missing.push("birth_date");
  if (!/^\+?[0-9()\-\s]{8,20}$/.test(phone)) missing.push("phone");

  if (missing.length) throw new ProfileValidationError([...new Set(missing)]);

  return {
    username,
    prefix: required("prefix"),
    first_name_th: required("first_name_th"),
    last_name_th: required("last_name_th"),
    nickname_th: required("nickname_th"),
    first_name_en: required("first_name_en"),
    last_name_en: required("last_name_en"),
    nickname_en: required("nickname_en"),
    citizen_id: citizenId.replace(/\D/g, ""),
    birth_date: birthDate || null,

    gender: required("gender"),
    blood_type: required("blood_type"),
    marital_status: required("marital_status"),
    nationality: required("nationality"),
    religion: required("religion"),
    education_level: required("education_level"),
    major_subject: required("major_subject"),
    university_name_th: required("university_name_th"),
    university_name_en: required("university_name_en"),
    phone,
    emergency_contact_name_th: required("emergency_contact_name_th"),
    emergency_contact_name_en: required("emergency_contact_name_en"),
    emergency_contact_relationship: required("emergency_contact_relationship"),
    emergency_contact_phone: required("emergency_contact_phone"),
    current_house_no: required("current_house_no"),
    current_village: readText(input, "current_village"),
    current_soi: readText(input, "current_soi"),
    current_province: required("current_province"),
    current_district: required("current_district"),
    current_subdistrict: required("current_subdistrict"),
    current_postal_code: required("current_postal_code"),
    registered_house_no: required("registered_house_no"),
    registered_village: readText(input, "registered_village"),
    registered_soi: readText(input, "registered_soi"),
    registered_province: required("registered_province"),
    registered_district: required("registered_district"),
    registered_subdistrict: required("registered_subdistrict"),
    registered_postal_code: required("registered_postal_code"),
    department: readText(input, "department"),
    branch_name: required("branch_name"),
    branch_code: required("branch_code"),
    terms_version: required("terms_version"),
  };
}
