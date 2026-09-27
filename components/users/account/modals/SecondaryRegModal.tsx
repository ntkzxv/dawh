"use client";

import { useState, useRef, type FormEvent } from "react";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  FileText,
  Loader2,
  Lock,
  User,
  X,
} from "lucide-react";
import { useNotification } from "@/context/NotificationContext";
import {
  warehouseApi,
  type MemberFull,
  type MemberProfile,
} from "@/lib/api/warehouse";
import { message } from "@/components/warehouse/Ui";
import { PRESET_RELIGIONS } from "../types";
import { FormCustomSelect } from "../selectors/FormCustomSelect";
import { UniversitySearchSelect } from "../selectors/UniversitySearchSelect";
import { ThaiAddressSelector } from "../selectors/ThaiAddressSelector";
import { MajorSubjectAutocomplete } from "../selectors/MajorSubjectAutocomplete";
import DatePicker from "@/components/common/DatePicker";

type ProfileDraft = Record<keyof MemberProfile, string>;

const toDraft = (profile: MemberProfile): ProfileDraft => ({
  username: profile.username ?? "",
  prefix: profile.prefix ?? "",
  firstNameTh: profile.firstNameTh ?? "",
  lastNameTh: profile.lastNameTh ?? "",
  nicknameTh: profile.nicknameTh ?? "",
  firstNameEn: profile.firstNameEn ?? "",
  lastNameEn: profile.lastNameEn ?? "",
  nicknameEn: profile.nicknameEn ?? "",
  citizenId: profile.citizenId ?? "",
  birthDate: profile.birthDate ?? "",
  gender: profile.gender ?? "",
  bloodType: profile.bloodType ?? "",
  maritalStatus: profile.maritalStatus ?? "",
  nationality: profile.nationality ?? "",
  religion: profile.religion ?? "",
  department: profile.department ?? "",
  employmentStatus: profile.employmentStatus ?? "",
  endedOn: profile.endedOn ?? "",
  educationLevel: profile.educationLevel ?? "",
  majorSubject: profile.majorSubject ?? "",
  universityNameTh: profile.universityNameTh ?? "",
  universityNameEn: profile.universityNameEn ?? "",
  contactEmail: profile.contactEmail ?? "",
  emergencyContactNameEn: profile.emergencyContactNameEn ?? "",
  emergencyContactRelationship: profile.emergencyContactRelationship ?? "",
  registeredAddress: profile.registeredAddress ?? "",
  employeeCode: profile.employeeCode ?? "",
  phone: profile.phone ?? "",
  address: profile.address ?? "",
  startedOn: profile.startedOn ?? "",
  emergencyContactName: profile.emergencyContactName ?? "",
  emergencyContactPhone: profile.emergencyContactPhone ?? "",
});

