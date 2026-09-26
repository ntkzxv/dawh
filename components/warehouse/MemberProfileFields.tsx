"use client";

import type { MemberProfile } from "@/lib/api/warehouse";
import { Field, input } from "./Ui";

export type ProfileForm = Record<keyof MemberProfile, string>;

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

export function MemberProfileFields({ value, onChange, employmentEditable }: {
  value: ProfileForm;
  onChange: (value: ProfileForm) => void;
  employmentEditable: boolean;
}) {
  const change = (key: keyof ProfileForm, next: string) => onChange({ ...value, [key]: next });
  return <div className="grid gap-3 sm:grid-cols-2">
    <Field label="รหัสพนักงาน">
      <input className={input} value={value.employeeCode} maxLength={50} disabled={!employmentEditable} onChange={(event) => change("employeeCode", event.target.value)} />
    </Field>
    <Field label="วันที่เริ่มงาน">
      <input className={input} type="date" value={value.startedOn} disabled={!employmentEditable} onChange={(event) => change("startedOn", event.target.value)} />
    </Field>
    <Field label="เบอร์โทรศัพท์">
      <input className={input} type="tel" value={value.phone} maxLength={30} autoComplete="tel" onChange={(event) => change("phone", event.target.value)} />
    </Field>
    <Field label="ชื่อผู้ติดต่อฉุกเฉิน">
      <input className={input} value={value.emergencyContactName} maxLength={160} onChange={(event) => change("emergencyContactName", event.target.value)} />
    </Field>
    <Field label="เบอร์ผู้ติดต่อฉุกเฉิน">
      <input className={input} type="tel" value={value.emergencyContactPhone} maxLength={30} onChange={(event) => change("emergencyContactPhone", event.target.value)} />
    </Field>
    <Field label="ที่อยู่">
      <textarea className={`${input} min-h-20 resize-y`} value={value.address} maxLength={1000} onChange={(event) => change("address", event.target.value)} />
    </Field>
  </div>;
}
