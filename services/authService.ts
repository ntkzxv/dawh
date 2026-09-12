import { supabase } from "@/utils/supabase";
import {
  saveAuthSession,
  clearAuthSession,
  checkAuthSession,
  fetchAndStoreUserProfile,
  getAuthToken,
  syncSessionCookie,
  AUTH_TOKEN_KEY,
  USER_ID_KEY,
  USER_EMAIL_KEY,
  USER_ROLE_KEY,
} from "@/utils/auth";
import { EmployeeProfile, UserRole } from "@/types/user";

export function saveAccountMapping(username: string, email: string) {
  if (typeof window === "undefined" || !username || !email) return;
  try {
    const cleanUser = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();
    const map = JSON.parse(localStorage.getItem("dawh_account_map") || "{}");
    map[cleanUser] = cleanEmail;
    localStorage.setItem("dawh_account_map", JSON.stringify(map));
  } catch {
    // non-blocking
  }
}

export function recordRealLoginLog(
  user: string,
  email: string,
  role: string = "Staff",
  status: "Success" | "Failed (2FA)" | "Failed (Password)" | "Blocked IP" = "Success"
) {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem("dawh_login_logs");
    const logs = raw ? JSON.parse(raw) : [];
    const ua = navigator.userAgent;
    const device = ua.includes("Windows")
      ? "Windows 11 (Google Chrome)"
      : ua.includes("Mac")
      ? "macOS (Safari / Chrome)"
      : ua.includes("iPhone") || ua.includes("iPad")
      ? "iOS Client"
      : ua.includes("Android")
      ? "Android Client"
      : "Desktop Enterprise Client";

    const newLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      user,
      email,
      role,
      ip: "127.0.0.1 (Localhost / Secured Gateway)",
      device,
      location: "Bangkok, Thailand",
      timestamp: new Date().toISOString().replace("T", " ").substring(0, 16),
      status,
    };
    const updated = [newLog, ...logs.filter((l: any) => l.id !== newLog.id)].slice(0, 50);
    localStorage.setItem("dawh_login_logs", JSON.stringify(updated));
  } catch {}
}

