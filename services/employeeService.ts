import { apiGet, apiPatch } from "@/lib/api/client";
import { toEmployeeProfile } from "@/lib/user-profile";
import type { EmployeeProfileDto } from "@/lib/profiles";
import type { EmployeeProfile } from "@/types/user";

type AdminUserSummary = {
  id: string;
  name: string;
  email: string;
  accountStatus: string;
  profileComplete: boolean;
  username: string | null;
  facility: { id: string; code: string; name: string } | null;
  department: { id: string; code: string; name: string } | null;
};

function mapAdminUser(user: AdminUserSummary): EmployeeProfile {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    full_name: user.name,
    department: user.department?.name ?? null,
    branch_id: user.facility?.id ?? null,
    branch_name: user.facility?.name ?? null,
    is_active: user.accountStatus === "ACTIVE",
    is_complete: user.profileComplete,
  };
}

export const employeeService = {
  /** The profile endpoint is self-scoped; userId is retained for compatibility. */
  async getProfile(userId: string): Promise<EmployeeProfile | null> {
    if (!userId) return null;
    try {
      const response = await apiGet<{
        profile: EmployeeProfileDto | null;
        profileComplete: boolean;
      }>("/api/profile/me");
      return response.data.profile ? toEmployeeProfile(response.data.profile) : null;
    } catch {
      return null;
    }
  },

  /**
   * อัปเดตข้อมูลพนักงาน
   */
  async updateProfile(userId: string, updates: Partial<EmployeeProfile>) {
    if (!userId) throw new Error("A user id is required.");
    const payload = {
      ...(updates.prefix !== undefined ? { prefix: updates.prefix ?? "" } : {}),
      ...(updates.nickname_th !== undefined ? { nicknameTh: updates.nickname_th ?? "" } : {}),
      ...(updates.nickname !== undefined ? { nicknameEn: updates.nickname ?? "" } : {}),
      ...(updates.nationality !== undefined ? { nationality: updates.nationality ?? "" } : {}),
      ...(updates.religion !== undefined ? { religion: updates.religion ?? "" } : {}),
      ...(updates.education_level !== undefined ? { educationLevel: updates.education_level ?? "" } : {}),
      ...(updates.major_subject !== undefined ? { majorSubject: updates.major_subject ?? "" } : {}),
      ...(updates.university_th !== undefined ? { universityNameTh: updates.university_th ?? "" } : {}),
      ...(updates.university_en !== undefined ? { universityNameEn: updates.university_en ?? "" } : {}),
      ...(updates.phone !== undefined ? { phone: updates.phone ?? "" } : {}),
      ...(updates.emergency_contact_name_th !== undefined ? { emergencyContactNameTh: updates.emergency_contact_name_th ?? "" } : {}),
      ...(updates.emergency_contact_name !== undefined ? { emergencyContactNameEn: updates.emergency_contact_name } : {}),
      ...(updates.emergency_contact_relationship !== undefined ? { emergencyContactRelationship: updates.emergency_contact_relationship ?? "" } : {}),
      ...(updates.emergency_contact_phone !== undefined ? { emergencyContactPhone: updates.emergency_contact_phone ?? "" } : {}),
    };
    const response = await apiPatch<EmployeeProfileDto>("/api/profile/me", payload);
    return toEmployeeProfile(response.data);
  },

  /**
   * ดึงรายชื่อพนักงานทั้งหมด (สำหรับเมนู Staff Directory)
   */
  async getAllEmployees(): Promise<EmployeeProfile[]> {
    try {
      const response = await apiGet<AdminUserSummary[]>("/api/admin/users?limit=100");
      return response.data.map(mapAdminUser);
    } catch {
      return [];
    }
  },
};
