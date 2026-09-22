"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  User,
  FileText,
  X,
  ChevronDown,
  Check,
  ArrowLeft,
  ArrowUpRight,
  Loader2,
  Lock,
  Building2,
  ShieldCheck,
} from "lucide-react";
import { useNotification } from "@/context/NotificationContext";
import { apiPut, ApiRequestError } from "@/lib/api/client";
import { getOnboardingOptions } from "@/lib/api/onboarding";
import { readPendingRegistrationProfile } from "@/lib/auth/pending-profile";
import { isValidIsoDate, isValidPhone, isValidThaiCitizenId } from "@/lib/profiles/client-validation";
import { toEmployeeProfile } from "@/lib/user-profile";
import {
  EmployeeProfile,
  Branch,
  DEFAULT_BRANCHES,
  formatBranchName,
  formatMaritalStatus,
  formatPrefix,
  getPrefixDisplayLabel,
  normalizePrefix,
  formatBirthDate,
} from "@/types/user";
import { PRESET_RELIGIONS } from "../types";
import { FormCustomSelect } from "../selectors/FormCustomSelect";
import { UniversitySearchSelect } from "../selectors/UniversitySearchSelect";
import { ThaiAddressSelector, parseAddressString } from "../selectors/ThaiAddressSelector";
import { MajorSubjectAutocomplete } from "../selectors/MajorSubjectAutocomplete";

export interface SecondaryRegModalProps {
  isOpen: boolean;
  initialStep?: "fill" | "review";
  onClose: () => void;
  onOpenExitConfirm: () => void;
  profile: Partial<EmployeeProfile>;
  isLight: boolean;
  isThai: boolean;
  onSuccess: (updatedProfile: Partial<EmployeeProfile>) => void;
  onOpenPinSetup: () => void;
}

