"use client";

import { Check, LockKeyhole, ShieldCheck, Users, X } from "lucide-react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import { warehouseRoles, type Role } from "@/lib/contracts/warehouse";
import { useAppLanguage } from "@/utils/language";

const roleLabels: Record<Role, { th: string; en: string }> = {
  ADMIN: { th: "ผู้ดูแลระบบ", en: "Admin" },
  CEO: { th: "ผู้บริหาร", en: "CEO" },
  MANAGER: { th: "ผู้จัดการ", en: "Manager" },
  COUNTER_STAFF: { th: "พนักงานเคาน์เตอร์", en: "Counter Staff" },
  EMPLOYEE: { th: "พนักงาน", en: "Employee" },
};

const rules: Array<{ th: string; en: string; roles: Role[] }> = [
  { th: "จัดการผู้ใช้และสิทธิ์บัญชี", en: "Manage users and account access", roles: ["ADMIN"] },
  { th: "จัดการสาขา", en: "Manage branches", roles: ["ADMIN", "CEO"] },
  { th: "จัดการคลังสินค้า", en: "Manage warehouses", roles: ["ADMIN", "CEO", "MANAGER"] },
  { th: "ดูบันทึกการตรวจสอบ", en: "View audit log", roles: ["ADMIN", "CEO"] },
  { th: "ดูข้อมูลสต็อก", en: "Read stock data", roles: ["ADMIN", "CEO", "MANAGER", "COUNTER_STAFF"] },
];