export function SecondaryRegModal({
  isOpen,
  onClose,
  member,
  isLight,
  isThai,
  onSuccess,
}: {
  isOpen: boolean;
  onClose: () => void;
  member: MemberFull;
  isLight: boolean;
  isThai: boolean;
  onSuccess: () => Promise<void>;
}) {
  const { notify } = useNotification();
  const [step, setStep] = useState<"fill" | "review" | "terms">("fill");
  const name = member.name;
  const [form, setForm] = useState<ProfileDraft>(() => {
    const draft = toDraft(member.profile);
    if (!draft.contactEmail && member.email) {
      draft.contactEmail = member.email;
    }
    return draft;
  });
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);

  const [religionChoice, setReligionChoice] = useState(() => {
    const r = member.profile.religion ?? "";
    if (!r) return "";
    if (PRESET_RELIGIONS.includes(r)) return r;
    return "อื่นๆ";
  });
  const [customReligion, setCustomReligion] = useState(() => {
    const r = member.profile.religion ?? "";
    return PRESET_RELIGIONS.includes(r) ? "" : r;
  });

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [isFormAtBottom, setIsFormAtBottom] = useState(false);

  const reviewScrollRef = useRef<HTMLDivElement | null>(null);
  const [isReviewAtBottom, setIsReviewAtBottom] = useState(false);

  if (!isOpen) return null;

  const update = (key: keyof MemberProfile, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const handleFormScroll = () => {
    if (!scrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    setIsFormAtBottom(scrollHeight - scrollTop - clientHeight < 40);
  };

  const handleReviewScroll = () => {
    if (!reviewScrollRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = reviewScrollRef.current;
    setIsReviewAtBottom(scrollHeight - scrollTop - clientHeight < 40);
  };

  const input = `w-full h-[38px] px-2.5 rounded-[8px] border text-xs outline-none transition-all ${
    isLight
      ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222] focus:border-[#222222]"
      : "bg-[#282828] border-[#444444] text-white focus:border-white"
  }`;
  const readOnlyInput = `w-full h-[38px] px-2.5 rounded-[8px] border text-xs outline-none cursor-not-allowed select-none transition-all ${
    isLight
      ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]"
      : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
  }`;
  const readOnlyArea = `w-full min-h-[64px] p-2.5 rounded-[8px] border text-xs leading-relaxed outline-none resize-none cursor-not-allowed select-none transition-all ${
    isLight
      ? "bg-[#F4F4F5] border-[#E4E4E7] text-[#222222]"
      : "bg-[#222222] border-[#383838] text-[#FFFFFF]"
  }`;
  const label = `text-xs font-semibold ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`;

  const proceed = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!name.trim()) {
      setError(
        isThai ? "กรุณากรอกชื่อบัญชี" : "Please enter the account name.",
      );
      return;
    }
    setStep("review");
  };

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const profile = Object.fromEntries(
        Object.entries(form).map(([key, value]) => [key, value.trim() || null]),
      ) as Partial<MemberProfile>;

      await warehouseApi.updateMember(member.id, {
        name: name.trim(),
        profile,
      });
      await onSuccess();
      notify.success(
        isThai ? "บันทึกข้อมูลโปรไฟล์เรียบร้อย" : "Profile updated",
        {
          message: isThai
            ? "ข้อมูลส่วนตัวของคุณได้รับการอัปเดตแล้ว"
            : "Your personal information has been updated.",
        },
      );
      onClose();
    } catch (cause) {
      setError(message(cause));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="secondary-profile-title"
        className={`w-full max-w-[760px] max-h-[90vh] rounded-[20px] border shadow-2xl flex flex-col overflow-hidden ${
          isLight
            ? "bg-white border-[#E4E4E7]"
            : "bg-[#383838] border-[#444444]"
        }`}
      >
        {/* Header */}
        <header
          className={`flex items-center justify-between p-5 sm:p-6 border-b shrink-0 ${
            isLight
              ? "border-[#E4E4E7] bg-white"
              : "border-[#444444]/60 bg-[#383838]"
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`p-2.5 rounded-xl shrink-0 ${
                isLight ? "bg-[#222222] text-white" : "bg-white text-[#222222]"
              }`}
            >
              {step === "fill" ? <User size={18} /> : <FileText size={18} />}
            </div>
            <div className="min-w-0">
              <h4
                id="secondary-profile-title"
                className={`font-outfit font-bold text-[18px] leading-tight ${
                  isLight ? "text-[#222222]" : "text-white"
                }`}
              >
                {step === "fill"
                  ? isThai
                    ? "แก้ไขข้อมูลโปรไฟล์"
                    : "Edit Profile Information"
                  : step === "review"
                    ? isThai
                      ? "ตรวจสอบข้อมูลก่อนบันทึก"
                      : "Review Profile Information"
                    : isThai
                      ? "ข้อกำหนดการให้บริการ"
                      : "Terms of Service"}
              </h4>
              <p
                className={`text-[12px] mt-0.5 ${
                  isLight ? "text-[#666666]" : "text-[#E4E4E7]"
                }`}
              >
                {step === "fill"
                  ? isThai
                    ? "ขั้นตอนที่ 1 จาก 3 : แก้ไขข้อมูลส่วนตัว ข้อมูลการศึกษา และที่อยู่"
                    : "Step 1 of 3: Update personal, education, and address details"
                  : step === "review"
                    ? isThai
                      ? "ขั้นตอนที่ 2 จาก 3 : ตรวจสอบความถูกต้องของข้อมูล"
                      : "Step 2 of 3: Verify your information"
                    : isThai
                      ? "ขั้นตอนที่ 3 จาก 3 : อ่านข้อกำหนดก่อนยืนยัน"
                      : "Step 3 of 3: Read the terms before confirming"}
              </p>
            </div>
          </div>
          <button
            type="button"
            disabled={busy}
            onClick={onClose}
            title={isThai ? "ปิด" : "Close"}
            className={`p-1.5 rounded-lg shrink-0 ${
              isLight
                ? "text-slate-400 hover:text-[#222222] hover:bg-slate-100"
                : "text-[#E4E4E7] hover:text-white hover:bg-[#444444]"
            }`}
          >
            <X size={20} />
          </button>
        </header>

        {/* Body */}
        {step === "fill" ? (
          <form
            onSubmit={proceed}
            className="flex-1 flex flex-col min-h-0 overflow-hidden relative"
          >
            {/* Scroll-to-bottom Down Arrow Button */}
            {!isFormAtBottom && (
              <button
                type="button"
                onClick={() =>
                  scrollRef.current?.scrollTo({
                    top: scrollRef.current.scrollHeight,
                    behavior: "smooth",
                  })
                }
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

            <div
              ref={scrollRef}
              onScroll={handleFormScroll}
              className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 pb-28 space-y-6"
            >
              {error && (
                <p role="alert" className="text-xs text-[#E74C3C] font-medium">
                  {error}
                </p>
              )}

              {/* 1. Account & Name */}
              <Section
                title={
                  isThai ? "ข้อมูลชื่อและบัญชีผู้ใช้" : "Name & Account Details"
                }
                isLight={isLight}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={isThai ? "ชื่อบัญชี" : "Account Name"}
                    labelClass={label}
                  >
                    <div className="relative flex items-center">
                      <input
                        type="text"
                        readOnly
                        disabled
                        value={name}
                        className={`${readOnlyInput} pr-9`}
                      />
                      <div
                        className={`absolute right-3 pointer-events-none ${isLight ? "text-slate-400" : "text-slate-500"}`}
                      >
                        <Lock size={13} />
                      </div>
                    </div>
                  </Field>
                  <Field
                    label={isThai ? "คำนำหน้าชื่อ" : "Prefix"}
                    labelClass={label}
                  >
                    <FormCustomSelect
                      id="prefix"
                      value={form.prefix}
                      placeholder={isThai ? "คำนำหน้าชื่อ" : "Select Prefix"}
                      options={[
                        {
                          value: "",
                          label: isThai ? "- ไม่ระบุ -" : "- None -",
                        },
                        { value: "mr", label: isThai ? "นาย" : "Mr." },
                        { value: "mrs", label: isThai ? "นาง" : "Mrs." },
                        { value: "miss", label: isThai ? "นางสาว" : "Miss" },
                      ]}
                      isOpen={activeDropdownId === "prefix"}
                      onToggle={() =>
                        setActiveDropdownId((prev) =>
                          prev === "prefix" ? null : "prefix",
                        )
                      }
                      onSelect={(val) => {
                        update("prefix", val);
                        setActiveDropdownId(null);
                      }}
                      isLight={isLight}
                    />
                  </Field>
                </div>

                {/* Thai Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field
                    label={isThai ? "ชื่อจริง (ภาษาไทย)" : "First Name (Thai)"}
                    labelClass={label}
                  >
                    <input
                      className={input}
                      value={form.firstNameTh}
                      onChange={(e) => update("firstNameTh", e.target.value)}
                    />
                  </Field>
                  <Field
                    label={isThai ? "นามสกุล (ภาษาไทย)" : "Last Name (Thai)"}
                    labelClass={label}
                  >
                    <input
                      className={input}
                      value={form.lastNameTh}
                      onChange={(e) => update("lastNameTh", e.target.value)}
                    />
                  </Field>
                  <Field
                    label={isThai ? "ชื่อเล่น (ภาษาไทย)" : "Nickname (Thai)"}
                    labelClass={label}
                  >
                    <input
                      className={input}
                      value={form.nicknameTh}
                      onChange={(e) => update("nicknameTh", e.target.value)}
                    />
                  </Field>
                </div>

                {/* English Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field
                    label={
                      isThai ? "ชื่อจริง (ภาษาอังกฤษ)" : "First Name (English)"
                    }
                    labelClass={label}
                  >
                    <input
                      className={input}
                      value={form.firstNameEn}
                      onChange={(e) => update("firstNameEn", e.target.value)}
                    />
                  </Field>
                  <Field
                    label={
                      isThai ? "นามสกุล (ภาษาอังกฤษ)" : "Last Name (English)"
                    }
                    labelClass={label}
                  >
                    <input
                      className={input}
                      value={form.lastNameEn}
                      onChange={(e) => update("lastNameEn", e.target.value)}
                    />
                  </Field>
                  <Field
                    label={
                      isThai ? "ชื่อเล่น (ภาษาอังกฤษ)" : "Nickname (English)"
                    }
                    labelClass={label}
                  >
                    <input
                      className={input}
                      value={form.nicknameEn}
                      onChange={(e) => update("nicknameEn", e.target.value)}
                    />
                  </Field>
                </div>
              </Section>

              {/* 2. Personal Identity */}
              <Section
                title={
                  isThai
                    ? "ข้อมูลส่วนบุคคลและเอกสารประจำตัว"
                    : "Personal Identity & Details"
                }
                isLight={isLight}
              >
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <Field
                    label={isThai ? "เลขบัตรประชาชน" : "Citizen ID"}
                    labelClass={label}
                    className="sm:col-span-2"
                  >
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={13}
                      placeholder={
                        isThai
                          ? "เลขบัตรประชาชน 13 หลัก"
                          : "13-digit citizen ID"
                      }
                      className={`${input} font-mono tracking-wider`}
                      value={form.citizenId}
                      onChange={(e) => {
                        const digitsOnly = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 13);
                        update("citizenId", digitsOnly);
                      }}
                    />
                  </Field>
                  <Field
                    label={isThai ? "วันเกิด" : "Birth Date"}
                    labelClass={label}
                  >
                    <DatePicker
                      value={form.birthDate}
                      onChange={(date) => update("birthDate", date)}
                      placeholder={
                        isThai ? "เลือกวันเกิด" : "Select birth date"
                      }
                      isThai={isThai}
                      triggerClassName="h-[38px]"
                    />
                  </Field>
                  <Field label={isThai ? "เพศ" : "Gender"} labelClass={label}>
                    <FormCustomSelect
                      id="gender"
                      value={form.gender || "ชาย"}
                      placeholder={isThai ? "เพศ" : "Gender"}
                      options={[
                        {
                          value: "",
                          label: isThai ? "- ไม่ระบุ -" : "- None -",
                        },
                        { value: "ชาย", label: isThai ? "ชาย" : "Male" },
                        { value: "หญิง", label: isThai ? "หญิง" : "Female" },
                        { value: "อื่นๆ", label: isThai ? "อื่นๆ" : "Other" },
                      ]}
                      isOpen={activeDropdownId === "gender"}
                      onToggle={() =>
                        setActiveDropdownId((prev) =>
                          prev === "gender" ? null : "gender",
                        )
                      }
                      onSelect={(val) => {
                        update("gender", val);
                        setActiveDropdownId(null);
                      }}
                      isLight={isLight}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <Field
                    label={isThai ? "กรุ๊ปเลือด" : "Blood Type"}
                    labelClass={label}
                  >
                    <FormCustomSelect
                      id="bloodType"
                      value={form.bloodType}
                      placeholder={
                        isThai ? "เลือกกรุ๊ปเลือด" : "Select Blood Type"
                      }
                      options={[
                        {
                          value: "",
                          label: isThai ? "- ไม่ระบุ -" : "- None -",
                        },
                        { value: "A", label: "A" },
                        { value: "B", label: "B" },
                        { value: "AB", label: "AB" },
                        { value: "O", label: "O" },
                      ]}
                      isOpen={activeDropdownId === "bloodType"}
                      onToggle={() =>
                        setActiveDropdownId((prev) =>
                          prev === "bloodType" ? null : "bloodType",
                        )
                      }
                      onSelect={(val) => {
                        update("bloodType", val);
                        setActiveDropdownId(null);
                      }}
                      isLight={isLight}
                    />
                  </Field>

                  <Field
                    label={isThai ? "สถานภาพสมรส" : "Marital Status"}
                    labelClass={label}
                  >
                    <FormCustomSelect
                      id="maritalStatus"
                      value={form.maritalStatus}
                      placeholder={isThai ? "เลือกสถานภาพ" : "Select Status"}
                      options={[
                        {
                          value: "",
                          label: isThai ? "- ไม่ระบุ -" : "- None -",
                        },
                        { value: "โสด", label: isThai ? "โสด" : "Single" },
                        { value: "สมรส", label: isThai ? "สมรส" : "Married" },
                        {
                          value: "หย่าร้าง",
                          label: isThai ? "หย่าร้าง" : "Divorced",
                        },
                        { value: "หม้าย", label: isThai ? "หม้าย" : "Widowed" },
                      ]}
                      isOpen={activeDropdownId === "maritalStatus"}
                      onToggle={() =>
                        setActiveDropdownId((prev) =>
                          prev === "maritalStatus" ? null : "maritalStatus",
                        )
                      }
                      onSelect={(val) => {
                        update("maritalStatus", val);
                        setActiveDropdownId(null);
                      }}
                      isLight={isLight}
                    />
                  </Field>

                  <Field
                    label={isThai ? "สัญชาติ" : "Nationality"}
                    labelClass={label}
                  >
                    <input
                      className={input}
                      value={form.nationality}
                      onChange={(e) => update("nationality", e.target.value)}
                      placeholder={
                        isThai ? "ระบุสัญชาติ (เช่น ไทย)" : "e.g. Thai"
                      }
                    />
                  </Field>

                  <Field
                    label={isThai ? "ศาสนา" : "Religion"}
                    labelClass={label}
                  >
                    <FormCustomSelect
                      id="religion"
                      value={religionChoice}
                      placeholder={isThai ? "เลือกศาสนา" : "Select Religion"}
                      options={[
                        {
                          value: "",
                          label: isThai ? "- ไม่ระบุ -" : "- None -",
                        },
                        { value: "พุทธ", label: isThai ? "พุทธ" : "Buddhism" },
                        { value: "อิสลาม", label: isThai ? "อิสลาม" : "Islam" },
                        {
                          value: "คริสต์",
                          label: isThai ? "คริสต์" : "Christianity",
                        },
                        {
                          value: "ฮินดู",
                          label: isThai ? "ฮินดู" : "Hinduism",
                        },
                        { value: "ซิกข์", label: isThai ? "ซิกข์" : "Sikhism" },
                        {
                          value: "ไม่นับถือศาสนา",
                          label: isThai
                            ? "ไม่นับถือศาสนา"
                            : "Non-religious / None",
                        },
                        {
                          value: "อื่นๆ",
                          label: isThai ? "อื่นๆ (ระบุเอง)" : "Other (Specify)",
                        },
                      ]}
                      isOpen={activeDropdownId === "religion"}
                      onToggle={() =>
                        setActiveDropdownId((prev) =>
                          prev === "religion" ? null : "religion",
                        )
                      }
                      onSelect={(val) => {
                        setReligionChoice(val);
                        if (val === "อื่นๆ") {
                          update("religion", customReligion);
                        } else {
                          update("religion", val);
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
                          update("religion", val);
                        }}
                        placeholder={
                          isThai
                            ? "กรุณาระบุศาสนาของคุณ"
                            : "Please specify religion"
                        }
                        className={`${input} mt-1.5`}
                        autoFocus
                      />
                    )}
                  </Field>
                </div>
              </Section>

              {/* 3. Educational Background (ข้อมูลการศึกษา) */}
              <Section
                title={isThai ? "ข้อมูลการศึกษา" : "Educational Background"}
                isLight={isLight}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={isThai ? "วุฒิการศึกษา" : "Education Level"}
                    labelClass={label}
                  >
                    <FormCustomSelect
                      id="educationLevel"
                      value={form.educationLevel || "ปริญญาตรี"}
                      placeholder={isThai ? "วุฒิการศึกษา" : "Education Level"}
                      options={[
                        {
                          value: "มัธยมศึกษาตอนปลาย / ปวช.",
                          label: isThai
                            ? "มัธยมศึกษาตอนปลาย / ปวช."
                            : "High School / Vocational",
                        },
                        {
                          value: "ปวส. / อนุปริญญา",
                          label: isThai
                            ? "ปวส. / อนุปริญญา"
                            : "Diploma / Associate",
                        },
                        {
                          value: "ปริญญาตรี",
                          label: isThai ? "ปริญญาตรี" : "Bachelor's Degree",
                        },
                        {
                          value: "ปริญญาโท",
                          label: isThai ? "ปริญญาโท" : "Master's Degree",
                        },
                        {
                          value: "ปริญญาเอก",
                          label: isThai ? "ปริญญาเอก" : "Doctorate / Ph.D.",
                        },
                        {
                          value: "อื่นๆ",
                          label: isThai ? "อื่นๆ" : "Other",
                        },
                      ]}
                      isOpen={activeDropdownId === "educationLevel"}
                      onToggle={() =>
                        setActiveDropdownId((prev) =>
                          prev === "educationLevel" ? null : "educationLevel",
                        )
                      }
                      onSelect={(val) => {
                        update("educationLevel", val);
                        setActiveDropdownId(null);
                      }}
                      isLight={isLight}
                    />
                  </Field>

                  <div className="flex flex-col gap-1">
                    <MajorSubjectAutocomplete
                      value={form.majorSubject}
                      onChange={(en) => update("majorSubject", en)}
                      isLight={isLight}
                      isThai={isThai}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <UniversitySearchSelect
                    valueTh={form.universityNameTh}
                    valueEn={form.universityNameEn}
                    onChange={(th, en) => {
                      setForm((current) => ({
                        ...current,
                        universityNameTh: th,
                        universityNameEn: en,
                      }));
                    }}
                    isLight={isLight}
                    isThai={isThai}
                  />
                </div>
              </Section>

              {/* 4. Contact & Addresses (ข้อมูลการติดต่อและที่อยู่อาศัย) */}
              <Section
                title={
                  isThai
                    ? "ข้อมูลการติดต่อและที่อยู่อาศัย"
                    : "Contact & Addresses"
                }
                isLight={isLight}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={isThai ? "อีเมลติดต่อ" : "Contact Email"}
                    labelClass={label}
                  >
                    <div className="relative flex items-center">
                      <input
                        type="email"
                        readOnly
                        disabled
                        value={form.contactEmail || member.email || ""}
                        className={`${readOnlyInput} pr-9 font-mono`}
                      />
                      <div
                        className={`absolute right-3 pointer-events-none ${isLight ? "text-slate-400" : "text-slate-500"}`}
                      >
                        <Lock size={13} />
                      </div>
                    </div>
                  </Field>
                  <Field
                    label={isThai ? "เบอร์โทรศัพท์" : "Phone Number"}
                    labelClass={label}
                  >
                    <input
                      type="tel"
                      className={input}
                      maxLength={15}
                      value={form.phone}
                      onChange={(e) => {
                        const digits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 15);
                        update("phone", digits);
                      }}
                    />
                  </Field>
                </div>

                {/* Emergency Contact */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={
                      isThai
                        ? "ความสัมพันธ์ผู้ติดต่อฉุกเฉิน"
                        : "Emergency Relationship"
                    }
                    labelClass={label}
                  >
                    <FormCustomSelect
                      id="emergencyContactRelationship"
                      value={form.emergencyContactRelationship || "บิดา/มารดา"}
                      placeholder={isThai ? "ความสัมพันธ์" : "Relationship"}
                      options={[
                        {
                          value: "บิดา/มารดา",
                          label: isThai ? "บิดา / มารดา" : "Parents",
                        },
                        {
                          value: "คู่สมรส",
                          label: isThai ? "คู่สมรส" : "Spouse",
                        },
                        {
                          value: "พี่/น้อง",
                          label: isThai ? "พี่ / น้อง" : "Sibling",
                        },
                        { value: "บุตร", label: isThai ? "บุตร" : "Child" },
                        { value: "ญาติ", label: isThai ? "ญาติ" : "Relative" },
                        {
                          value: "เพื่อน",
                          label: isThai ? "เพื่อนสนิท" : "Friend",
                        },
                        { value: "อื่นๆ", label: isThai ? "อื่นๆ" : "Other" },
                      ]}
                      isOpen={
                        activeDropdownId === "emergencyContactRelationship"
                      }
                      onToggle={() =>
                        setActiveDropdownId((prev) =>
                          prev === "emergencyContactRelationship"
                            ? null
                            : "emergencyContactRelationship",
                        )
                      }
                      onSelect={(val) => {
                        update("emergencyContactRelationship", val);
                        setActiveDropdownId(null);
                      }}
                      isLight={isLight}
                    />
                  </Field>
                  <Field
                    label={isThai ? "เบอร์ผู้ติดต่อฉุกเฉิน" : "Emergency Phone"}
                    labelClass={label}
                  >
                    <input
                      type="tel"
                      className={input}
                      maxLength={15}
                      value={form.emergencyContactPhone}
                      onChange={(e) => {
                        const digits = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 15);
                        update("emergencyContactPhone", digits);
                      }}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={
                      isThai
                        ? "ผู้ติดต่อฉุกเฉิน ภาษาไทย"
                        : "Emergency Contact (Thai)"
                    }
                    labelClass={label}
                  >
                    <input
                      className={input}
                      value={form.emergencyContactName}
                      onChange={(e) =>
                        update("emergencyContactName", e.target.value)
                      }
                    />
                  </Field>
                  <Field
                    label={
                      isThai
                        ? "ผู้ติดต่อฉุกเฉิน ภาษาอังกฤษ"
                        : "Emergency Contact (English)"
                    }
                    labelClass={label}
                  >
                    <input
                      className={input}
                      value={form.emergencyContactNameEn}
                      onChange={(e) =>
                        update("emergencyContactNameEn", e.target.value)
                      }
                    />
                  </Field>
                </div>

                {/* Thai Address Selectors (Cascading Dropdowns) */}
                <div className="flex flex-col gap-5 pt-2">
                  <ThaiAddressSelector
                    label={isThai ? "ที่อยู่ปัจจุบัน" : "Current Address"}
                    value={form.address}
                    onChange={(val) => update("address", val)}
                    isLight={isLight}
                    isThai={isThai}
                  />

                  <ThaiAddressSelector
                    label={
                      isThai ? "ที่อยู่ตามทะเบียนบ้าน" : "Registered Address"
                    }
                    value={form.registeredAddress}
                    onChange={(val) => update("registeredAddress", val)}
                    isLight={isLight}
                    isThai={isThai}
                    showCopyButton={true}
                    onCopyFromCurrent={() => {
                      if (form.address) {
                        update("registeredAddress", form.address);
                      }
                    }}
                  />
                </div>
              </Section>
            </div>

            {/* Footer */}
            <footer
              className={`p-4 sm:px-6 border-t flex justify-end gap-2.5 shrink-0 ${
                isLight
                  ? "bg-white border-[#E4E4E7]"
                  : "bg-[#383838] border-[#444444]"
              }`}
            >
              <button
                type="button"
                onClick={onClose}
                className={`h-[38px] px-4 rounded-[8px] text-xs font-semibold ${
                  isLight
                    ? "text-[#666666] hover:bg-[#F5F5F5]"
                    : "text-[#E4E4E7] hover:bg-white/10"
                }`}
              >
                {isThai ? "ยกเลิก" : "Cancel"}
              </button>
              <button
                type="submit"
                className={`h-[38px] px-5 rounded-[8px] text-xs font-bold ${
                  isLight
                    ? "bg-[#222222] text-white hover:bg-black"
                    : "bg-white text-[#222222] hover:bg-[#F4F4F5]"
                }`}
              >
                {isThai ? "ตรวจสอบข้อมูล" : "Review Information"}
              </button>
            </footer>
          </form>
        ) : step === "review" ? (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            {/* Scroll-to-bottom Down Arrow Button */}
            {!isReviewAtBottom && (
              <button
                type="button"
                onClick={() =>
                  reviewScrollRef.current?.scrollTo({
                    top: reviewScrollRef.current.scrollHeight,
                    behavior: "smooth",
                  })
                }
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

            <div
              ref={reviewScrollRef}
              onScroll={handleReviewScroll}
              className="flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 pb-28 space-y-6"
            >
              {error && (
                <p role="alert" className="text-xs text-[#E74C3C] font-medium">
                  {error}
                </p>
              )}

              {/* 1. Account & Name */}
              <Section
                title={
                  isThai ? "ข้อมูลชื่อและบัญชีผู้ใช้" : "Name & Account Details"
                }
                isLight={isLight}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={isThai ? "ชื่อบัญชี" : "Account Name"}
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={name || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                  <Field
                    label={isThai ? "คำนำหน้าชื่อ" : "Prefix"}
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={
                        form.prefix === "mr"
                          ? isThai
                            ? "นาย"
                            : "Mr."
                          : form.prefix === "mrs"
                            ? isThai
                              ? "นาง"
                              : "Mrs."
                            : form.prefix === "miss"
                              ? isThai
                                ? "นางสาว"
                                : "Miss"
                              : form.prefix || "—"
                      }
                      className={readOnlyInput}
                    />
                  </Field>
                </div>

                {/* Thai Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field
                    label={isThai ? "ชื่อจริง (ภาษาไทย)" : "First Name (Thai)"}
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.firstNameTh || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                  <Field
                    label={isThai ? "นามสกุล (ภาษาไทย)" : "Last Name (Thai)"}
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.lastNameTh || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                  <Field
                    label={isThai ? "ชื่อเล่น (ภาษาไทย)" : "Nickname (Thai)"}
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.nicknameTh || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                </div>

                {/* English Name */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Field
                    label={
                      isThai ? "ชื่อจริง (ภาษาอังกฤษ)" : "First Name (English)"
                    }
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.firstNameEn || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                  <Field
                    label={
                      isThai ? "นามสกุล (ภาษาอังกฤษ)" : "Last Name (English)"
                    }
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.lastNameEn || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                  <Field
                    label={
                      isThai ? "ชื่อเล่น (ภาษาอังกฤษ)" : "Nickname (English)"
                    }
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.nicknameEn || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                </div>
              </Section>

              {/* 2. Personal Identity */}
              <Section
                title={
                  isThai
                    ? "ข้อมูลส่วนบุคคลและเอกสารประจำตัว"
                    : "Personal Identity & Details"
                }
                isLight={isLight}
              >
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <Field
                    label={isThai ? "เลขบัตรประชาชน" : "Citizen ID"}
                    labelClass={label}
                    className="sm:col-span-2"
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.citizenId || "—"}
                      className={`${readOnlyInput} font-mono`}
                    />
                  </Field>
                  <Field
                    label={isThai ? "วันเกิด" : "Birth Date"}
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.birthDate || "—"}
                      className={`${readOnlyInput} font-mono`}
                    />
                  </Field>
                  <Field label={isThai ? "เพศ" : "Gender"} labelClass={label}>
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.gender || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <Field
                    label={isThai ? "กรุ๊ปเลือด" : "Blood Type"}
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.bloodType || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                  <Field
                    label={isThai ? "สถานภาพสมรส" : "Marital Status"}
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.maritalStatus || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                  <Field
                    label={isThai ? "สัญชาติ" : "Nationality"}
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.nationality || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                  <Field
                    label={isThai ? "ศาสนา" : "Religion"}
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.religion || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                </div>
              </Section>

              {/* 3. Educational Background */}
              <Section
                title={isThai ? "ข้อมูลการศึกษา" : "Educational Background"}
                isLight={isLight}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={isThai ? "วุฒิการศึกษา" : "Education Level"}
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.educationLevel || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                  <Field
                    label={isThai ? "สาขาวิชา" : "Major Subject"}
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.majorSubject || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={
                      isThai ? "สถาบันการศึกษา (ภาษาไทย)" : "Institution (Thai)"
                    }
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.universityNameTh || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                  <Field
                    label={
                      isThai
                        ? "สถาบันการศึกษา (English)"
                        : "Institution (English)"
                    }
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.universityNameEn || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                </div>
              </Section>

              {/* 4. Contact & Addresses */}
              <Section
                title={
                  isThai
                    ? "ข้อมูลการติดต่อและที่อยู่อาศัย"
                    : "Contact & Addresses"
                }
                isLight={isLight}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={isThai ? "อีเมลติดต่อ" : "Contact Email"}
                    labelClass={label}
                  >
                    <input
                      type="email"
                      readOnly
                      disabled
                      value={form.contactEmail || member.email || "—"}
                      className={`${readOnlyInput} font-mono`}
                    />
                  </Field>
                  <Field
                    label={isThai ? "เบอร์โทรศัพท์" : "Phone Number"}
                    labelClass={label}
                  >
                    <input
                      type="tel"
                      readOnly
                      disabled
                      value={form.phone || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={
                      isThai
                        ? "ความสัมพันธ์ผู้ติดต่อฉุกเฉิน"
                        : "Emergency Relationship"
                    }
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.emergencyContactRelationship || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                  <Field
                    label={isThai ? "เบอร์ผู้ติดต่อฉุกเฉิน" : "Emergency Phone"}
                    labelClass={label}
                  >
                    <input
                      type="tel"
                      readOnly
                      disabled
                      value={form.emergencyContactPhone || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Field
                    label={
                      isThai
                        ? "ผู้ติดต่อฉุกเฉิน ภาษาไทย"
                        : "Emergency Contact (Thai)"
                    }
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.emergencyContactName || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                  <Field
                    label={
                      isThai
                        ? "ผู้ติดต่อฉุกเฉิน ภาษาอังกฤษ"
                        : "Emergency Contact (English)"
                    }
                    labelClass={label}
                  >
                    <input
                      type="text"
                      readOnly
                      disabled
                      value={form.emergencyContactNameEn || "—"}
                      className={readOnlyInput}
                    />
                  </Field>
                </div>

                <div className="flex flex-col gap-4 pt-2">
                  <Field
                    label={isThai ? "ที่อยู่ปัจจุบัน" : "Current Address"}
                    labelClass={label}
                  >
                    <textarea
                      readOnly
                      disabled
                      rows={2}
                      value={form.address || "—"}
                      className={readOnlyArea}
                    />
                  </Field>

                  <Field
                    label={
                      isThai ? "ที่อยู่ตามทะเบียนบ้าน" : "Registered Address"
                    }
                    labelClass={label}
                  >
                    <textarea
                      readOnly
                      disabled
                      rows={2}
                      value={form.registeredAddress || "—"}
                      className={readOnlyArea}
                    />
                  </Field>
                </div>
              </Section>
            </div>

            {/* Footer */}
            <footer
              className={`p-4 sm:px-6 border-t flex justify-between gap-2.5 shrink-0 ${
                isLight
                  ? "bg-white border-[#E4E4E7]"
                  : "bg-[#383838] border-[#444444]"
              }`}
            >
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep("fill")}
                className={`h-[38px] px-4 rounded-[8px] inline-flex items-center gap-2 text-xs font-semibold ${
                  isLight
                    ? "text-[#222222] hover:bg-[#F5F5F5]"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <ArrowLeft size={14} />
                {isThai ? "ย้อนกลับ" : "Back"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep("terms")}
                className={`h-[38px] px-5 rounded-[8px] inline-flex items-center gap-2 text-xs font-bold disabled:opacity-50 ${
                  isLight
                    ? "bg-[#222222] text-white hover:bg-black"
                    : "bg-white text-[#222222] hover:bg-[#F4F4F5]"
                }`}
              >
                {isThai ? "ต่อไป" : "Next"}
                <ArrowLeft size={14} className="rotate-180" />
              </button>
            </footer>
          </div>
        ) : (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div
              className={`flex-1 overflow-y-auto min-h-0 p-5 sm:p-6 space-y-5 text-xs leading-relaxed ${
                isLight ? "text-[#383838]" : "text-[#E4E4E7]"
              }`}
            >
              <div>
                <h5
                  className={`mb-1 font-bold ${isLight ? "text-[#222222]" : "text-white"}`}
                >
                  {isThai
                    ? "การใช้งานระบบองค์กร"
                    : "Use of the enterprise system"}
                </h5>
                <p>
                  {isThai
                    ? "ผู้ใช้งานต้องใช้บัญชีของตนเองและปฏิบัติตามสิทธิ์การเข้าถึงที่องค์กรกำหนด ห้ามแบ่งปันรหัสผ่านหรือใช้ข้อมูลของผู้อื่น"
                    : "You must use your own account and follow the access permissions assigned by the organization. Do not share your password or use another person's information."}
                </p>
              </div>
              <div>
                <h5
                  className={`mb-1 font-bold ${isLight ? "text-[#222222]" : "text-white"}`}
                >
                  {isThai
                    ? "การคุ้มครองข้อมูลส่วนบุคคล"
                    : "Personal data protection"}
                </h5>
                <p>
                  {isThai
                    ? "องค์กรจะเก็บและประมวลผลข้อมูลโปรไฟล์เพื่อการบริหารงานบุคคลและการใช้งานระบบตามวัตถุประสงค์ที่แจ้งไว้"
                    : "The organization collects and processes profile information for personnel administration and system operations as described in the policy."}
                </p>
              </div>
              <div>
                <h5
                  className={`mb-1 font-bold ${isLight ? "text-[#222222]" : "text-white"}`}
                >
                  {isThai
                    ? "ความรับผิดชอบของผู้ใช้งาน"
                    : "Your responsibilities"}
                </h5>
                <p>
                  {isThai
                    ? "โปรดตรวจสอบข้อมูลให้ถูกต้อง แจ้งการเปลี่ยนแปลงที่สำคัญ และติดต่อผู้ดูแลระบบทันทีเมื่อพบเหตุผิดปกติหรือการเข้าถึงที่ไม่ได้รับอนุญาต"
                    : "Keep your information accurate, report important changes, and contact the system administrator immediately if you notice suspicious activity or unauthorized access."}
                </p>
              </div>
            </div>
            <footer
              className={`p-4 sm:px-6 border-t flex justify-between gap-2.5 shrink-0 ${
                isLight
                  ? "bg-white border-[#E4E4E7]"
                  : "bg-[#383838] border-[#444444]"
              }`}
            >
              <button
                type="button"
                disabled={busy}
                onClick={() => setStep("review")}
                className={`h-[38px] px-4 rounded-[8px] inline-flex items-center gap-2 text-xs font-semibold ${
                  isLight
                    ? "text-[#222222] hover:bg-[#F5F5F5]"
                    : "text-white hover:bg-white/10"
                }`}
              >
                <ArrowLeft size={14} />
                {isThai ? "ย้อนกลับ" : "Back"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void save()}
                className={`h-[38px] px-5 rounded-[8px] inline-flex items-center gap-2 text-xs font-bold disabled:opacity-50 ${
                  isLight
                    ? "bg-[#222222] text-white hover:bg-black"
                    : "bg-white text-[#222222] hover:bg-[#F4F4F5]"
                }`}
              >
                {busy ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : (
                  <Check size={14} />
                )}
                {busy
                  ? isThai
                    ? "กำลังบันทึก..."
                    : "Saving..."
                  : isThai
                    ? "ยืนยันและบันทึก"
                    : "Confirm & Save"}
              </button>
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}

function Section({
  title,
  isLight,
  children,
}: {
  title: string;
  isLight: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h5
        className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-white"}`}
      >
        {title}
      </h5>
      {children}
    </section>
  );
}

function Field({
  label,
  labelClass,
  className = "",
  children,
}: {
  label: string;
  labelClass: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`flex flex-col gap-1 min-w-0 ${className}`}>
      <span className={labelClass}>{label}</span>
      {children}
    </label>
  );
}
