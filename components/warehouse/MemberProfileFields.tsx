"use client";

import type { MemberProfile } from "@/lib/api/warehouse";
import { Field, input } from "./Ui";
import DatePicker from "@/components/common/DatePicker";

export type ProfileForm = Record<"employeeCode" | "phone" | "address" | "startedOn" | "emergencyContactName" | "emergencyContactPhone", string>;

export function profileForm(profile: MemberProfile): ProfileForm {
  return {
    employeeCode: profile.employeeCode ?? "",
    phone: profile.phone ?? "",
    address: profile.address ?? "",
    startedOn: profile.startedOn ?? "",
    emergencyContactName: profile.emergencyContactName ?? "",
    emergencyContactPhone: profile.emergencyContactPhone ?? "",
  };
}

export function MemberProfileFields({ value, onChange, employmentEditable, isThai }: {
  value: ProfileForm;
  onChange: (value: ProfileForm) => void;
  employmentEditable: boolean;
  isThai: boolean;
}) {
  const change = (key: keyof ProfileForm, next: string) => onChange({ ...value, [key]: next });
  return <div className="grid gap-3 sm:grid-cols-2">
    <Field label={isThai ? "รหัสพนักงาน" : "Employee code"}>
      <input className={input} value={value.employeeCode} maxLength={50} disabled={!employmentEditable} onChange={(event) => change("employeeCode", event.target.value)} />
    </Field>
    <Field label={isThai ? "วันที่เริ่มงาน" : "Start date"}>
      <DatePicker
        value={value.startedOn}
        disabled={!employmentEditable}
        onChange={(date) => change("startedOn", date)}
        placeholder={isThai ? "เลือกวันที่เริ่มงาน" : "Select start date"}
        isThai={isThai}
        triggerClassName="h-[38px]"
      />
    </Field>
    <Field label={isThai ? "เบอร์โทรศัพท์" : "Phone number"}>
      <input className={input} type="tel" value={value.phone} maxLength={30} autoComplete="tel" onChange={(event) => change("phone", event.target.value)} />
    </Field>
    <div className="sm:col-span-2">
      <Field label={isThai ? "ที่อยู่" : "Address"}>
        <textarea className={`${input} min-h-20 w-full resize-none`} value={value.address} maxLength={1000} onChange={(event) => change("address", event.target.value)} />
      </Field>
    </div>
    <Field label={isThai ? "ชื่อผู้ติดต่อฉุกเฉิน" : "Emergency contact name"}>
      <input className={input} value={value.emergencyContactName} maxLength={160} onChange={(event) => change("emergencyContactName", event.target.value)} />
    </Field>
    <Field label={isThai ? "เบอร์ผู้ติดต่อฉุกเฉิน" : "Emergency contact phone"}>
      <input className={input} type="tel" value={value.emergencyContactPhone} maxLength={30} onChange={(event) => change("emergencyContactPhone", event.target.value)} />
    </Field>
  </div>;
}
