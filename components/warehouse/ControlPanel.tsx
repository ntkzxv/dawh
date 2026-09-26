"use client";

import Link from "next/link";
import { useCallback, useState, type FormEvent } from "react";
import {
  warehouseApi, type CatalogItem, type Member, type MemberProfile,
  type MemberUpdate, type Organization, type Role,
} from "@/lib/api/warehouse";
import { MemberProfileFields, profileForm, type ProfileForm } from "./MemberProfileFields";
import { button, Empty, Field, input, message, Notice, panel, subtleButton, useRemote } from "./Ui";

const roles: Role[] = ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF", "EMPLOYEE"];
const roleName: Record<Role, string> = {
  ADMIN: "ผู้ดูแลระบบ", CEO: "CEO", MANAGER: "ผู้จัดการ",
  COUNTER_STAFF: "พนักงานเคาน์เตอร์", EMPLOYEE: "พนักงาน",
};
const blankProfile: MemberProfile = {
  employeeCode: null, phone: null, address: null, startedOn: null,
  emergencyContactName: null, emergencyContactPhone: null,
};

export default function ControlPanel() {
  const load = useCallback(() => Promise.all([
    warehouseApi.me(), warehouseApi.organization(), warehouseApi.members(),
    warehouseApi.catalog("branches"),
  ]), []);
  const { data, loading, error, refresh } = useRemote(load);
  const [tab, setTab] = useState<"members" | "org" | "audit">("members");
  const [notice, setNotice] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [audit, setAudit] = useState<Array<{
    id: number; action: string; entity_type: string;
    actor_email: string | null; created_at: string;
  }> | null>(null);

  const run = async (action: () => Promise<unknown>, success: string) => {
    setFailure(null);
    setNotice(null);
    try {
      await action();
      await refresh();
      setNotice(success);
      return true;
    } catch (cause) {
      setFailure(message(cause));
      return false;
    }
  };

  if (loading && !data) return <main className="mx-auto max-w-6xl p-8">กำลังโหลดข้อมูล...</main>;
  if (error) return <main className="mx-auto max-w-6xl p-8"><Notice tone="error">{error}</Notice></main>;
  if (!data) return null;

  const [me, organization, members, branches] = data;
  const isAdmin = me.role === "ADMIN";
  const canViewOrganization = ["ADMIN", "CEO", "MANAGER"].includes(me.role);
  const canViewAudit = ["ADMIN", "CEO"].includes(me.role);

  return <main className="min-h-screen bg-[#F8FAFC] px-5 py-8 text-[#2C2C2C] dark:bg-[#2C2C2C] dark:text-white">
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div><p className="text-sm font-semibold text-indigo-600">DAWH · สมาชิกองค์กร</p><h1 className="text-2xl font-bold">รายชื่อสมาชิก</h1></div>
        <div className="flex gap-2"><Link className={subtleButton} href="/settings">บัญชีของฉัน</Link><Link className={subtleButton} href="/workspace">หน้าหลัก</Link></div>
      </div>
      <nav className="flex flex-wrap gap-2" aria-label="ส่วนข้อมูลสมาชิก">
        <button type="button" className={tab === "members" ? button : subtleButton} onClick={() => setTab("members")}>สมาชิก</button>
        {canViewOrganization && <button type="button" className={tab === "org" ? button : subtleButton} onClick={() => setTab("org")}>ข้อมูลองค์กร</button>}
        {canViewAudit && <button type="button" className={tab === "audit" ? button : subtleButton} onClick={() => {
          setTab("audit");
          if (!audit) void warehouseApi.audit().then(setAudit).catch((cause) => setFailure(message(cause)));
        }}>กิจกรรม</button>}
      </nav>
      {notice && <Notice tone="success">{notice}</Notice>}
      {failure && <Notice tone="error">{failure}</Notice>}

      {tab === "members" && <div className={isAdmin ? "grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]" : ""}>
        <section className={panel}>
          <h2 className="mb-4 text-lg font-bold">สมาชิก ({members.length})</h2>
          {members.length ? <div className="space-y-3">{members.map((member) =>
            <MemberCard key={member.id} member={member} branches={branches} actorId={me.id} actorRole={me.role}
              onUpdate={(body) => run(() => warehouseApi.updateMember(member.id, body), "บันทึกข้อมูลสมาชิกแล้ว")}
              onDelete={() => run(() => warehouseApi.deleteMember(member.id), "ลบสมาชิกแบบกู้คืนได้แล้ว")}
              onRestore={() => run(() => warehouseApi.restoreMember(member.id), "กู้คืนสมาชิกแล้ว")}
              onReset={(password) => run(() => warehouseApi.resetMemberPassword(member.id, password), "รีเซ็ตรหัสผ่านแล้ว")} />
          )}</div> : <Empty text="ยังไม่มีสมาชิกในสาขาที่คุณดูได้" />}
        </section>
        {isAdmin && <CreateMember branches={branches} onSave={(body) => run(() => warehouseApi.createMember(body), "เพิ่มสมาชิกแล้ว")} />}
      </div>}

      {tab === "org" && canViewOrganization && <OrganizationForm value={organization} canEdit={isAdmin}
        onSave={(body) => run(() => warehouseApi.saveOrganization(body, !!organization), "บันทึกข้อมูลองค์กรแล้ว")} />}
      {tab === "audit" && canViewAudit && <section className={panel}>
        <h2 className="mb-4 text-lg font-bold">กิจกรรมในระบบ</h2>
        {audit?.length ? <div className="space-y-2">{audit.map((item) =>
          <div key={item.id} className="flex flex-wrap justify-between gap-2 border-b border-slate-100 py-2 text-sm dark:border-white/10">
            <span>{item.action} · {item.entity_type}</span>
            <span className="text-slate-500">{item.actor_email ?? "ระบบ"} · {new Date(item.created_at).toLocaleString("th-TH")}</span>
          </div>)}</div> : <Empty />}
      </section>}
    </div>
  </main>;
}

