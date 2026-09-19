import "server-only";

import type { Pool, PoolClient } from "pg";

import type { AccessContext } from "@/lib/access/types";
import { writeAuditLog } from "@/lib/audit/service";
import { dbPool } from "@/lib/core/db/pool";
import { withTransaction } from "@/lib/core/db/transaction";
import type { RequestContext } from "@/lib/core/http/context";
import { NotFoundError } from "@/lib/core/http/errors";
import { getCurrentTermsVersion } from "@/lib/onboarding/service";
import type {
  AddressInput,
  CompleteEmployeeProfileInput,
  EmployeeProfileDto,
  EmployeeProfileResponse,
  PartialUpdateEmployeeProfileInput,
} from "@/lib/profiles/types";

type QueryExecutor = Pick<Pool | PoolClient, "query">;

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
  p.department, p.branch_name, p.branch_code, p.facility_id::text, p.department_id::text,
  p.terms_version, p.terms_accepted_at, p.profile_completed_at, p.created_at, p.updated_at,
  u.email, (p.profile_completed_at IS NOT NULL AND p.facility_id IS NOT NULL) AS is_complete`;

export async function getEmployeeProfile(
  userId: string,
  executor: QueryExecutor = dbPool,
): Promise<EmployeeProfileResponse | null> {
  const result = await executor.query<EmployeeProfileResponse>(
    `SELECT ${columns} FROM public.employee_profiles p
     JOIN public."user" u ON u.id = p.user_id WHERE p.user_id = $1`,
    [userId],
  );
  return result.rows[0] ?? null;
}

function address(
  profile: EmployeeProfileResponse,
  prefix: "current" | "registered",
): AddressInput {
  return {
    houseNo: profile[`${prefix}_house_no`] ?? "",
    village: profile[`${prefix}_village`],
    soi: profile[`${prefix}_soi`],
    province: profile[`${prefix}_province`] ?? "",
    district: profile[`${prefix}_district`] ?? "",
    subdistrict: profile[`${prefix}_subdistrict`] ?? "",
    postalCode: profile[`${prefix}_postal_code`] ?? "",
  };
}

export async function toEmployeeProfileDto(
  profile: EmployeeProfileResponse,
  executor: QueryExecutor = dbPool,
): Promise<EmployeeProfileDto> {
  let related: {
    facility_id: string;
    facility_code: string;
    facility_name: string;
    department_id: string | null;
    department_code: string | null;
    department_name: string | null;
  } | null = null;
  if (profile.facility_id) {
    const result = await executor.query<{
      facility_id: string;
      facility_code: string;
      facility_name: string;
      department_id: string | null;
      department_code: string | null;
      department_name: string | null;
    }>(
      `SELECT f.id::text AS facility_id, f.code AS facility_code, f.name AS facility_name,
              d.id::text AS department_id, d.code AS department_code, d.name AS department_name
       FROM public.facilities f LEFT JOIN public.departments d ON d.id = $2::bigint
       WHERE f.id = $1::bigint`,
      [profile.facility_id, profile.department_id],
    );
    related = result.rows[0] ?? null;
  }
  return {
    userId: profile.user_id,
    email: profile.email,
    username: profile.username,
    prefix: profile.prefix ?? "",
    firstNameTh: profile.first_name_th ?? "",
    lastNameTh: profile.last_name_th ?? "",
    nicknameTh: profile.nickname_th ?? "",
    firstNameEn: profile.first_name_en,
    lastNameEn: profile.last_name_en,
    nicknameEn: profile.nickname_en ?? "",
    citizenId: profile.citizen_id ?? "",
    birthDate: profile.birth_date ?? "",
    gender: profile.gender ?? "",
    bloodType: profile.blood_type ?? "",
    maritalStatus: profile.marital_status ?? "",
    nationality: profile.nationality ?? "",
    religion: profile.religion ?? "",
    educationLevel: profile.education_level ?? "",
    majorSubject: profile.major_subject ?? "",
    universityNameTh: profile.university_name_th ?? "",
    universityNameEn: profile.university_name_en ?? "",
    phone: profile.phone,
    emergencyContactNameTh: profile.emergency_contact_name_th ?? "",
    emergencyContactNameEn: profile.emergency_contact_name_en,
    emergencyContactRelationship: profile.emergency_contact_relationship ?? "",
    emergencyContactPhone: profile.emergency_contact_phone ?? "",
    currentAddress: address(profile, "current"),
    registeredAddress: address(profile, "registered"),
    facilityId: related?.facility_id ?? null,
    departmentId: related?.department_id ?? null,
    facility: related
      ? {
          id: related.facility_id,
          code: related.facility_code,
          name: related.facility_name,
        }
      : null,
    department:
      related?.department_id &&
      related?.department_code &&
      related?.department_name
        ? {
            id: related.department_id,
            code: related.department_code,
            name: related.department_name,
          }
        : null,
    termsVersion: profile.terms_version ?? "",
    termsAcceptedAt: profile.terms_accepted_at ?? "",
    profileCompletedAt: profile.profile_completed_at ?? "",
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
    isComplete: profile.is_complete,
  };
}

async function resolveAssignment(
  client: PoolClient,
  context: AccessContext,
  facilityId: string,
  departmentId: string | null,
) {
  const facility = await client.query<{
    id: string;
    code: string;
    name: string;
  }>(
    `SELECT id::text, code, name FROM public.facilities
     WHERE id=$1::bigint AND organization_id=$2::bigint AND is_active=true`,
    [facilityId, context.organization.id],
  );
  if (!facility.rows[0]) throw new NotFoundError("Facility");
  const department = departmentId
    ? await client.query<{ id: string; code: string; name: string }>(
        `SELECT id::text, code, name FROM public.departments
     WHERE id=$1::bigint AND organization_id=$2::bigint AND is_active=true`,
        [departmentId, context.organization.id],
      )
    : null;
  if (departmentId && !department?.rows[0])
    throw new NotFoundError("Department");
  return {
    facility: facility.rows[0],
    department: department?.rows[0] ?? null,
  };
}

export async function completeEmployeeProfile(
  context: AccessContext,
  requestContext: RequestContext,
  input: CompleteEmployeeProfileInput,
): Promise<EmployeeProfileDto> {
  return withTransaction(async (client) => {
    const assignment = await resolveAssignment(
      client,
      context,
      input.facilityId,
      input.departmentId,
    );
    const termsVersion = getCurrentTermsVersion();
    const values = [
      context.user.id,
      input.username,
      input.prefix,
      input.firstNameTh,
      input.lastNameTh,
      input.nicknameTh,
      input.firstNameEn,
      input.lastNameEn,
      input.nicknameEn,
      input.citizenId,
      input.birthDate,
      input.gender,
      input.bloodType,
      input.maritalStatus,
      input.nationality,
      input.religion,
      input.educationLevel,
      input.majorSubject,
      input.universityNameTh,
      input.universityNameEn,
      input.phone,
      input.emergencyContactNameTh,
      input.emergencyContactNameEn,
      input.emergencyContactRelationship,
      input.emergencyContactPhone,
      input.currentAddress.houseNo,
      input.currentAddress.village,
      input.currentAddress.soi,
      input.currentAddress.province,
      input.currentAddress.district,
      input.currentAddress.subdistrict,
      input.currentAddress.postalCode,
      input.registeredAddress.houseNo,
      input.registeredAddress.village,
      input.registeredAddress.soi,
      input.registeredAddress.province,
      input.registeredAddress.district,
      input.registeredAddress.subdistrict,
      input.registeredAddress.postalCode,
      assignment.department?.name ?? null,
      assignment.facility.name,
      assignment.facility.code,
      assignment.facility.id,
      assignment.department?.id ?? null,
      termsVersion,
    ];
    const placeholders = values.map((_, index) => `$${index + 1}`).join(", ");
    await client.query(
      `INSERT INTO public.employee_profiles (
        user_id,username,prefix,first_name_th,last_name_th,nickname_th,first_name_en,
        last_name_en,nickname_en,citizen_id,birth_date,gender,blood_type,marital_status,
        nationality,religion,education_level,major_subject,university_name_th,
        university_name_en,phone,emergency_contact_name_th,emergency_contact_name_en,
        emergency_contact_relationship,emergency_contact_phone,current_house_no,
        current_village,current_soi,current_province,current_district,current_subdistrict,
        current_postal_code,registered_house_no,registered_village,registered_soi,
        registered_province,registered_district,registered_subdistrict,registered_postal_code,
        department,branch_name,branch_code,facility_id,department_id,terms_version,
        terms_accepted_at,profile_completed_at
      ) VALUES (${placeholders},now(),now())
      ON CONFLICT (user_id) DO UPDATE SET
        username=EXCLUDED.username,prefix=EXCLUDED.prefix,first_name_th=EXCLUDED.first_name_th,
        last_name_th=EXCLUDED.last_name_th,nickname_th=EXCLUDED.nickname_th,
        first_name_en=EXCLUDED.first_name_en,last_name_en=EXCLUDED.last_name_en,
        nickname_en=EXCLUDED.nickname_en,citizen_id=EXCLUDED.citizen_id,
        birth_date=EXCLUDED.birth_date,gender=EXCLUDED.gender,blood_type=EXCLUDED.blood_type,
        marital_status=EXCLUDED.marital_status,nationality=EXCLUDED.nationality,
        religion=EXCLUDED.religion,education_level=EXCLUDED.education_level,
        major_subject=EXCLUDED.major_subject,university_name_th=EXCLUDED.university_name_th,
        university_name_en=EXCLUDED.university_name_en,phone=EXCLUDED.phone,
        emergency_contact_name_th=EXCLUDED.emergency_contact_name_th,
        emergency_contact_name_en=EXCLUDED.emergency_contact_name_en,
        emergency_contact_relationship=EXCLUDED.emergency_contact_relationship,
        emergency_contact_phone=EXCLUDED.emergency_contact_phone,
        current_house_no=EXCLUDED.current_house_no,current_village=EXCLUDED.current_village,
        current_soi=EXCLUDED.current_soi,current_province=EXCLUDED.current_province,
        current_district=EXCLUDED.current_district,current_subdistrict=EXCLUDED.current_subdistrict,
        current_postal_code=EXCLUDED.current_postal_code,
        registered_house_no=EXCLUDED.registered_house_no,
        registered_village=EXCLUDED.registered_village,registered_soi=EXCLUDED.registered_soi,
        registered_province=EXCLUDED.registered_province,
        registered_district=EXCLUDED.registered_district,
        registered_subdistrict=EXCLUDED.registered_subdistrict,
        registered_postal_code=EXCLUDED.registered_postal_code,department=EXCLUDED.department,
        branch_name=EXCLUDED.branch_name,branch_code=EXCLUDED.branch_code,
        facility_id=EXCLUDED.facility_id,department_id=EXCLUDED.department_id,
        terms_version=EXCLUDED.terms_version,terms_accepted_at=now(),
        profile_completed_at=now(),updated_at=now()`,
      values,
    );
    await writeAuditLog(client, {
      organizationId: context.organization.id,
      requestId: requestContext.requestId,
      actorUserId: context.user.id,
      action: "profile.completed",
      entityType: "employee_profile",
      newData: {
        targetUserId: context.user.id,
        facilityId: assignment.facility.id,
        departmentId: assignment.department?.id ?? null,
        termsVersion,
      },
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
    });
    const profile = await getEmployeeProfile(context.user.id, client);
    if (!profile) throw new NotFoundError("Employee profile");
    return toEmployeeProfileDto(profile, client);
  });
}

export async function updateEmployeeProfile(
  context: AccessContext,
  requestContext: RequestContext,
  input: PartialUpdateEmployeeProfileInput,
): Promise<EmployeeProfileDto> {
  return withTransaction(async (client) => {
    const previous = await getEmployeeProfile(context.user.id, client);
    if (!previous?.is_complete)
      throw new NotFoundError("Completed employee profile");
    const assignments: string[] = [];
    const values: unknown[] = [context.user.id];
    const set = (column: string, value: unknown) => {
      values.push(value);
      assignments.push(`${column}=$${values.length}`);
    };
    const scalarFields: Array<[keyof PartialUpdateEmployeeProfileInput, string]> = [
      ["prefix", "prefix"], ["nicknameTh", "nickname_th"], ["nicknameEn", "nickname_en"],
      ["nationality", "nationality"], ["religion", "religion"], ["educationLevel", "education_level"],
      ["majorSubject", "major_subject"], ["universityNameTh", "university_name_th"],
      ["universityNameEn", "university_name_en"], ["phone", "phone"],
      ["emergencyContactNameTh", "emergency_contact_name_th"],
      ["emergencyContactNameEn", "emergency_contact_name_en"],
      ["emergencyContactRelationship", "emergency_contact_relationship"],
      ["emergencyContactPhone", "emergency_contact_phone"],
    ];
    for (const [key, column] of scalarFields) {
      if (input[key] !== undefined) set(column, input[key]);
    }
    const addressFields: Array<["currentAddress" | "registeredAddress", string]> = [
      ["currentAddress", "current"], ["registeredAddress", "registered"],
    ];
    for (const [key, prefix] of addressFields) {
      const address = input[key];
      if (!address) continue;
      set(`${prefix}_house_no`, address.houseNo);
      set(`${prefix}_village`, address.village);
      set(`${prefix}_soi`, address.soi);
      set(`${prefix}_province`, address.province);
      set(`${prefix}_district`, address.district);
      set(`${prefix}_subdistrict`, address.subdistrict);
      set(`${prefix}_postal_code`, address.postalCode);
    }
    assignments.push("updated_at=now()");
    await client.query(
      `UPDATE public.employee_profiles SET ${assignments.join(",")} WHERE user_id=$1`,
      values,
    );
    await writeAuditLog(client, {
      organizationId: context.organization.id,
      requestId: requestContext.requestId,
      actorUserId: context.user.id,
      action: "profile.updated",
      entityType: "employee_profile",
      oldData: {
        targetUserId: context.user.id,
        updatedAt: previous.updated_at,
      },
      newData: { targetUserId: context.user.id },
      ipAddress: requestContext.ipAddress,
      userAgent: requestContext.userAgent,
    });
    const profile = await getEmployeeProfile(context.user.id, client);
    if (!profile) throw new NotFoundError("Employee profile");
    return toEmployeeProfileDto(profile, client);
  });
}
