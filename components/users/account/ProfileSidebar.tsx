"use client";

import React from "react";
import { Pencil } from "lucide-react";
import type { EmployeeProfile } from "@/types/user";

export interface ProfileSidebarProps {
  profile: Partial<EmployeeProfile>;
  isLight: boolean;
  isThai: boolean;
  fullName: string;
  initials: string;
  departmentTitle: string;
  onOpenAvatarCrop: () => void;
  onGoToSettings?: () => void;
}

export function ProfileSidebar({
  profile,
  isLight,
  isThai,
  fullName,
  initials,
  departmentTitle,
  onOpenAvatarCrop,
  onGoToSettings,
}: ProfileSidebarProps) {
  return (
    <div
      className={`w-full lg:w-[360px] p-8 flex flex-col items-center gap-6 rounded-[12px] border transition-colors shrink-0 ${
        isLight
          ? "bg-[#FFFFFF] border-[#E4E4E7] shadow-sm"
          : "bg-[#383838] border-[#444444] shadow-lg"
      }`}
    >
      {/* Avatar Container with Edit Pencil Button */}
      <div className="relative group">
        <div
          className={`w-[110px] h-[110px] rounded-full border overflow-hidden flex items-center justify-center select-none shadow-sm transition-all ${
            isLight
              ? "bg-[#F5F5F5] border-[#E5E5E5]"
              : "bg-[#282828] border-[#444444]"
          }`}
        >
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt={fullName} className="w-full h-full rounded-full object-cover" />
          ) : (
            <span className={`font-bold text-[48px] leading-[60px] ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`} style={{ fontFamily: "var(--font-outfit), sans-serif" }}>
              {initials}
            </span>
          )}
        </div>

        {/* Circular Pencil Button */}
        <button
          type="button"
          onClick={onOpenAvatarCrop}
          title={isThai ? "เปลี่ยนรูปโปรไฟล์" : "Change Profile Picture"}
          className={`absolute bottom-0 right-0 w-8 h-8 rounded-full border shadow-md flex items-center justify-center transition-all transform hover:scale-110 active:scale-95 cursor-pointer ${
            isLight
              ? "bg-[#222222] hover:bg-black text-[#FFFFFF] border-white"
              : "bg-[#FFFFFF] hover:bg-[#F4F4F5] text-[#222222] border-[#282828]"
          }`}
        >
          <Pencil size={14} />
        </button>
      </div>

      <div className="w-full flex flex-col items-center gap-1.5">
        <h2 className={`font-bold text-[20px] leading-[25px] text-center ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`} style={{ fontFamily: "var(--font-outfit), sans-serif" }}>
          {fullName}
        </h2>

        {/* Username with @ prefix directly below name */}
        <span className={`text-[13px] font-medium leading-tight ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
          @{profile.username || (profile.email ? profile.email.split("@")[0] : "username")}
        </span>

        {/* Staff ID Badge */}
        <div
          className={`mt-1.5 px-3 py-1 rounded-[8px] border text-xs font-mono font-semibold flex items-center gap-1.5 select-text ${
            isLight
              ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]"
              : "bg-[#282828] border-[#444444] text-[#FFFFFF]"
          }`}
        >
          <span className={`text-[10.5px] font-sans font-normal ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
            {isThai ? "รหัสพนักงาน:" : "Staff ID:"}
          </span>
          <span>{profile.staff_code || (profile.id ? `EMP-${profile.id.slice(0, 4).toUpperCase()}` : "EMP-1001")}</span>
        </div>

        {/* Department Info */}
        {departmentTitle !== "—" && (
          <div className="flex flex-row items-center px-2 py-0.5 gap-1.5 text-xs opacity-75">
            <span className={`text-[11px] ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
              {isThai ? "แผนก:" : "Dept:"} {departmentTitle}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProfileSidebar;