function branchLabels(ids: number[], branches: CatalogItem[]) {
  return ids.map((id) => branches.find((branch) => branch.id === id)?.name ?? `สาขา ${id}`).join(", ") || "ไม่ระบุสาขา";
}

function BranchPicker({ branches, value, onChange }: {
  branches: CatalogItem[]; value: number[]; onChange: (next: number[]) => void;
}) {
  return <fieldset><legend className="mb-1.5 text-sm font-medium">สาขาที่รับผิดชอบ</legend>
    <div className="flex flex-wrap gap-3">{branches.filter((branch) => branch.active !== false).map((branch) =>
      <label key={branch.id} className="inline-flex items-center gap-1.5 text-sm">
        <input type="checkbox" checked={value.includes(branch.id)}
          onChange={(event) => onChange(event.target.checked ? [...value, branch.id] : value.filter((id) => id !== branch.id))} />
        {branch.name}
      </label>)}</div>
  </fieldset>;
}

function MemberCard({ member, branches, actorId, actorRole, onUpdate, onDelete, onRestore, onReset }: {
  member: Member; branches: CatalogItem[]; actorId: number; actorRole: Role;
  onUpdate: (body: MemberUpdate) => Promise<boolean>;
  onDelete: () => Promise<boolean>; onRestore: () => Promise<boolean>;
  onReset: (password: string) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetPassword, setResetPassword] = useState("");
  const [name, setName] = useState(member.name);
  const [email, setEmail] = useState(member.detailLevel === "FULL" ? member.email : "");
  const [role, setRole] = useState(member.role);
  const [branchIds, setBranchIds] = useState(member.branchIds);
  const [profile, setProfile] = useState<ProfileForm>(profileForm(member.detailLevel === "FULL" ? member.profile : blankProfile));

  const isAdmin = actorRole === "ADMIN";
  const canEdit = member.detailLevel === "FULL" && !member.deletedAt && (isAdmin || actorId === member.id);
  const toggleEditing = () => {
    if (editing) { setEditing(false); return; }
    setName(member.name);
    setEmail(member.detailLevel === "FULL" ? member.email : "");
    setRole(member.role);
    setBranchIds(member.branchIds);
    setProfile(profileForm(member.detailLevel === "FULL" ? member.profile : blankProfile));
    setEditing(true);
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    const personal = {
      phone: profile.phone, address: profile.address,
      emergencyContactName: profile.emergencyContactName,
      emergencyContactPhone: profile.emergencyContactPhone,
    };
    const body: MemberUpdate = isAdmin
      ? { name, email, role, branchIds, profile: { ...personal, employeeCode: profile.employeeCode, startedOn: profile.startedOn } }
      : { name, profile: personal };
    if (await onUpdate(body)) setEditing(false);
  };

  return <article className="rounded-xl border border-slate-200 p-4 dark:border-white/10">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <strong>{member.name}</strong>
        <p className="text-sm text-slate-500 dark:text-zinc-300">
          {roleName[member.role]} · {branchLabels(member.branchIds, branches)}
          {member.detailLevel === "FULL" && member.deletedAt && " · ปิดบัญชีแล้ว"}
        </p>
      </div>
      <div className="flex flex-wrap gap-2">
        {canEdit && <button type="button" className={subtleButton} onClick={toggleEditing}>{editing ? "ยกเลิก" : "แก้ไข"}</button>}
        {isAdmin && member.detailLevel === "FULL" && member.deletedAt &&
          <button type="button" className={subtleButton} onClick={() => void onRestore()}>กู้คืน</button>}
        {isAdmin && member.detailLevel === "FULL" && !member.deletedAt && <>
          <button type="button" className={subtleButton} onClick={() => setResetOpen(!resetOpen)}>รีเซ็ตรหัสผ่าน</button>
          {member.id !== actorId && <button type="button" className="rounded-xl border border-rose-300 px-4 py-2 text-sm text-rose-700" onClick={() => setConfirmDelete(!confirmDelete)}>ลบ</button>}
        </>}
      </div>
    </div>

    {member.detailLevel === "FULL" && <details className="mt-3 border-t border-slate-200 pt-3 text-sm dark:border-white/10">
      <summary className="cursor-pointer font-medium text-indigo-600 dark:text-indigo-300">ดูข้อมูลสมาชิก</summary>
      <dl className="mt-3 grid gap-2 sm:grid-cols-2">
        <div><dt className="text-slate-500">อีเมล</dt><dd>{member.email}</dd></div>
        <div><dt className="text-slate-500">รหัสพนักงาน</dt><dd>{member.profile.employeeCode || "ยังไม่ระบุ"}</dd></div>
        <div><dt className="text-slate-500">เบอร์โทรศัพท์</dt><dd>{member.profile.phone || "ยังไม่ระบุ"}</dd></div>
        <div><dt className="text-slate-500">วันที่เริ่มงาน</dt><dd>{member.profile.startedOn || "ยังไม่ระบุ"}</dd></div>
        <div><dt className="text-slate-500">ที่อยู่</dt><dd>{member.profile.address || "ยังไม่ระบุ"}</dd></div>
        <div><dt className="text-slate-500">ผู้ติดต่อฉุกเฉิน</dt><dd>{member.profile.emergencyContactName || "ยังไม่ระบุ"}</dd></div>
        <div><dt className="text-slate-500">เบอร์ผู้ติดต่อฉุกเฉิน</dt><dd>{member.profile.emergencyContactPhone || "ยังไม่ระบุ"}</dd></div>
      </dl>
    </details>}

    {editing && member.detailLevel === "FULL" && <form className="mt-4 space-y-3 border-t border-slate-200 pt-4 dark:border-white/10" onSubmit={(event) => void save(event)}>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="ชื่อ"><input className={input} value={name} maxLength={160} required onChange={(event) => setName(event.target.value)} /></Field>
        {isAdmin && <Field label="อีเมล"><input className={input} type="email" value={email} required onChange={(event) => setEmail(event.target.value)} /></Field>}
      </div>
      {isAdmin && <>
        <Field label="สิทธิ์"><select className={input} value={role} onChange={(event) => setRole(event.target.value as Role)}>{roles.map((item) => <option key={item} value={item}>{roleName[item]}</option>)}</select></Field>
        <BranchPicker branches={branches} value={branchIds} onChange={setBranchIds} />
      </>}
      <MemberProfileFields value={profile} onChange={setProfile} employmentEditable={isAdmin} />
      <button className={button}>บันทึกข้อมูล</button>
    </form>}

    {resetOpen && isAdmin && <form className="mt-3 flex flex-wrap gap-2" onSubmit={async (event) => {
      event.preventDefault();
      if (await onReset(resetPassword)) { setResetOpen(false); setResetPassword(""); }
    }}>
      <input className={input} type="password" minLength={8} required placeholder="รหัสผ่านเริ่มต้นใหม่" value={resetPassword} onChange={(event) => setResetPassword(event.target.value)} />
      <button className={button}>ยืนยันรีเซ็ต</button>
    </form>}
    {confirmDelete && isAdmin && <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
      <span>ยืนยันลบสมาชิก {member.name}?</span>
      <button type="button" className="rounded-xl bg-rose-600 px-4 py-2 font-semibold text-white" onClick={async () => { if (await onDelete()) setConfirmDelete(false); }}>ยืนยันลบ</button>
      <button type="button" className={subtleButton} onClick={() => setConfirmDelete(false)}>ยกเลิก</button>
    </div>}
  </article>;
}

