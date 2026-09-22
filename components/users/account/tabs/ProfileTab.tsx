"use client";

import React from "react";
import { FileText } from "lucide-react";
import { useNotification } from "@/context/NotificationContext";
import { getPrefixDisplayLabel } from "@/types/user";
import type { EmployeeProfile } from "@/types/user";

export interface ProfileTabProps {
  profile: Partial<EmployeeProfile>;
  isLight: boolean;
  isThai: boolean;
  idCardText: string;
  birthDateText: string;
  genderText: string;
  bloodTypeText: string;
  maritalText: string;
  nationalityText: string;
  religionText: string;
  emailText: string;
  phoneText: string;
  currentAddressText: string;
  registeredAddressText: string;
}

export function ProfileTab({
  profile,
  isLight,
  isThai,
  idCardText,
  birthDateText,
  genderText,
  bloodTypeText,
  maritalText,
  nationalityText,
  religionText,
  emailText,
  phoneText,
  currentAddressText,
  registeredAddressText,
}: ProfileTabProps) {
  const { notify } = useNotification();

  return (
    <div
      className={`flex-1 w-full p-6 sm:p-8 flex flex-col items-start gap-5 rounded-[12px] border transition-colors ${
        isLight
          ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-sm"
          : "bg-[#383838] border-[#444444] shadow-lg"
      }`}
    >
      <div className="w-full flex items-center justify-between border-b pb-3 border-[#444444]/40">
        <h3
          className={`font-bold text-[16px] leading-[20px] ${
            isLight ? "text-[#222222]" : "text-[#FFFFFF]"
          }`}
          style={{ fontFamily: "var(--font-outfit), sans-serif" }}
        >
          {isThai ? "ข้อมูลประวัติส่วนตัวและการติดต่อ" : "Personal Profile & Contact Details"}
        </h3>
      </div>

      <div className="w-full flex flex-col gap-3">
        <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
          {isThai ? "ข้อมูลชื่อและบัญชีผู้ใช้" : "Name & Account Details"}
        </span>

        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "ชื่อจริง (ภาษาไทย)" : "First Name (Thai)"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text font-medium ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {profile.first_name_th || "—"}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "นามสกุล (ภาษาไทย)" : "Last Name (Thai)"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text font-medium ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {profile.last_name_th || "—"}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "ชื่อเล่น (ภาษาไทย)" : "Nickname (Thai)"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {profile.nickname_th || "—"}
            </div>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "ชื่อจริง (English)" : "First Name (English)"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text font-medium ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {profile.first_name || "—"}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "นามสกุล (English)" : "Last Name (English)"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text font-medium ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {profile.last_name || "—"}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "ชื่อเล่น (English)" : "Nickname (English)"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {profile.nickname || "—"}
            </div>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "คำนำหน้า (Prefix)" : "Prefix"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {profile.prefix ? getPrefixDisplayLabel(profile.prefix, isThai ? "TH" : "EN") : "—"}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "ชื่อผู้ใช้" : "Username"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] font-mono select-text ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {profile.username || "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
        <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
          {isThai ? "ข้อมูลส่วนบุคคลและเอกสารประจำตัว" : "Personal Identity & Details"}
        </span>

        <div className="w-full grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex flex-col items-start gap-1 sm:col-span-2">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "เลขบัตรประชาชน" : "Citizen ID"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] font-mono select-text ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {idCardText}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "วันเกิด" : "Birth Date"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {birthDateText}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "เพศ" : "Gender"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {genderText}
            </div>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-4 gap-3">
          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "กรุ๊ปเลือด" : "Blood Type"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {bloodTypeText}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "สถานภาพสมรส" : "Marital Status"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {maritalText}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "สัญชาติ" : "Nationality"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {nationalityText}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "ศาสนา" : "Religion"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {religionText}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
        <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
          {isThai ? "ข้อมูลการศึกษา" : "Educational Background"}
        </span>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "วุฒิการศึกษา" : "Education Level"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text truncate ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {profile.education_level || "—"}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "สาขาวิชา" : "Major Subject"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text truncate ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {profile.major_subject || "—"}
            </div>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "สถาบันการศึกษา (ภาษาไทย)" : "University (Thai)"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text truncate ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {profile.university_th || profile.university_name || "—"}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "สถาบันการศึกษา (English)" : "Institution (English)"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text truncate ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {profile.university_en || "—"}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full flex flex-col gap-3 pt-2 border-t border-[#444444]/30">
        <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
          {isThai ? "ข้อมูลการติดต่อและที่อยู่อาศัย" : "Contact & Addresses"}
        </span>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "อีเมลติดต่อ" : "Contact Email"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] font-mono select-text truncate ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {emailText}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "เบอร์โทรศัพท์" : "Phone Number"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] font-mono select-text ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {phoneText}
            </div>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "ผู้ติดต่อฉุกเฉิน (ไทย)" : "Emergency Contact (Thai)"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text truncate ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {profile.emergency_contact_name_th || "—"}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "ผู้ติดต่อฉุกเฉิน (English)" : "Emergency Contact (English)"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text truncate ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {profile.emergency_contact_name || "—"}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "เบอร์ผู้ติดต่อฉุกเฉิน" : "Emergency Phone"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] font-mono select-text ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {profile.emergency_contact_phone || "—"}
            </div>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "ที่อยู่ปัจจุบัน" : "Current Resident Address"}
            </label>
            <div
              className={`w-full p-3 min-h-[56px] flex items-center rounded-[8px] border text-[12px] leading-relaxed select-text ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {currentAddressText}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "ที่อยู่ตามทะเบียนบ้าน" : "Registered Legal Address"}
            </label>
            <div
              className={`w-full p-3 min-h-[56px] flex items-center rounded-[8px] border text-[12px] leading-relaxed select-text ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {registeredAddressText}
            </div>
          </div>
        </div>
      </div>

      <div className="w-full pt-3 border-t border-[#444444]/40 flex flex-wrap items-center justify-end gap-2.5">
        <button
          type="button"
          onClick={() => {
            notify.info(
              isThai ? "แจ้งเรื่องขอแก้ไขข้อมูล" : "Profile Modification Request",
              {
                message: isThai
                  ? "ระบบส่งคำร้องขอแก้ไขข้อมูลส่วนตัวอยู่ระหว่างการพัฒนาระบบ"
                  : "The profile modification request ticket system is currently in development.",
                duration: 4000,
              }
            );
          }}
          className={`px-4 py-2.5 h-[37px] rounded-[8px] font-semibold text-[13px] leading-[17px] transition-all hover:scale-102 active:scale-98 cursor-pointer flex items-center gap-1.5 shadow-sm ${
            isLight
              ? "bg-[#222222] hover:bg-black text-[#FFFFFF]"
              : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#222222]"
          }`}
        >
          <FileText size={14} />
          <span>{isThai ? "แจ้งเรื่องขอแก้ไขข้อมูล" : "Request Profile Update"}</span>
        </button>
      </div>
    </div>
  );
}

export default ProfileTab;
