import { supabase } from "@/utils/supabase";
import { EmployeeProfile } from "@/types/user";

export const employeeService = {
  /**
   * ดึงข้อมูล Profile ของพนักงานตาม ID
   */
  async getProfile(userId: string): Promise<EmployeeProfile | null> {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching employee profile:", error);
        return null;
      }
      return data as EmployeeProfile;
    } catch (err) {
      console.error("Unexpected error in getProfile:", err);
      return null;
    }
  },

  /**
   * อัปเดตข้อมูลพนักงาน
   */
  async updateProfile(userId: string, updates: Partial<EmployeeProfile>) {
    const { data, error } = await supabase
      .from("employees")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data as EmployeeProfile;
  },

  /**
   * ดึงรายชื่อพนักงานทั้งหมด (สำหรับเมนู Staff Directory)
   */
  async getAllEmployees(): Promise<EmployeeProfile[]> {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data || []) as EmployeeProfile[];
    } catch {
      return [];
    }
  },
};