function CreateMember({ branches, onSave }: {
  branches: CatalogItem[];
  onSave: (body: { name: string; email: string; role: Role; branchIds: number[]; initialPassword: string }) => Promise<boolean>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("EMPLOYEE");
  const [branchIds, setBranchIds] = useState<number[]>([]);
  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (await onSave({ name, email, role, branchIds, initialPassword: password })) {
      setName(""); setEmail(""); setPassword(""); setRole("EMPLOYEE"); setBranchIds([]);
    }
  };
  return <form className={`${panel} h-fit space-y-3`} onSubmit={(event) => void submit(event)}>
    <h2 className="text-lg font-bold">เพิ่มสมาชิก</h2>
    <Field label="ชื่อ"><input className={input} value={name} required onChange={(event) => setName(event.target.value)} /></Field>
    <Field label="อีเมล"><input className={input} type="email" value={email} required onChange={(event) => setEmail(event.target.value)} /></Field>
    <Field label="สิทธิ์"><select className={input} value={role} onChange={(event) => setRole(event.target.value as Role)}>{roles.map((item) => <option key={item} value={item}>{roleName[item]}</option>)}</select></Field>
    <BranchPicker branches={branches} value={branchIds} onChange={setBranchIds} />
    <Field label="รหัสผ่านเริ่มต้น"><input className={input} type="password" minLength={8} value={password} required onChange={(event) => setPassword(event.target.value)} /></Field>
    <button className={button}>เพิ่มสมาชิก</button>
  </form>;
}

function OrganizationForm({ value, canEdit, onSave }: {
  value: Organization; canEdit: boolean;
  onSave: (body: { name: string; phone?: string; address?: string }) => Promise<boolean>;
}) {
  const [name, setName] = useState(value?.name ?? "");
  const [phone, setPhone] = useState(value?.phone ?? "");
  const [address, setAddress] = useState(value?.address ?? "");
  return <form className={`${panel} max-w-2xl space-y-4`} onSubmit={(event) => { event.preventDefault(); void onSave({ name, phone, address }); }}>
    <h2 className="text-lg font-bold">ข้อมูลองค์กร</h2>
    <Field label="ชื่อองค์กร"><input className={input} value={name} required disabled={!canEdit} onChange={(event) => setName(event.target.value)} /></Field>
    <Field label="โทรศัพท์"><input className={input} value={phone} disabled={!canEdit} onChange={(event) => setPhone(event.target.value)} /></Field>
    <Field label="ที่อยู่"><textarea className={`${input} min-h-20 resize-y`} value={address} disabled={!canEdit} onChange={(event) => setAddress(event.target.value)} /></Field>
    {canEdit && <button className={button}>บันทึกข้อมูลองค์กร</button>}
  </form>;
}