export default function AccessControlPreview() {
  const isThai = useAppLanguage() === "TH";
  return (
    <WarehousePageTemplate titleEn="Access Preview" titleTh="ตัวอย่างการควบคุมสิทธิ์" routePath="/controlpanel/access-preview">
      <main className="space-y-6 pb-10">
        <section className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white dark:border-[#444444] dark:bg-[#383838]">
          <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-7">
            <div className="flex min-w-0 items-start gap-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F4F4F5] text-[#222222] dark:bg-white/10 dark:text-white">
                <ShieldCheck size={22} aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500 dark:text-[#E4E4E7]">{isThai ? "แผงควบคุมสิทธิ์" : "Access control"}</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-[#222222] dark:text-white sm:text-2xl">{isThai ? "ภาพรวมสิทธิ์ตามบทบาท" : "Role access overview"}</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-[#E4E4E7]">
                  {isThai ? "ดูตัวอย่างการเข้าถึงฟังก์ชันของแต่ละบทบาทจากกติกาที่แสดงในหน้านี้" : "Review the access rules displayed here for each role and function."}
                </p>
              </div>
            </div>
            <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-[#E4E4E7] bg-[#F4F4F5] px-3 py-1.5 text-xs font-semibold text-[#383838] dark:border-[#555555] dark:bg-[#2C2C2C] dark:text-[#F4F4F5]">
              <LockKeyhole size={13} aria-hidden="true" />{isThai ? "อ่านอย่างเดียว" : "Read only"}
            </span>
          </div>
          <div className="grid border-t border-[#E4E4E7] bg-[#FAFAFA] dark:border-[#444444] dark:bg-[#323232] sm:grid-cols-2">
            <div className="flex items-center gap-3 px-5 py-4 sm:px-7">
              <Users size={18} className="shrink-0 text-slate-500 dark:text-[#E4E4E7]" aria-hidden="true" />
              <span className="text-sm text-slate-600 dark:text-[#E4E4E7]">{isThai ? "บทบาทในระบบ" : "System roles"}</span>
              <strong className="ml-auto text-lg tabular-nums text-[#222222] dark:text-white">{warehouseRoles.length}</strong>
            </div>
            <div className="flex items-center gap-3 border-t border-[#E4E4E7] px-5 py-4 dark:border-[#444444] sm:border-l sm:border-t-0 sm:px-7">
              <ShieldCheck size={18} className="shrink-0 text-slate-500 dark:text-[#E4E4E7]" aria-hidden="true" />
              <span className="text-sm text-slate-600 dark:text-[#E4E4E7]">{isThai ? "ฟังก์ชันที่แสดง" : "Functions shown"}</span>
              <strong className="ml-auto text-lg tabular-nums text-[#222222] dark:text-white">{rules.length}</strong>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-[#E4E4E7] bg-white dark:border-[#444444] dark:bg-[#383838]" aria-labelledby="access-matrix-title">
          <div className="border-b border-[#E4E4E7] px-5 py-5 dark:border-[#444444] sm:px-7">
            <h2 id="access-matrix-title" className="text-base font-bold text-[#222222] dark:text-white">{isThai ? "ตารางสิทธิ์ตามฟังก์ชัน" : "Access by function"}</h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-[#E4E4E7]">{isThai ? "เลื่อนตารางในแนวนอนเพื่อดูทุกบทบาท" : "Scroll horizontally to see every role."}</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-[13px]">
              <thead className="bg-[#F4F4F5] text-[#383838] dark:bg-[#2C2C2C] dark:text-[#E4E4E7]">
                <tr>
                  <th scope="col" className="w-[32%] px-5 py-3.5 font-semibold sm:px-7">{isThai ? "ฟังก์ชัน" : "Function"}</th>
                  {warehouseRoles.map((role) => <th scope="col" key={role} className="min-w-28 px-3 py-3.5 text-center font-semibold">{isThai ? roleLabels[role].th : roleLabels[role].en}</th>)}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E4E4E7] dark:divide-[#444444]">
                {rules.map((rule) => (
                  <tr key={rule.en} className="transition-colors hover:bg-[#F8FAFC] dark:hover:bg-white/5">
                    <th scope="row" className="px-5 py-4 font-medium text-[#222222] dark:text-[#F4F4F5] sm:px-7">{isThai ? rule.th : rule.en}</th>
                    {warehouseRoles.map((role) => {
                      const allowed = rule.roles.includes(role);
                      return (
                        <td key={role} className="px-3 py-3 text-center">
                          <span className={allowed ? "inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#2EC4B6]/15 text-[#168D82] dark:text-[#2EC4B6]" : "inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#F4F4F5] text-slate-400 dark:bg-white/10 dark:text-zinc-400"}>
                            {allowed ? <Check size={15} strokeWidth={2.5} aria-hidden="true" /> : <X size={14} aria-hidden="true" />}
                            <span className="sr-only">{allowed ? (isThai ? "อนุญาต" : "Allowed") : (isThai ? "ไม่มีสิทธิ์" : "No access")}</span>
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="border-t border-[#E4E4E7] px-5 py-3 text-xs leading-5 text-slate-500 dark:border-[#444444] dark:text-[#E4E4E7] sm:px-7">
            {isThai ? "ตารางนี้เป็นตัวอย่างแบบอ่านอย่างเดียว ยังไม่ดึงสิทธิ์จากข้อมูลจริงหรือแก้บทบาทจากหน้านี้" : "This is a read-only preview. It does not fetch live permissions or allow role editing."}
          </p>
        </section>

        <section className="rounded-2xl border border-[#E4E4E7] bg-white p-5 dark:border-[#444444] dark:bg-[#383838] sm:p-7" aria-labelledby="access-roles-title">
          <h2 id="access-roles-title" className="text-base font-bold text-[#222222] dark:text-white">{isThai ? "บทบาทที่มีอยู่" : "Available roles"}</h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-[#E4E4E7]">{isThai ? "ชื่อบทบาทที่ใช้ในตารางสิทธิ์ด้านบน" : "Role names used in the access table above."}</p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {warehouseRoles.map((role) => (
              <li key={role} className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] px-4 py-3 dark:border-[#555555] dark:bg-[#323232]">
                <span className="truncate text-sm font-medium text-[#222222] dark:text-[#F4F4F5]">{isThai ? roleLabels[role].th : roleLabels[role].en}</span>
                <span className="shrink-0 font-mono text-[10px] text-slate-500 dark:text-[#E4E4E7]">{role}</span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </WarehousePageTemplate>
  );
}
