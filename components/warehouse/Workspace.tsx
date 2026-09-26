"use client";

import Link from "next/link";
import { useCallback } from "react";
import { logout } from "@/lib/auth-client";
import { warehouseApi } from "@/lib/api/warehouse";
import { Empty, Notice, panel, subtleButton, useRemote } from "./Ui";

export default function Workspace() {
  const load = useCallback(() => warehouseApi.me(), []);
  const { data: me, loading, error } = useRemote(load);
  return <main className="min-h-screen bg-[#F8FAFC] px-5 py-10 text-[#2C2C2C] dark:bg-[#2C2C2C] dark:text-white"><div className="mx-auto max-w-5xl space-y-7"><header className="flex flex-wrap items-center justify-between gap-4"><div><p className="text-sm font-semibold tracking-wide text-indigo-600">DAWH</p><h1 className="text-3xl font-bold">พื้นที่ทำงาน</h1><p className="mt-1 text-sm text-slate-500">ระบบคลังสินค้าสำหรับองค์กรเดียว</p></div><button className={subtleButton} onClick={() => void logout()}>ออกจากระบบ</button></header>
    {loading && <p>กำลังโหลดสิทธิ์...</p>}{error && <Notice tone="error">{error}</Notice>}
    {me?.mustChangePassword && <Notice tone="error">บัญชีนี้ต้องเปลี่ยนรหัสผ่านเริ่มต้นก่อนใช้งาน <Link className="font-semibold underline" href="/settings">ไปหน้าเปลี่ยนรหัสผ่าน</Link></Notice>}
    {me && !me.mustChangePassword && <div className="grid gap-4 md:grid-cols-2"><Link href="/warehouse" className={`${panel} block transition hover:border-indigo-400`}><p className="text-xs font-semibold uppercase text-indigo-600">Warehouse</p><h2 className="mt-2 text-xl font-bold">คลังสินค้า</h2><p className="mt-2 text-sm text-slate-500">สั่งสินค้า รับเอกสารขนส่ง ตรวจนับ ลงสต๊อก และติดตามปัญหา</p></Link>{["ADMIN", "CEO", "MANAGER"].includes(me.role) && <Link href="/controlpanel" className={`${panel} block transition hover:border-indigo-400`}><p className="text-xs font-semibold uppercase text-indigo-600">Organization</p><h2 className="mt-2 text-xl font-bold">จัดการองค์กร</h2><p className="mt-2 text-sm text-slate-500">สมาชิก สิทธิ์ ข้อมูลองค์กร และประวัติกิจกรรม</p></Link>}<Link href="/settings" className={`${panel} block transition hover:border-indigo-400`}><h2 className="text-lg font-bold">บัญชีของฉัน</h2><p className="mt-2 text-sm text-slate-500">ดูสิทธิ์และตั้งค่ารหัสผ่าน</p></Link></div>}
    {!loading && !me && !error && <Empty text="ไม่พบบัญชีผู้ใช้" />}
  </div></main>;
}
