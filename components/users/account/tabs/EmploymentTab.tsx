"use client";

import React from "react";
import type { EmployeeProfile } from "@/types/user";

export interface EmploymentTabProps {
  profile: Partial<EmployeeProfile>;
  isLight: boolean;
  isThai: boolean;
  departmentTitle: string;
  branchTitle: string;
}

export function EmploymentTab({
  profile,
  isLight,
  isThai,
  departmentTitle,
  branchTitle,
}: EmploymentTabProps) {
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
          {isThai ? "ข้อมูลเกี่ยวกับบริษัทและสัญญาการจ้างงาน" : "Company & Employment Information"}
        </h3>
      </div>

      <div className="w-full flex flex-col gap-3">
        <span className={`text-xs font-bold uppercase tracking-wider ${isLight ? "text-[#222222]" : "text-[#FFFFFF]"}`}>
          {isThai ? "ข้อมูลสังกัดและตำแหน่งงานในองค์กร" : "Organization & Position Assignment"}
        </span>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "แผนก / ฝ่ายสังกัด" : "Department"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text truncate ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {departmentTitle}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "สาขาประจำการ" : "Branch Location"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text truncate ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {branchTitle}
            </div>
          </div>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "สถานะการจ้างงาน" : "Employment Status"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] font-semibold select-text ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#2EC4B6]" : "bg-[#282828] border-[#444444] text-[#2EC4B6]"
              }`}
            >
              {profile.employment_status || (isThai ? "พนักงานประจำ" : "Permanent Staff")}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "วันที่เริ่มงาน" : "Start Date"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {profile.start_date || "—"}
            </div>
          </div>

          <div className="flex flex-col items-start gap-1">
            <label className={`font-semibold text-[11.5px] ${isLight ? "text-[#222222]" : "text-[#E4E4E7]"}`}>
              {isThai ? "โครงสร้างเงินเดือน / ค่าตอบแทน" : "Compensation"}
            </label>
            <div
              className={`w-full p-2.5 h-[38px] flex items-center rounded-[8px] border text-[12.5px] select-text font-semibold ${
                isLight ? "bg-[#F5F5F5] border-[#E5E5E5] text-[#222222]" : "bg-[#282828] border-[#444444] text-[#F4F4F5]"
              }`}
            >
              {profile.salary ? `฿${profile.salary.toLocaleString()}` : "—"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EmploymentTab;
