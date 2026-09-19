"use client";

import { apiGet } from "@/lib/api/client";
import type { EmployeeProfileDto, EmployeeProfileResponse } from "@/lib/profiles";
import type { EmployeeProfile } from "@/types/user";

const PROFILE_CACHE_KEY = "dawh_user_profile";

function formatAddress(...parts: Array<string | null>) {
  return parts.filter((part): part is string => Boolean(part?.trim())).join(", ");
}

function fromDto(profile: EmployeeProfileDto): EmployeeProfile {
  const currentAddress = profile.currentAddress;
  const registeredAddress = profile.registeredAddress;
  return {
    id: profile.userId,
    email: profile.email,
    username: profile.username,
    prefix: profile.prefix,
    first_name: profile.firstNameEn,
    last_name: profile.lastNameEn,
    nickname: profile.nicknameEn,
    first_name_th: profile.firstNameTh,
    last_name_th: profile.lastNameTh,
    nickname_th: profile.nicknameTh,
    id_card: profile.citizenId,
    birth_date: profile.birthDate ? profile.birthDate.slice(0, 10) : null,
    gender: profile.gender,
    blood_type: profile.bloodType,
    marital_status: profile.maritalStatus,
    nationality: profile.nationality,
    religion: profile.religion,
    phone: profile.phone,
    emergency_contact_name_th: profile.emergencyContactNameTh,
    emergency_contact_name: profile.emergencyContactNameEn,
    emergency_contact_relationship: profile.emergencyContactRelationship,
    emergency_contact_phone: profile.emergencyContactPhone,
    current_address: formatAddress(
      currentAddress.houseNo,
      currentAddress.village,
      currentAddress.soi,
      currentAddress.subdistrict,
      currentAddress.district,
      currentAddress.province,
      currentAddress.postalCode,
    ),
    registered_address: formatAddress(
      registeredAddress.houseNo,
      registeredAddress.village,
      registeredAddress.soi,
      registeredAddress.subdistrict,
      registeredAddress.district,
      registeredAddress.province,
      registeredAddress.postalCode,
    ),
    department: profile.department?.name ?? null,
    branch_name: profile.facility?.name ?? null,
    branch_id: profile.facilityId,
    education_level: profile.educationLevel,
    major_subject: profile.majorSubject,
    university_th: profile.universityNameTh,
    university_en: profile.universityNameEn,
    university_name: profile.universityNameTh,
    created_at: profile.createdAt,
    updated_at: profile.updatedAt,
    terms_version: profile.termsVersion,
    terms_accepted_at: profile.termsAcceptedAt,
    profile_completed_at: profile.profileCompletedAt,
    is_complete: profile.isComplete,
  };
}

export function toEmployeeProfile(profile: EmployeeProfileDto | EmployeeProfileResponse): EmployeeProfile {
  if ("userId" in profile) return fromDto(profile);
  return {
    id: profile.user_id, email: profile.email, username: profile.username, prefix: profile.prefix,
    first_name: profile.first_name_en, last_name: profile.last_name_en, nickname: profile.nickname_en,
    first_name_th: profile.first_name_th, last_name_th: profile.last_name_th, nickname_th: profile.nickname_th,
    id_card: profile.citizen_id,
    birth_date: profile.birth_date ? profile.birth_date.slice(0, 10) : null,
    gender: profile.gender,
    blood_type: profile.blood_type, marital_status: profile.marital_status,
    nationality: profile.nationality, religion: profile.religion, phone: profile.phone,
    emergency_contact_name_th: profile.emergency_contact_name_th,
    emergency_contact_name: profile.emergency_contact_name_en,
    emergency_contact_relationship: profile.emergency_contact_relationship,
    emergency_contact_phone: profile.emergency_contact_phone,
    current_address: formatAddress(profile.current_house_no, profile.current_village, profile.current_soi, profile.current_subdistrict, profile.current_district, profile.current_province, profile.current_postal_code),
    registered_address: formatAddress(profile.registered_house_no, profile.registered_village, profile.registered_soi, profile.registered_subdistrict, profile.registered_district, profile.registered_province, profile.registered_postal_code),
    department: profile.department, branch_name: profile.branch_name, branch_id: profile.branch_code,
    education_level: profile.education_level, major_subject: profile.major_subject,
    university_th: profile.university_name_th, university_en: profile.university_name_en,
    university_name: profile.university_name_th, created_at: profile.created_at, updated_at: profile.updated_at,
    terms_version: profile.terms_version, terms_accepted_at: profile.terms_accepted_at,
    profile_completed_at: profile.profile_completed_at,
    is_complete: Boolean(profile.is_complete ?? profile.profile_completed_at),
  };
}

export async function fetchAndStoreUserProfile(userId: string, email?: string | null): Promise<EmployeeProfile | null> {
  if (typeof window === "undefined" || !userId) return null;
  void email;
  try {
    const response = await apiGet<{
      profile: EmployeeProfileDto | null;
      profileComplete: boolean;
    }>("/api/profile/me");
    const dto = response.data.profile;
    if (!dto) {
      localStorage.removeItem(PROFILE_CACHE_KEY);
      return null;
    }
    const profile = toEmployeeProfile(dto);
    localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    return profile;
  } catch (error) {
    const status = error instanceof Error && "status" in error
      ? (error as { status?: number }).status
      : undefined;
    if (status === 401) {
      clearUserProfileCache();
      return null;
    }
    if (status === 404) return null;
    throw error;
  }
}

export function clearUserProfileCache() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(PROFILE_CACHE_KEY);
  localStorage.removeItem("current_user_id");
  localStorage.removeItem("current_user_email");
  localStorage.removeItem("current_user_role");
  localStorage.removeItem("current_user_birth_date");
  localStorage.removeItem("current_user_phone");
}

export function checkProfileCompleteness(profile: Partial<EmployeeProfile> | null | undefined): {
  isComplete: boolean;
  missingFields: string[];
} {
  if (!profile || (!profile.id && !profile.username && !profile.email)) {
    return { isComplete: false, missingFields: ["profile_completion"] };
  }

  const fields: Array<[keyof EmployeeProfile, string]> = [
    ["username", "username"],
    ["first_name_th", "first_name_th"],
    ["last_name_th", "last_name_th"],
    ["first_name", "first_name_en"],
    ["last_name", "last_name_en"],
    ["id_card", "citizen_id"],
    ["phone", "phone"],
    ["current_address", "current_address"],
    ["registered_address", "registered_address"],
    ["branch_name", "branch_name"],
    ["education_level", "education_level"],
  ];

  const missingFields = fields
    .filter(([key]) => !String(profile[key] ?? "").trim())
    .map(([, label]) => label);

  if (!profile.profile_completed_at && profile.is_complete !== true) {
    missingFields.push("profile_completion");
  }

  return { isComplete: missingFields.length === 0, missingFields };
}
