import { supabase } from "./supabase";
import { EmployeeProfile, UserRole } from "@/types/user";

export const AUTH_TOKEN_KEY = "dawh_auth_token";
export const REFRESH_TOKEN_KEY = "dawh_refresh_token";
export const USER_ID_KEY = "current_user_id";
export const USER_EMAIL_KEY = "current_user_email";
export const USER_ROLE_KEY = "current_user_role";
export const AUTH_SYNC_EVENT_KEY = "dawh_auth_sync";

export interface AuthSessionData {
  accessToken: string;
  refreshToken?: string;
  userId: string;
  email: string;
  role?: UserRole;
  fullName?: string;
}

/**
 * 📡 กระจาย Event การเปลี่ยนแปลง Session ข้าม Browser Tabs (Multi-Tab Synchronization)
 */
export function broadcastAuthEvent(payload: {
  type: "LOGIN" | "LOGOUT" | "PROFILE_UPDATED";
  userId?: string;
  timestamp?: number;
}) {
  if (typeof window === "undefined") return;
  try {
    const data = { ...payload, timestamp: Date.now() };
    localStorage.setItem(AUTH_SYNC_EVENT_KEY, JSON.stringify(data));
  } catch {
    // Non-blocking
  }
}

/**
 * 🔄 ดึงข้อมูลพนักงานตัวเต็ม (ดึงจาก Cache ทันที 0ms เพื่อความเร็วสูงสุด และอัปเดตเบื้องหลัง)
 */