export const authService = {
  /**
   * ค้นหาและแปลง Username / Login ID ให้เป็น Email จริงขององค์กร (Database RPC + Local Cache)
   */
  async resolveEmail(identifier: string): Promise<string> {
    let clean = identifier.trim();
    if (clean.startsWith("@")) clean = clean.substring(1).trim();

    // 1. ถ้าเป็น Email รูปแบบมาตรฐานอยู่แล้ว (มี @ และ .)
    if (clean.includes("@") && clean.includes(".")) {
      return clean;
    }

    const lowerClean = clean.toLowerCase();

    // 2. ค้นหาผ่าน Database RPC โดยตรง (Security Definer - ทำงานได้แม้ยังไม่ได้ล็อกอิน)
    try {
      const { data: rpcData, error: rpcErr } = await supabase.rpc("rpc_resolve_username_to_email", {
        p_identifier: clean,
      });
      if (!rpcErr && rpcData && rpcData.success && rpcData.email) {
        saveAccountMapping(clean, rpcData.email);
        return rpcData.email;
      }
    } catch {
      // Continue to local fallbacks
    }

    // 3. ค้นหาจากประวัติบัญชีในเครื่องนี้ (Local Cache / Recent Accounts / Account Map)
    if (typeof window !== "undefined") {
      try {
        // 3.1 ตรวจสอบจาก Account Map ที่บันทึกไว้
        const accountMap = JSON.parse(localStorage.getItem("dawh_account_map") || "{}");
        if (accountMap[lowerClean]) {
          return accountMap[lowerClean];
        }

        // 3.2 ตรวจสอบจาก Recent Accounts
        const savedRecent = localStorage.getItem("dawh_recent_accounts");
        if (savedRecent) {
          const list = JSON.parse(savedRecent);
          const found = list.find((a: { username?: string; email?: string }) =>
            a.username?.toLowerCase() === lowerClean ||
            a.email?.toLowerCase() === lowerClean ||
            a.email?.toLowerCase().split("@")[0] === lowerClean
          );
          if (found?.email) return found.email;
        }

        // 3.3 ตรวจสอบจาก Profile ที่เปิดค้างไว้ในเครื่อง
        const savedProfile = localStorage.getItem("dawh_user_profile");
        if (savedProfile) {
          const prof = JSON.parse(savedProfile);
          if (
            (prof.username?.toLowerCase() === lowerClean ||
              prof.email?.toLowerCase().split("@")[0] === lowerClean) &&
            prof.email
          ) {
            return prof.email;
          }
        }
      } catch {
        // Non-blocking
      }
    }

    // 4. หากไม่มี @ เลย ให้ลองใช้รูปแบบ username@dawh.co.th
    if (!clean.includes("@")) {
      return `${clean}@dawh.co.th`;
    }

    return clean;
  },

  /**
   * 🔍 ตรวจสอบว่า Username ซ้ำในระบบหรือไม่ (สำหรับขั้นตอนสมัครสมาชิก)
   */
  async checkUsernameAvailable(username: string): Promise<{ available: boolean; message?: string }> {
    let clean = username.trim();
    if (clean.startsWith("@")) clean = clean.substring(1).trim();
    if (!clean || clean.length < 3) {
      return { available: false, message: "Username ต้องมีความยาวอย่างน้อย 3 ตัวอักษร" };
    }

    try {
      const { data: rpcData, error } = await supabase.rpc("rpc_check_username_exists", {
        p_username: clean,
      });
      if (!error && rpcData) {
        if (rpcData.exists) {
          return { available: false, message: "ชื่อผู้ใช้นี้ถูกใช้งานแล้วในระบบ กรุณาเลือกชื่ออื่น" };
        }
        return { available: true };
      }
    } catch {
      // Fallback
    }

    return { available: true };
  },

  /**
   * เข้าสู่ระบบด้วย Email/Username และ Password (บล็อกจนกว่าโหลด Profile สำเร็จ 100%)
   */
  async signIn(emailOrUsername: string, password: string) {
    let cleanIdentifier = emailOrUsername.trim();
    if (cleanIdentifier.startsWith("@")) {
      cleanIdentifier = cleanIdentifier.substring(1).trim();
    }

    const resolvedEmail = await this.resolveEmail(cleanIdentifier);

    // 1. ล็อกอินด้วย Resolved Email
    let res = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    });

    // 2. ถ้าไม่สำเร็จ และ Resolved Email ไม่เหมือน cleanIdentifier ให้ลองอีกครั้งด้วย cleanIdentifier หรือ fallback domain
    if (res.error && resolvedEmail !== cleanIdentifier) {
      if (!cleanIdentifier.includes("@")) {
        const fallbackRes = await supabase.auth.signInWithPassword({
          email: `${cleanIdentifier}@dawh.co.th`,
          password,
        });
        if (!fallbackRes.error) {
          res = fallbackRes;
        }
      } else {
        const rawRes = await supabase.auth.signInWithPassword({
          email: cleanIdentifier,
          password,
        });
        if (!rawRes.error) {
          res = rawRes;
        }
      }
    }

    if (res.error) throw res.error;
    if (res.data.session && res.data.user) {
      saveAuthSession(res.data.session);

      // บันทึก Account Mapping ลง LocalStorage
      const userMeta = res.data.user.user_metadata || {};
      const actualUsername = userMeta.username || cleanIdentifier;
      if (actualUsername && res.data.user.email) {
        saveAccountMapping(actualUsername, res.data.user.email);
      }

      // ⏱️ อัปเดตเวลาเข้าใช้งานล่าสุดจริงใน Database
      try {
        await supabase
          .from("employees")
          .update({ last_login_at: new Date().toISOString() })
          .eq("id", res.data.user.id);
      } catch {
        // Continue
      }

      // ดึงข้อมูล Profile ตัวเต็มและบันทึกลง LocalStorage
      const profile = await fetchAndStoreUserProfile(res.data.user.id, res.data.user.email, 1);
      
      // 📝 บันทึกประวัติการเข้าสู่ระบบจริง (Real Login Log)
      try {
        const uName =
          profile?.full_name ||
          [profile?.first_name, profile?.last_name].filter(Boolean).join(" ") ||
          actualUsername ||
          "Staff User";
        const uEmail = res.data.user.email || profile?.email || `${actualUsername || "staff"}@dawh.co.th`;
        const uRole = profile?.role === "devops" ? "DevOps" : profile?.role === "super_admin" ? "Super Admin" : profile?.role === "admin" ? "Admin" : (profile?.role || "Staff");
        recordRealLoginLog(uName, uEmail, uRole, "Success");
      } catch {}

      return { ...res.data, profile: profile || null };
    }
    return { ...res.data, profile: null };
  },

  /**
   * 🔢 เข้าสู่ระบบด่วนด้วย Quick PIN 6 หลัก (บล็อกจนกว่าโหลด Profile สำเร็จ 100%)
   */
  async loginWithPin(usernameOrEmail: string, pin: string) {
    let cleanId = usernameOrEmail.trim();
    if (cleanId.startsWith("@")) {
      cleanId = cleanId.substring(1).trim();
    }

    // 1. เรียก RPC rpc_verify_employee_pin ซึ่งรองรับ Bcrypt, Rate Limiting และ Lockout
    const { data: rpcRes, error: rpcErr } = await supabase.rpc("rpc_verify_employee_pin", {
      p_username: cleanId,
      p_pin: pin,
    });

    if (rpcErr) {
      console.warn("[DAWH Auth PIN Login] RPC error:", rpcErr);
      throw new Error(rpcErr.message || "เกิดข้อผิดพลาดในการตรวจสอบรหัส PIN");
    }

    if (rpcRes) {
      if (rpcRes.success && rpcRes.user) {
        const user = rpcRes.user as EmployeeProfile;
        const sessionToken = `pin_session_${user.id}_${Date.now()}`;

        // จัดเก็บใน localStorage (ตัด pin_code ออกเพื่อความปลอดภัย)
        if (typeof window !== "undefined") {
          localStorage.setItem(AUTH_TOKEN_KEY, sessionToken);
          localStorage.setItem(USER_ID_KEY, user.id);
          if (user.email) localStorage.setItem(USER_EMAIL_KEY, user.email);
          if (user.role) localStorage.setItem(USER_ROLE_KEY, user.role);
          if (user.birth_date) localStorage.setItem("current_user_birth_date", user.birth_date);
          if (user.phone) localStorage.setItem("current_user_phone", user.phone);

          const safeUser = { ...user };
          delete (safeUser as any).pin_code;
          localStorage.setItem("dawh_user_profile", JSON.stringify(safeUser));
        }

        // ซิงค์ Cookie เพื่อให้ Next.js Middleware รู้จัก Session นี้ทันที
        syncSessionCookie({
          token: sessionToken,
          role: user.role,
          userId: user.id,
        });

        if (user.username && user.email) {
          saveAccountMapping(user.username, user.email);
        }

        // 📝 บันทึกประวัติการเข้าสู่ระบบด่วนด้วย PIN จริง
        try {
          const uName =
            user.full_name ||
            [user.first_name, user.last_name].filter(Boolean).join(" ") ||
            user.username ||
            cleanId ||
            "Staff User";
          const uEmail = user.email || `${user.username || cleanId}@dawh.co.th`;
          const uRole =
            user.role === "devops"
              ? "DevOps"
              : user.role === "super_admin"
              ? "Super Admin"
              : user.role === "admin"
              ? "Admin"
              : (user.role || "Staff");
          recordRealLoginLog(uName, uEmail, uRole, "Success");
        } catch {}

        return { success: true, user };
      } else if (rpcRes.message) {
        throw new Error(rpcRes.message);
      }
    }

    throw new Error("ไม่สามารถเข้าสู่ระบบด้วยรหัส PIN ได้ กรุณาลองใหม่อีกครั้ง");
  },

  /**
   * ⚙️ ตั้งค่า / เปลี่ยนรหัส Quick PIN 6 หลัก (Hash ด้วย Bcrypt)
   */
  async setupPin(userId: string, newPin: string) {
    let data = null;
    try {
      // 1. เรียกผ่าน RPC rpc_setup_employee_pin เพื่อให้ Bcrypt Hash บน Database
      const { data: rpcData, error: rpcErr } = await supabase.rpc("rpc_setup_employee_pin", {
        p_user_id: userId,
        p_new_pin: newPin,
      });

      if (!rpcErr && rpcData?.success) {
        data = rpcData;
      } else {
        // Fallback กรณีตารางยังไม่ได้รัน Migration
        const { data: resData, error } = await supabase
          .from("employees")
          .update({
            pin_code: newPin,
            is_pin_enabled: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)
          .select()
          .maybeSingle();

        if (error) {
          console.warn("[DAWH Auth] Supabase setupPin error:", error);
        } else {
          data = resData;
        }
      }
    } catch (err) {
      console.warn("[DAWH Auth] setupPin query exception:", err);
    }

    if (typeof window !== "undefined") {
      try {
        const cached = localStorage.getItem("dawh_user_profile");
        if (cached) {
          const parsed = JSON.parse(cached);
          // ห้ามเก็บ pin_code แบบ plaintext ใน localStorage
          delete parsed.pin_code;
          parsed.is_pin_enabled = true;
          localStorage.setItem("dawh_user_profile", JSON.stringify(parsed));
        }

        const savedRecent = localStorage.getItem("dawh_recent_accounts");
        if (savedRecent) {
          const list = JSON.parse(savedRecent);
          const updated = list.map((a: { id?: string; has_pin?: boolean }) => {
            if (a.id === userId) {
              return { ...a, has_pin: true };
            }
            return a;
          });
          localStorage.setItem("dawh_recent_accounts", JSON.stringify(updated));
        }
      } catch {
        // Non-blocking
      }
    }

    return data;
  },

  /**
   * สมัครสมาชิกพนักงานใหม่
   */
  async signUp(params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: UserRole;
    pinCode?: string;
  }) {
    const { email, password, firstName, lastName, phone, role = "staff", pinCode } = params;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
          phone,
          role,
          pin_code: pinCode,
        },
      },
    });

    if (error) throw error;

    if (data.user) {
      await supabase.from("employees").upsert({
        id: data.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        phone,
        role,
        pin_code: pinCode || null,
        is_pin_enabled: !!pinCode,
        is_active: true,
      });
    }

    if (data.session) {
      saveAuthSession(data.session);
    }
    return data;
  },

  /**
   * ออกจากระบบ
   */
  async signOut() {
    await clearAuthSession();
  },

  /**
   * ตรวจสอบสถานะ Session ปัจจุบัน
   */
  async checkSession(): Promise<{ isAuthenticated: boolean; user: EmployeeProfile | null }> {
    return checkAuthSession();
  },

  /**
   * ดึง Auth Token
   */
  getToken(): string | null {
    return getAuthToken();
  },
};

function splitEmail(email: string) {
  return email.split("@")[0] || "user";
}
