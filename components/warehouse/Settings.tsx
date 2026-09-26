"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import { warehouseApi, type MemberFull, type MemberProfile, type MemberUpdate } from "@/lib/api/warehouse";
import { MemberProfileFields, profileForm, type ProfileForm } from "./MemberProfileFields";
import { button, Field, input, message, Notice, panel, subtleButton, useRemote } from "./Ui";

export default function Settings() {
  const load = useCallback(async () => {
    const me = await warehouseApi.me();
    return { me, member: me.mustChangePassword ? null : await warehouseApi.member(me.id) };
  }, []);
  const { data, loading, error, refresh } = useRemote(load);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const submit = async (event: FormEvent) => { event.preventDefault(); setBusy(true); setFailure(null); setResult(null); try { await warehouseApi.changeInitialPassword(currentPassword, newPassword); setCurrentPassword(""); setNewPassword(""); setResult("เปลี่ยนรหัสผ่านแล้ว"); await refresh(); } catch (cause) { setFailure(message(cause)); } finally { setBusy(false); } };
  return <main className="min-h-screen bg-[#F8FAFC] px-5 py-10 text-[#2C2C2C] dark:bg-[#2C2C2C] dark:text-white">
    <div className="mx-auto max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">บัญชีของฉัน</h1>
        <div className="flex gap-2">{data && !data.me.mustChangePassword && <Link href="/controlpanel" className={subtleButton}>รายชื่อทีม</Link>}<Link href="/workspace" className={subtleButton}>หน้าหลัก</Link></div>
      </div>
      {loading && <p>กำลังโหลด...</p>}
      {error && <Notice tone="error">{error}</Notice>}
      {data && <section className={`${panel} space-y-2`}>
        <p><strong>สิทธิ์:</strong> {data.me.role}</p>
        <p><strong>สาขา:</strong> {data.me.branchIds.length ? data.me.branchIds.join(", ") : "ทุกสาขา"}</p>
        {data.me.mustChangePassword && <Notice tone="error">ต้องเปลี่ยนรหัสผ่านเริ่มต้นก่อนใช้งานระบบ</Notice>}
      </section>}
      {result && <Notice tone="success">{result}</Notice>}
      {failure && <Notice tone="error">{failure}</Notice>}
      {data?.member?.detailLevel === "FULL" && <OwnProfile member={data.member} onSaved={async () => { await refresh(); setResult("บันทึกข้อมูลส่วนตัวแล้ว"); }} onError={setFailure} />}
      <form className={`${panel} space-y-4`} onSubmit={(event) => void submit(event)}>
        <h2 className="text-lg font-bold">เปลี่ยนรหัสผ่านเริ่มต้น</h2>
        <Field label="รหัสผ่านปัจจุบัน"><input className={input} type="password" autoComplete="current-password" required value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} /></Field>
        <Field label="รหัสผ่านใหม่"><input className={input} type="password" autoComplete="new-password" minLength={8} required value={newPassword} onChange={(event) => setNewPassword(event.target.value)} /></Field>
        <button className={button} disabled={busy}>{busy ? "กำลังบันทึก..." : "เปลี่ยนรหัสผ่าน"}</button>
      </form>
    </div>
  </main>;
}

function OwnProfile({ member, onSaved, onError }: {
  member: MemberFull;
  onSaved: () => Promise<void>;
  onError: (value: string | null) => void;
}) {
  const [name, setName] = useState(member.name);
  const [profile, setProfile] = useState<ProfileForm>(profileForm(member.profile));
  const [busy, setBusy] = useState(false);
  const save = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    onError(null);
    try {
      const update: MemberUpdate = {};
      if (name !== member.name) update.name = name;
      const changedProfile: Partial<MemberProfile> = {};
      for (const field of ["phone", "address", "emergencyContactName", "emergencyContactPhone"] as const) {
        if (profile[field] !== (member.profile[field] ?? "")) changedProfile[field] = profile[field];
      }
      if (Object.keys(changedProfile).length) update.profile = changedProfile;
      if (Object.keys(update).length) await warehouseApi.updateMember(member.id, update);
      await onSaved();
    } catch (cause) { onError(message(cause)); }
    finally { setBusy(false); }
  };
  return <form className={`${panel} space-y-4`} onSubmit={(event) => void save(event)}>
    <div><h2 className="text-lg font-bold">ข้อมูลส่วนตัว</h2><p className="text-sm text-slate-500">แก้ไขข้อมูลติดต่อของคุณได้ที่นี่</p></div>
    <Field label="ชื่อ"><input className={input} value={name} maxLength={160} required onChange={(event) => setName(event.target.value)} /></Field>
    <Field label="อีเมลบัญชี"><input className={input} value={member.email} disabled /></Field>
    <MemberProfileFields value={profile} onChange={setProfile} employmentEditable={false} />
    <button className={button} disabled={busy}>{busy ? "กำลังบันทึก..." : "บันทึกข้อมูลส่วนตัว"}</button>
  </form>;
}
