"use client";

import { Ban, Boxes, Building2, CircleCheck, Clock3, Database, FileText, History, PauseCircle, ShieldCheck } from "lucide-react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import { useAppLanguage } from "@/utils/language";

type RoadmapPageKind = "scopes" | "account-status" | "master-data";

const pageCopy = {
  scopes: {
    titleEn: "Branch Access",
    titleTh: "สิทธิ์การเข้าถึงสาขา",
    introEn: "Assign a user to a branch with a defined access level and validity period.",
    introTh: "กำหนดผู้ใช้ สาขา ระดับสิทธิ์ และช่วงเวลาที่มีผล",
  },
  "account-status": {
    titleEn: "Account Status",
    titleTh: "สถานะบัญชี",
    introEn: "Manage active, suspended, and terminated accounts with a reason and change history.",
    introTh: "จัดการบัญชีใช้งาน ระงับ และสิ้นสุด พร้อมเหตุผลและประวัติการเปลี่ยนแปลง",
  },
  "master-data": {
    titleEn: "Master Data",
    titleTh: "ข้อมูลหลัก",
    introEn: "Manage warehouse locations and organization departments.",
    introTh: "จัดการตำแหน่งจัดเก็บสินค้าและแผนกขององค์กร",
  },
} satisfies Record<RoadmapPageKind, { titleEn: string; titleTh: string; introEn: string; introTh: string }>;

