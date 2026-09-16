"use client";

import React, { Suspense, useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  Sun,
  Moon,
  ShieldCheck,
  CheckCircle2,
  User,
  Mail,
  Phone,
  Check,
  X,
  FileText,
  Globe,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/utils/supabase";
import { saveAuthSession, checkAuthSession, AUTH_TOKEN_KEY, USER_ID_KEY } from "@/utils/auth";
import { getDawhLogo } from "@/config/brand";
import { useTheme } from "@/context/ThemeContext";
import { useNotification } from "@/context/NotificationContext";
import { DEFAULT_NEW_USER_ROLE } from "@/config/roles";
import { authService, saveAccountMapping } from "@/services/authService";
import { formatRelativeTime } from "@/types/user";
import { useLoading, LoadingScreen } from "@/components/loading_screen";
import { translations } from "@/translations";
import { Users, ArrowLeft, History, Lock, KeyRound, Search, Trash2, Clock, Sparkles, Delete } from "lucide-react";
import { useAppLanguage, setAppLanguage } from "@/utils/language";

export type AuthMode = "signin" | "signup";
export type Language = "TH" | "EN";

function getPasswordStrength(pass: string, currentLang: Language, isLight: boolean = false) {
  const dict = translations[currentLang];
  if (!pass) return { score: 0, label: "", color: "bg-transparent", textClass: "" };

  const hasLength = pass.length >= 8 && pass.length <= 16;
  const hasUppercase = /[A-Z]/.test(pass);
  const hasLowercase = /[a-z]/.test(pass);
  const hasNumber = /[0-9]/.test(pass);

  let score = 0;
  if (hasLength) score += 1;
  if (hasUppercase) score += 1;
  if (hasLowercase) score += 1;
  if (hasNumber) score += 1;

  if (score <= 1) {
    return {
      score: 1,
      label: dict.strengthWeak,
      color: isLight ? "bg-[#E74C3C]" : "bg-[#E71D36]",
      textClass: isLight ? "text-[#E74C3C] font-bold" : "text-[#E71D36] font-semibold",
    };
  }
  if (score === 2) {
    return {
      score: 2,
      label: dict.strengthFair,
      color: "bg-[#FF9F1C]",
      textClass: isLight ? "text-[#FF9F1C] font-bold" : "text-[#FF9F1C] font-semibold",
    };
  }
  if (score === 3) {
    return {
      score: 3,
      label: dict.strengthGood,
      color: "bg-[#2EC4B6]",
      textClass: isLight ? "text-[#2EC4B6] font-bold" : "text-[#2EC4B6] font-semibold",
    };
  }
  return {
    score: 4,
    label: dict.strengthStrong,
    color: "bg-[#2EC4B6]",
    textClass: isLight ? "text-[#2EC4B6] font-bold" : "text-[#2EC4B6] font-semibold",
  };
}

export interface UserAuthViewProps {
  initialMode?: AuthMode;
  onNavigate?: (target: string) => void;
  onAuthSuccess?: () => void;
  preventAutoRedirect?: boolean;
}

export function UserAuthView({
  initialMode = "signin",
  onNavigate,
  onAuthSuccess,
  preventAutoRedirect = false,
}: UserAuthViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeModeParam = (searchParams.get("mode") as AuthMode) || initialMode;
  const { navigateWithLoading } = useLoading();

  const { theme, toggleTheme } = useTheme();
  const isLight = theme === "light";
  const { notify } = useNotification();

  const lang = useAppLanguage() as Language;

  const toggleLanguage = () => {
    const nextLang: Language = lang === "TH" ? "EN" : "TH";
    setAppLanguage(nextLang);
  };

  const t = translations[lang];

  const [mode, setMode] = useState<AuthMode>(activeModeParam);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Recent Users & Quick PIN States
  const [signInSubView, setSignInSubView] = useState<"form" | "recent" | "pin">("form");
  const [selectedRecentUser, setSelectedRecentUser] = useState<{
    id?: string;
    username: string;
    first_name?: string;
    last_name?: string;
    first_name_th?: string;
    last_name_th?: string;
    full_name?: string;
    role?: string;
    department?: string;
    avatar_url?: string;
    last_login_at?: string;
    last_active?: string;
  } | null>(null);
  const [recentAccounts, setRecentAccounts] = useState<
    Array<{
      id?: string;
      username: string;
      first_name?: string;
      last_name?: string;
      first_name_th?: string;
      last_name_th?: string;
      full_name?: string;
      role?: string;
      department?: string;
      avatar_url?: string;
      last_login_at?: string;
      last_active?: string;
    }>
  >([]);
  const [recentSearch, setRecentSearch] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [pinDigits, setPinDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const pinInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [pinErrorShake, setPinErrorShake] = useState(false);
  const [lastTypedPinIndex, setLastTypedPinIndex] = useState<number | null>(null);
  const pinMorphTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isPinAuthenticating, setIsPinAuthenticating] = useState(false);

  const triggerPinDigitMorph = (index: number) => {
    if (pinMorphTimeoutRef.current) clearTimeout(pinMorphTimeoutRef.current);
    setLastTypedPinIndex(index);
    pinMorphTimeoutRef.current = setTimeout(() => {
      setLastTypedPinIndex(null);
    }, 550);
  };

  // Load accounts that actually logged in on this specific device from localStorage
  useEffect(() => {
    function loadDeviceRecentAccounts() {
      try {
        const deletedList: string[] = JSON.parse(localStorage.getItem("dawh_deleted_recent_accounts") || "[]");
        const saved = localStorage.getItem("dawh_recent_accounts");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Auto-purge any legacy demo mockup items from previous tests
            const filtered = parsed.filter(
              (p: Record<string, unknown>) =>
                p &&
                typeof p.username === "string" &&
                !deletedList.includes(p.username) &&
                !String(p.id || "").startsWith("demo-") &&
                p.id !== "demo-admin-01" &&
                p.id !== "demo-staff-02" &&
                p.first_name !== "ธนกฤต" &&
                p.first_name !== "สมชาย" &&
                p.username !== "somchai"
            ) as unknown as typeof recentAccounts;

            setRecentAccounts(filtered);
            localStorage.setItem("dawh_recent_accounts", JSON.stringify(filtered));
            return;
          }
        }
        setRecentAccounts([]);
      } catch {
        setRecentAccounts([]);
      }
    }

    loadDeviceRecentAccounts();
  }, []);

  const removeRecentAccount = (e: React.MouseEvent, username: string) => {
    e.stopPropagation();
    try {
      const deletedList: string[] = JSON.parse(localStorage.getItem("dawh_deleted_recent_accounts") || "[]");
      if (!deletedList.includes(username)) {
        deletedList.push(username);
        localStorage.setItem("dawh_deleted_recent_accounts", JSON.stringify(deletedList));
      }
    } catch {
      // non-blocking
    }

    setRecentAccounts((prev) => {
      const updated = prev.filter((p) => p.username !== username);
      localStorage.setItem("dawh_recent_accounts", JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllRecentAccounts = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      localStorage.removeItem("dawh_recent_accounts");
      localStorage.removeItem("dawh_deleted_recent_accounts");
    } catch {
      // non-blocking
    }
    setRecentAccounts([]);
  };

  const saveRecentAccount = (acc: {
    id?: string;
    username: string;
    email?: string;
    first_name?: string;
    last_name?: string;
    first_name_th?: string;
    last_name_th?: string;
    full_name?: string;
    birth_date?: string;
    phone?: string;
    role?: string;
    department?: string;
    avatar_url?: string;
    has_pin?: boolean;
    last_login_at?: string;
  }) => {
    try {
      if (acc.username && acc.email) {
        saveAccountMapping(acc.username, acc.email);
      }
      setRecentAccounts((prev) => {
        const withoutCurrent = prev.filter((p) => p.username?.toLowerCase() !== acc.username?.toLowerCase());
        const updated = [{ ...acc, last_login_at: new Date().toISOString() }, ...withoutCurrent].slice(0, 5);
        localStorage.setItem("dawh_recent_accounts", JSON.stringify(updated));
        return updated;
      });
    } catch {
      // Non-blocking
    }
  };

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [phone, setPhone] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const passwordStrength = getPasswordStrength(password, lang, isLight);

  const [showTermsModal, setShowTermsModal] = useState(false);
  const [agreedInModal, setAgreedInModal] = useState(false);

  const isPreviewSuccess =
    searchParams.get("preview") === "registersuccess" || searchParams.get("preview") === "success";
  const [showLoadingModal, setShowLoadingModal] = useState(isPreviewSuccess);
  const [isModalSuccess, setIsModalSuccess] = useState(isPreviewSuccess);
  const [loadingStepText, setLoadingStepText] = useState("");
  const [errorModal, setErrorModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
  }>({
    isOpen: false,
    title: "",
    message: "",
  });

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[field];
        return updated;
      });
    }
    if (errorMessage) {
      setErrorMessage(null);
    }
  };

  const getFieldClass = (fieldName: string) => {
    const hasError = !!errors[fieldName];
    if (hasError) {
      return isLight
        ? "bg-rose-50/50 border-rose-500 text-[#222222] focus-within:border-rose-600 focus-within:ring-1 focus-within:ring-rose-500/30"
        : "bg-rose-950/20 border-rose-500/80 text-white focus-within:border-rose-500 focus-within:ring-1 focus-within:ring-rose-500/30";
    }
    return isLight
      ? "bg-[#F8FAFC] border-slate-300 focus-within:border-[#222222] focus-within:bg-white"
      : "bg-[#202020] border-[#3A3A3A] focus-within:border-white/50";
  };

  useEffect(() => {
    if (preventAutoRedirect) {
      return;
    }

    // หาก Middleware เพิ่ง Redirect มาที่หน้านี้เนื่องจากไม่มี Session Cookie (เช่น ?from=/workspace)
    // ให้เคลียร์ LocalStorage เก่าทิ้งเพื่อป้องกันปัญหา Redirect Loop
    const fromPath = searchParams.get("from");
    if (fromPath) {
      if (typeof window !== "undefined") {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(USER_ID_KEY);
      }
      return;
    }

    const verifySession = async () => {
      try {
        const hasCookie =
          typeof document !== "undefined" && document.cookie.includes("dawh_auth_token=");
        const hasLocalToken =
          typeof window !== "undefined" &&
          !!(localStorage.getItem(AUTH_TOKEN_KEY) && localStorage.getItem(USER_ID_KEY));

        if (hasCookie && hasLocalToken) {
          const targetUrl = searchParams.get("from") || "/workspace";
          if (onAuthSuccess) onAuthSuccess();
          else if (onNavigate) onNavigate(targetUrl);
          else window.location.href = targetUrl;
          return;
        }

        const { isAuthenticated } = await checkAuthSession();
        if (isAuthenticated && typeof document !== "undefined" && document.cookie.includes("dawh_auth_token=")) {
          const targetUrl = searchParams.get("from") || "/workspace";
          if (onAuthSuccess) onAuthSuccess();
          else if (onNavigate) onNavigate(targetUrl);
          else window.location.href = targetUrl;
          return;
        }
      } catch {
        // Continue
      }
    };

    verifySession();
  }, [router, onAuthSuccess, onNavigate, preventAutoRedirect, searchParams]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const newErrors: Record<string, boolean> = {};
    if (!email.trim()) newErrors.signinEmail = true;
    if (!password) newErrors.signinPassword = true;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    try {
      const data = await authService.signIn(email, password);

      if (data && data.session && data.user) {
        saveAuthSession(data.session);
        const profile = data.profile;

        saveRecentAccount({
          id: profile?.id || data.user.id,
          username: profile?.username || data.user.user_metadata?.username || (data.user.email?.split("@")[0] || email.split("@")[0] || "user"),
          email: data.user.email || profile?.email || email,
          first_name: profile?.first_name || data.user.user_metadata?.first_name || "",
          last_name: profile?.last_name || data.user.user_metadata?.last_name || "",
          first_name_th: profile?.first_name_th || data.user.user_metadata?.first_name_th || "",
          last_name_th: profile?.last_name_th || data.user.user_metadata?.last_name_th || "",
          role: profile?.role || data.user.user_metadata?.role || "Staff",
          department: profile?.department || data.user.user_metadata?.department || "",
          avatar_url: profile?.avatar_url || data.user.user_metadata?.avatar_url || "",
          has_pin: !!(profile?.pin_code || profile?.is_pin_enabled || data.user.user_metadata?.pin_code),
          last_login_at: new Date().toISOString(),
        });

        const displayName =
          profile?.first_name_th ||
          profile?.first_name ||
          data.user.user_metadata?.first_name_th ||
          data.user.user_metadata?.first_name ||
          data.user.email?.split("@")[0] ||
          "";

        notify.success(
          lang === "TH" ? "เข้าสู่ระบบสำเร็จ" : "Login Successful",
          {
            message:
              lang === "TH"
                ? `ยินดีต้อนรับคุณ ${displayName} เข้าสู่ระบบเรียบร้อยแล้ว`
                : `Welcome back, ${displayName}`,
            duration: 3500,
          }
        );

        const targetUrl = searchParams.get("from") || "/workspace";
        setTimeout(() => {
          if (onAuthSuccess) onAuthSuccess();
          else if (onNavigate) onNavigate(targetUrl);
          else window.location.href = targetUrl;
        }, 300);
      }
    } catch (error: unknown) {
      setErrors({ signinEmail: true, signinPassword: true });
      const msg = error instanceof Error ? error.message : "Invalid login credentials";
      setErrorMessage(
        msg === "Invalid login credentials"
          ? t.invalidCredentials
          : msg
      );
    } finally {
      setIsLoading(false);
    }
  };

  const executePinLogin = useCallback(
    async (username: string, pinToVerify: string) => {
      if (isLoading) return;
      setIsLoading(true);
      setIsPinAuthenticating(true);
      setErrorMessage(null);

      try {
        const res = await authService.loginWithPin(username.trim(), pinToVerify);
        if (res && res.success) {
          const user = res.user;
          if (user) {
            saveRecentAccount({
              id: user.id,
              username: user.username || username,
              email: user.email || undefined,
              first_name: user.first_name || undefined,
              last_name: user.last_name || undefined,
              first_name_th: user.first_name_th || undefined,
              last_name_th: user.last_name_th || undefined,
              role: user.role || undefined,
              department: user.department || undefined,
              avatar_url: user.avatar_url || undefined,
              has_pin: true,
              last_login_at: new Date().toISOString(),
            });
          } else if (selectedRecentUser) {
            saveRecentAccount(selectedRecentUser);
          }
          const userDisplayName =
            user?.first_name_th ||
            user?.first_name ||
            selectedRecentUser?.first_name_th ||
            selectedRecentUser?.first_name ||
            username;

          notify.success(
            lang === "TH" ? "เข้าสู่ระบบสำเร็จ" : "Login Successful",
            {
              message:
                lang === "TH"
                  ? `ยินดีต้อนรับคุณ ${userDisplayName} เข้าสู่ระบบเรียบร้อยแล้ว`
                  : `Welcome back, ${userDisplayName}`,
              duration: 3500,
            }
          );

          const targetUrl = searchParams.get("from") || "/workspace";
          setTimeout(() => {
            if (onAuthSuccess) onAuthSuccess();
            else if (onNavigate) onNavigate(targetUrl);
            else window.location.href = targetUrl;
          }, 350);
        }
      } catch (err: unknown) {
        setIsPinAuthenticating(false);
        const msg = err instanceof Error ? err.message : (lang === "TH" ? "รหัส PIN ไม่ถูกต้อง" : "Invalid PIN code");
        setErrorMessage(msg);
        try {
          notify.error(lang === "TH" ? "การเข้าสู่ระบบล้มเหลว" : "Authentication Failed", {
            message: msg,
            duration: 4500,
          });
        } catch {}
        setPinErrorShake(true);
        setPinDigits(["", "", "", "", "", ""]);
        setPinCode("");
        setLastTypedPinIndex(null);
        setTimeout(() => {
          setPinErrorShake(false);
        }, 600);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, lang, notify, onAuthSuccess, onNavigate, router, selectedRecentUser]
  );

  const handleKeypadDigitClick = useCallback(
    (digit: string) => {
      if (isLoading) return;
      const nextIdx = pinDigits.findIndex((d) => !d);
      if (nextIdx === -1) return;

      const newDigits = [...pinDigits];
      newDigits[nextIdx] = digit;
      setPinDigits(newDigits);
      const combined = newDigits.join("");
      setPinCode(combined);
      clearError("pinCode");
      triggerPinDigitMorph(nextIdx);

      // Auto-submit instantly when all 6 digits are typed
      if (nextIdx === 5 && selectedRecentUser) {
        setTimeout(() => {
          executePinLogin(selectedRecentUser.username, combined);
        }, 120);
      }
    },
    [isLoading, pinDigits, selectedRecentUser, executePinLogin]
  );

  const handleKeypadDelete = useCallback(() => {
    if (isLoading) return;
    let lastFilled = -1;
    for (let i = 5; i >= 0; i--) {
      if (pinDigits[i]) {
        lastFilled = i;
        break;
      }
    }
    if (lastFilled !== -1) {
      const newDigits = [...pinDigits];
      newDigits[lastFilled] = "";
      setPinDigits(newDigits);
      setPinCode(newDigits.join(""));
      setLastTypedPinIndex(null);
    }
  }, [isLoading, pinDigits]);

  const handleKeypadClear = useCallback(() => {
    if (isLoading) return;
    setPinDigits(["", "", "", "", "", ""]);
    setPinCode("");
    setLastTypedPinIndex(null);
  }, [isLoading]);

  // Hardware Keyboard Listener when in PIN Subview
  useEffect(() => {
    if (signInSubView !== "pin") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      let pressedNum: string | null = null;
      if (e.key >= "0" && e.key <= "9") {
        pressedNum = e.key;
      } else if (e.code && e.code.startsWith("Numpad") && e.code.length === 7) {
        const numChar = e.code.replace("Numpad", "");
        if (numChar >= "0" && numChar <= "9") {
          pressedNum = numChar;
        }
      }

      if (pressedNum !== null) {
        e.preventDefault();
        handleKeypadDigitClick(pressedNum);
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleKeypadDelete();
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (pinDigits.every((d) => d !== "") && selectedRecentUser) {
          executePinLogin(selectedRecentUser.username, pinDigits.join(""));
        }
      } else if (e.key === "Escape" || e.key === "c" || e.key === "C") {
        e.preventDefault();
        handleKeypadClear();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [signInSubView, pinDigits, selectedRecentUser, handleKeypadDigitClick, handleKeypadDelete, handleKeypadClear, executePinLogin]);

  const handlePreSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const newErrors: Record<string, boolean> = {};
    if (!firstName.trim()) newErrors.firstName = true;
    if (!lastName.trim()) newErrors.lastName = true;
    if (!username.trim()) newErrors.username = true;
    if (!email.trim()) newErrors.email = true;
    if (!phone.trim()) newErrors.phone = true;
    if (!password) newErrors.password = true;
    if (!confirmPassword) newErrors.confirmPassword = true;

    // Validate 18+ Age Requirement
    if (!birthDate) {
      newErrors.birthDate = true;
    } else {
      const dob = new Date(birthDate);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 18 || isNaN(age)) {
        newErrors.birthDate = true;
        setErrors({ ...newErrors, birthDate: true });
        setErrorMessage(
          lang === "TH"
            ? "ผู้สมัครต้องมีอายุอย่างน้อย 18 ปีบริบูรณ์ขึ้นไป"
            : "You must be at least 18 years old to register."
        );
        return;
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    const strength = getPasswordStrength(password, lang);
    if (strength.score < 4) {
      setErrors({ password: true });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: true });
      setErrorMessage(t.passwordMismatch);
      return;
    }

    // 🔍 ตรวจสอบความซ้ำซ้อนของ Username ในฐานข้อมูลแบบ Realtime
    setIsLoading(true);
    try {
      const userCheck = await authService.checkUsernameAvailable(username);
      if (!userCheck.available) {
        setErrors({ username: true });
        setErrorMessage(
          lang === "TH"
            ? (userCheck.message || "ชื่อผู้ใช้นี้ถูกใช้งานแล้วในระบบ กรุณาเลือกชื่ออื่น")
            : "This username is already in use. Please choose another."
        );
        setIsLoading(false);
        return;
      }
    } catch {
      // Non-blocking fallback
    } finally {
      setIsLoading(false);
    }

    setErrors({});
    setErrorMessage(null);
    setAgreedInModal(false);
    setShowTermsModal(true);
  };

  const handleConfirmSignUp = async () => {
    if (!agreedInModal || isRegistering) return;

    setIsRegistering(true);
    setShowTermsModal(false);
    setShowLoadingModal(true);
    setIsModalSuccess(false);

    setLoadingStepText(
      lang === "TH"
        ? "กำลังลงทะเบียนและจัดสรรสิทธิ์ในระบบองค์กร..."
        : "Securing credentials & allocating permissions..."
    );

    const startTime = Date.now();

    try {
      const cleanFirstName = firstName.trim();
      const cleanLastName = lastName.trim();
      const cleanFullName = `${cleanFirstName} ${cleanLastName}`.trim();
      const cleanUsername = username.trim().toLowerCase();
      const cleanBirthDate = birthDate ? birthDate : null;
      const cleanEmail = email.trim();
      const cleanPhone = phone.trim();

      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            username: cleanUsername,
            first_name: cleanFirstName,
            last_name: cleanLastName,
            full_name: cleanFullName,
            birth_date: cleanBirthDate,
            phone: cleanPhone,
            role: DEFAULT_NEW_USER_ROLE,
          },
        },
      });

      if (error) {
        // Wait full 2.0s duration so user sees the bar complete before showing error modal
        const elapsed = Date.now() - startTime;
        if (elapsed < 2000) {
          await new Promise((resolve) => setTimeout(resolve, 2000 - elapsed));
        }

        setShowLoadingModal(false);
        setIsRegistering(false);
        setIsModalSuccess(false);

        const isDuplicateUsername =
          error.message?.toLowerCase().includes("username") ||
          error.message?.toLowerCase().includes("employees_username_key");

        const isAlreadyRegistered =
          !isDuplicateUsername &&
          (error.message?.toLowerCase().includes("already registered") ||
            error.message?.toLowerCase().includes("user already exists") ||
            error.message?.toLowerCase().includes("email already in use"));

        const errorTitle = isDuplicateUsername
          ? lang === "TH"
            ? "ชื่อผู้ใช้ (Username) นี้มีผู้ใช้งานแล้ว"
            : "Username Already Taken"
          : isAlreadyRegistered
          ? lang === "TH"
            ? "อีเมลนี้ถูกลงทะเบียนไว้แล้ว"
            : "User Already Registered"
          : lang === "TH"
          ? "ไม่สามารถลงทะเบียนได้"
          : "Registration Failed";

        const errorDesc = isDuplicateUsername
          ? lang === "TH"
            ? `ชื่อผู้ใช้ "${cleanUsername}" ถูกใช้งานแล้ว กรุณากดกลับไปแก้ไขชื่อผู้ใช้ใหม่`
            : `The username "${cleanUsername}" is already taken. Please choose another username.`
          : isAlreadyRegistered
          ? lang === "TH"
            ? `อีเมล "${cleanEmail}" มีบัญชีพนักงานในระบบอยู่แล้ว กรุณาใช้อีเมลอื่น หรือกดเข้าสู่ระบบ`
            : `The email "${cleanEmail}" is already registered. Please use another corporate email or sign in.`
          : error.message;

        setErrorModal({
          isOpen: true,
          title: errorTitle,
          message: errorDesc,
        });
      } else {
        if (typeof window !== "undefined") {
          try {
            if (cleanBirthDate) localStorage.setItem("current_user_birth_date", cleanBirthDate);
            if (cleanPhone) localStorage.setItem("current_user_phone", cleanPhone);
          } catch {
            // non-blocking
          }
        }

        // 1. Ensure user has an active session immediately
        let activeSession = data.session;
        if (!activeSession) {
          try {
            const { data: signInData } = await supabase.auth.signInWithPassword({
              email: cleanEmail,
              password,
            });
            activeSession = signInData?.session || null;
          } catch {
            // Non-blocking fallback
          }
        }

        if (activeSession) {
          saveAuthSession(activeSession);
        }

        // 2. Ensure employee record exists in public.employees with staff_code
        if (data.user) {
          try {
            const targetId = data.user.id;
            const { data: existingEmp } = await supabase
              .from("employees")
              .select("id, staff_code")
              .eq("id", targetId)
              .maybeSingle();

            if (!existingEmp) {
              const randSuffix = Math.floor(Math.random() * 9000 + 1000);
              const generatedStaffCode = `EMP-${randSuffix}`;

              await supabase.from("employees").insert({
                id: targetId,
                username: cleanUsername,
                staff_code: generatedStaffCode,
                first_name: cleanFirstName,
                last_name: cleanLastName,
                birth_date: cleanBirthDate,
                email: cleanEmail,
                phone: cleanPhone,
                role: DEFAULT_NEW_USER_ROLE,
                department: "General Operations",
                employment_status: "Active",
                is_pin_enabled: false,
                is_active: true,
              });
            }
          } catch (err) {
            console.error("Employee profile creation error:", err);
          }
        }

        saveRecentAccount({
          id: data.user?.id,
          username: cleanUsername,
          email: cleanEmail,
          first_name: cleanFirstName,
          last_name: cleanLastName,
          full_name: cleanFullName,
          birth_date: cleanBirthDate || undefined,
          phone: cleanPhone || undefined,
          role: DEFAULT_NEW_USER_ROLE,
          has_pin: false,
          last_login_at: new Date().toISOString(),
        });

        // 1. Wait until the progress bar has filled COMPLETELY to 100% (2.0s duration) before proceeding
        const elapsed = Date.now() - startTime;
        if (elapsed < 2000) {
          await new Promise((resolve) => setTimeout(resolve, 2000 - elapsed));
        }

        // 2. Reveal success state only after bar is 100% full
        setIsModalSuccess(true);
        setIsRegistering(false);

        // 3. Smooth auto-redirect to workspace with loading screen after 1.2s of viewing the success screen
        setTimeout(() => {
          if (onAuthSuccess) {
            onAuthSuccess();
          } else if (onNavigate) {
            onNavigate("workspace");
          } else {
            window.location.href = "/workspace";
          }
        }, 1200);
      }
    } catch {
      const elapsed = Date.now() - startTime;
      if (elapsed < 2000) {
        await new Promise((resolve) => setTimeout(resolve, 2000 - elapsed));
      }
      setShowLoadingModal(false);
      setIsRegistering(false);
      setIsModalSuccess(false);
      setErrorModal({
        isOpen: true,
        title: lang === "TH" ? "เกิดข้อผิดพลาดในการเชื่อมต่อ" : "Connection Error",
        message: t.networkError,
      });
    }
  };

  const switchMode = (targetMode: AuthMode) => {
    setMode(targetMode);
    setErrors({});
    setErrorMessage(null);
    setIsSuccess(false);
    setShowTermsModal(false);
    if (typeof window !== "undefined") {
      const nextPath = targetMode === "signin" ? "/auth/login" : "/auth/register";
      window.history.replaceState({ __dawh_silent: true }, "", nextPath);
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="flex min-h-dvh w-full items-center justify-center bg-[#222222] text-white">
        <Loader2 size={32} className="animate-spin text-white" />
      </div>
    );
  }

  return (
    <div
      className={`relative min-h-dvh w-full flex flex-col justify-between ${
        isLight
          ? "bg-[#F8FAFC] text-slate-900 selection:bg-[#222222] selection:text-white"
          : "bg-[#222222] text-white selection:bg-white/25 selection:text-white"
      } transition-colors duration-300 overflow-hidden`}
    >
      {/* 1. TWO-TONE SPLIT BACKGROUND */}
      <div className="absolute inset-0 flex flex-col pointer-events-none z-0">
        <div
          className={`w-full h-[52%] relative overflow-hidden transition-colors duration-300 ${
            isLight ? "bg-[#EEF2F6]" : "bg-[#1A1A1A]"
          }`}
        >
          <div className="absolute inset-0 pointer-events-none select-none">
            <div className="absolute -top-4 -left-24 sm:-left-36 md:-left-48 h-1/2 aspect-[1580/528] relative">
              <div
                className="w-full h-full transition-colors duration-300"
                style={{
                  backgroundColor: isLight ? "#FFFFFF" : "#282828",
                  WebkitMaskImage: `url(${getDawhLogo(theme, "longNoSpace")})`,
                  maskImage: `url(${getDawhLogo(theme, "longNoSpace")})`,
                  WebkitMaskSize: "contain",
                  maskSize: "contain",
                  WebkitMaskRepeat: "no-repeat",
                  maskRepeat: "no-repeat",
                  WebkitMaskPosition: "center",
                  maskPosition: "center",
                  transform: "rotate(-180deg)",
                }}
              />
              <div
                className={`absolute top-[61.2%] h-[150vh] left-[76.2%] w-[7%] transition-colors duration-300 ${
                  isLight ? "bg-[#FFFFFF]" : "bg-[#282828]"
                }`}
              />
            </div>
          </div>
        </div>

        <div
          className={`w-full flex-1 relative overflow-hidden transition-colors duration-300 ${
            isLight ? "bg-[#FFFFFF]" : "bg-[#282828]"
          }`}
        >
          <div
            className="absolute bottom-0 right-0 h-full w-full pointer-events-none select-none transition-colors duration-300"
            style={{
              backgroundColor: isLight ? "#EEF2F6" : "#1A1A1A",
              WebkitMaskImage: `url(${getDawhLogo(theme, "longNoSpace")})`,
              maskImage: `url(${getDawhLogo(theme, "longNoSpace")})`,
              WebkitMaskSize: "contain",
              maskSize: "contain",
              WebkitMaskRepeat: "no-repeat",
              maskRepeat: "no-repeat",
              WebkitMaskPosition: "right bottom",
              maskPosition: "right bottom",
            }}
          />
        </div>
      </div>

      {/* TOP-LEFT BRAND HEADER */}
      <motion.header
        initial={{ opacity: 0, y: -18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full pt-8 px-8 sm:px-12 flex items-center justify-start shrink-0 pointer-events-auto select-none"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <motion.img
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          src={getDawhLogo(theme, "horizontal")}
          alt="DAWH Logo"
          className="h-[58px] sm:h-[68px] md:h-[76px] w-auto object-contain select-none cursor-pointer"
          draggable={false}
          onClick={() => switchMode("signin")}
        />
      </motion.header>

      {/* MAIN CENTERED AUTH CONTAINER */}
      <main className="relative z-10 flex-1 flex items-center justify-center w-full mx-auto px-4 sm:px-6 py-6">
        <motion.div
          layout
          initial={{ opacity: 0, y: 36, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            duration: 0.7,
            delay: 0.1,
            ease: [0.16, 1, 0.3, 1],
            layout: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
          }}
          className={`w-full rounded-[24px] border p-6 sm:p-8 shadow-lg transition-[max-width,background-color,border-color,box-shadow] duration-300 ease-out ${
            mode === "signup" ? "max-w-[680px]" : "max-w-[460px]"
          } ${
            isLight
              ? "bg-white border-slate-200 shadow-slate-300/30"
              : "bg-[#2E2E2E] border-[#3E3E3E] shadow-black/40"
          }`}
        >
          {/* Card Header */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="mb-5 flex flex-col gap-0.5"
          >
            <h2
              className={`text-[28px] sm:text-[32px] font-extrabold leading-[36px] tracking-tight ${
                isLight ? "text-[#222222]" : "text-white"
              }`}
              style={{ fontFamily: "var(--font-outfit), sans-serif" }}
            >
              {mode === "signin" ? t.signInTitle : t.signUpTitle}
            </h2>
            {mode === "signup" && (
              <p
                className={`text-[12.5px] font-normal leading-[16px] ${
                  isLight ? "text-[#383838]" : "text-[#999999]"
                }`}
                style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
              >
                {t.signUpSubtitle}
              </p>
            )}
          </motion.div>

          {/* Success Alert */}
          {isSuccess && mode === "signup" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-4 overflow-hidden rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 shadow-lg shadow-emerald-500/5 text-center"
            >
              <span className="font-medium text-[13px]">{t.successAlert}</span>
            </motion.div>
          )}

          {/* Error Alert */}
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3.5 py-2.5 text-xs text-red-400"
            >
              {errorMessage}
            </motion.div>
          )}

          {/* MODE SWITCHER WITH ANIMATE PRESENCE */}
          <AnimatePresence mode="wait" initial={false}>
            {mode === "signin" ? (
              <motion.div
                key="mode-signin"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.24, ease: "easeInOut" }}
              >
                {/* SUBVIEWS SWITCHER WITH ANIMATE PRESENCE */}
                <AnimatePresence mode="wait" initial={false}>
                  {/* SUB-VIEW 1: STANDARD CLEAN SIGN IN FORM (INSTANT & SNAPPY) */}
                  {signInSubView === "form" && (
                    <motion.div
                      key="subview-form"
                      initial={{ opacity: 0, x: -16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 16 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                    >
                      <form onSubmit={handleSignIn} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                          <label
                            htmlFor="signin-email"
                            className={`text-[12.5px] font-medium leading-[16px] ${
                              isLight ? "text-[#2C2C2C]" : "text-[#A1A1AA]"
                            }`}
                            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                          >
                            {t.usernameOrEmailLabel}
                          </label>
                          <div
                            className={`flex h-[44px] w-full items-center rounded-[12px] border px-4 transition-all duration-200 ${getFieldClass(
                              "signinEmail"
                            )}`}
                          >
                            <input
                              id="signin-email"
                              type="text"
                              value={email}
                              onChange={(e) => {
                                setEmail(e.target.value);
                                clearError("signinEmail");
                              }}
                              placeholder={t.usernameOrEmailPlaceholder}
                              className={`w-full bg-transparent text-[13.5px] leading-[18px] outline-none ${
                                isLight
                                  ? "text-[#222222] placeholder-[#888888]"
                                  : "text-white placeholder-[#666666]"
                              }`}
                              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label
                            htmlFor="signin-password"
                            className={`text-[12.5px] font-medium leading-[16px] ${
                              isLight ? "text-[#2C2C2C]" : "text-[#A1A1AA]"
                            }`}
                            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                          >
                            {t.passwordLabel}
                          </label>
                          <div
                            className={`flex h-[44px] w-full items-center justify-between rounded-[12px] border px-4 transition-all duration-200 ${getFieldClass(
                              "signinPassword"
                            )}`}
                          >
                            <input
                              id="signin-password"
                              type={showPassword ? "text" : "password"}
                              value={password}
                              onChange={(e) => {
                                setPassword(e.target.value);
                                clearError("signinPassword");
                              }}
                              placeholder={t.passwordPlaceholder}
                              className={`w-full bg-transparent text-[13.5px] leading-[18px] outline-none ${
                                isLight
                                  ? "text-[#222222] placeholder-[#888888]"
                                  : "text-white placeholder-[#666666]"
                              }`}
                              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                            />
                            <button
                              type="button"
                              onClick={() => setShowPassword(!showPassword)}
                              className={`flex items-center justify-center transition-colors ${
                                isLight
                                  ? "text-[#383838] hover:text-[#222222]"
                                  : "text-[#777777] hover:text-white"
                              }`}
                            >
                              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>

                          <div className="flex justify-end pt-0.5">
                            <a
                              href="#forgot"
                              className={`text-[12px] font-normal underline transition-colors ${
                                isLight
                                  ? "text-[#383838] hover:text-[#222222]"
                                  : "text-[#999999] hover:text-white"
                              }`}
                              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                            >
                              {t.forgotPassword}
                            </a>
                          </div>
                        </div>

                        <div className="pt-1">
                          <motion.button
                            whileHover={{ scale: 1.015, y: -1 }}
                            whileTap={{ scale: 0.985 }}
                            type="submit"
                            disabled={isLoading}
                            className={`flex h-[46px] w-full items-center justify-center gap-2 rounded-[14px] text-[14.5px] font-semibold leading-[20px] border transition-all duration-200 disabled:opacity-50 shadow-sm cursor-pointer ${
                              isLight
                                ? "bg-[#222222] border-[#222222] text-white hover:bg-white hover:text-[#222222] hover:border-slate-300"
                                : "bg-[#282828] border-[#444444] text-white hover:bg-white hover:text-slate-950 hover:border-white"
                            }`}
                            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                          >
                            {isLoading ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <>
                                <span>{t.signInBtn}</span>
                                <ArrowRight size={16} />
                              </>
                            )}
                          </motion.button>
                        </div>

                        <div className="flex items-center justify-center pt-2 text-[13px]">
                          <span className={isLight ? "text-[#383838]" : "text-[#A1A1AA]"}>
                            {t.noAccount}{" "}
                          </span>
                          <button
                            type="button"
                            onClick={() => switchMode("signup")}
                            className={`font-bold underline ml-1.5 transition-colors cursor-pointer ${
                              isLight
                                ? "text-[#222222] hover:text-[#000000]"
                                : "text-white hover:text-white/80"
                            }`}
                          >
                            {t.signUpLink}
                          </button>
                        </div>

                        {/* 🔘 BOTTOM CORNER QUICK SWITCH: RECENT USERS BUTTON */}
                        <div className="pt-3 mt-1 border-t border-dashed border-slate-200 dark:border-[#383838] flex items-center justify-between">
                          <span className={`text-[12px] ${isLight ? "text-slate-500" : "text-[#888888]"}`}>
                            {lang === "TH" ? "ผู้ใช้เครื่องนี้?" : "Recent accounts"}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSignInSubView("recent");
                              setErrorMessage(null);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-semibold transition-all cursor-pointer group shadow-sm ${
                              isLight
                                ? "bg-slate-50 hover:bg-white border-slate-300 text-slate-800 hover:border-slate-400"
                                : "bg-[#242424] hover:bg-[#303030] border-[#444444] text-white hover:border-white/50"
                            }`}
                          >
                            <Users size={14} className={isLight ? "text-slate-800" : "text-white"} />
                            <span>{lang === "TH" ? "เข้าใช้งานล่าสุด (PIN)" : "Recent Users"}</span>
                            <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                          </button>
                        </div>
                      </form>
                    </motion.div>
                  )}

                  {/* SUB-VIEW 2: RECENT USERS LIST (ANIMATED SLIDE TRANSITION) */}
                  {signInSubView === "recent" && (
                    <motion.div
                      key="subview-recent"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="flex flex-col gap-4"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className={`text-[16.5px] font-bold ${isLight ? "text-slate-900" : "text-white"}`}>
                            {lang === "TH" ? "เข้าใช้งานล่าสุด" : "Recent Accounts"}
                          </h3>
                          <p className={`text-[12px] ${isLight ? "text-slate-500" : "text-[#999999]"}`}>
                            {lang === "TH" ? "แสดง 5 บัญชีล่าสุดที่ใช้งานในเครื่องนี้" : "Showing 5 most recent accounts"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {recentAccounts.length > 0 && (
                            <button
                              type="button"
                              onClick={clearAllRecentAccounts}
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-lg border transition-colors cursor-pointer ${
                                isLight
                                  ? "border-slate-200 text-slate-500 hover:text-red-600 hover:bg-red-50"
                                  : "border-[#444444] text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
                              }`}
                              title={lang === "TH" ? "ล้างประวัติทั้งหมดในเครื่องนี้" : "Clear all recent accounts"}
                            >
                              {lang === "TH" ? "ล้างประวัติ" : "Clear all"}
                            </button>
                          )}
                          <span
                            className={`px-2.5 py-0.5 rounded-lg text-[11px] font-bold border ${
                              isLight
                                ? "bg-slate-100 border-slate-200 text-slate-800"
                                : "bg-[#333333] border-[#484848] text-white"
                            }`}
                          >
                            {recentAccounts.length} บัญชี
                          </span>
                        </div>
                      </div>

                      {/* Search Bar (Auto-appears when 4+ accounts) */}
                      {recentAccounts.length >= 4 && (
                        <div
                          className={`flex h-9.5 w-full items-center gap-2 rounded-xl border px-3 transition-all ${
                            isLight ? "bg-slate-50 border-slate-200 focus-within:bg-white" : "bg-[#222222] border-[#383838]"
                          }`}
                        >
                          <Search size={14} className="text-slate-400 shrink-0" />
                          <input
                            type="text"
                            value={recentSearch}
                            onChange={(e) => setRecentSearch(e.target.value)}
                            placeholder={lang === "TH" ? "ค้นหาชื่อ นามสกุล หรือ @username..." : "Search name, @username, or dept..."}
                            className={`w-full bg-transparent text-[12.5px] outline-none ${
                              isLight ? "text-slate-800" : "text-white"
                            }`}
                          />
                          {recentSearch && (
                            <button
                              type="button"
                              onClick={() => setRecentSearch("")}
                              className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
                            >
                              <X size={13} />
                            </button>
                          )}
                        </div>
                      )}

                      {/* Recent Accounts Scrollable List or Empty State */}
                      {recentAccounts.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center rounded-2xl border border-dashed border-inherit">
                          <p
                            className={`text-[13.5px] font-bold mb-1 ${
                              isLight ? "text-slate-800" : "text-white"
                            }`}
                            style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                          >
                            {lang === "TH" ? "ยังไม่มีประวัติการเข้าใช้งาน" : "No Recent Accounts"}
                          </p>
                          <p
                            className={`text-[12px] leading-[17px] max-w-[260px] mb-4 ${
                              isLight ? "text-slate-500" : "text-[#999999]"
                            }`}
                            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                          >
                            {lang === "TH"
                              ? "เข้าสู่ระบบด้วยอีเมลและรหัสผ่านเพื่อบันทึกบัญชีลงในเครื่องนี้"
                              : "Sign in with your email and password to remember your account on this device."}
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSignInSubView("form");
                              setErrorMessage(null);
                            }}
                            className={`px-4 py-2 rounded-xl text-[12.5px] font-bold border transition-all cursor-pointer shadow-sm ${
                              isLight
                                ? "bg-slate-900 border-slate-900 text-white hover:bg-black"
                                : "bg-white border-white text-slate-950 hover:bg-white/90"
                            }`}
                          >
                            {lang === "TH" ? "เข้าสู่ระบบด้วยอีเมล / รหัสผ่าน" : "Sign in with Credentials"}
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-2.5 max-h-[320px] overflow-y-auto px-1.5 py-1 -mx-1.5">
                          {recentAccounts
                            .filter((acc) => {
                              if (!recentSearch.trim()) return true;
                              const query = recentSearch.toLowerCase();
                              const fullName = `${acc.first_name || ""} ${acc.last_name || ""} ${acc.full_name || ""}`.toLowerCase();
                              const dept = (acc.department || "").toLowerCase();
                              return fullName.includes(query) || acc.username.toLowerCase().includes(query) || dept.includes(query);
                            })
                            .map((acc, idx) => {
                              const fullName =
                                acc.first_name && acc.last_name
                                ? `${acc.first_name} ${acc.last_name}`
                                : acc.full_name || acc.username;

                              return (
                                <motion.div
                                  key={acc.id || acc.username}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ duration: 0.2, delay: idx * 0.035 }}
                                  whileHover={{ y: -1 }}
                                  whileTap={{ scale: 0.99 }}
                                  onClick={() => {
                                    setSelectedRecentUser(acc);
                                    setSignInSubView("pin");
                                    setPinDigits(["", "", "", "", "", ""]);
                                    setPinCode("");
                                    setErrorMessage(null);
                                    setTimeout(() => pinInputRefs.current[0]?.focus(), 150);
                                  }}
                                  className={`p-3 sm:p-3.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer group relative ${
                                    isLight
                                      ? "bg-slate-50 hover:bg-white hover:border-slate-400 hover:shadow-md border-slate-200 shadow-sm"
                                      : "bg-[#222222] hover:bg-[#282828] hover:border-white/50 hover:shadow-md border-[#383838]"
                                  }`}
                                >
                                  <div className="flex items-center gap-3 min-w-0 pr-2">
                                    {/* Avatar Initials */}
                                    <div
                                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl font-bold text-[14px] shadow-sm ${
                                        isLight
                                          ? "bg-slate-900 text-white"
                                          : "bg-white text-slate-950 font-extrabold"
                                      }`}
                                    >
                                      {(acc.first_name || acc.username).charAt(0)}
                                    </div>

                                    <div className="text-left min-w-0">
                                      {/* 1. Full Name (ชื่อ - นามสกุล) */}
                                      <div className={`text-[13.5px] font-bold leading-tight truncate ${isLight ? "text-slate-800" : "text-white"}`}>
                                        {fullName}
                                      </div>

                                      {/* 2. @username & Department (แผนก) */}
                                      <div className="flex items-center gap-1.5 text-[11.5px] text-slate-500 dark:text-[#999999] mt-0.5 truncate">
                                        <span className={`font-semibold ${isLight ? "text-slate-700" : "text-slate-300"}`}>
                                          @{acc.username}
                                        </span>
                                        <span>•</span>
                                        <span className="truncate text-slate-500 dark:text-slate-400">
                                          {acc.department || "—"}
                                        </span>
                                      </div>

                                      {/* 3. Real Last Login Time (เวลาเข้าใช้งานล่าสุดจริง) */}
                                      <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-[#888888] mt-0.5">
                                        <Clock size={11.5} className="text-slate-400 shrink-0" />
                                        <span>
                                          {lang === "TH" ? "เข้าใช้งานล่าสุด:" : "Active:"}{" "}
                                          <strong className="font-medium text-slate-600 dark:text-slate-300">
                                            {formatRelativeTime(acc.last_login_at || acc.last_active, lang)}
                                          </strong>
                                        </span>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Forget / Remove from device button (กากบาท) */}
                                  <button
                                    type="button"
                                    title={lang === "TH" ? "ลบออกจากเครื่องนี้" : "Remove from device"}
                                    onClick={(e) => removeRecentAccount(e, acc.username)}
                                    className={`p-2 rounded-lg transition-all shrink-0 cursor-pointer ${
                                      isLight
                                        ? "text-slate-400 hover:text-red-500 hover:bg-red-50"
                                        : "text-[#888888] hover:text-red-400 hover:bg-red-500/10"
                                    }`}
                                  >
                                    <X size={16} />
                                  </button>
                                </motion.div>
                              );
                            })}
                        </div>
                      )}

                      {/* Back to Password Login */}
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setSignInSubView("form");
                            setErrorMessage(null);
                          }}
                          className={`w-full flex items-center justify-center gap-2 h-10.5 rounded-xl border text-[12.5px] font-semibold transition-all cursor-pointer ${
                            isLight
                              ? "bg-slate-100 hover:bg-slate-200 border-slate-300 text-slate-700"
                              : "bg-[#222222] hover:bg-[#2B2B2B] border-[#444444] text-white"
                          }`}
                        >
                          <ArrowLeft size={14} />
                          <span>{lang === "TH" ? "เข้าสู่ระบบด้วยชื่อผู้ใช้ / รหัสผ่าน" : "Standard Password Login"}</span>
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* SUB-VIEW 3: QUICK PIN KEYPAD (CAPSULE PILL BAR + MORPHING DIGITS + BORDERLESS KEYPAD) */}
                  {signInSubView === "pin" && selectedRecentUser && (
                    <motion.div
                      key="subview-pin"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.22, ease: "easeInOut" }}
                      className="flex flex-col items-center gap-4 text-center"
                    >
                      {/* Selected User Info Banner */}
                      <div
                        className={`w-full p-2.5 rounded-2xl border flex items-center justify-between transition-all ${
                          isLight ? "bg-slate-50 border-slate-200" : "bg-[#222222] border-[#383838]"
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0 pr-2">
                          <div
                            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold text-[14px] shadow-sm ${
                              isLight ? "bg-slate-900 text-white" : "bg-white text-slate-950 font-extrabold"
                            }`}
                          >
                            {(selectedRecentUser.first_name || selectedRecentUser.username).charAt(0)}
                          </div>
                          <div className="text-left min-w-0">
                            <div className={`text-[13px] font-bold truncate ${isLight ? "text-slate-800" : "text-white"}`}>
                              {selectedRecentUser.first_name && selectedRecentUser.last_name
                                ? `${selectedRecentUser.first_name} ${selectedRecentUser.last_name}`
                                : selectedRecentUser.username}
                            </div>
                            <div className={`text-[11px] font-medium truncate ${isLight ? "text-slate-500" : "text-[#A1A1AA]"}`}>
                              @{selectedRecentUser.username}{selectedRecentUser.department ? ` • ${selectedRecentUser.department}` : ""}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSignInSubView("recent");
                            setPinDigits(["", "", "", "", "", ""]);
                            setPinCode("");
                            setLastTypedPinIndex(null);
                            setErrorMessage(null);
                          }}
                          className={`text-[11.5px] font-semibold underline px-2 py-1 shrink-0 transition-colors cursor-pointer ${
                            isLight ? "text-slate-500 hover:text-slate-800" : "text-[#999999] hover:text-white"
                          }`}
                        >
                          {lang === "TH" ? "เปลี่ยนผู้ใช้" : "Change"}
                        </button>
                      </div>

                      {/* Header */}
                      <div>
                        <h3 className={`text-[17px] font-bold ${isLight ? "text-[#222222]" : "text-white"}`}>
                          {lang === "TH" ? "กรอกรหัส PIN เพื่อเข้าสู่ระบบ" : "Enter Security PIN"}
                        </h3>
                        <p className={`text-[11.5px] mt-0.5 ${isLight ? "text-slate-500" : "text-[#999999]"}`}>
                          {lang === "TH"
                            ? "พิมพ์ผ่านแป้นพิมพ์ หรือ กดตัวเลขด้านล่าง"
                            : "Type with keyboard or tap numbers below"}
                        </p>
                      </div>

                      {/* DYNAMIC CAPSULE PILL BAR (Morphs into Full-Width Button on 6 digits with Slide Animation) */}
                      <div className={`w-full flex flex-col items-center ${pinErrorShake ? "animate-shake" : ""}`}>
                        <div className="w-full max-w-[270px] h-[44px] sm:h-[46px] relative overflow-hidden rounded-full">
                          <AnimatePresence mode="wait" initial={false}>
                            {!pinDigits.every((d) => d !== "") ? (
                              /* State 1: PIN Input Dots */
                              <motion.div
                                key="pin-dots-bar"
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                transition={{ duration: 0.2, ease: "easeOut" }}
                                className={`w-full h-full rounded-full border px-4 flex items-center justify-center transition-all ${
                                  isLight ? "bg-white border-zinc-300" : "bg-[#1E1E1E] border-zinc-700"
                                }`}
                              >
                                <div className="flex items-center justify-center gap-3 select-none">
                                  {pinDigits.map((digit, i) => {
                                    const isFilled = digit !== "";
                                    const isCurrentlyTyping = lastTypedPinIndex === i;

                                    return (
                                      <div
                                        key={`pin-login-dot-${i}`}
                                        className="flex items-center justify-center w-3 h-5 relative"
                                      >
                                        <AnimatePresence mode="wait">
                                          {isFilled ? (
                                            isCurrentlyTyping ? (
                                              <motion.span
                                                key={`pin-num-${i}-${digit}`}
                                                initial={{ scale: 0.7, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.5, opacity: 0 }}
                                                transition={{ duration: 0.14 }}
                                                className={`text-sm sm:text-base font-bold font-mono ${
                                                  isLight ? "text-black" : "text-white"
                                                }`}
                                              >
                                                {digit}
                                              </motion.span>
                                            ) : (
                                              <motion.span
                                                key={`pin-dot-${i}`}
                                                initial={{ scale: 0.4, opacity: 0 }}
                                                animate={{ scale: 1, opacity: 1 }}
                                                exit={{ scale: 0.4, opacity: 0 }}
                                                transition={{ duration: 0.14 }}
                                                className={`w-2 h-2 rounded-full ${
                                                  isLight ? "bg-black" : "bg-white"
                                                }`}
                                              />
                                            )
                                          ) : (
                                            <motion.span
                                              key={`pin-empty-${i}`}
                                              initial={{ opacity: 0 }}
                                              animate={{ opacity: 1 }}
                                              className={`w-2 h-2 rounded-full ${
                                                isLight ? "bg-zinc-300" : "bg-zinc-700"
                                              }`}
                                            />
                                          )}
                                        </AnimatePresence>
                                      </div>
                                    );
                                  })}
                                </div>
                              </motion.div>
                            ) : (
                              /* State 2: Non-clickable Authenticating Status Pill Bar */
                              <motion.div
                                key="pin-authenticating-status"
                                initial={{ x: "-100%", opacity: 0 }}
                                animate={{ x: "0%", opacity: 1 }}
                                exit={{ x: "100%", opacity: 0 }}
                                transition={{ type: "spring", stiffness: 440, damping: 28 }}
                                className={`w-full h-full rounded-full font-bold text-xs sm:text-[13px] flex items-center justify-center gap-2 select-none pointer-events-none cursor-default shadow-sm transition-colors ${
                                  isLight
                                    ? "bg-black text-white"
                                    : "bg-white text-black"
                                }`}
                              >
                                <Loader2 size={15} className="animate-spin" />
                                <span>{lang === "TH" ? "กำลังเข้าสู่ระบบ..." : "Signing in..."}</span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* BORDERLESS NUMBER KEYPAD (No Borders, No ABC text, Scaled Proportionally) */}
                      <div className="grid grid-cols-3 gap-1.5 max-w-[210px] mx-auto w-full pt-0.5">
                        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
                          <motion.button
                            whileHover={{ scale: 1.08 }}
                            whileTap={{ scale: 0.92 }}
                            key={num}
                            type="button"
                            onClick={() => handleKeypadDigitClick(num)}
                            disabled={isLoading}
                            className={`h-10 rounded-full border-0 text-lg font-bold flex items-center justify-center cursor-pointer select-none transition-colors ${
                              isLight
                                ? "text-black hover:bg-zinc-200/70 active:bg-zinc-300/80"
                                : "text-white hover:bg-white/10 active:bg-white/20"
                            }`}
                          >
                            {num}
                          </motion.button>
                        ))}

                        {/* Clear Button */}
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          type="button"
                          onClick={handleKeypadClear}
                          disabled={isLoading}
                          className={`h-10 rounded-full border-0 text-xs font-bold flex items-center justify-center cursor-pointer select-none transition-colors ${
                            isLight
                              ? "text-zinc-400 hover:text-black hover:bg-zinc-200/70"
                              : "text-zinc-500 hover:text-white hover:bg-white/10"
                          }`}
                        >
                          C
                        </motion.button>

                        {/* 0 Button */}
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          type="button"
                          onClick={() => handleKeypadDigitClick("0")}
                          disabled={isLoading}
                          className={`h-10 rounded-full border-0 text-lg font-bold flex items-center justify-center cursor-pointer select-none transition-colors ${
                            isLight
                              ? "text-black hover:bg-zinc-200/70 active:bg-zinc-300/80"
                              : "text-white hover:bg-white/10 active:bg-white/20"
                          }`}
                        >
                          0
                        </motion.button>

                        {/* Backspace Button */}
                        <motion.button
                          whileHover={{ scale: 1.08 }}
                          whileTap={{ scale: 0.92 }}
                          type="button"
                          onClick={handleKeypadDelete}
                          disabled={isLoading}
                          className={`h-10 rounded-full border-0 text-xs font-bold flex items-center justify-center cursor-pointer select-none transition-colors ${
                            isLight
                              ? "text-zinc-400 hover:text-black hover:bg-zinc-200/70"
                              : "text-zinc-500 hover:text-white hover:bg-white/10"
                          }`}
                          title="Delete"
                        >
                          <Delete size={16} strokeWidth={2.2} />
                        </motion.button>
                      </div>

                      {/* Back to Password Login Link */}
                      <div className="flex items-center justify-center pt-0.5 text-[12px]">
                        <button
                          type="button"
                          onClick={() => {
                            setSignInSubView("form");
                            setPinDigits(["", "", "", "", "", ""]);
                            setPinCode("");
                            setLastTypedPinIndex(null);
                            setErrorMessage(null);
                          }}
                          className={`underline transition-colors cursor-pointer ${
                            isLight ? "text-slate-600 hover:text-slate-950" : "text-[#999999] hover:text-white"
                          }`}
                        >
                          {lang === "TH" ? "เข้าสู่ระบบด้วยรหัสผ่านหลักแทน" : "Sign in with password instead"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
          ) : (
            /* MODE 2: REGISTER / SIGN UP FLOW WITH MULTI-STEP PIN CREATION */
            <motion.div
              key="mode-signup"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.24, ease: "easeInOut" }}
            >
              <motion.form
                key="signup-form"
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                onSubmit={handlePreSignUp}
                className="flex flex-col gap-3.5"
              >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="signup-firstName"
                          className={`text-[12px] font-medium leading-[16px] ${
                            errors.firstName
                              ? "text-red-400 font-semibold"
                              : isLight
                              ? "text-[#2C2C2C]"
                              : "text-[#A1A1AA]"
                          }`}
                          style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                        >
                          {t.fullNameLabel}
                        </label>
                        <div
                          className={`flex h-[40px] w-full items-center gap-2 rounded-[10px] border px-3 transition-all duration-200 ${getFieldClass(
                            "firstName"
                          )}`}
                        >
                          <User
                            size={14}
                            className={
                              errors.firstName
                                ? "text-red-400"
                                : isLight
                                ? "text-[#383838]"
                                : "text-[#666666]"
                            }
                          />
                          <input
                            id="signup-firstName"
                            type="text"
                            value={firstName}
                            onChange={(e) => {
                              setFirstName(e.target.value);
                              clearError("firstName");
                            }}
                            placeholder={t.fullNamePlaceholder}
                            className={`w-full bg-transparent text-[13px] leading-[17px] outline-none ${
                              isLight
                                ? "text-[#222222] placeholder-[#888888]"
                                : "text-white placeholder-[#666666]"
                            }`}
                            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="signup-lastName"
                          className={`text-[12px] font-medium leading-[16px] ${
                            errors.lastName
                              ? "text-red-400 font-semibold"
                              : isLight
                              ? "text-[#2C2C2C]"
                              : "text-[#A1A1AA]"
                          }`}
                          style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                        >
                          {t.lastNameLabel}
                        </label>
                        <div
                          className={`flex h-[40px] w-full items-center gap-2 rounded-[10px] border px-3 transition-all duration-200 ${getFieldClass(
                            "lastName"
                          )}`}
                        >
                          <User
                            size={14}
                            className={
                              errors.lastName
                                ? "text-red-400"
                                : isLight
                                ? "text-[#383838]"
                                : "text-[#666666]"
                            }
                          />
                          <input
                            id="signup-lastName"
                            type="text"
                            value={lastName}
                            onChange={(e) => {
                              setLastName(e.target.value);
                              clearError("lastName");
                            }}
                            placeholder={t.lastNamePlaceholder}
                            className={`w-full bg-transparent text-[13px] leading-[17px] outline-none ${
                              isLight
                                ? "text-[#222222] placeholder-[#888888]"
                                : "text-white placeholder-[#666666]"
                            }`}
                            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                          />
                        </div>
                      </div>

                      {/* Username Input */}
                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="signup-username"
                          className={`text-[12px] font-medium leading-[16px] ${
                            errors.username
                              ? "text-red-400 font-semibold"
                              : isLight
                              ? "text-[#2C2C2C]"
                              : "text-[#A1A1AA]"
                          }`}
                          style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                        >
                          {t.usernameLabel}
                        </label>
                        <div
                          className={`flex h-[40px] w-full items-center gap-2 rounded-[10px] border px-3 transition-all duration-200 ${getFieldClass(
                            "username"
                          )}`}
                        >
                          <User
                            size={14}
                            className={
                              errors.username
                                ? "text-red-400"
                                : isLight
                                ? "text-[#383838]"
                                : "text-[#666666]"
                            }
                          />
                          <input
                            id="signup-username"
                            type="text"
                            value={username}
                            onChange={(e) => {
                              setUsername(e.target.value.replace(/\s+/g, ""));
                              clearError("username");
                            }}
                            placeholder={t.usernamePlaceholder}
                            className={`w-full bg-transparent text-[13px] leading-[17px] outline-none ${
                              isLight
                                ? "text-[#222222] placeholder-[#888888]"
                                : "text-white placeholder-[#666666]"
                            }`}
                            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                          />
                        </div>
                      </div>

                      {/* Birth Date Input */}
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="signup-birthDate"
                            className={`text-[12px] font-medium leading-[16px] ${
                              errors.birthDate
                                ? "text-red-400 font-semibold"
                                : isLight
                                ? "text-[#2C2C2C]"
                                : "text-[#A1A1AA]"
                            }`}
                            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                          >
                            {t.birthDateLabel}
                          </label>
                          <span
                            className={`text-[10px] font-semibold tracking-tight ${
                              errors.birthDate
                                ? "text-red-400"
                                : isLight
                                ? "text-slate-500"
                                : "text-[#888888]"
                            }`}
                          >
                            {lang === "TH" ? "(ขั้นต่ำ 18 ปีบริบูรณ์)" : "(18+ Required)"}
                          </span>
                        </div>
                        <div
                          className={`flex h-[40px] w-full items-center gap-2 rounded-[10px] border px-3 transition-all duration-200 ${getFieldClass(
                            "birthDate"
                          )}`}
                        >
                          <input
                            id="signup-birthDate"
                            type="date"
                            value={birthDate}
                            onChange={(e) => {
                              setBirthDate(e.target.value);
                              clearError("birthDate");
                            }}
                            className={`w-full bg-transparent text-[13px] leading-[17px] outline-none ${
                              isLight
                                ? "text-[#222222] placeholder-[#888888]"
                                : "text-white placeholder-[#666666]"
                            }`}
                            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="signup-email"
                          className={`text-[12px] font-medium leading-[16px] ${
                            errors.email
                              ? "text-red-400 font-semibold"
                              : isLight
                              ? "text-[#2C2C2C]"
                              : "text-[#A1A1AA]"
                          }`}
                          style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                        >
                          {t.corporateEmailLabel}
                        </label>
                        <div
                          className={`flex h-[40px] w-full items-center gap-2 rounded-[10px] border px-3 transition-all duration-200 ${getFieldClass(
                            "email"
                          )}`}
                        >
                          <Mail
                            size={14}
                            className={
                              errors.email
                                ? "text-red-400"
                                : isLight
                                ? "text-[#383838]"
                                : "text-[#666666]"
                            }
                          />
                          <input
                            id="signup-email"
                            type="email"
                            value={email}
                            onChange={(e) => {
                              setEmail(e.target.value);
                              clearError("email");
                            }}
                            placeholder={t.corporateEmailPlaceholder}
                            className={`w-full bg-transparent text-[13px] leading-[17px] outline-none ${
                              isLight
                                ? "text-[#222222] placeholder-[#888888]"
                                : "text-white placeholder-[#666666]"
                            }`}
                            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label
                          htmlFor="signup-phone"
                          className={`text-[12px] font-medium leading-[16px] ${
                            errors.phone
                              ? "text-red-400 font-semibold"
                              : isLight
                              ? "text-[#2C2C2C]"
                              : "text-[#A1A1AA]"
                          }`}
                          style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                        >
                          {t.phoneLabel}
                        </label>
                        <div
                          className={`flex h-[40px] w-full items-center gap-2 rounded-[10px] border px-3 transition-all duration-200 ${getFieldClass(
                            "phone"
                          )}`}
                        >
                          <Phone
                            size={14}
                            className={
                              errors.phone
                                ? "text-red-400"
                                : isLight
                                ? "text-[#383838]"
                                : "text-[#666666]"
                            }
                          />
                          <input
                            id="signup-phone"
                            type="tel"
                            value={phone}
                            onChange={(e) => {
                              setPhone(e.target.value);
                              clearError("phone");
                            }}
                            placeholder={t.phonePlaceholder}
                            className={`w-full bg-transparent text-[13px] leading-[17px] outline-none ${
                              isLight
                                ? "text-[#222222] placeholder-[#888888]"
                                : "text-white placeholder-[#666666]"
                            }`}
                            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                          />
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="signup-password"
                            className={`text-[12px] font-medium leading-[16px] ${
                              errors.password
                                ? "text-red-400 font-semibold"
                                : isLight
                                ? "text-[#2C2C2C]"
                                : "text-[#A1A1AA]"
                            }`}
                            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                          >
                            {t.passwordLabel}
                          </label>
                          {password && (
                            <span
                              className={`text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${passwordStrength.textClass}`}
                            >
                              {passwordStrength.label}
                            </span>
                          )}
                        </div>
                        <div
                          className={`flex h-[40px] w-full items-center justify-between rounded-[10px] border px-3 transition-all duration-200 ${getFieldClass(
                            "password"
                          )}`}
                        >
                          <input
                            id="signup-password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              clearError("password");
                            }}
                            placeholder={t.passwordPlaceholder}
                            className={`w-full bg-transparent text-[13px] leading-[17px] outline-none ${
                              isLight
                                ? "text-[#222222] placeholder-[#888888]"
                                : "text-white placeholder-[#666666]"
                            }`}
                            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={`flex items-center justify-center transition-colors ${
                              isLight ? "text-[#383838] hover:text-[#222222]" : "text-[#777777] hover:text-white"
                            }`}
                          >
                            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>

                        <div className="flex gap-1 pt-0.5 h-[3px]">
                          {[1, 2, 3, 4].map((level) => (
                            <div
                              key={level}
                              className={`h-full flex-1 rounded-full transition-all duration-300 ${
                                password && passwordStrength.score >= level
                                  ? passwordStrength.color
                                  : isLight
                                  ? "bg-slate-200"
                                  : "bg-[#333333]"
                              }`}
                            />
                          ))}
                        </div>

                        <p
                          className={`text-[10px] leading-[13px] pt-1 select-none ${
                            errors.password
                              ? "text-red-400 font-medium"
                              : isLight
                              ? "text-[#383838]"
                              : "text-[#999999]"
                          }`}
                          style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                        >
                          {t.passwordConditions}
                        </p>
                      </div>

                      <div className="flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <label
                            htmlFor="signup-confirmPassword"
                            className={`text-[12px] font-medium leading-[16px] ${
                              errors.confirmPassword
                                ? "text-red-400 font-semibold"
                                : isLight
                                ? "text-[#2C2C2C]"
                                : "text-[#A1A1AA]"
                            }`}
                            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                          >
                            {t.confirmPasswordLabel}
                          </label>
                          {confirmPassword && password && (
                            <span
                              className={`text-[10px] font-bold tracking-wider uppercase transition-all duration-300 ${
                                password === confirmPassword
                                  ? "text-[#2EC4B6] font-bold"
                                  : isLight
                                  ? "text-[#E74C3C] font-bold"
                                  : "text-[#E71D36] font-semibold"
                              }`}
                            >
                              {password === confirmPassword ? t.match : t.mismatch}
                            </span>
                          )}
                        </div>
                        <div
                          className={`flex h-[40px] w-full items-center justify-between rounded-[10px] border px-3 transition-all duration-200 ${getFieldClass(
                            "confirmPassword"
                          )}`}
                        >
                          <input
                            id="signup-confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            value={confirmPassword}
                            onChange={(e) => {
                              setConfirmPassword(e.target.value);
                              clearError("confirmPassword");
                            }}
                            placeholder={t.confirmPasswordPlaceholder}
                            className={`w-full bg-transparent text-[13px] leading-[17px] outline-none ${
                              isLight
                                ? "text-[#222222] placeholder-[#888888]"
                                : "text-white placeholder-[#666666]"
                            }`}
                            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                          />
                          <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className={`flex items-center justify-center transition-colors ${
                              isLight ? "text-[#383838] hover:text-[#222222]" : "text-[#777777] hover:text-white"
                            }`}
                          >
                            {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                          </button>
                        </div>

                        <div className="h-[3px] pt-0.5" />
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoading || isSuccess}
                        className={`flex h-[46px] w-full items-center justify-center gap-2 rounded-[14px] text-[14.5px] font-semibold leading-[20px] border transition-all duration-200 active:scale-98 disabled:opacity-50 shadow-sm cursor-pointer ${
                          isLight
                            ? "bg-[#222222] border-[#222222] text-white hover:bg-white hover:text-[#222222] hover:border-slate-300"
                            : "bg-[#282828] border-[#444444] text-white hover:bg-white hover:text-slate-950 hover:border-white"
                        }`}
                        style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                      >
                        <span>{t.createAccountBtn}</span>
                        <ArrowRight size={16} />
                      </button>
                    </div>

                    <div className="flex items-center justify-center pt-2 text-[13px]">
                      <span className={isLight ? "text-[#383838]" : "text-[#A1A1AA]"}>
                        {t.alreadyRegistered}{" "}
                      </span>
                      <button
                        type="button"
                        onClick={() => switchMode("signin")}
                        className={`font-bold underline ml-1.5 transition-colors cursor-pointer ${
                          isLight
                            ? "text-[#222222] hover:text-[#000000]"
                            : "text-white hover:text-white/80"
                        }`}
                      >
                        {t.signInLink}
                      </button>
                    </div>
                  </motion.form>
            </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  </main>

      {/* TERMS MODAL */}
      {showTermsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div
            className={`relative w-full max-w-[620px] rounded-[24px] border p-6 sm:p-8 shadow-lg transition-all duration-300 ${
              isLight
                ? "bg-white border-slate-200 text-[#222222] shadow-slate-400/25"
                : "bg-[#2A2A2A] border-[#444444] text-white shadow-black/50"
            }`}
          >
            <div className="flex items-center justify-between pb-4 border-b border-inherit">
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl font-bold ${
                    isLight ? "bg-[#222222] text-white" : "bg-white text-slate-950"
                  }`}
                >
                  <FileText size={18} />
                </div>
                <div>
                  <h3
                    className="text-[17px] font-extrabold leading-[22px] tracking-tight"
                    style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                  >
                    {t.modalTitle}
                  </h3>
                  <p
                    className={`text-[12px] ${isLight ? "text-[#383838]" : "text-[#A1A1AA]"}`}
                    style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                  >
                    {t.modalSubtitle}
                  </p>
                </div>
              </div>

              <button
                type="button"
                disabled={isRegistering}
                onClick={() => setShowTermsModal(false)}
                className={`flex h-8 w-8 items-center justify-center rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isLight
                    ? "border-slate-200 text-[#383838] hover:bg-slate-100"
                    : "border-[#444444] text-[#A1A1AA] hover:bg-white/10 hover:text-white"
                }`}
              >
                <X size={16} />
              </button>
            </div>

            <div
              className={`my-4 min-h-[280px] max-h-[380px] sm:max-h-[420px] overflow-y-auto rounded-xl border p-5 space-y-4 text-[13px] leading-[20px] ${
                isLight
                  ? "bg-slate-50 border-slate-200 text-[#2C2C2C]"
                  : "bg-[#1E1E1E] border-[#3E3E3E] text-[#D4D4D8]"
              }`}
              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
            >
              <div>
                <h4 className={`font-bold mb-0.5 ${isLight ? "text-[#222222]" : "text-white"}`}>
                  {t.modalTerm1Title}
                </h4>
                <p>{t.modalTerm1Desc}</p>
              </div>

              <div>
                <h4 className={`font-bold mb-0.5 ${isLight ? "text-[#222222]" : "text-white"}`}>
                  {t.modalTerm2Title}
                </h4>
                <p>{t.modalTerm2Desc}</p>
              </div>

              <div>
                <h4 className={`font-bold mb-0.5 ${isLight ? "text-[#222222]" : "text-white"}`}>
                  {t.modalTerm3Title}
                </h4>
                <p>{t.modalTerm3Desc}</p>
              </div>
            </div>

            <div className="pt-2 pb-4">
              <button
                type="button"
                disabled={isRegistering}
                onClick={() => setAgreedInModal(!agreedInModal)}
                className="flex items-start gap-2.5 text-left w-full cursor-pointer select-none group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-all duration-200 ${
                    agreedInModal
                      ? isLight
                        ? "bg-[#222222] border-[#222222] text-white"
                        : "bg-white border-white text-slate-950"
                      : isLight
                      ? "border-slate-300 bg-white group-hover:border-slate-400"
                      : "border-[#555555] bg-transparent group-hover:border-white/60"
                  }`}
                >
                  {agreedInModal && <Check size={12} strokeWidth={3} />}
                </div>
                <span
                  className={`text-[12.5px] leading-[17px] ${
                    isLight ? "text-[#222222]" : "text-white"
                  }`}
                  style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
                >
                  {t.modalCheckboxPre}
                  <span className="font-semibold underline cursor-pointer hover:text-black dark:hover:text-white">{t.modalTos}</span>
                  {t.modalAnd}
                  <span className="font-semibold underline cursor-pointer hover:text-black dark:hover:text-white">{t.modalPrivacy}</span>
                </span>
              </button>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-inherit">
              <button
                type="button"
                disabled={isRegistering}
                onClick={() => setShowTermsModal(false)}
                className={`px-4 py-2 rounded-xl text-[13px] font-medium border transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                  isLight
                    ? "border-slate-200 text-[#383838] hover:bg-slate-100"
                    : "border-[#444444] text-[#A1A1AA] hover:bg-white/10 hover:text-white"
                }`}
              >
                {t.cancelBtn}
              </button>

              <button
                type="button"
                disabled={!agreedInModal || isRegistering}
                onClick={handleConfirmSignUp}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-bold border transition-all duration-200 ${
                  agreedInModal && !isRegistering
                    ? isLight
                      ? "bg-[#222222] border-[#222222] text-white hover:bg-[#000000] cursor-pointer shadow-md active:scale-95"
                      : "bg-white border-white text-slate-950 hover:bg-white/90 cursor-pointer shadow-md active:scale-95"
                    : isLight
                    ? "bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed opacity-50"
                    : "bg-[#202020] border-[#3E3E3E] text-[#666666] cursor-not-allowed opacity-50"
                }`}
              >
                {isRegistering ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    <span>{t.registeringBtn}</span>
                  </>
                ) : (
                  <>
                    <span>{t.confirmRegisterBtn}</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOADING MODAL */}
      {showLoadingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
          <div
            className={`relative flex flex-col items-center justify-center w-full max-w-[390px] rounded-[24px] border p-7 sm:p-8 shadow-lg transition-all duration-300 text-center animate-in zoom-in-95 duration-200 overflow-hidden ${
              isLight
                ? "bg-white border-slate-200 text-[#222222] shadow-slate-400/25"
                : "bg-[#242424] border-[#3E3E3E] text-white shadow-black/50"
            }`}
          >
            <h3
              className={`text-[20px] font-extrabold tracking-tight mb-2 transition-colors duration-300 ${
                isModalSuccess
                  ? "text-[#2EC4B6] font-extrabold"
                  : isLight
                  ? "text-[#222222]"
                  : "text-white"
              }`}
              style={{ fontFamily: "var(--font-outfit), sans-serif" }}
            >
              {isModalSuccess
                ? lang === "TH"
                  ? "สร้างบัญชีสำเร็จ!"
                  : "Account Created Successfully!"
                : lang === "TH"
                ? "กำลังสร้างบัญชีพนักงาน..."
                : "Creating Staff Account..."}
            </h3>

            <p
              className={`text-[13px] leading-[19px] max-w-[300px] mb-6 ${
                isLight ? "text-[#555555]" : "text-[#A1A1AA]"
              }`}
              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
            >
              {isModalSuccess
                ? lang === "TH"
                  ? "บัญชีพนักงานของคุณพร้อมใช้งานในระบบแล้ว"
                  : "Your staff account is ready for use."
                : loadingStepText ||
                  (lang === "TH"
                    ? "ระบบกำลังลงทะเบียนและจัดสรรสิทธิ์ในระบบองค์กร"
                    : "Securing employee credentials & allocating permissions...")}
            </p>

            {/* Smooth Fill Progress Bar (Guaranteed 2.0s Duration) */}
            {!isModalSuccess ? (
              <div className="w-full h-3 bg-slate-200/80 dark:bg-white/10 rounded-full overflow-hidden p-0.5 relative my-3">
                <div
                  className={`h-full rounded-full ${
                    isLight
                      ? "bg-slate-900"
                      : "bg-white shadow-[0_0_10px_rgba(255,255,255,0.7)]"
                  }`}
                  style={{
                    animation: "fillProgressBar 2000ms linear forwards",
                  }}
                />
                <style>{`
                  @keyframes fillProgressBar {
                    0% {
                      width: 0%;
                    }
                    100% {
                      width: 100%;
                    }
                  }
                `}</style>
              </div>
            ) : (
              <div className="w-full h-3 bg-slate-200/80 dark:bg-white/10 rounded-full overflow-hidden p-0.5 relative my-3">
                <div
                  className="h-full w-full rounded-full bg-[#2EC4B6] shadow-[0_0_12px_rgba(46,196,182,0.5)]"
                />
              </div>
            )}

            {isModalSuccess && (
              <button
                type="button"
                onClick={() => {
                  if (onAuthSuccess) onAuthSuccess();
                  else if (onNavigate) onNavigate("workspace");
                  else navigateWithLoading("/workspace");
                }}
                className={`w-full h-[44px] mt-2 rounded-xl text-[13.5px] font-bold border transition-all duration-300 active:scale-95 shadow-md flex items-center justify-center gap-2 cursor-pointer animate-in fade-in zoom-in-95 duration-300 ${
                  isLight
                    ? "bg-slate-900 border-slate-900 text-white hover:bg-black"
                    : "bg-white border-white text-slate-950 hover:bg-white/90"
                }`}
              >
                <span>{lang === "TH" ? "ยืนยันและเข้าสู่ระบบ" : "Confirm & Enter Workspace"}</span>
                <ArrowRight size={15} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* FULLSCREEN PIN LOGIN LOADING SCREEN */}
      <AnimatePresence mode="wait">
        {isPinAuthenticating && (
          <LoadingScreen
            key="dawh-pin-login-loading-screen"
            show={true}
            message={lang === "TH" ? "กำลังเข้าสู่ระบบ..." : "Signing in..."}
            description={lang === "TH" ? "กำลังยืนยันความถูกต้องของรหัส PIN องค์กร" : "Verifying security PIN credentials..."}
          />
        )}
      </AnimatePresence>

      {/* ERROR MODAL */}
      {errorModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in select-none">
          <div
            className={`relative flex flex-col items-center w-full max-w-[400px] rounded-[24px] border p-7 sm:p-8 shadow-lg transition-all duration-300 text-center animate-in zoom-in-95 duration-200 ${
              isLight
                ? "bg-white border-slate-200 text-[#222222] shadow-slate-400/25"
                : "bg-[#242424] border-[#404040] text-white shadow-black/50"
            }`}
          >
            <h3
              className="text-[19px] font-extrabold tracking-tight mb-2 text-red-500"
              style={{ fontFamily: "var(--font-outfit), sans-serif" }}
            >
              {errorModal.title}
            </h3>

            <p
              className={`text-[13px] leading-[19px] mb-6 px-1 ${
                isLight ? "text-[#383838]" : "text-[#D4D4D8]"
              }`}
              style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
            >
              {errorModal.message}
            </p>

            <div className="flex w-full items-center justify-center">
              <button
                type="button"
                onClick={() => setErrorModal({ isOpen: false, title: "", message: "" })}
                className={`w-full h-[42px] rounded-xl text-[13.5px] font-bold border transition-all duration-200 active:scale-95 shadow-sm cursor-pointer ${
                  isLight
                    ? "bg-[#222222] border-[#222222] text-white hover:bg-black"
                    : "bg-white border-white text-slate-950 hover:bg-white/90"
                }`}
              >
                {lang === "TH" ? "กลับไปแก้ไขข้อมูล" : "Back to Edit"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <motion.footer
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-20 w-full py-6 px-6 sm:px-12 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 transition-colors duration-300"
      >
        <div className="flex items-center gap-2 text-left">
          <ShieldCheck
            size={15}
            className={`shrink-0 ${
              isLight ? "text-[#2C2C2C]" : "text-[#E4E4E7]"
            }`}
          />
          <p
            className={`text-[12px] font-normal leading-[16px] ${
              isLight ? "text-[#383838]" : "text-[#888888]"
            }`}
            style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
          >
            {t.footerSecured}
          </p>
        </div>

        <div
          className={`flex items-center gap-1 p-1 rounded-full border transition-all duration-300 shadow-sm select-none ${
            isLight
              ? "bg-white/90 border-slate-200 shadow-slate-200/50 backdrop-blur-sm"
              : "bg-[#282828]/90 border-[#404040] shadow-black/40 backdrop-blur-sm"
          }`}
        >
          <button
            type="button"
            onClick={toggleLanguage}
            className={`group relative flex h-7 items-center gap-1.5 px-2.5 rounded-full text-[11.5px] font-bold transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
              isLight
                ? "text-[#222222] hover:bg-slate-100"
                : "text-white hover:bg-white/10"
            }`}
            title={`Switch Language (Current: ${lang})`}
          >
            <Globe
              size={13}
              className="transition-transform duration-500 group-hover:rotate-45 group-active:rotate-180 text-inherit shrink-0"
            />
            <span
              key={lang}
              className="inline-block transition-all duration-300"
              style={{ fontFamily: "var(--font-outfit), sans-serif" }}
            >
              {lang}
            </span>
          </button>

          <div
            className={`h-3.5 w-[1px] transition-colors duration-300 ${
              isLight ? "bg-slate-200" : "bg-white/15"
            }`}
          />

          <button
            type="button"
            onClick={toggleTheme}
            className={`group flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
              isLight
                ? "text-[#222222] hover:bg-slate-100"
                : "text-white hover:bg-white/10"
            }`}
            title={isLight ? t.switchDarkMode : t.switchLightMode}
          >
            <div className="relative flex items-center justify-center transition-transform duration-500 group-hover:rotate-45 group-active:rotate-90">
              {isLight ? (
                <Moon size={13} className="transition-transform duration-300" />
              ) : (
                <Sun size={13} className="transition-transform duration-300" />
              )}
            </div>
          </button>
        </div>
      </motion.footer>
    </div>
  );
}

export default function UnifiedAuthPage({
  initialMode = "signin",
  onNavigate,
  onAuthSuccess,
  preventAutoRedirect = false,
}: UserAuthViewProps) {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh w-full items-center justify-center bg-[#222222] text-white">
          <Loader2 size={32} className="animate-spin text-white" />
        </div>
      }
    >
      <UserAuthView
        initialMode={initialMode}
        onNavigate={onNavigate}
        onAuthSuccess={onAuthSuccess}
        preventAutoRedirect={preventAutoRedirect}
      />
    </Suspense>
  );
}
