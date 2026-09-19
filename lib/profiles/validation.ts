import { ValidationError } from "@/lib/core/http/errors";
import {
  optionalBigIntId,
  optionalText,
  rejectUnknownFields,
  requiredBigIntId,
  requiredBoolean,
  requiredText,
} from "@/lib/core/validation/fields";
import type {
  AddressInput,
  CompleteEmployeeProfileInput,
  UpdateEmployeeProfileInput,
} from "@/lib/profiles/types";

const completeFields = [
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
  "educationLevel",
  "majorSubject",
  "universityNameTh",
  "universityNameEn",
  "phone",
  "emergencyContactNameTh",
  "emergencyContactNameEn",
  "emergencyContactRelationship",
  "emergencyContactPhone",
  "currentAddress",
  "registeredAddress",
  "departmentId",
  "facilityId",
  "termsAccepted",
] as const;

const updateFields = [
  "prefix",
  "nicknameTh",
  "nicknameEn",
  "nationality",
  "religion",
  "educationLevel",
  "majorSubject",
  "universityNameTh",
  "universityNameEn",
  "phone",
  "emergencyContactNameTh",
  "emergencyContactNameEn",
  "emergencyContactRelationship",
  "emergencyContactPhone",
  "currentAddress",
  "registeredAddress",
] as const;

const addressFields = [
  "houseNo",
  "village",
  "soi",
  "province",
  "district",
  "subdistrict",
  "postalCode",
] as const;

function parseAddress(value: unknown, key: string): AddressInput {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new ValidationError({ [key]: "Use an address object." });
  }
  const body = value as Record<string, unknown>;
  rejectUnknownFields(body, addressFields);
  const postalCode = requiredText(body, "postalCode");
  if (!/^\d{5}$/.test(postalCode)) {
    throw new ValidationError({
      [`${key}.postalCode`]: "Use a 5-digit postal code.",
    });
  }
  return {
    houseNo: requiredText(body, "houseNo"),
    village: optionalText(body, "village"),
    soi: optionalText(body, "soi"),
    province: requiredText(body, "province"),
    district: requiredText(body, "district"),
    subdistrict: requiredText(body, "subdistrict"),
    postalCode,
  };
}

function validateUsername(value: string) {
  const username = value.toLowerCase();
  if (!/^[a-z0-9][a-z0-9._-]{2,31}$/.test(username)) {
    throw new ValidationError({
      username:
        "Use 3-32 lowercase letters, digits, dots, underscores, or hyphens.",
    });
  }
  return username;
}

function validateCitizenId(value: string) {
  const citizenId = value.replace(/\D/g, "");
  if (!/^\d{13}$/.test(citizenId)) {
    throw new ValidationError({
      citizenId: "Use a valid 13-digit Thai citizen ID.",
    });
  }
  const digits = citizenId.split("").map(Number);
  const sum = digits
    .slice(0, 12)
    .reduce((total, digit, index) => total + digit * (13 - index), 0);
  if ((11 - (sum % 11)) % 10 !== digits[12]) {
    throw new ValidationError({
      citizenId: "The Thai citizen ID checksum is invalid.",
    });
  }
  return citizenId;
}

function validateBirthDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError({ birthDate: "Use YYYY-MM-DD." });
  }
  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    throw new ValidationError({ birthDate: "Use a valid calendar date." });
  }
  if (date.getTime() > Date.now()) {
    throw new ValidationError({
      birthDate: "Birth date cannot be in the future.",
    });
  }
  return value;
}

function validatePhone(value: string, key: string) {
  if (!/^\+?[0-9()\-\s]{8,20}$/.test(value)) {
    throw new ValidationError({ [key]: "Use a valid phone number." });
  }
  return value;
}

function sharedFields(
  body: Record<string, unknown>,
): UpdateEmployeeProfileInput {
  return {
    prefix: requiredText(body, "prefix"),
    nicknameTh: requiredText(body, "nicknameTh"),
    nicknameEn: requiredText(body, "nicknameEn"),
    nationality: requiredText(body, "nationality"),
    religion: requiredText(body, "religion"),
    educationLevel: requiredText(body, "educationLevel"),
    majorSubject: requiredText(body, "majorSubject"),
    universityNameTh: requiredText(body, "universityNameTh"),
    universityNameEn: requiredText(body, "universityNameEn"),
    phone: validatePhone(requiredText(body, "phone"), "phone"),
    emergencyContactNameTh: requiredText(body, "emergencyContactNameTh"),
    emergencyContactNameEn: optionalText(body, "emergencyContactNameEn"),
    emergencyContactRelationship: requiredText(
      body,
      "emergencyContactRelationship",
    ),
    emergencyContactPhone: validatePhone(
      requiredText(body, "emergencyContactPhone"),
      "emergencyContactPhone",
    ),
    currentAddress: parseAddress(body.currentAddress, "currentAddress"),
    registeredAddress: parseAddress(
      body.registeredAddress,
      "registeredAddress",
    ),
  };
}

export function parseCompleteEmployeeProfile(
  body: Record<string, unknown>,
): CompleteEmployeeProfileInput {
  rejectUnknownFields(body, completeFields);
  const termsAccepted = requiredBoolean(body, "termsAccepted");
  if (!termsAccepted)
    throw new ValidationError({
      termsAccepted: "Accept the current terms to continue.",
    });
  return {
    ...sharedFields(body),
    username: validateUsername(requiredText(body, "username")),
    firstNameTh: requiredText(body, "firstNameTh"),
    lastNameTh: requiredText(body, "lastNameTh"),
    firstNameEn: requiredText(body, "firstNameEn"),
    lastNameEn: requiredText(body, "lastNameEn"),
    citizenId: validateCitizenId(requiredText(body, "citizenId")),
    birthDate: validateBirthDate(requiredText(body, "birthDate")),
    gender: requiredText(body, "gender"),
    bloodType: requiredText(body, "bloodType"),
    maritalStatus: requiredText(body, "maritalStatus"),
    facilityId: requiredBigIntId(body, "facilityId"),
    departmentId: optionalBigIntId(body, "departmentId"),
    termsAccepted: true,
  };
}

export function parseUpdateEmployeeProfile(
  body: Record<string, unknown>,
): UpdateEmployeeProfileInput {
  rejectUnknownFields(body, updateFields);
  return sharedFields(body);
}