export function SecondaryRegModal({
  isOpen,
  initialStep = "fill",
  onClose,
  onOpenExitConfirm,
  profile,
  isLight,
  isThai,
  onSuccess,
  onOpenPinSetup,
}: SecondaryRegModalProps) {
  const { notify } = useNotification();
  const [regStep, setRegStep] = useState<"fill" | "review">(initialStep);
  const [isTermsAgreed, setIsTermsAgreed] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  const regFormScrollRef = useRef<HTMLDivElement | null>(null);
  const reviewScrollRef = useRef<HTMLDivElement | null>(null);
  const [isFormAtBottom, setIsFormAtBottom] = useState(false);
  const [isReviewAtBottom, setIsReviewAtBottom] = useState(false);

  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [branchesList] = useState<Branch[]>(DEFAULT_BRANCHES);
  const [religionChoice, setReligionChoice] = useState<string>("");
  const [customReligion, setCustomReligion] = useState<string>("");

  const [regForm, setRegForm] = useState({
    username: "",
    prefix: "mr",
    first_name_th: "",
    last_name_th: "",
    nickname_th: "",
    first_name: "",
    last_name: "",
    nickname: "",
    id_card: "",
    birth_date: "",
    gender: "ชาย",
    blood_type: "",
    marital_status: "",
    nationality: "",
    religion: "",
    phone: "",
    emergency_contact_name_th: "",
    emergency_contact_name: "",
    emergency_contact_relationship: "บิดา/มารดา",
    emergency_contact_phone: "",
    current_address: "",
    registered_address: "",
    department: "",
    branch_id: "00000000-0000-0000-0000-000000000001",
    branch_name: "สำนักงานใหญ่ (Headquarter)",
    education_level: "ปริญญาตรี",
    major_subject: "",
    university_th: "",
    university_en: "",
    university_name: "",
    bio: "",
  });

  const syncFormFromProfile = useCallback((data: Partial<EmployeeProfile>) => {
    const matchedBranch = DEFAULT_BRANCHES.find(
      (b) => b.id === data.branch_id || b.branch_name === data.branch_name || b.branch_code === data.branch_name
    );

    const currentReligion = data.religion || "";
    if (currentReligion && PRESET_RELIGIONS.includes(currentReligion)) {
      setReligionChoice(currentReligion);
      setCustomReligion("");
    } else if (currentReligion) {
      setReligionChoice("อื่นๆ");
      setCustomReligion(currentReligion);
    } else {
      setReligionChoice("");
      setCustomReligion("");
    }

    setRegForm({
      username: data.username || "",
      prefix: normalizePrefix(data.prefix),
      first_name_th: data.first_name_th || "",
      last_name_th: data.last_name_th || "",
      nickname_th: data.nickname_th || "",
      first_name: data.first_name || "",
      last_name: data.last_name || "",
      nickname: data.nickname || "",
      id_card: data.id_card || "",
      birth_date:
        data.birth_date ||
        (typeof window !== "undefined" ? localStorage.getItem("current_user_birth_date") || "" : ""),
      gender: data.gender || "ชาย",
      blood_type: data.blood_type || "",
      marital_status: data.marital_status || "",
      nationality: data.nationality || "",
      religion: currentReligion || "",
      phone: data.phone || (typeof window !== "undefined" ? localStorage.getItem("current_user_phone") || "" : ""),
      emergency_contact_name_th: data.emergency_contact_name_th || "",
      emergency_contact_name: data.emergency_contact_name || "",
      emergency_contact_relationship: data.emergency_contact_relationship || "บิดา/มารดา",
      emergency_contact_phone: data.emergency_contact_phone || "",
      current_address: data.current_address || "",
      registered_address: data.registered_address || "",
      department: data.department || "",
      branch_id: data.branch_id || matchedBranch?.id || "00000000-0000-0000-0000-000000000001",
      branch_name: data.branch_name || matchedBranch?.branch_name || "สำนักงานใหญ่ (Headquarter)",
      education_level: data.education_level || "ปริญญาตรี",
      major_subject: data.major_subject || "",
      university_th: data.university_th || data.university_name || "",
      university_en: data.university_en || "",
      university_name: data.university_name || data.university_th || "",
      bio: data.bio || "",
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      syncFormFromProfile(profile);
      setRegStep(initialStep);
      setIsTermsAgreed(false);
      setModalError(null);
      setHasAttemptedSubmit(false);
    }
  }, [isOpen, initialStep, profile, syncFormFromProfile]);

  const lockedPhone = useMemo(() => {
    if (profile.phone) return profile.phone;
    if (typeof window !== "undefined") return localStorage.getItem("current_user_phone") || "";
    return "";
  }, [profile.phone]);

  const handleFormScroll = useCallback(() => {
    if (!regFormScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = regFormScrollRef.current;
    setIsFormAtBottom(scrollTop + clientHeight >= scrollHeight - 40);
  }, []);

  const handleReviewScroll = useCallback(() => {
    if (!reviewScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = reviewScrollRef.current;
    setIsReviewAtBottom(scrollTop + clientHeight >= scrollHeight - 40);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsFormAtBottom(false);
      setIsReviewAtBottom(false);
      const timer = setTimeout(() => {
        handleFormScroll();
        handleReviewScroll();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen, regStep, handleFormScroll, handleReviewScroll]);

  // Close active custom dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-custom-dropdown]")) {
        setActiveDropdownId(null);
      }
    };
    if (activeDropdownId) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }
  }, [activeDropdownId]);

  const isFieldInvalid = (fieldName: string) => {
    if (!hasAttemptedSubmit) return false;
    switch (fieldName) {
      case "first_name_th":
        return !regForm.first_name_th.trim();
      case "last_name_th":
        return !regForm.last_name_th.trim();
      case "first_name":
        return !regForm.first_name.trim();
      case "last_name":
        return !regForm.last_name.trim();
      case "id_card":
        return regForm.id_card.trim().replace(/\D/g, "").length !== 13;
      case "birth_date":
        return !regForm.birth_date;
      case "phone":
        return !regForm.phone.trim();
      case "current_address":
        return !regForm.current_address.trim();
      case "registered_address":
        return !regForm.registered_address.trim();
      case "branch_name":
        return !regForm.branch_name.trim();
      default:
        return false;
    }
  };

  const getInputClass = (_fieldName?: string, extraClasses: string = "") => {
    return `p-2.5 rounded-lg border text-xs outline-none transition-all ${
      isLight
        ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222] focus:border-[#222222]"
        : "bg-[#282828] border-[#444444] text-[#FFFFFF] focus:border-white"
    } ${extraClasses}`;
  };

  const handleTestPushFill = () => {
    const defaultBranch = branchesList[0]?.branch_name || "สำนักงานใหญ่ (Headquarter)";
    const defaultBranchId = branchesList[0]?.id || "00000000-0000-0000-0000-000000000001";

    setRegForm((prev) => ({
      ...prev,
      username: prev.username || profile.username || "test_employee",
      prefix: "mr",
      first_name_th: "ทดสอบ",
      last_name_th: "ระบบ",
      nickname_th: "เทส",
      first_name: "Test",
      last_name: "User",
      nickname: "Tester",
      id_card: "1100500123456",
      birth_date: "1995-05-15",
      gender: "ชาย",
      blood_type: "O",
      marital_status: "โสด",
      nationality: "ไทย",
      religion: "พุทธ",
      phone: prev.phone || profile.phone || "0812345678",
      emergency_contact_name_th: "สมศรี ใจดี",
      emergency_contact_name: "Emergency Contact",
      emergency_contact_relationship: "บิดา/มารดา",
      emergency_contact_phone: "0898765432",
      current_address: "99/9 หมู่ 1 ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120",
      registered_address: "99/9 หมู่ 1 ต.คลองหนึ่ง อ.คลองหลวง จ.ปทุมธานี 12120",
      department: "Information Technology",
      branch_id: defaultBranchId,
      branch_name: defaultBranch,
      education_level: "ปริญญาตรี",
      major_subject: "วิทยาการคอมพิวเตอร์",
      university_th: "จุฬาลงกรณ์มหาวิทยาลัย",
      university_en: "Chulalongkorn University",
      university_name: "จุฬาลงกรณ์มหาวิทยาลัย",
      bio: "Test Account for system QA",
    }));
    setIsTermsAgreed(true);
    setModalError(null);
    setHasAttemptedSubmit(false);
  };

  const handleValidateAndProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    setModalError(null);

    if (!regForm.first_name_th.trim() || !regForm.last_name_th.trim()) {
      const msg = isThai ? "กรุณากรอกชื่อจริงและนามสกุล (ภาษาไทย) ให้ครบถ้วน" : "Please fill in Thai first and last name.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const cleanFirstNameEn = (regForm.first_name || profile.first_name || "").trim();
    const cleanLastNameEn = (regForm.last_name || profile.last_name || "").trim();
    if (!cleanFirstNameEn || !cleanLastNameEn) {
      const msg = isThai ? "กรุณากรอกชื่อจริงและนามสกุล (English) ให้ครบถ้วน" : "Please fill in English first and last name.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const cleanIdCard = regForm.id_card.trim().replace(/\D/g, "");
    if (!isValidThaiCitizenId(cleanIdCard)) {
      const msg = isThai ? "กรุณากรอกเลขบัตรประชาชน 13 หลักให้ถูกต้อง" : "Please enter a valid 13-digit Thai citizen ID.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const activeBirthDate =
      regForm.birth_date ||
      profile.birth_date ||
      readPendingRegistrationProfile()?.birthDate ||
      (typeof window !== "undefined" ? localStorage.getItem("current_user_birth_date") || "" : "");
    if (!isValidIsoDate(activeBirthDate)) {
      const msg = isThai
        ? "ไม่พบวันเกิดจากข้อมูลการสมัคร กรุณากลับไปสมัครด้วยแท็บเดิม"
        : "Birth date from registration is missing. Please continue in the original registration tab.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const resolvedUsername =
      (regForm.username.trim() ||
        profile.username ||
        profile.email?.split("@")[0]?.replace(/[^a-zA-Z0-9._-]/g, "") ||
        "employee").toLowerCase();

    const activePhone = (
      regForm.phone ||
      profile.phone ||
      readPendingRegistrationProfile()?.phone ||
      (typeof window !== "undefined" ? localStorage.getItem("current_user_phone") || "" : "")
    ).trim();
    if (!activePhone) {
      const msg = isThai ? "กรุณาระบุเบอร์โทรศัพท์มือถือ" : "Please enter mobile phone number.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!isValidPhone(activePhone)) {
      const msg = isThai ? "กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง" : "Please enter a valid phone number.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!regForm.current_address.trim()) {
      const msg = isThai ? "กรุณากรอกที่อยู่ปัจจุบัน ให้ครบถ้วน" : "Please enter current address.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!regForm.registered_address.trim()) {
      const msg = isThai ? "กรุณากรอกที่อยู่ตามทะเบียนบ้าน ให้ครบถ้วน" : "Please enter registered address.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (!regForm.branch_name.trim()) {
      const msg = isThai ? "กรุณาเลือกสาขาที่สังกัด" : "Please select branch assignment.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    const requiredValues = [
      resolvedUsername, regForm.prefix, regForm.nickname_th, regForm.nickname,
      regForm.gender, regForm.blood_type, regForm.marital_status, regForm.nationality,
      regForm.religion, regForm.education_level, regForm.major_subject,
      regForm.university_th || regForm.university_name, regForm.university_en || regForm.university_name,
      regForm.emergency_contact_name_th, regForm.emergency_contact_name,
      regForm.emergency_contact_relationship, regForm.emergency_contact_phone,
    ];
    const currentAddress = parseAddressString(regForm.current_address);
    const registeredAddress = parseAddressString(regForm.registered_address);
    const addressValues = [
      currentAddress.houseNo, currentAddress.province_en, currentAddress.district_en, currentAddress.subdistrict_en, currentAddress.zipcode,
      registeredAddress.houseNo, registeredAddress.province_en, registeredAddress.district_en, registeredAddress.subdistrict_en, registeredAddress.zipcode,
    ];
    if (requiredValues.some((value) => !value.trim()) || addressValues.some((value) => !value.trim())) {
      const msg = isThai ? "กรุณากรอกข้อมูลที่มีเครื่องหมาย * ให้ครบถ้วน" : "Please complete every required field before continuing.";
      setModalError(msg);
      regFormScrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setRegForm((prev) => ({
      ...prev,
      username: resolvedUsername,
      first_name: cleanFirstNameEn,
      last_name: cleanLastNameEn,
      birth_date: activeBirthDate,
      phone: activePhone,
    }));

    setIsTermsAgreed(false);
    setRegStep("review");
  };

  const handleConfirmSaveAndProceedToPin = async () => {
    if (!isTermsAgreed || isSaving) return;

    setIsSaving(true);
    setModalError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));

      const pending = readPendingRegistrationProfile();
      const resolvedFirstName = (regForm.first_name || profile.first_name || pending?.firstName || "").trim();
      const resolvedLastName = (regForm.last_name || profile.last_name || pending?.lastName || "").trim();
      const cleanFullName = `${resolvedFirstName} ${resolvedLastName}`.trim();
      const cleanIdCard = regForm.id_card.trim().replace(/\D/g, "");
      const cleanBirthDate = (
        regForm.birth_date || profile.birth_date || pending?.birthDate ||
        (typeof window !== "undefined" ? localStorage.getItem("current_user_birth_date") || "" : "")
      ).trim();
      if (!isValidIsoDate(cleanBirthDate)) {
        throw new Error(isThai
          ? "ไม่พบวันเกิดจากข้อมูลการสมัคร กรุณากลับไปสมัครด้วยแท็บเดิม"
          : "Birth date from registration is missing. Please continue in the original registration tab.");
      }
      const cleanUsername =
        (regForm.username.trim() ||
          profile.username ||
          pending?.username ||
          profile.email?.split("@")[0]?.replace(/[^a-zA-Z0-9._-]/g, "") ||
          "employee").toLowerCase();
      const resolvedPhone = (
        regForm.phone ||
        profile.phone ||
        pending?.phone ||
        (typeof window !== "undefined" ? localStorage.getItem("current_user_phone") || "" : "")
      ).trim();

      const currentAddress = parseAddressString(regForm.current_address);
      const registeredAddress = parseAddressString(regForm.registered_address);
      const branch = branchesList.find((item) => item.id === regForm.branch_id || item.branch_name === regForm.branch_name) ?? DEFAULT_BRANCHES[0];
      const options = await getOnboardingOptions();
      const facility = options.data.facilities.find(
        (item) => item.id === regForm.branch_id || item.code === branch.branch_code || item.name === branch.branch_name,
      ) ?? options.data.facilities[0];
      if (!facility) throw new Error("No active facility is available for this profile.");
      const department = options.data.departments.find(
        (item) => item.id === regForm.department || item.code === regForm.department || item.name === regForm.department,
      );
      const response = await apiPut<import("@/lib/profiles").EmployeeProfileDto>("/api/profile/me/complete", {
        username: cleanUsername,
        prefix: regForm.prefix.trim(),
        firstNameTh: regForm.first_name_th.trim(),
        lastNameTh: regForm.last_name_th.trim(),
        nicknameTh: regForm.nickname_th.trim(),
        firstNameEn: resolvedFirstName,
        lastNameEn: resolvedLastName,
        nicknameEn: regForm.nickname.trim(),
        citizenId: cleanIdCard,
        birthDate: cleanBirthDate,
        gender: regForm.gender,
        bloodType: regForm.blood_type,
        maritalStatus: regForm.marital_status.trim(),
        nationality: regForm.nationality.trim(),
        religion: regForm.religion.trim(),
        educationLevel: regForm.education_level,
        majorSubject: regForm.major_subject.trim(),
        universityNameTh: regForm.university_th.trim() || regForm.university_name.trim(),
        universityNameEn: regForm.university_en.trim() || regForm.university_name.trim(),
        phone: resolvedPhone,
        emergencyContactNameTh: regForm.emergency_contact_name_th.trim(),
        emergencyContactNameEn: regForm.emergency_contact_name.trim() || null,
        emergencyContactRelationship: regForm.emergency_contact_relationship,
        emergencyContactPhone: regForm.emergency_contact_phone.trim(),
        currentAddress: {
          houseNo: currentAddress.houseNo,
          village: currentAddress.moo || null,
          soi: currentAddress.soi || null,
          province: currentAddress.province_en,
          district: currentAddress.district_en,
          subdistrict: currentAddress.subdistrict_en,
          postalCode: currentAddress.zipcode,
        },
        registeredAddress: {
          houseNo: registeredAddress.houseNo,
          village: registeredAddress.moo || null,
          soi: registeredAddress.soi || null,
          province: registeredAddress.province_en,
          district: registeredAddress.district_en,
          subdistrict: registeredAddress.subdistrict_en,
          postalCode: registeredAddress.zipcode,
        },
        facilityId: facility.id,
        departmentId: department?.id ?? null,
        termsAccepted: true,
      });
      const result = response.data;

      const updatedProfile: Partial<EmployeeProfile> = { ...toEmployeeProfile(result), full_name: cleanFullName };
      onSuccess(updatedProfile);
      if (typeof window !== "undefined") {
        localStorage.setItem("dawh_user_profile", JSON.stringify(updatedProfile));
        sessionStorage.removeItem("dawh_pending_profile");
        window.dispatchEvent(new CustomEvent("dawh_profile_updated", { detail: updatedProfile }));
      }

      setSaveSuccess(true);
      notify.success(
        isThai ? "บันทึกข้อมูลโปรไฟล์เรียบร้อย" : "Profile Updated Successfully",
        {
          message: isThai
            ? "ข้อมูลส่วนตัวของท่านได้รับการบันทึกแล้ว"
            : "Your employee profile has been saved.",
          duration: 4000,
        }
      );
      setTimeout(() => {
        setSaveSuccess(false);
        onClose();
        setRegStep("fill");
        onOpenPinSetup();
      }, 700);
    } catch (err: unknown) {
      let errorMsg = err instanceof Error ? err.message : null;
      if (err instanceof ApiRequestError && err.details && typeof err.details === "object") {
        const details = Object.entries(err.details as Record<string, unknown>)
          .map(([field, message]) => `${field}: ${String(message)}`)
          .join("; ");
        if (details) errorMsg = `${err.message} ${details}`;
      }
      errorMsg ||= isThai ? "เกิดข้อผิดพลาดในการบันทึกข้อมูล" : "Failed to update profile";
      setModalError(errorMsg);
      notify.error(isThai ? "เกิดข้อผิดพลาด" : "Save Failed", {
        message: errorMsg,
        duration: 5000,
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className={`w-full max-w-[720px] max-h-[90vh] rounded-[20px] border shadow-2xl flex flex-col overflow-hidden ${
              isLight ? "bg-white border-[#E4E4E7]" : "bg-[#383838] border-[#444444]"
            }`}
          >
            {/* Modal Header (Fixed) */}
            <div
              className={`flex items-center justify-between p-5 sm:p-6 border-b shrink-0 ${
                isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444]/60 bg-[#383838]"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl shrink-0 ${isLight ? "bg-[#222222] text-white" : "bg-white text-[#222222]"}`}>
                  {regStep === "fill" ? <User size={18} /> : <FileText size={18} />}
                </div>
                <div>
                  <h4
                    className={`font-bold text-[18px] leading-tight ${
                      isLight ? "text-[#222222]" : "text-[#FFFFFF]"
                    }`}
                    style={{ fontFamily: "var(--font-outfit), sans-serif" }}
                  >
                    {regStep === "fill"
                      ? isThai ? "กรอกข้อมูลโปรไฟล์เพิ่มเติม (ลงทะเบียนรอบ 2)" : "Complete Profile Information"
                      : isThai ? "ตรวจสอบข้อมูลและยอมรับเงื่อนไข" : "Review Information & Terms"}
                  </h4>
                  <p className={`text-[12px] mt-0.5 ${isLight ? "text-[#666666]" : "text-[#E4E4E7]"}`}>
                    {regStep === "fill"
                      ? isThai ? "ขั้นตอนที่ 1 จาก 2 : กรุณากรอกข้อมูลส่วนตัวเพื่อความสมบูรณ์ของระบบ" : "Step 1 of 2 : Please fill in your enterprise employee records"
                      : isThai ? "ขั้นตอนที่ 2 จาก 2 : กรุณาตรวจสอบข้อมูลและยอมรับข้อตกลงก่อนบันทึก" : "Step 2 of 2 : Please verify your information and agree to terms"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {/* DEV_TESTPUSHFILL_START - Text button for test fill (DELETE ME EASILY WHEN DONE) */}
                <button
                  type="button"
                  onClick={handleTestPushFill}
                  className="text-xs text-amber-500 hover:text-amber-400 underline cursor-pointer p-1 font-mono"
                  title="Auto-fill test data"
                >
                  testpushfill
                </button>
                {/* DEV_TESTPUSHFILL_END */}

                <button
                  type="button"
                  onClick={() => onOpenExitConfirm()}
                  className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                    isLight ? "text-slate-400 hover:text-[#222222] hover:bg-slate-100" : "text-[#E4E4E7] hover:text-[#FFFFFF] hover:bg-[#444444]"
                  }`}
                  title={isThai ? "ปิด / ออกจากแบบฟอร์ม" : "Close"}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {regStep === "fill" ? (
              /* ================================================================= */
              /* STEP 1: FORM INPUTS                                              */
              /* ================================================================= */
              <form onSubmit={handleValidateAndProceedToReview} className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                {/* Scroll-to-bottom Down Arrow Button (hides when at bottom) */}
                {!isFormAtBottom && (
                  <button
                    type="button"
                    onClick={() => regFormScrollRef.current?.scrollTo({ top: regFormScrollRef.current.scrollHeight, behavior: "smooth" })}
                    className={`absolute bottom-20 right-5 sm:right-7 p-2.5 rounded-full shadow-lg border transition-all hover:scale-110 active:scale-95 cursor-pointer z-20 flex items-center justify-center animate-in fade-in duration-200 ${
                      isLight
                        ? "bg-white/95 hover:bg-white border-[#E4E4E7] text-[#222222] shadow-slate-400/30"
                        : "bg-[#282828]/95 hover:bg-[#333333] border-[#555555] text-white shadow-black/50"
                    }`}
                    title={isThai ? "เลื่อนลงไปล่างสุด" : "Scroll to bottom"}
                  >
                    <ChevronDown size={18} />
                  </button>
                )}

                {/* Scrollable Form Body (Scrollbar strictly contained inside between header and footer) */}
                <div ref={regFormScrollRef} onScroll={handleFormScroll} className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 pb-36 space-y-4">
                  {modalError && (
                    <p className="text-xs text-rose-500 font-medium py-1 select-none">
                      {modalError}
                    </p>
                  )}

                  {/* Section: ข้อมูลชื่อและบัญชีผู้ใช้ (Name & Account) */}
                  <div className="flex flex-col gap-3">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลชื่อและบัญชีผู้ใช้" : "Name & Account Details"}
                    </h5>

                    {/* Thai Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อจริง (ภาษาไทย) *" : "First Name (Thai) *"}
                        </label>
                        <input
                          type="text"
                          value={regForm.first_name_th}
                          onChange={(e) => setRegForm({ ...regForm, first_name_th: e.target.value })}
                          placeholder={isThai ? "ชื่อจริง" : "First Name"}
                          className={getInputClass("first_name_th")}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "นามสกุล (ภาษาไทย) *" : "Last Name (Thai) *"}
                        </label>
                        <input
                          type="text"
                          value={regForm.last_name_th}
                          onChange={(e) => setRegForm({ ...regForm, last_name_th: e.target.value })}
                          placeholder={isThai ? "นามสกุล" : "Last Name"}
                          className={getInputClass("last_name_th")}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อเล่น (ภาษาไทย)" : "Nickname (Thai)"}
                        </label>
                        <input
                          type="text"
                          value={regForm.nickname_th}
                          onChange={(e) => setRegForm({ ...regForm, nickname_th: e.target.value })}
                          placeholder={isThai ? "ชื่อเล่น" : "Nickname"}
                          className={getInputClass("nickname_th")}
                        />
                      </div>
                    </div>

                      {/* English Name (3 columns) */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="flex flex-col gap-1">
                          <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>First Name (English) *</label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={regForm.first_name || profile.first_name || ""}
                              onChange={(e) => setRegForm({ ...regForm, first_name: e.target.value })}
                              placeholder="First Name"
                              className={getInputClass("first_name")}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>Last Name (English) *</label>
                          <div className="relative flex items-center">
                            <input
                              type="text"
                              value={regForm.last_name || profile.last_name || ""}
                              onChange={(e) => setRegForm({ ...regForm, last_name: e.target.value })}
                              placeholder="Last Name"
                              className={getInputClass("last_name")}
                            />
                          </div>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>Nickname (English)</label>
                          <input
                            type="text"
                            value={regForm.nickname}
                            onChange={(e) => setRegForm({ ...regForm, nickname: e.target.value })}
                            placeholder="Nickname"
                            className={getInputClass("nickname")}
                          />
                        </div>
                      </div>

                    {/* Prefix and Username (2 columns) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "คำนำหน้าชื่อ" : "Prefix"}
                        </label>
                        <FormCustomSelect
                          id="prefix"
                          value={regForm.prefix || ""}
                          placeholder={isThai ? "คำนำหน้าชื่อ" : "Prefix"}
                          options={[
                            { value: "", label: isThai ? "- ไม่ระบุ -" : "- None -" },
                            { value: "mr", label: isThai ? "นาย" : "Mr." },
                            { value: "mrs", label: isThai ? "นาง" : "Mrs." },
                            { value: "miss", label: isThai ? "นางสาว" : "Miss" },
                          ]}
                          isOpen={activeDropdownId === "prefix"}
                          onToggle={() => setActiveDropdownId((prev) => (prev === "prefix" ? null : "prefix"))}
                          onSelect={(val) => {
                            setRegForm({ ...regForm, prefix: val });
                            setActiveDropdownId(null);
                          }}
                          isLight={isLight}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อผู้ใช้" : "Username"}
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={regForm.username || profile.username || (profile.email ? profile.email.split("@")[0] : "") || ""}
                            placeholder={isThai ? "ชื่อผู้ใช้" : "Username"}

                            className={`w-full p-2.5 pr-9 rounded-lg border text-xs font-mono font-medium outline-none cursor-not-allowed select-none transition-all ${
                              isLight
                                ? "bg-[#F0F0F0] border-[#E5E5E5] text-[#555555]"
                                : "bg-[#202020] border-[#383838] text-[#A1A1AA]"
                            }`}
                          />
                          <div
                            className={`absolute right-3 pointer-events-none ${
                              isLight ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            <Lock size={13} />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section: ข้อมูลส่วนบุคคลและเอกสารประจำตัว (Personal Identity & Details) */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลส่วนบุคคลและเอกสารประจำตัว" : "Personal Identity & Details"}
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "เลขประจำตัวประชาชน *" : "National ID Card *"}
                        </label>
                        <input
                          type="text"
                          maxLength={13}
                          value={regForm.id_card}
                          onChange={(e) => setRegForm({ ...regForm, id_card: e.target.value.replace(/\D/g, "") })}
                          placeholder={isThai ? "เลขประจำตัวประชาชน 13 หลัก" : "13-Digit National ID"}
                          className={getInputClass("id_card", "font-mono tracking-wider")}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "วัน/เดือน/ปีเกิด" : "Birth Date"}
                        </label>
                        <div className="relative flex items-center">
                          <input
                            type="text"
                            readOnly
                            disabled
                            value={formatBirthDate(regForm.birth_date || profile.birth_date)}
                            placeholder={isThai ? "วัน/เดือน/ปีเกิด" : "Birth Date"}
                            className={`w-full p-2.5 pr-9 rounded-lg border text-xs font-mono font-medium outline-none cursor-not-allowed select-none transition-all ${
                              isLight
                                ? "bg-[#F0F0F0] border-[#E5E5E5] text-[#555555]"
                                : "bg-[#202020] border-[#383838] text-[#A1A1AA]"
                            }`}
                          />
                          <div
                            className={`absolute right-3 pointer-events-none ${
                              isLight ? "text-slate-400" : "text-slate-500"
                            }`}
                          >
                            <Lock size={13} />
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "เพศ" : "Gender"}
                        </label>
                        <FormCustomSelect
                          id="gender"
                          value={regForm.gender || "ชาย"}
                          placeholder={isThai ? "เพศ" : "Gender"}
                          options={[
                            { value: "ชาย", label: isThai ? "ชาย" : "Male" },
                            { value: "หญิง", label: isThai ? "หญิง" : "Female" },
                            { value: "อื่นๆ", label: isThai ? "อื่นๆ" : "Other" },
                          ]}
                          isOpen={activeDropdownId === "gender"}
                          onToggle={() => setActiveDropdownId((prev) => (prev === "gender" ? null : "gender"))}
                          onSelect={(val) => {
                            setRegForm({ ...regForm, gender: val });
                            setActiveDropdownId(null);
                          }}
                          isLight={isLight}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "กรุ๊ปเลือด" : "Blood Type"}
                        </label>
                        <FormCustomSelect
                          id="blood_type"
                          value={regForm.blood_type}
                          placeholder={isThai ? "เลือกกรุ๊ปเลือด" : "Select Blood Type"}
                          options={[
                            { value: "A", label: "A" },
                            { value: "B", label: "B" },
                            { value: "AB", label: "AB" },
                            { value: "O", label: "O" },
                          ]}
                          isOpen={activeDropdownId === "blood_type"}
                          onToggle={() => setActiveDropdownId((prev) => (prev === "blood_type" ? null : "blood_type"))}
                          onSelect={(val) => {
                            setRegForm({ ...regForm, blood_type: val });
                            setActiveDropdownId(null);
                          }}
                          isLight={isLight}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "สถานภาพสมรส" : "Marital Status"}
                        </label>
                        <FormCustomSelect
                          id="marital_status"
                          value={regForm.marital_status}
                          placeholder={isThai ? "เลือกสถานภาพ" : "Select Status"}
                          options={[
                            { value: "โสด", label: isThai ? "โสด" : "Single" },
                            { value: "สมรส", label: isThai ? "สมรส" : "Married" },
                            { value: "หย่าร้าง", label: isThai ? "หย่าร้าง" : "Divorced" },
                            { value: "หม้าย", label: isThai ? "หม้าย" : "Widowed" },
                          ]}
                          isOpen={activeDropdownId === "marital_status"}
                          onToggle={() => setActiveDropdownId((prev) => (prev === "marital_status" ? null : "marital_status"))}
                          onSelect={(val) => {
                            setRegForm({ ...regForm, marital_status: val });
                            setActiveDropdownId(null);
                          }}
                          isLight={isLight}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "สัญชาติ" : "Nationality"}
                        </label>
                        <input
                          type="text"
                          value={regForm.nationality}
                          onChange={(e) => setRegForm({ ...regForm, nationality: e.target.value })}
                          placeholder={isThai ? "ระบุสัญชาติ (เช่น ไทย)" : "e.g. Thai"}
                          className={`p-2.5 rounded-lg border text-xs outline-none ${
                            isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#FFFFFF]"
                          }`}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ศาสนา" : "Religion"}
                        </label>
                        <FormCustomSelect
                          id="religion"
                          value={religionChoice}
                          placeholder={isThai ? "เลือกศาสนา" : "Select Religion"}
                          options={[
                            { value: "พุทธ", label: isThai ? "พุทธ" : "Buddhism" },
                            { value: "อิสลาม", label: isThai ? "อิสลาม" : "Islam" },
                            { value: "คริสต์", label: isThai ? "คริสต์" : "Christianity" },
                            { value: "ฮินดู", label: isThai ? "ฮินดู" : "Hinduism" },
                            { value: "ซิกข์", label: isThai ? "ซิกข์" : "Sikhism" },
                            { value: "ไม่นับถือศาสนา", label: isThai ? "ไม่นับถือศาสนา" : "Non-religious / None" },
                            { value: "อื่นๆ", label: isThai ? "อื่นๆ (ระบุเอง)" : "Other (Specify)" },
                          ]}
                          isOpen={activeDropdownId === "religion"}
                          onToggle={() => setActiveDropdownId((prev) => (prev === "religion" ? null : "religion"))}
                          onSelect={(val) => {
                            setReligionChoice(val);
                            if (val === "อื่นๆ") {
                              setRegForm({ ...regForm, religion: customReligion });
                            } else {
                              setRegForm({ ...regForm, religion: val });
                              setCustomReligion("");
                            }
                            setActiveDropdownId(null);
                          }}
                          isLight={isLight}
                        />

                        {religionChoice === "อื่นๆ" && (
                          <input
                            type="text"
                            value={customReligion}
                            onChange={(e) => {
                              const val = e.target.value;
                              setCustomReligion(val);
                              setRegForm({ ...regForm, religion: val });
                            }}
                            placeholder={isThai ? "กรุณาระบุศาสนาของคุณ" : "Please specify religion"}
                            className={`mt-1.5 p-2.5 rounded-lg border text-xs outline-none animate-in fade-in zoom-in-95 duration-150 ${
                              isLight ? "bg-white border-[#222222] text-[#222222]" : "bg-[#282828] border-white text-[#FFFFFF]"
                            }`}
                            autoFocus
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Section: ข้อมูลการศึกษา (Education Details) */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลการศึกษา" : "Educational Background"}
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "วุฒิการศึกษา" : "Education Level"}
                        </label>
                        <FormCustomSelect
                          id="education_level"
                          value={regForm.education_level || "ปริญญาตรี"}
                          placeholder={isThai ? "วุฒิการศึกษา" : "Education Level"}
                          options={[
                            { value: "มัธยมศึกษาตอนปลาย / ปวช.", label: isThai ? "มัธยมศึกษาตอนปลาย / ปวช." : "High School / Vocational" },
                            { value: "ปวส. / อนุปริญญา", label: isThai ? "ปวส. / อนุปริญญา" : "Diploma / Associate" },
                            { value: "ปริญญาตรี", label: isThai ? "ปริญญาตรี" : "Bachelor's Degree" },
                            { value: "ปริญญาโท", label: isThai ? "ปริญญาโท" : "Master's Degree" },
                            { value: "ปริญญาเอก", label: isThai ? "ปริญญาเอก" : "Doctorate / Ph.D." },
                            { value: "อื่นๆ", label: isThai ? "อื่นๆ" : "Other" },
                          ]}
                          isOpen={activeDropdownId === "education_level"}
                          onToggle={() => setActiveDropdownId((prev) => (prev === "education_level" ? null : "education_level"))}
                          onSelect={(val) => {
                            setRegForm({ ...regForm, education_level: val });
                            setActiveDropdownId(null);
                          }}
                          isLight={isLight}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <MajorSubjectAutocomplete
                          value={regForm.major_subject}
                          onChange={(en) => setRegForm({ ...regForm, major_subject: en })}
                          isLight={isLight}
                          isThai={isThai}
                        />
                      </div>
                    </div>

                    <UniversitySearchSelect
                      valueTh={regForm.university_th}
                      valueEn={regForm.university_en}
                      onChange={(th, en) => {
                        setRegForm({
                          ...regForm,
                          university_th: th,
                          university_en: en,
                          university_name: isThai ? (th || en) : (en || th),
                        });
                      }}
                      isLight={isLight}
                      isThai={isThai}
                    />
                  </div>

                  {/* Section: ข้อมูลการติดต่อและที่อยู่อาศัย (Contact & Addresses) */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลการติดต่อและที่อยู่อาศัย" : "Contact & Addresses"}
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "เบอร์โทรศัพท์มือถือ *" : "Mobile Phone *"}
                        </label>
                        {lockedPhone ? (
                          <div className="relative flex items-center">
                            <input
                              type="tel"
                              readOnly
                              disabled
                              value={lockedPhone}
                              className={`w-full p-2.5 pr-9 rounded-lg border text-xs font-mono font-medium outline-none cursor-not-allowed select-none transition-all ${
                                isLight
                                  ? "bg-[#F0F0F0] border-[#E5E5E5] text-[#555555]"
                                  : "bg-[#202020] border-[#383838] text-[#A1A1AA]"
                              }`}
                            />
                            <div className={`absolute right-3 pointer-events-none ${isLight ? "text-slate-400" : "text-slate-500"}`}>
                              <Lock size={13} />
                            </div>
                          </div>
                        ) : (
                          <input
                            type="tel"
                            value={regForm.phone}
                            onChange={(e) => setRegForm({ ...regForm, phone: e.target.value })}
                            placeholder={isThai ? "เบอร์โทรศัพท์มือถือ" : "Mobile Phone"}
                            className={getInputClass("phone", "font-mono")}
                          />
                        )}
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ความสัมพันธ์ผู้ติดต่อฉุกเฉิน *" : "Emergency Relationship *"}
                        </label>
                        <FormCustomSelect
                          id="emergency_contact_relationship"
                          value={regForm.emergency_contact_relationship || "บิดา/มารดา"}
                          placeholder={isThai ? "ความสัมพันธ์" : "Relationship"}
                          options={[
                            { value: "บิดา/มารดา", label: isThai ? "บิดา / มารดา" : "Parents" },
                            { value: "คู่สมรส", label: isThai ? "คู่สมรส" : "Spouse" },
                            { value: "พี่/น้อง", label: isThai ? "พี่ / น้อง" : "Sibling" },
                            { value: "บุตร", label: isThai ? "บุตร" : "Child" },
                            { value: "ญาติ", label: isThai ? "ญาติ" : "Relative" },
                            { value: "เพื่อน", label: isThai ? "เพื่อนสนิท" : "Friend" },
                            { value: "อื่นๆ", label: isThai ? "อื่นๆ" : "Other" },
                          ]}
                          isOpen={activeDropdownId === "emergency_contact_relationship"}
                          onToggle={() => setActiveDropdownId((prev) => (prev === "emergency_contact_relationship" ? null : "emergency_contact_relationship"))}
                          onSelect={(val) => {
                            setRegForm({ ...regForm, emergency_contact_relationship: val });
                            setActiveDropdownId(null);
                          }}
                          isLight={isLight}
                        />
                      </div>
                    </div>

                    {/* Emergency Contact: Name TH, Name EN, Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อผู้ติดต่อฉุกเฉิน (ภาษาไทย) *" : "Emergency Contact (Thai) *"}
                        </label>
                        <input
                          type="text"
                          placeholder={isThai ? "ชื่อผู้ติดต่อฉุกเฉิน (ภาษาไทย)" : "Emergency Contact Name"}
                          value={regForm.emergency_contact_name_th}
                          onChange={(e) => setRegForm({ ...regForm, emergency_contact_name_th: e.target.value })}
                          className={`p-2.5 rounded-lg border text-xs outline-none ${
                            isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#FFFFFF]"
                          }`}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อผู้ติดต่อฉุกเฉิน (English)" : "Emergency Contact (English)"}
                        </label>
                        <input
                          type="text"
                          placeholder={isThai ? "ชื่อผู้ติดต่อฉุกเฉิน (English)" : "Emergency Contact Name"}
                          value={regForm.emergency_contact_name}
                          onChange={(e) => setRegForm({ ...regForm, emergency_contact_name: e.target.value })}
                          className={`p-2.5 rounded-lg border text-xs outline-none ${
                            isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#FFFFFF]"
                          }`}
                        />
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "เบอร์โทรติดต่อฉุกเฉิน *" : "Emergency Phone *"}
                        </label>
                        <input
                          type="tel"
                          value={regForm.emergency_contact_phone}
                          onChange={(e) => setRegForm({ ...regForm, emergency_contact_phone: e.target.value })}
                          placeholder={isThai ? "เบอร์โทรติดต่อฉุกเฉิน" : "Emergency Phone"}
                          className={`p-2.5 rounded-lg border text-xs font-mono outline-none ${
                            isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      <ThaiAddressSelector
                        label={isThai ? "ที่อยู่ปัจจุบัน" : "Current Address"}
                        isRequired
                        value={regForm.current_address}
                        onChange={(val) => setRegForm({ ...regForm, current_address: val })}
                        isLight={isLight}
                        isThai={isThai}
                      />

                      <ThaiAddressSelector
                        label={isThai ? "ที่อยู่ตามทะเบียนบ้าน" : "Registered Address"}
                        isRequired
                        value={regForm.registered_address}
                        onChange={(val) => setRegForm({ ...regForm, registered_address: val })}
                        isLight={isLight}
                        isThai={isThai}
                        showCopyButton={true}
                        onCopyFromCurrent={() => {
                          if (regForm.current_address) {
                            setRegForm({ ...regForm, registered_address: regForm.current_address });
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Section: สังกัดงานและองค์กร (Branch Assignment) */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลสาขาประจำการ" : "Branch Assignment"}
                    </h5>

                    <div className="grid grid-cols-1 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "สาขาที่สังกัด *" : "Branch Assignment *"}
                        </label>

                        {/* Custom Dropdown Trigger Button with Auto-Scroll */}
                        <FormCustomSelect
                          id="branch"
                          value={regForm.branch_name || ""}
                          placeholder={isThai ? "เลือกสาขาที่สังกัด" : "Select Branch Assignment"}
                          options={branchesList.map((b) => ({
                            value: b.branch_name,
                            label: isThai ? b.branch_name : (b.branch_name_en || b.branch_name),
                            sublabel: b.address,
                            badge: b.branch_code,
                          }))}
                          isOpen={activeDropdownId === "branch"}
                          onToggle={() => setActiveDropdownId((prev) => (prev === "branch" ? null : "branch"))}
                          onSelect={(val) => {
                            const matched = branchesList.find((b) => b.branch_name === val);
                            setRegForm({
                              ...regForm,
                              branch_name: val,
                              branch_id: matched?.id || regForm.branch_id,
                            });
                            setActiveDropdownId(null);
                          }}
                          isLight={isLight}
                          isInvalid={isFieldInvalid("branch_name")}
                          icon={<Building2 size={13} />}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Modal Actions (Fixed at bottom) */}
                <div
                  className={`flex items-center justify-between gap-2.5 p-4 sm:px-6 border-t shrink-0 ${
                    isLight ? "border-[#E4E4E7] bg-[#FAFAFA]" : "border-[#444444]/60 bg-[#303030]"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    {modalError && (
                      <p className="text-xs text-rose-500 font-medium truncate select-none">
                        {modalError}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenExitConfirm()}
                      className={`px-4 py-2.5 text-xs font-semibold rounded-xl transition-colors cursor-pointer ${
                        isLight ? "text-slate-500 hover:text-[#222222] hover:bg-slate-200/50" : "text-[#E4E4E7] hover:text-[#FFFFFF] hover:bg-[#444444]"
                      }`}
                    >
                      {isThai ? "ยกเลิก" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      className={`px-6 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all ${
                        isLight ? "bg-[#222222] text-white hover:bg-black" : "bg-[#FFFFFF] text-[#222222] hover:bg-[#F4F4F5]"
                      }`}
                    >
                      <span>{isThai ? "ตรวจสอบข้อมูลและยอมรับเงื่อนไข" : "Review & Continue"}</span>
                      <ArrowLeft size={14} className="rotate-180" />
                    </button>
                  </div>
                </div>
              </form>
            ) : (
              /* ================================================================= */
              /* STEP 2: REVIEW SUMMARY & TERMS OF SERVICE AGREEMENT               */
              /* ================================================================= */
              <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
                {/* Scroll-to-bottom Down Arrow Button (hides when at bottom) */}
                {!isReviewAtBottom && (
                  <button
                    type="button"
                    onClick={() => reviewScrollRef.current?.scrollTo({ top: reviewScrollRef.current.scrollHeight, behavior: "smooth" })}
                    className={`absolute bottom-20 right-5 sm:right-7 p-2.5 rounded-full shadow-lg border transition-all hover:scale-110 active:scale-95 cursor-pointer z-20 flex items-center justify-center animate-in fade-in duration-200 ${
                      isLight
                        ? "bg-white/95 hover:bg-white border-[#E4E4E7] text-[#222222] shadow-slate-400/30"
                        : "bg-[#282828]/95 hover:bg-[#333333] border-[#555555] text-white shadow-black/50"
                    }`}
                    title={isThai ? "เลื่อนลงไปล่างสุด" : "Scroll to bottom"}
                  >
                    <ChevronDown size={18} />
                  </button>
                )}

                {/* Scrollable Review Body */}
                <div ref={reviewScrollRef} onScroll={handleReviewScroll} className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 pb-20 space-y-4">
                  {modalError && (
                    <p className="text-xs text-rose-500 font-medium py-1 select-none">
                      {modalError}
                    </p>
                  )}

                  {/* Info Notice Banner */}
                  <div
                    className={`p-4 rounded-xl border flex items-start gap-3 ${
                      isLight ? "bg-slate-50 border-slate-200 text-[#222222]" : "bg-[#282828] border-[#444444] text-white"
                    }`}
                  >
                    <ShieldCheck size={18} className="text-[#2EC4B6] shrink-0 mt-0.5" />
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-bold">{isThai ? "สรุปข้อมูลการลงทะเบียนรอบ 2" : "Registration Summary"}</span>
                      <span className={`text-[11.5px] leading-relaxed ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                        {isThai
                          ? "โปรดตรวจสอบข้อมูลของท่านให้ถูกต้อง ข้อมูลทั้งหมดจะถูกใช้ในสัญญาจ้างงานและสิทธิ์การเข้าถึงระบบองค์กร"
                          : "Please carefully review your personal information. These records are tied to enterprise clearance and operations."}
                      </span>
                    </div>
                  </div>

                  {/* Section 1: ข้อมูลประจำตัวและชื่อ (Read-Only Form) */}
                  <div className="flex flex-col gap-3">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลชื่อและบัญชีผู้ใช้" : "Name & Account Details"}
                    </h5>

                    {/* Thai Names */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "คำนำหน้า" : "Prefix"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={getPrefixDisplayLabel(regForm.prefix, isThai ? "TH" : "EN")}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อจริง (ภาษาไทย)" : "First Name (Thai)"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.first_name_th || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "นามสกุล (ภาษาไทย)" : "Last Name (Thai)"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.last_name_th || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อเล่น (ภาษาไทย)" : "Nickname (Thai)"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.nickname_th || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>

                    {/* English Names & Username */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "First Name (English)" : "First Name"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.first_name || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "Last Name (English)" : "Last Name"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.last_name || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "Nickname (English)" : "Nickname"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.nickname || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อผู้ใช้ในระบบ" : "Username"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={`@${regForm.username || "—"}`}
                          className={`w-full p-2.5 rounded-lg border text-xs font-mono outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>

                    {/* Personal Identity Details: ID Card, Birth Date, Gender, Blood, Marital, Nationality, Religion */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1 sm:col-span-2">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "เลขประจำตัวประชาชน (13 หลัก)" : "Citizen ID Card (13 Digits)"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.id_card || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs font-mono tracking-wider outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "วันเดือนปีเกิด" : "Birth Date"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={formatBirthDate(regForm.birth_date)}
                          className={`w-full p-2.5 rounded-lg border text-xs font-mono outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "เพศ" : "Gender"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.gender || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "กรุ๊ปเลือด" : "Blood Type"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.blood_type || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs font-semibold outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "สถานภาพสมรส" : "Marital Status"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.marital_status || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "สัญชาติ" : "Nationality"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.nationality || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ศาสนา" : "Religion"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.religion || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 2: ข้อมูลการศึกษา (Read-Only Form) */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลการศึกษา" : "Educational Background"}
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "วุฒิการศึกษา" : "Education Level"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.education_level || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "สาขาวิชา" : "Major Subject"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.major_subject || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "สถาบันการศึกษา / มหาวิทยาลัย" : "University / Institution"}
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={
                          regForm.university_th
                            ? `${regForm.university_th} ${regForm.university_en ? `(${regForm.university_en})` : ""}`
                            : regForm.university_name || "—"
                        }
                        className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                          isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Section 3: ข้อมูลการติดต่อและที่อยู่อาศัย (Read-Only Form) */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลการติดต่อและที่อยู่อาศัย" : "Contact & Addresses"}
                    </h5>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "เบอร์โทรศัพท์มือถือ" : "Mobile Phone"}
                        </label>
                        <input
                          type="tel"
                          readOnly
                          disabled
                          value={regForm.phone || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs font-mono outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ความสัมพันธ์ผู้ติดต่อฉุกเฉิน" : "Emergency Relationship"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.emergency_contact_relationship || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อผู้ติดต่อฉุกเฉิน (ภาษาไทย)" : "Emergency Contact (Thai)"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.emergency_contact_name_th || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ชื่อผู้ติดต่อฉุกเฉิน (English)" : "Emergency Contact (English)"}
                        </label>
                        <input
                          type="text"
                          readOnly
                          disabled
                          value={regForm.emergency_contact_name || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "เบอร์โทรติดต่อฉุกเฉิน" : "Emergency Phone"}
                        </label>
                        <input
                          type="tel"
                          readOnly
                          disabled
                          value={regForm.emergency_contact_phone || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs font-mono outline-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-3">
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ที่อยู่ปัจจุบัน" : "Current Address"}
                        </label>
                        <textarea
                          rows={2}
                          readOnly
                          disabled
                          value={regForm.current_address || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs leading-relaxed outline-none resize-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                          {isThai ? "ที่อยู่ตามทะเบียนบ้าน" : "Registered Address"}
                        </label>
                        <textarea
                          rows={2}
                          readOnly
                          disabled
                          value={regForm.registered_address || "—"}
                          className={`w-full p-2.5 rounded-lg border text-xs leading-relaxed outline-none resize-none cursor-not-allowed select-none ${
                            isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Section 4: สังกัดงานและองค์กร (Read-Only Form) */}
                  <div className="flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
                    <h5 className={`font-bold text-xs uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
                      {isThai ? "ข้อมูลสาขาประจำการ" : "Branch Assignment"}
                    </h5>
                    <div className="flex flex-col gap-1">
                      <label className={`text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
                        {isThai ? "สาขาที่สังกัด" : "Branch Assignment"}
                      </label>
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={regForm.branch_name || "สำนักงานใหญ่ (Headquarters)"}
                        className={`w-full p-2.5 rounded-lg border text-xs outline-none cursor-not-allowed select-none ${
                          isLight ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]" : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
                        }`}
                      />
                    </div>
                  </div>

                  {/* Terms of Service & Privacy Agreement Box */}
                  <div className="flex flex-col gap-2 pt-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${isLight ? "text-[#222222]" : "text-white"}`}>
                        <FileText size={13} />
                        <span>{isThai ? "ข้อตกลงและนโยบายความเป็นส่วนตัว" : "Terms & Privacy Policy"}</span>
                      </span>

                      <a
                        href="/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`text-xs flex items-center gap-1 font-medium transition-colors hover:underline cursor-pointer ${
                          isLight ? "text-zinc-600 hover:text-black" : "text-zinc-400 hover:text-white"
                        }`}
                        title={isThai ? "เปิดอ่านฉบับเต็มในแท็บใหม่" : "Open full terms in new tab"}
                      >
                        <span>{isThai ? "อ่านฉบับเต็ม" : "Read Full Terms"}</span>
                        <ArrowUpRight size={13} />
                      </a>
                    </div>

                    <div
                      className={`p-5 rounded-xl border min-h-[180px] max-h-[260px] overflow-y-auto text-xs leading-relaxed space-y-3.5 ${
                        isLight ? "bg-white border-[#E4E4E7] text-[#444444]" : "bg-[#1E1E1E] border-[#3E3E3E] text-[#D4D4D8]"
                      }`}
                    >
                      <div>
                        <span className={`font-bold block text-[13px] ${isLight ? "text-[#222222]" : "text-white"}`}>
                          {isThai ? "1. การคุ้มครองข้อมูลส่วนบุคคล" : "1. Data Protection & PDPA"}
                        </span>
                        <p className="mt-1">
                          {isThai
                            ? "ข้อมูลส่วนบุคคลทั้งหมดที่ท่านระบุจะถูกจัดเก็บ เข้ารหัส และประมวลผลอย่างปลอดภัยตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล เพื่อการบริหารงานบุคคลและสัญญาจ้างงาน"
                            : "All personal information provided is stored, encrypted, and processed in accordance with privacy laws for employment and clearance purposes."}
                        </p>
                      </div>
                      <div>
                        <span className={`font-bold block text-[13px] ${isLight ? "text-[#222222]" : "text-white"}`}>
                          {isThai ? "2. การรับรองความถูกต้องของข้อมูล" : "2. Truthfulness & Authenticity"}
                        </span>
                        <p className="mt-1">
                          {isThai
                            ? "ท่านรับรองว่าข้อมูลทั้งหมดที่ระบุไว้ข้างต้นเป็นความจริง ถูกต้อง และสมบูรณ์ทุกประการ"
                            : "You certify that all information submitted is true, complete, and accurate."}
                        </p>
                      </div>
                      <div>
                        <span className={`font-bold block text-[13px] ${isLight ? "text-[#222222]" : "text-white"}`}>
                          {isThai ? "3. การรักษาความปลอดภัยบัญชีและรหัส PIN" : "3. Account & PIN Security"}
                        </span>
                        <p className="mt-1">
                          {isThai
                            ? "บัญชีผู้ใช้และรหัส PIN 6 หลักที่ท่านจะกำหนดในขั้นตอนถัดไปเป็นสิทธิ์เฉพาะบุคคล ห้ามส่งต่อหรือเปิดเผยแก่บุคคลอื่น"
                            : "Your account credentials and the 6-digit PIN created in the next step are strictly personal and non-transferable."}
                        </p>
                      </div>
                    </div>

                    {/* Interactive Terms Checkbox */}
                    <button
                      type="button"
                      onClick={() => setIsTermsAgreed(!isTermsAgreed)}
                      className={`w-full py-1.5 px-0.5 flex items-start gap-3 text-left cursor-pointer select-none transition-opacity mt-1 hover:opacity-90 ${
                        isLight ? "text-[#333333]" : "text-[#E4E4E7]"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-[4px] border transition-all ${
                          isTermsAgreed
                            ? isLight
                              ? "bg-[#222222] border-[#222222] text-white"
                              : "bg-white border-white text-[#222222]"
                            : isLight
                            ? "border-[#CCCCCC] bg-white"
                            : "border-[#666666] bg-transparent"
                        }`}
                      >
                        {isTermsAgreed && <Check size={12} strokeWidth={3} />}
                      </div>
                      <span className="text-xs leading-relaxed">
                        {isThai ? (
                          <>
                            ฉันได้ตรวจสอบข้อมูลทั้งหมดข้างต้นถูกต้องครบถ้วน และยินยอมปฏิบัติตาม{" "}
                            <span className="font-semibold underline">เงื่อนไขการให้บริการ (Terms of Service)</span> และ{" "}
                            <span className="font-semibold underline">นโยบายความเป็นส่วนตัว (Privacy Policy)</span> ขององค์กรทุกประการ
                          </>
                        ) : (
                          <>
                            I have verified that all entered information is accurate and I agree to the{" "}
                            <span className="font-semibold underline">Terms of Service</span> and{" "}
                            <span className="font-semibold underline">Data Privacy Policy</span>.
                          </>
                        )}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Review Actions (Fixed at bottom) */}
                <div
                  className={`flex items-center justify-between gap-2.5 p-4 sm:px-6 border-t shrink-0 ${
                    isLight ? "border-[#E4E4E7] bg-[#FAFAFA]" : "border-[#444444]/60 bg-[#303030]"
                  }`}
                >
                  <div className="flex-1 min-w-0 pr-2">
                    {modalError && (
                      <p className="text-xs text-rose-500 font-medium truncate select-none">
                        {modalError}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setRegStep("fill")}
                    className={`px-4 py-2.5 text-xs font-semibold rounded-xl border flex items-center gap-1.5 transition-colors cursor-pointer ${
                      isLight
                        ? "border-[#E5E5E5] bg-white text-[#222222] hover:bg-slate-100"
                        : "border-[#555555] bg-[#282828] text-white hover:bg-[#333333]"
                    }`}
                  >
                    <ArrowLeft size={14} />
                    <span>{isThai ? "ย้อนกลับไปแก้ไข" : "Back to Edit"}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleConfirmSaveAndProceedToPin}
                    disabled={!isTermsAgreed || isSaving}
                    className={`px-6 py-2.5 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 shadow-md transition-all ${
                      !isTermsAgreed || isSaving
                        ? "opacity-50 cursor-not-allowed bg-slate-300 dark:bg-[#444444] text-slate-500 dark:text-slate-400"
                        : isLight
                        ? "bg-[#222222] text-white hover:bg-black cursor-pointer"
                        : "bg-[#FFFFFF] text-[#222222] hover:bg-[#F4F4F5] cursor-pointer"
                    }`}
                  >
                    {isSaving ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : saveSuccess ? (
                      <Check size={15} strokeWidth={2.5} className="text-[#2EC4B6]" />
                    ) : null}
                    <span>
                      {saveSuccess
                        ? (isThai ? "บันทึกเรียบร้อย!" : "Saved!")
                        : (isThai ? "บันทึกข้อมูล" : "Save")}
                    </span>
                  </button>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
  );
}

export default SecondaryRegModal;