export async function fetchAndStoreUserProfile(
  userId: string,
  email?: string | null,
  maxRetries: number = 1
): Promise<EmployeeProfile | null> {
  if (typeof window === "undefined" || !userId) return null;

  let fetchedProfile: EmployeeProfile | null = null;

  // 1. Instant Cache Lookup from LocalStorage (0ms)
  try {
    const cached = localStorage.getItem("dawh_user_profile");
    if (cached) {
      const parsed = JSON.parse(cached);
      if (parsed && (parsed.id === userId || (email && parsed.email === email))) {
        fetchedProfile = parsed as EmployeeProfile;
      }
    }
  } catch {
    // Non-blocking
  }

  // 2. Fetch fresh profile from Supabase Database
  try {
    const { data: empById, error: errById } = await supabase
      .from("employees")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!errById && empById) {
      fetchedProfile = empById as EmployeeProfile;
    } else {
      const { data: rpcEmp, error: errRpc } = await supabase.rpc("rpc_get_employee_profile", {
        p_id: userId,
      });

      if (!errRpc && rpcEmp) {
        fetchedProfile = rpcEmp as EmployeeProfile;
      } else if (email) {
        const { data: empByEmail, error: errEmail } = await supabase
          .from("employees")
          .select("*")
          .eq("email", email)
          .maybeSingle();

        if (!errEmail && empByEmail) {
          fetchedProfile = empByEmail as EmployeeProfile;
        }
      }
    }
  } catch (err) {
    console.warn("[DAWH Auth] Profile fetch attempt failed:", err);
  }

  // 3. Fallback: Construct valid profile from user metadata & Auto-heal employee record in DB
  if (!fetchedProfile) {
    let authUser = null;
    try {
      const { data: authData } = await supabase.auth.getUser();
      authUser = authData?.user;
    } catch {
      // Non-blocking
    }

    const meta = authUser?.user_metadata || {};
    const cleanEmail = email || authUser?.email || (typeof window !== "undefined" ? localStorage.getItem(USER_EMAIL_KEY) : "") || "";
    const cleanUsername = meta.username || (cleanEmail ? cleanEmail.split("@")[0] : "");
    const realFullName =
      (meta.full_name && meta.full_name !== "Authorized Staff" && meta.full_name !== "H. Administrator" ? meta.full_name : "") ||
      [meta.first_name, meta.last_name].filter(Boolean).join(" ") ||
      [meta.first_name_th, meta.last_name_th].filter(Boolean).join(" ") ||
      cleanUsername ||
      (cleanEmail ? cleanEmail.split("@")[0] : "");

    const randCode = Math.floor(Math.random() * 9000 + 1000);
    const autoStaffCode = `EMP-${randCode}`;

    fetchedProfile = {
      id: userId,
      staff_code: autoStaffCode,
      email: cleanEmail,
      username: cleanUsername || "user",
      full_name: realFullName || cleanUsername || "Administrator",
      first_name: meta.first_name || cleanUsername || "Staff",
      last_name: meta.last_name || "Member",
      first_name_th: meta.first_name_th || "",
      last_name_th: meta.last_name_th || "",
      role: (meta.role as UserRole) || (typeof window !== "undefined" ? localStorage.getItem(USER_ROLE_KEY) as UserRole : "") || "staff",
      department: meta.department || "General Operations",
      branch_name: meta.branch_name || "สำนักงานใหญ่ (Headquarters)",
      birth_date: meta.birth_date || (typeof window !== "undefined" ? localStorage.getItem("current_user_birth_date") : "") || "",
      phone: meta.phone || (typeof window !== "undefined" ? localStorage.getItem("current_user_phone") : "") || "",
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as EmployeeProfile;

    // Auto-heal: Insert the missing employee into public.employees table
    if (authUser && authUser.id) {
      try {
        await supabase.from("employees").insert({
          id: authUser.id,
          username: cleanUsername || `user_${randCode}`,
          staff_code: autoStaffCode,
          email: cleanEmail,
          first_name: meta.first_name || cleanUsername || "Staff",
          last_name: meta.last_name || "Member",
          role: (meta.role as UserRole) || "staff",
          department: meta.department || "General Operations",
          employment_status: "Active",
          is_active: true,
        });
      } catch (err) {
        console.warn("[DAWH Auth] Auto-heal employee insert notice:", err);
      }
    }
  } else {
    // Ensure full_name is computed from real first/last names if missing in DB
    if (!fetchedProfile.full_name || fetchedProfile.full_name === "Authorized Staff" || fetchedProfile.full_name === "H. Administrator") {
      fetchedProfile.full_name =
        [fetchedProfile.first_name, fetchedProfile.last_name].filter(Boolean).join(" ") ||
        [fetchedProfile.first_name_th, fetchedProfile.last_name_th].filter(Boolean).join(" ") ||
        fetchedProfile.nickname_th ||
        fetchedProfile.nickname ||
        fetchedProfile.username ||
        (fetchedProfile.email ? fetchedProfile.email.split("@")[0] : "") ||
        "Administrator";
    }
  }

  // บันทึกข้อมูลลง LocalStorage (Sanitize sensitive fields)
  try {
    localStorage.setItem(USER_ID_KEY, fetchedProfile.id);
    if (fetchedProfile.email) localStorage.setItem(USER_EMAIL_KEY, fetchedProfile.email);
    if (fetchedProfile.role) {
      localStorage.setItem(USER_ROLE_KEY, fetchedProfile.role);
      // ซิงค์ Cookie role ให้ตรงกับฐานข้อมูลเสมอ
      syncSessionCookie({ role: fetchedProfile.role, userId: fetchedProfile.id });
    }
    if (fetchedProfile.birth_date) localStorage.setItem("current_user_birth_date", fetchedProfile.birth_date);
    if (fetchedProfile.phone) localStorage.setItem("current_user_phone", fetchedProfile.phone);

    // ห้ามจัดเก็บ pin_code ใน localStorage โดยเด็ดขาด เพื่อความปลอดภัย
    const sanitizedProfile = { ...fetchedProfile };
    delete (sanitizedProfile as any).pin_code;
    localStorage.setItem("dawh_user_profile", JSON.stringify(sanitizedProfile));
  } catch (err) {
    console.error("Failed to store employee profile:", err);
  }

  return fetchedProfile;
}

/**
 * 🍪 ซิงค์ Session Token และ Role ไปยัง HTTP Cookies เพื่อให้ Next.js Middleware อ่านค่าได้
 */
