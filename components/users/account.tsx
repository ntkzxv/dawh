"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { User, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useTheme } from "@/context/ThemeContext";
import { useNotification } from "@/context/NotificationContext";
import { getCurrentSession } from "@/lib/auth-client";
import { fetchAndStoreUserProfile } from "@/lib/user-profile";
import { getAppMe, type AppMe } from "@/lib/api/session";
import { readPendingRegistrationProfile } from "@/lib/auth/pending-profile";
import {
  EmployeeProfile,
  DEFAULT_BRANCHES,
  formatBranchName,
  formatMaritalStatus,
  formatBirthDate,
} from "@/types/user";
import { HeaderNavbar, MobileNavbar } from "@/components/navbar";
import { AvatarCropModal } from "@/components/users/AvatarCropModal";
import { useAppLanguage, setAppLanguage } from "@/utils/language";

// Subcomponents
import { ProfileSidebar } from "./account/ProfileSidebar";
import { ProfileTab } from "./account/tabs/ProfileTab";
import { EmploymentTab } from "./account/tabs/EmploymentTab";
import { SecurityTab } from "./account/tabs/SecurityTab";
import { SkeletonAccountPage } from "./account/SkeletonAccountPage";
import { SecondaryRegModal } from "./account/modals/SecondaryRegModal";
import { PinPromptModal } from "./account/modals/PinPromptModal";
import { PinSetupModal } from "./account/modals/PinSetupModal";
import { PasswordModal } from "./account/modals/PasswordModal";
import { ExitConfirmModal } from "./account/modals/ExitConfirmModal";

// Re-export shared types & selectors for backward compatibility
export type {
  AccountViewProps,
  SettingsViewProps,
  AccountTabType,
  FormCustomSelectOption,
  FormCustomSelectProps,
  AddressParts,
} from "./account/types";
export { FormCustomSelect } from "./account/selectors/FormCustomSelect";
export { UniversitySearchSelect } from "./account/selectors/UniversitySearchSelect";
export { ThaiAddressSelector } from "./account/selectors/ThaiAddressSelector";
export { MajorSubjectAutocomplete } from "./account/selectors/MajorSubjectAutocomplete";

import type { AccountViewProps } from "./account/types";

