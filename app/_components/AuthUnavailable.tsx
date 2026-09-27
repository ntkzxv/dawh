"use client";

import { useRouter } from "next/navigation";

export default function AuthUnavailable() {
  const router = useRouter();
  return (
    <main className="flex min-h-dvh items-center justify-center bg-[#222222] px-6 text-white">
      <section className="w-full max-w-md space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
        <h1 className="text-xl font-semibold">เชื่อมต่อระบบยืนยันตัวตนไม่ได้</h1>
        <p className="text-sm text-white/70">ลองโหลดหน้านี้อีกครั้ง เมื่อตรวจสอบ session สำเร็จแล้วระบบจะพาไปยังหน้าที่เหมาะสม</p>
        <button className="rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#222222]" onClick={() => router.refresh()}>ลองอีกครั้ง</button>
      </section>
    </main>
  );
}