export function syncSessionCookie(params: {
  token?: string | null;
  role?: string | null;
  userId?: string | null;
}) {
  if (typeof window === "undefined") return;

  const currentToken = params.token || localStorage.getItem(AUTH_TOKEN_KEY);
  if (!currentToken) return;

  const userRole = params.role || localStorage.getItem(USER_ROLE_KEY) || "staff";
  const userId = params.userId || localStorage.getItem(USER_ID_KEY) || "";

  // 1. ตั้งค่าผ่าน document.cookie ทันที (0ms fallback)
  try {
    const maxAge = 60 * 60 * 24 * 7; // 7 days
    document.cookie = `dawh_auth_token=${encodeURIComponent(currentToken)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    if (userRole) {
      document.cookie = `dawh_user_role=${encodeURIComponent(userRole)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
    if (userId) {
      document.cookie = `dawh_user_id=${encodeURIComponent(userId)}; path=/; max-age=${maxAge}; SameSite=Lax`;
    }
  } catch {
    // Non-blocking
  }

  // 2. ส่ง request ไปตั้งค่า Cookie ฝั่งเซิร์ฟเวอร์
  try {
    fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: currentToken,
        role: userRole,
        userId: userId,
      }),
    }).catch(() => {});
  } catch {
    // Non-blocking
  }
}

/**
 * 🍪 ล้าง Session Cookies ทั้งหมด
 */
export function clearSessionCookie() {
  if (typeof window === "undefined") return;

  try {
    document.cookie = "dawh_auth_token=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "dawh_user_role=; path=/; max-age=0; SameSite=Lax";
    document.cookie = "dawh_user_id=; path=/; max-age=0; SameSite=Lax";
  } catch {
    // Non-blocking
  }

  try {
    fetch("/api/auth/session", { method: "DELETE" }).catch(() => {});
  } catch {
    // Non-blocking
  }
}

/**
 * บันทึก Token และข้อมูล Session ผู้ใช้งานลงใน LocalStorage
 */
export function saveAuthSession(session: {
  access_token: string;
  refresh_token?: string;
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      full_name?: string;
      username?: string;
      role?: string;
      birth_date?: string;
    };
  };
}) {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(AUTH_TOKEN_KEY, session.access_token);
    if (session.refresh_token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, session.refresh_token);
    }
    localStorage.setItem(USER_ID_KEY, session.user.id);
    if (session.user.email) {
      localStorage.setItem(USER_EMAIL_KEY, session.user.email);
    }
    if (session.user.user_metadata?.role) {
      localStorage.setItem(USER_ROLE_KEY, session.user.user_metadata.role);
    }
    if (session.user.user_metadata?.birth_date) {
      localStorage.setItem("current_user_birth_date", session.user.user_metadata.birth_date);
    }

    // ซิงค์ Session Cookie ไปยังเซิร์ฟเวอร์
    syncSessionCookie({
      token: session.access_token,
      role: session.user.user_metadata?.role,
      userId: session.user.id,
    });
  } catch (err) {
    console.error("Failed to save auth session to localStorage:", err);
  }
}

/**
 * ดึง Token ปัจจุบัน
 */
export function getAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

/**
 * ล้างข้อมูล Token และออกจากระบบอย่างสมบูรณ์
 */
export async function clearAuthSession(): Promise<void> {
  if (typeof window === "undefined") return;

  try {
    await supabase.auth.signOut();
  } catch {
    // Non-blocking
  }

  // ล้าง Session Cookies
  clearSessionCookie();

  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_ID_KEY);
    localStorage.removeItem(USER_EMAIL_KEY);
    localStorage.removeItem(USER_ROLE_KEY);
    localStorage.removeItem("current_user_birth_date");
    localStorage.removeItem("current_user_phone");
    localStorage.removeItem("dawh_user_profile");
  } catch (err) {
    console.error("Failed to clear auth session:", err);
  }
}

/**
 * ตรวจสอบสถานะการ Login และความถูกต้องของ Token ทันที
 */