export default function AccountView({
  onNavigate,
  onBack,
  initialTab = "profile",
}: AccountViewProps) {
  const router = useRouter();
  const { theme } = useTheme();
  const { notify } = useNotification();
  const isLight = theme === "light";

  // Language State
  const lang = useAppLanguage();
  const isThai = lang === "TH";

  // Tab State: 'profile' | 'employment' | 'security' | 'admin'
  const [activeTab, setActiveTab] = useState<"profile" | "employment" | "security" | "admin">(() => {
    if (initialTab === "security" || initialTab === "employment" || initialTab === "profile" || initialTab === "admin") {
      return initialTab;
    }
    if (typeof window !== "undefined") {
      const param = new URLSearchParams(window.location.search).get("tab");
      if (param === "security" || param === "password" || param === "email") return "security";
      if (param === "employment") return "employment";
      if (param === "admin") return "admin";
    }
    return "profile";
  });

  // Profile State
  const [profile, setProfile] = useState<Partial<EmployeeProfile>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [appMe, setAppMe] = useState<AppMe | null>(null);

  // Modals Visibility State
  const [showSecondaryRegModal, setShowSecondaryRegModal] = useState(false);
  const [regStep, setRegStep] = useState<"fill" | "review">("fill");
  const [showPinPromptModal, setShowPinPromptModal] = useState(false);
  const [showPinSetupModal, setShowPinSetupModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showExitConfirmModal, setShowExitConfirmModal] = useState(false);
  const [showAvatarCropModal, setShowAvatarCropModal] = useState(false);

  // Prevent background scrolling when any modal is open
  useEffect(() => {
    const isAnyModalOpen =
      showSecondaryRegModal ||
      showPinPromptModal ||
      showPinSetupModal ||
      showPasswordModal ||
      showExitConfirmModal ||
      showAvatarCropModal;

    if (isAnyModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [
    showSecondaryRegModal,
    showPinPromptModal,
    showPinSetupModal,
    showPasswordModal,
    showExitConfirmModal,
    showAvatarCropModal,
  ]);

  // Open Secondary Registration Modal Helper
  const openSecondaryRegistrationModal = useCallback((step: "fill" | "review" = "fill") => {
    setRegStep(step);
    setShowSecondaryRegModal(true);
  }, []);

  // Direct URL query parameter / hash routing (e.g. ?modal=register, ?modal=review, ?modal=pin)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(window.location.search);
      const modalParam = params.get("modal");
      if (modalParam === "register" || modalParam === "fill") {
        openSecondaryRegistrationModal("fill");
      } else if (modalParam === "review") {
        openSecondaryRegistrationModal("review");
      } else if (modalParam === "pin") {
        setShowPinSetupModal(true);
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [openSecondaryRegistrationModal]);

  // Fetch the canonical employee profile
  useEffect(() => {
    let cachedProfile: Partial<EmployeeProfile> | null = null;
    try {
      const cached = localStorage.getItem("dawh_user_profile");
      if (cached) {
        cachedProfile = JSON.parse(cached);
        if (cachedProfile) {
          setProfile(cachedProfile);
        }
      }
    } catch {
      // Non-blocking
    }

    async function loadUserProfile() {
      if (!cachedProfile) {
        setIsLoading(true);
      }
      try {
        try {
          const me = await getAppMe();
          if (me?.data) {
            setAppMe(me.data);
          }
        } catch {
          // non-blocking
        }

        const session = await getCurrentSession();
        const targetId = session?.user.id;
        const targetEmail = session?.user.email;

        if (targetId) {
          let fetched: EmployeeProfile | null = null;
          try {
            fetched = await fetchAndStoreUserProfile(targetId, targetEmail);
          } catch (profileError) {
            console.warn("Unable to load employee profile; using registration identity.", profileError);
          }

          if (fetched) {
            setProfile(fetched);
            return;
          }

          const pending = readPendingRegistrationProfile();
          const pendingProfile: Partial<EmployeeProfile> = {
            id: targetId,
            email: targetEmail || "",
            username: pending?.username || "",
            first_name: pending?.firstName || session.user.name?.split(" ")[0] || "",
            last_name: pending?.lastName || session.user.name?.split(" ").slice(1).join(" ") || "",
            birth_date: pending?.birthDate || "",
            phone: pending?.phone || "",
            full_name: session.user.name || undefined,
          };
          setProfile(pendingProfile);
        }
      } catch (err) {
        console.error("Error loading user profile in settings:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserProfile();
  }, []);

  // Check if profile is incomplete
  const missingFields: string[] = [];
  if (!profile.id_card) missingFields.push(isThai ? "เลขบัตรประชาชน" : "Citizen ID");
  if (!profile.phone) missingFields.push(isThai ? "เบอร์โทรศัพท์" : "Phone");
  if (!profile.current_address) missingFields.push(isThai ? "ที่อยู่ปัจจุบัน" : "Address");
  if (!profile.registered_address) missingFields.push(isThai ? "ที่อยู่ตามทะเบียนบ้าน" : "Registered Address");
  if (!profile.emergency_contact_phone && !profile.emergency_contact_name)
    missingFields.push(isThai ? "ผู้ติดต่อฉุกเฉิน" : "Emergency Contact");
  if (!profile.education_level) missingFields.push(isThai ? "วุฒิการศึกษา" : "Education");

  const isProfileIncomplete = missingFields.length > 0 || (!profile.profile_completed_at && profile.is_complete !== true);

  // Auto-open Secondary Registration modal if autoOpen or incomplete query param exists
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      if (params.get("autoOpen") === "true" || params.get("incomplete") === "true") {
        const timer = setTimeout(() => {
          openSecondaryRegistrationModal("fill");
        }, 100);
        return () => clearTimeout(timer);
      }
    }
  }, [openSecondaryRegistrationModal]);

  // Trigger Notification Popup if Profile is Incomplete
  const hasNotifiedIncompleteRef = useRef(false);
  useEffect(() => {
    if (!isLoading && profile.id && isProfileIncomplete && !hasNotifiedIncompleteRef.current) {
      hasNotifiedIncompleteRef.current = true;
      notify.warning(
        isThai ? "กรุณากรอกข้อมูลส่วนตัวเพิ่มเติม" : "Complete Profile Information",
        {
          message: isThai
            ? `ข้อมูลประวัติยังไม่สมบูรณ์ (${missingFields.slice(0, 3).join(", ")}) กรุณากรอกข้อมูลเพื่อความสมบูรณ์ของระบบ`
            : "Your employee records are incomplete. Please update your details.",
          duration: 6000,
        }
      );
    }
  }, [isLoading, profile.id, isProfileIncomplete, isThai, missingFields, notify]);

  // Calculated profile values
  const fullName =
    profile.full_name ||
    [profile.first_name, profile.last_name].filter(Boolean).join(" ") ||
    profile.username ||
    profile.email ||
    "—";

  const initials =
    (profile.first_name?.[0] || profile.username?.[0] || (fullName !== "—" ? fullName.charAt(0) : "U")).toUpperCase() +
    (profile.last_name?.[0] || "").toUpperCase();

  const departmentTitle =
    profile.department ||
    (isThai ? "ฝ่ายปฏิบัติการทั่วไป (General Operations)" : "General Operations");

  const branchTitle =
    (profile.branch_name && profile.branch_name !== "—" ? formatBranchName(profile.branch_name, isThai ? "TH" : "EN") : null) ||
    (profile.branch_id ? DEFAULT_BRANCHES.find((b) => b.id === profile.branch_id)?.branch_name : null) ||
    (isThai ? "สำนักงานใหญ่ (Headquarters)" : "Headquarters");

  const emailText = profile.email || "—";
  const phoneText = profile.phone || "—";
  const idCardText = profile.id_card || "—";
  const birthDateText = formatBirthDate(profile.birth_date);
  const genderText = profile.gender || "—";
  const bloodTypeText = profile.blood_type || "—";
  const maritalText = profile.marital_status ? formatMaritalStatus(profile.marital_status, lang) : "—";
  const nationalityText = profile.nationality || "—";
  const religionText = profile.religion || "—";
  const currentAddressText = profile.current_address || "—";
  const registeredAddressText = profile.registered_address || "—";

  return (
    <div
      className={`h-screen w-full flex flex-col overflow-hidden transition-colors duration-300 ${
        isLight
          ? "bg-[#FFFFFF] text-[#222222]"
          : "bg-[#2C2C2C] text-[#FFFFFF] selection:bg-white/20"
      }`}
      style={{ fontFamily: "var(--font-geist-sans), sans-serif" }}
    >
      {/* 1. REUSABLE APP HEADER */}
      <div className="shrink-0 w-full z-40">
        <HeaderNavbar
          showLogo={true}
          showAccount={true}
          title={isThai ? "ข้อมูลบัญชีและประวัติพนักงาน" : "Employee Profile & Records"}
          subtitle={
            isThai
              ? "จัดการและตรวจสอบข้อมูลประวัติส่วนบุคคล สังกัด และเอกสารสัญญาจ้าง"
              : "Manage personal details, organization, and employment records"
          }
          onNavigate={onNavigate}
          onBack={onBack}
          lang={lang}
          onLangChange={setAppLanguage}
        />
        <MobileNavbar />
      </div>

      {/* 2. MAIN CONTENT BODY */}
      <div className="flex-1 w-full overflow-y-auto min-h-0">
        <main className="w-full max-w-[1200px] mx-auto p-4 sm:p-8 pb-[96px] md:pb-8 flex flex-col items-start gap-6">
          {/* ADMIN CREDENTIAL RESET BANNER */}
          {(profile.needs_password_reset ||
            profile.needs_pin_reset ||
            (typeof window !== "undefined" &&
              (localStorage.getItem("dawh_needs_password_reset") === "true" ||
                localStorage.getItem("dawh_needs_pin_reset") === "true"))) && (
            <div
              className={`w-full p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all duration-300 ${
                isLight
                  ? "bg-[#FFF7ED] border-[#FDBA74] text-[#9A3412] shadow-sm"
                  : "bg-[#2D1B13] border-[#7C2D12] text-[#FFEDD5] shadow-lg"
              }`}
            >
              <div className="flex flex-col gap-0.5">
                <h3 className="font-bold text-[15px] leading-tight">
                  {isThai
                    ? "ผู้ดูแลระบบได้ทำการรีเซ็ตข้อมูลความปลอดภัยของคุณ"
                    : "Your security credentials have been reset by Admin"}
                </h3>
                <p className="text-[12.5px] leading-normal opacity-85">
                  {isThai
                    ? "คุณสามารถเข้าสู่ระบบและกดปุ่มเพื่อตั้งรหัสผ่านหรือรหัส PIN ใหม่ได้ด้วยตนเองทันที"
                    : "You can set your new password or PIN below."}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {(profile.needs_password_reset ||
                  (typeof window !== "undefined" &&
                    localStorage.getItem("dawh_needs_password_reset") === "true")) && (
                  <button
                    type="button"
                    onClick={() => setShowPasswordModal(true)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer ${
                      isLight
                        ? "bg-[#EA580C] hover:bg-[#C2410C] text-white"
                        : "bg-[#FB923C] hover:bg-[#F97316] text-[#222222]"
                    }`}
                  >
                    <span>{isThai ? "ตั้งรหัสผ่านใหม่" : "Set New Password"}</span>
                  </button>
                )}

                {(profile.needs_pin_reset ||
                  (typeof window !== "undefined" &&
                    localStorage.getItem("dawh_needs_pin_reset") === "true")) && (
                  <button
                    type="button"
                    onClick={() => setShowPinSetupModal(true)}
                    className={`px-4 py-2.5 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer ${
                      isLight
                        ? "bg-[#222222] hover:bg-black text-white"
                        : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#222222]"
                    }`}
                  >
                    <span>{isThai ? "ตั้งรหัส PIN ใหม่" : "Set New PIN"}</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* SKELETON LOADING OR MAIN CONTENT */}
          {isLoading ? (
            <SkeletonAccountPage />
          ) : (
            <>
              {/* TABS NAVIGATION */}
              <div
                className={`w-full h-[42px] border-b flex flex-row items-start gap-2 select-none overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden ${
                  isLight ? "border-[#E4E4E7]" : "border-[#444444]"
                }`}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab("profile")}
                  className={`relative px-6 py-3 h-[42px] text-[14px] leading-[18px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === "profile"
                      ? isLight
                        ? "text-[#222222]"
                        : "text-[#FFFFFF]"
                      : isLight
                      ? "text-[#666666] hover:text-[#222222]"
                      : "text-[#E4E4E7] hover:text-[#FFFFFF]"
                  }`}
                >
                  <span>{isThai ? "ข้อมูลประวัติส่วนตัว" : "Personal Profile"}</span>
                  {activeTab === "profile" && (
                    <motion.div
                      layoutId="activeSettingsTabUnderline"
                      className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                        isLight ? "bg-[#222222]" : "bg-white"
                      }`}
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 35,
                      }}
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("employment")}
                  className={`relative px-6 py-3 h-[42px] text-[14px] leading-[18px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                    activeTab === "employment"
                      ? isLight
                        ? "text-[#222222]"
                        : "text-[#FFFFFF]"
                      : isLight
                      ? "text-[#666666] hover:text-[#222222]"
                      : "text-[#E4E4E7] hover:text-[#FFFFFF]"
                  }`}
                >
                  <span>{isThai ? "ข้อมูลเกี่ยวกับบริษัทและสัญญา" : "Company & Employment"}</span>
                  {activeTab === "employment" && (
                    <motion.div
                      layoutId="activeSettingsTabUnderline"
                      className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                        isLight ? "bg-[#222222]" : "bg-white"
                      }`}
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 35,
                      }}
                    />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab("security")}
                  className={`relative px-6 py-3 h-[42px] text-[14px] leading-[18px] font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 flex items-center gap-2 ${
                    activeTab === "security"
                      ? isLight
                        ? "text-[#222222]"
                        : "text-[#FFFFFF]"
                      : isLight
                      ? "text-[#666666] hover:text-[#222222]"
                      : "text-[#E4E4E7] hover:text-[#FFFFFF]"
                  }`}
                >
                  <span>{isThai ? "เปลี่ยนอีเมลและรหัสผ่าน" : "Change Email / Password"}</span>
                  {((profile.needs_password_reset) ||
                    (typeof window !== "undefined" && localStorage.getItem("dawh_needs_password_reset") === "true")) && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                  {activeTab === "security" && (
                    <motion.div
                      layoutId="activeSettingsTabUnderline"
                      className={`absolute bottom-0 left-0 right-0 h-[2px] ${
                        isLight ? "bg-[#222222]" : "bg-white"
                      }`}
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 35,
                      }}
                    />
                  )}
                </button>
              </div>

              {/* TAB CONTENT & SIDEBAR */}
              {(activeTab === "profile" || activeTab === "employment" || activeTab === "security") && (
                <div className="w-full flex flex-col lg:flex-row items-start gap-6 animate-in fade-in duration-200">
                  <div className="w-full lg:w-[360px] flex flex-col gap-4 shrink-0">
                    <ProfileSidebar
                      profile={profile}
                      isLight={isLight}
                      isThai={isThai}
                      fullName={fullName}
                      initials={initials}
                      departmentTitle={departmentTitle}
                      onOpenAvatarCrop={() => setShowAvatarCropModal(true)}
                      onGoToSettings={() => {
                        if (onNavigate) onNavigate("settings");
                        else router.push("/settings");
                      }}
                    />

                    {/* SECONDARY REGISTRATION PROMPT BANNER BELOW PROFILE */}
                    {isProfileIncomplete && (
                      <div
                        className={`w-full p-5 rounded-[12px] border flex flex-col gap-3.5 transition-all duration-300 ${
                          isLight
                            ? "bg-white border-[#E4E4E7] text-[#222222] shadow-sm"
                            : "bg-[#383838] border-[#444444] text-[#FFFFFF] shadow-lg"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={`p-2.5 rounded-xl shrink-0 mt-0.5 shadow-sm ${
                              isLight ? "bg-[#222222] text-white" : "bg-white text-[#222222]"
                            }`}
                          >
                            <User size={18} />
                          </div>
                          <div className="flex flex-col gap-1 min-w-0">
                            <h3 className="font-bold text-[14.5px] leading-tight">
                              {isThai
                                ? "ข้อมูลโปรไฟล์ยังไม่ครบถ้วน"
                                : "Incomplete Profile Registration"}
                            </h3>
                            <p
                              className={`text-[12px] leading-relaxed ${
                                isLight ? "text-[#666666]" : "text-[#E4E4E7]"
                              }`}
                            >
                              {isThai
                                ? `ยังขาดข้อมูล: ${missingFields.slice(0, 3).join(", ")}${missingFields.length > 3 ? ` และอีก ${missingFields.length - 3} รายการ` : ""} กรุณากรอกข้อมูลเพิ่มเติมและตั้งรหัส PIN 6 หลัก`
                                : `Missing: ${missingFields.slice(0, 3).join(", ")}. Complete secondary registration & PIN.`}
                            </p>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => openSecondaryRegistrationModal("fill")}
                          className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs active:scale-95 transition-all shadow-sm flex items-center justify-center cursor-pointer ${
                            isLight
                              ? "bg-[#222222] hover:bg-black text-white"
                              : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#222222]"
                          }`}
                        >
                          <span>{isThai ? "กรอกข้อมูลเพิ่มเติมรอบสอง" : "Complete Registration"}</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {activeTab === "profile" && (
                    <ProfileTab
                      profile={profile}
                      isLight={isLight}
                      isThai={isThai}
                      idCardText={idCardText}
                      birthDateText={birthDateText}
                      genderText={genderText}
                      bloodTypeText={bloodTypeText}
                      maritalText={maritalText}
                      nationalityText={nationalityText}
                      religionText={religionText}
                      emailText={emailText}
                      phoneText={phoneText}
                      currentAddressText={currentAddressText}
                      registeredAddressText={registeredAddressText}
                    />
                  )}

                  {activeTab === "employment" && (
                    <EmploymentTab
                      profile={profile}
                      isLight={isLight}
                      isThai={isThai}
                      departmentTitle={departmentTitle}
                      branchTitle={branchTitle}
                    />
                  )}

                  {activeTab === "security" && (
                    <SecurityTab
                      profile={profile}
                      isLight={isLight}
                      isThai={isThai}
                      emailText={emailText}
                      onOpenPinSetup={() => setShowPinSetupModal(true)}
                      onPasswordResetSuccess={() => {
                        setProfile((prev) => ({
                          ...prev,
                          needs_password_reset: false,
                        }));
                      }}
                    />
                  )}
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* MODALS */}
      <SecondaryRegModal
        isOpen={showSecondaryRegModal}
        initialStep={regStep}
        onClose={() => setShowSecondaryRegModal(false)}
        onOpenExitConfirm={() => setShowExitConfirmModal(true)}
        profile={profile}
        isLight={isLight}
        isThai={isThai}
        onSuccess={(updated) => {
          setProfile(updated);
        }}
        onOpenPinSetup={() => setShowPinPromptModal(true)}
      />

      <PinPromptModal
        isOpen={showPinPromptModal}
        onClose={() => setShowPinPromptModal(false)}
        onAccept={() => setShowPinSetupModal(true)}
        isLight={isLight}
        isThai={isThai}
      />

      <PinSetupModal
        isOpen={showPinSetupModal}
        onClose={() => setShowPinSetupModal(false)}
        userId={profile.id}
        isLight={isLight}
        isThai={isThai}
      />

      <PasswordModal
        isOpen={showPasswordModal}
        onClose={() => setShowPasswordModal(false)}
        onSuccess={() => {
          setProfile((prev) => ({
            ...prev,
            needs_password_reset: false,
          }));
        }}
        isLight={isLight}
        isThai={isThai}
      />

      <ExitConfirmModal
        isOpen={showExitConfirmModal}
        onClose={() => setShowExitConfirmModal(false)}
        onConfirmDiscard={() => {
          setShowExitConfirmModal(false);
          setShowSecondaryRegModal(false);
          setShowPinPromptModal(false);
          setShowPinSetupModal(false);
          notify.info(
            isThai ? "ยกเลิกการกรอกข้อมูลแล้ว" : "Form Dismissed",
            {
              message: isThai
                ? "ข้อมูลที่กรอกไว้ยังไม่ได้รับการบันทึก"
                : "Unsaved changes have been discarded.",
              duration: 3500,
            }
          );
        }}
        isLight={isLight}
        isThai={isThai}
      />

      <AvatarCropModal
        isOpen={showAvatarCropModal}
        onClose={() => setShowAvatarCropModal(false)}
        userId={profile.id || ""}
        onSuccess={(publicUrl) => {
          setProfile((prev) => ({ ...prev, avatar_url: publicUrl }));
          notify.success(
            isThai ? "อัปเดตรูปโปรไฟล์สำเร็จ" : "Profile Picture Updated",
            {
              message: isThai ? "แปลงเป็น WebP 1:1 และบันทึกเรียบร้อยแล้ว" : "Cropped to 1:1 WebP and saved successfully.",
              duration: 3500,
            }
          );
        }}
        isLight={isLight}
        isThai={isThai}
      />
    </div>
  );
}
