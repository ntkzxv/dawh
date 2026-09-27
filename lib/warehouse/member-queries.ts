import "server-only";

import { dbPool } from "@/lib/core/db/pool";
import { NotFoundError } from "@/lib/core/http/errors";
import { emptyProfile, type Profile } from "@/lib/warehouse/member-profile";
import type { Actor, Role } from "@/lib/warehouse/access";

type MemberRow = {
  id: number;
  auth_user_id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  branch_ids: number[];
  deleted_at: Date | null;
  profile: Profile | null;
};
type MemberSummaryRow = Pick<
  MemberRow,
  "id" | "name" | "image" | "role" | "branch_ids" | "deleted_at"
>;
function visibleBranches(
  actor: Actor,
  row: Pick<MemberRow, "id" | "branch_ids">,
) {
  return actor.role === "ADMIN" || actor.role === "CEO" || actor.id === row.id
    ? row.branch_ids
    : row.branch_ids.filter((branchId) => actor.branchIds.includes(branchId));
}
export function mapMember(actor: Actor, row: MemberRow) {
  const common = {
    id: row.id,
    name: row.name,
    image: row.image,
    role: row.role,
    branchIds: visibleBranches(actor, row),
  };
  if (
    !["ADMIN", "CEO", "MANAGER"].includes(actor.role) &&
    actor.id !== row.id
  ) {
    return { ...common, detailLevel: "SUMMARY" as const };
  }
  return {
    ...common,
    detailLevel: "FULL" as const,
    email: row.email,
    deletedAt: row.deleted_at,
    profile: row.profile ?? emptyProfile,
  };
}
const select = `SELECT a.id, a.auth_user_id, u.name, u.email, u.image, a.role, a.deleted_at,
  CASE WHEN ($1::text IN ('ADMIN','CEO','MANAGER') OR a.id=$2) THEN jsonb_build_object(
    'employeeCode', p.employee_code,
    'username', p.username,
    'prefix', p.prefix,
    'firstNameTh', p.first_name_th,
    'lastNameTh', p.last_name_th,
    'nicknameTh', p.nickname_th,
    'firstNameEn', p.first_name_en,
    'lastNameEn', p.last_name_en,
    'nicknameEn', p.nickname_en,
    'citizenId', p.citizen_id,
    'birthDate', p.birth_date::text,
    'gender', p.gender,
    'bloodType', p.blood_type,
    'maritalStatus', p.marital_status,
    'nationality', p.nationality,
    'religion', p.religion,
    'department', p.department,
    'employmentStatus', p.employment_status,
    'startedOn', p.started_on::text,
    'endedOn', p.ended_on::text,
    'educationLevel', p.education_level,
    'majorSubject', p.major_subject,
    'universityNameTh', p.university_name_th,
    'universityNameEn', p.university_name_en,
    'contactEmail', p.contact_email,
    'phone', p.phone,
    'emergencyContactName', p.emergency_contact_name,
    'emergencyContactNameEn', p.emergency_contact_name_en,
    'emergencyContactRelationship', p.emergency_contact_relationship,
    'emergencyContactPhone', p.emergency_contact_phone,
    'address', p.address,
    'registeredAddress', p.registered_address
  ) ELSE NULL END AS profile,
  ARRAY(SELECT m.branch_id FROM app.branch_memberships m WHERE m.user_id=a.id ORDER BY m.branch_id) AS branch_ids
  FROM app.app_users a JOIN public."user" u ON u.id = a.auth_user_id
  LEFT JOIN app.member_profiles p ON p.app_user_id = a.id`;
const visibility = `($1::text = 'ADMIN' OR a.deleted_at IS NULL) AND
  ($1::text IN ('ADMIN','CEO') OR a.id=$2 OR EXISTS (
    SELECT 1 FROM app.branch_memberships scope
    WHERE scope.user_id=a.id AND scope.branch_id=ANY($3::integer[])
  ))`;
function visibilityParams(actor: Actor) {
  return [actor.role, actor.id, actor.branchIds];
}

export async function loadMember(actor: Actor, memberId: number) {
  const result = await dbPool.query<MemberRow>(
    `${select} WHERE a.id=$4 AND ${visibility}`,
    [...visibilityParams(actor), memberId],
  );
  const row = result.rows[0];
  if (!row) throw new NotFoundError("Member");
  return row;
}

export async function listMembers(
  actor: Actor,
  view: "full" | "summary" = "full",
) {
  if (view === "summary") {
    const result = await dbPool.query<MemberSummaryRow>(
      `SELECT a.id,u.name,u.image,a.role,a.deleted_at,
      ARRAY(SELECT m.branch_id FROM app.branch_memberships m WHERE m.user_id=a.id ORDER BY m.branch_id) AS branch_ids
      FROM app.app_users a JOIN public."user" u ON u.id=a.auth_user_id
      WHERE ${visibility} ORDER BY a.id`,
      visibilityParams(actor),
    );
    return result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      image: row.image,
      role: row.role,
      branchIds: visibleBranches(actor, row),
      detailLevel: "SUMMARY" as const,
      ...(actor.role === "ADMIN" ? { deletedAt: row.deleted_at } : {}),
    }));
  }
  const result = await dbPool.query<MemberRow>(
    `${select} WHERE ${visibility} ORDER BY a.id`,
    visibilityParams(actor),
  );
  return result.rows.map((row) => mapMember(actor, row));
}
export async function getMember(actor: Actor, memberId: number) {
  return mapMember(actor, await loadMember(actor, memberId));
}