export async function checkAuthSession(): Promise<{
  isAuthenticated: boolean;
  user: EmployeeProfile | null;
}> {
  if (typeof window === "undefined") {
    return { isAuthenticated: false, user: null };
  }

  try {
    const localToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const localUserId = localStorage.getItem(USER_ID_KEY);

    if (!localToken || !localUserId) {
      return { isAuthenticated: false, user: null };
    }

    if (typeof document !== "undefined" && !document.cookie.includes("dawh_auth_token=")) {
      syncSessionCookie({
        token: localToken,
        userId: localUserId,
        role: localStorage.getItem(USER_ROLE_KEY) || undefined,
      });
    }

    let localProfile: EmployeeProfile | null = null;
    try {
      const cached = localStorage.getItem("dawh_user_profile");
      if (cached) {
        localProfile = JSON.parse(cached);
      }
    } catch {
      // non-blocking
    }

    if (localProfile) {
      return { isAuthenticated: true, user: localProfile };
    }

    const employeeData = await fetchAndStoreUserProfile(localUserId, null, 1);
    if (employeeData) {
      return { isAuthenticated: true, user: employeeData };
    }

    return { isAuthenticated: true, user: null };
  } catch {
    return { isAuthenticated: false, user: null };
  }
}

/**
 * ตรวจสอบความสมบูรณ์ของข้อมูลพนักงาน (Secondary Registration & PIN)
 */
export function checkProfileCompleteness(profile: Partial<EmployeeProfile> | null | undefined): {
  isComplete: boolean;
  missingFields: string[];
} {
  let activeProfile = profile;

  // Fallback ตรวจสอบจาก LocalStorage Cache หาก profile ที่ส่งเข้ามายังว่างอยู่
  if ((!activeProfile || Object.keys(activeProfile).length === 0) && typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("dawh_user_profile");
      if (cached) {
        activeProfile = JSON.parse(cached);
      }
    } catch {
      // non-blocking
    }
  }

  if (!activeProfile || Object.keys(activeProfile).length === 0) {
    return { isComplete: false, missingFields: ["ข้อมูลพนักงานทั้งหมด"] };
  }

  const missing: string[] = [];

  // 1. เลขบัตรประชาชน 13 หลัก
  const cleanIdCard = (activeProfile.id_card || "").replace(/\D/g, "");
  if (cleanIdCard.length !== 13) {
    missing.push("เลขบัตรประชาชน 13 หลัก");
  }

  // 2. ชื่อ-นามสกุล (ภาษาไทย)
  if (!activeProfile.first_name_th?.trim() || !activeProfile.last_name_th?.trim()) {
    if (!activeProfile.first_name?.trim() || !activeProfile.last_name?.trim()) {
      missing.push("ชื่อ-นามสกุล");
    } else {
      missing.push("ชื่อ-นามสกุล (ภาษาไทย)");
    }
  }

  // 3. ชื่อ-นามสกุล (English)
  if (!activeProfile.first_name?.trim() || !activeProfile.last_name?.trim()) {
    if (activeProfile.first_name_th?.trim() && activeProfile.last_name_th?.trim()) {
      // มีชื่อไทยแล้ว
    } else {
      missing.push("ชื่อ-นามสกุล (English)");
    }
  }

  // 4. วันเดือนปีเกิด
  if (!activeProfile.birth_date) {
    missing.push("วันเกิด");
  }

  // 5. เบอร์โทรศัพท์มือถือ
  if (!activeProfile.phone?.trim() || activeProfile.phone.trim().length < 9) {
    missing.push("เบอร์โทรศัพท์มือถือ");
  }

  // 6. ที่อยู่ปัจจุบัน
  if (!activeProfile.current_address?.trim()) {
    missing.push("ที่อยู่ปัจจุบัน");
  }

  // 7. ที่อยู่ตามทะเบียนบ้าน
  if (!activeProfile.registered_address?.trim()) {
    missing.push("ที่อยู่ตามทะเบียนบ้าน");
  }

  // 8. รหัส PIN 6 หลัก
  if (!activeProfile.pin_code && !activeProfile.is_pin_enabled) {
    missing.push("รหัส PIN 6 หลัก");
  }

  return {
    isComplete: missing.length === 0,
    missingFields: missing,
  };
}