function EmptyApiState({ isThai, children }: { isThai: boolean; children: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-dashed border-[#A1A1AA] bg-[#FAFAFA] p-4 dark:border-[#666666] dark:bg-[#323232]">
      <Database size={18} className="mt-0.5 shrink-0 text-slate-500 dark:text-[#E4E4E7]" aria-hidden="true" />
      <div>
        <p className="text-sm leading-6 text-slate-700 dark:text-[#F4F4F5]">{children}</p>
        <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-[#E4E4E7]">
          {isThai ? "ส่วนนี้ยังไม่เชื่อมกับข้อมูลจริง" : "This section is not connected to live data yet."}
        </p>
      </div>
    </div>
  );
}

export default function ControlPanelRoadmapPage({ kind }: { kind: RoadmapPageKind }) {
  const isThai = useAppLanguage() === "TH";
  const copy = pageCopy[kind];
  const routePath = `/controlpanel/${kind}`;

  return (
    <WarehousePageTemplate titleEn={copy.titleEn} titleTh={copy.titleTh} routePath={routePath}>
      <main className="space-y-6 pb-10">
        <section className="flex flex-col gap-5 rounded-2xl border border-[#E4E4E7] bg-white p-5 dark:border-[#444444] dark:bg-[#383838] sm:flex-row sm:items-start sm:justify-between sm:p-7">
          <div className="flex min-w-0 items-start gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#F4F4F5] text-[#222222] dark:bg-white/10 dark:text-white">
              {kind === "account-status" ? <CircleCheck size={22} aria-hidden="true" /> : kind === "master-data" ? <Boxes size={22} aria-hidden="true" /> : <ShieldCheck size={22} aria-hidden="true" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-500 dark:text-[#E4E4E7]">{isThai ? "แผงควบคุม" : "Control panel"}</p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-[#222222] dark:text-white sm:text-2xl">{isThai ? copy.titleTh : copy.titleEn}</h2>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-[#E4E4E7]">{isThai ? copy.introTh : copy.introEn}</p>
            </div>
          </div>
          <span className="inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-[#E4E4E7] bg-[#F4F4F5] px-3 py-1.5 text-xs font-semibold text-[#383838] dark:border-[#555555] dark:bg-[#2C2C2C] dark:text-[#F4F4F5]">
            <Clock3 size={13} aria-hidden="true" />{isThai ? "โครงหน้าจอ" : "Preview layout"}
          </span>
        </section>

        {kind === "scopes" && (
          <>
            <section className="rounded-2xl border border-[#E4E4E7] bg-white p-5 dark:border-[#444444] dark:bg-[#383838] sm:p-7">
              <h2 className="text-base font-bold">{isThai ? "ระดับสิทธิ์" : "Access levels"}</h2>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                {[
                  ["READ", isThai ? "อ่านข้อมูล" : "Read"],
                  ["OPERATE", isThai ? "ปฏิบัติงาน" : "Operate"],
                  ["APPROVE", isThai ? "อนุมัติ" : "Approve"],
                ].map(([code, label]) => <div key={code} className="rounded-lg bg-slate-50 p-3 dark:bg-white/5"><span className="font-medium">{label}</span><span className="ml-2 text-xs text-slate-500 dark:text-zinc-400">{code}</span></div>)}
              </div>
              <p className="mt-3 text-sm text-slate-500 dark:text-zinc-400">{isThai ? "กำหนดวันเริ่มต้นและวันสิ้นสุดของสิทธิ์แต่ละสาขา" : "Each branch assignment will have a start date and an optional end date."}</p>
            </section>
            <EmptyApiState isThai={isThai}>{isThai ? "ยังไม่มีข้อมูลสิทธิ์รายสาขาที่บันทึกได้ ปัจจุบันระบบเก็บเพียงรายชื่อสาขาที่ผู้ใช้สังกัด" : "Branch access assignments are not persisted yet. The current system stores branch membership only."}</EmptyApiState>
          </>
        )}

        {kind === "account-status" && (
          <>
            <section aria-labelledby="account-status-options-title">
              <div className="mb-4">
                <h2 id="account-status-options-title" className="text-base font-bold text-[#222222] dark:text-white">{isThai ? "รูปแบบสถานะบัญชี" : "Account status model"}</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-[#E4E4E7]">{isThai ? "สถานะที่เตรียมรองรับเมื่อเชื่อมข้อมูลจริง" : "Statuses planned for live account records."}</p>
              </div>
              <div className="grid gap-4 md:grid-cols-3">
              {[
                { code: "ACTIVE", title: isThai ? "ใช้งาน" : "Active", description: isThai ? "บัญชีที่เข้าใช้งานระบบได้ตามสิทธิ์" : "Account can sign in and use assigned access.", icon: CircleCheck, tone: "text-[#168D82] bg-[#2EC4B6]/10 border-[#2EC4B6]/30 dark:text-[#2EC4B6]" },
                { code: "SUSPENDED", title: isThai ? "ระงับชั่วคราว" : "Suspended", description: isThai ? "พักการใช้งานโดยระบุเหตุผลและช่วงเวลา" : "Temporarily blocked with a reason and period.", icon: PauseCircle, tone: "text-[#B66B09] bg-[#FF9F1C]/10 border-[#FF9F1C]/30 dark:text-[#FF9F1C]" },
                { code: "TERMINATED", title: isThai ? "สิ้นสุด" : "Terminated", description: isThai ? "ปิดบัญชีและเก็บประวัติการเปลี่ยนสถานะ" : "Closed account with a retained status history.", icon: Ban, tone: "text-[#C0392B] bg-[#E74C3C]/10 border-[#E74C3C]/30 dark:text-[#E71D36]" },
              ].map(({ code, title, description, icon: Icon, tone }) => (
                <article key={code} className="rounded-2xl border border-[#E4E4E7] bg-white p-5 dark:border-[#444444] dark:bg-[#383838] sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className={"flex h-10 w-10 items-center justify-center rounded-xl border " + tone}><Icon size={20} aria-hidden="true" /></span>
                    <span className="font-mono text-[10px] text-slate-500 dark:text-[#E4E4E7]">{code}</span>
                  </div>
                  <h3 className="mt-5 text-base font-bold text-[#222222] dark:text-white">{title}</h3>
                  <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-[#E4E4E7]">{description}</p>
                </article>
              ))}
              </div>
            </section>
            <section className="rounded-2xl border border-[#E4E4E7] bg-white p-5 dark:border-[#444444] dark:bg-[#383838] sm:p-7">
              <h2 className="text-base font-bold text-[#222222] dark:text-white">{isThai ? "ข้อมูลที่ต้องบันทึกเมื่อเปลี่ยนสถานะ" : "Status change details"}</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div className="flex gap-3 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-4 dark:border-[#555555] dark:bg-[#323232]">
                  <FileText size={18} className="mt-0.5 shrink-0 text-slate-500 dark:text-[#E4E4E7]" aria-hidden="true" />
                  <div><h3 className="text-sm font-semibold">{isThai ? "เหตุผลและระยะเวลา" : "Reason and duration"}</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-[#E4E4E7]">{isThai ? "ระบุสาเหตุ วันเริ่มต้น และวันสิ้นสุดเมื่อจำเป็น" : "Record the reason, start date, and optional end date."}</p></div>
                </div>
                <div className="flex gap-3 rounded-xl border border-[#E4E4E7] bg-[#FAFAFA] p-4 dark:border-[#555555] dark:bg-[#323232]">
                  <History size={18} className="mt-0.5 shrink-0 text-slate-500 dark:text-[#E4E4E7]" aria-hidden="true" />
                  <div><h3 className="text-sm font-semibold">{isThai ? "ประวัติการเปลี่ยนแปลง" : "Change history"}</h3><p className="mt-1 text-xs leading-5 text-slate-500 dark:text-[#E4E4E7]">{isThai ? "แสดงผู้ดำเนินการ เวลา และสถานะก่อนกับหลัง" : "Show the actor, time, previous status, and new status."}</p></div>
                </div>
              </div>
              <div className="mt-5"><EmptyApiState isThai={isThai}>{isThai ? "ระบบปัจจุบันยังไม่มีสถานะ เหตุผล และประวัติครบตามรูปแบบนี้" : "The current system does not yet store the full status, reason, and history model."}</EmptyApiState></div>
            </section>
          </>
        )}

        {kind === "master-data" && (
          <div className="grid gap-5 lg:grid-cols-2">
            <section className="flex flex-col rounded-2xl border border-[#E4E4E7] bg-white p-5 dark:border-[#444444] dark:bg-[#383838] sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4F4F5] text-[#222222] dark:bg-white/10 dark:text-white"><Boxes size={20} aria-hidden="true" /></span>
                <div><h2 className="text-base font-bold text-[#222222] dark:text-white">{isThai ? "ตำแหน่งจัดเก็บ" : "Warehouse locations"}</h2><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-[#E4E4E7]">{isThai ? "โครงสร้างพื้นที่สำหรับระบุที่เก็บสินค้า" : "A location hierarchy for storing inventory."}</p></div>
              </div>
              <div className="my-5 border-t border-[#E4E4E7] dark:border-[#555555]" />
              <p className="text-xs font-semibold text-slate-500 dark:text-[#E4E4E7]">{isThai ? "โครงข้อมูลที่เตรียมไว้" : "Planned structure"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {(isThai ? ["สาขา", "โซน", "ทางเดิน", "ชั้นวาง", "ช่องจัดเก็บ"] : ["Branch", "Zone", "Aisle", "Rack", "Bin"]).map((label, index) => (
                  <span key={label} className="inline-flex items-center gap-2 rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] px-3 py-2 text-xs font-medium text-[#383838] dark:border-[#555555] dark:bg-[#323232] dark:text-[#F4F4F5]">
                    <span className="font-mono text-slate-400 dark:text-zinc-400">{String(index + 1).padStart(2, "0")}</span>{label}
                  </span>
                ))}
              </div>
              <div className="mt-auto pt-6"><EmptyApiState isThai={isThai}>{isThai ? "ยังไม่มีข้อมูลและบริการสำหรับจัดการตำแหน่งจัดเก็บ" : "Location records and management API are not available yet."}</EmptyApiState></div>
            </section>
            <section className="flex flex-col rounded-2xl border border-[#E4E4E7] bg-white p-5 dark:border-[#444444] dark:bg-[#383838] sm:p-7">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#F4F4F5] text-[#222222] dark:bg-white/10 dark:text-white"><Building2 size={20} aria-hidden="true" /></span>
                <div><h2 className="text-base font-bold text-[#222222] dark:text-white">{isThai ? "แผนก" : "Departments"}</h2><p className="mt-1 text-sm leading-6 text-slate-600 dark:text-[#E4E4E7]">{isThai ? "ข้อมูลหน่วยงานสำหรับกำหนดให้ผู้ใช้" : "Organization units for user assignments."}</p></div>
              </div>
              <div className="my-5 border-t border-[#E4E4E7] dark:border-[#555555]" />
              <p className="text-xs font-semibold text-slate-500 dark:text-[#E4E4E7]">{isThai ? "ข้อมูลหลักที่ควรมี" : "Suggested fields"}</p>
              <div className="mt-3 grid gap-2">
                {(isThai ? ["รหัสแผนก", "ชื่อแผนก", "สถานะการใช้งาน"] : ["Department code", "Department name", "Active status"]).map((label) => (
                  <div key={label} className="flex items-center gap-3 rounded-lg border border-[#E4E4E7] bg-[#FAFAFA] px-3 py-2.5 text-sm text-[#383838] dark:border-[#555555] dark:bg-[#323232] dark:text-[#F4F4F5]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#6366F1]" />{label}
                  </div>
                ))}
              </div>
              <div className="mt-auto pt-6"><EmptyApiState isThai={isThai}>{isThai ? "ปัจจุบันแผนกยังเป็นข้อความในโปรไฟล์ ไม่ใช่ข้อมูลหลักที่จัดการแยกได้" : "Departments are currently profile text, not independently managed master data."}</EmptyApiState></div>
            </section>
          </div>
        )}
      </main>
    </WarehousePageTemplate>
  );
}
