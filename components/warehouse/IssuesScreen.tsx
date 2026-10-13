"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import { warehouseApi, type Issue } from "@/lib/api/warehouse";
import { button, Empty, EvidenceLinks, EvidencePicker, Field, input, message, Notice, panel, subtleButton } from "./Ui";
import { useCursorResource } from "@/hooks/useCursorResource";
import { useAppLanguage } from "@/utils/language";
import { Loader2 } from "lucide-react";

const next: Record<string, string[]> = {
  OPEN: ["FOLLOWING_UP", "RESOLVED", "CLOSED"],
  FOLLOWING_UP: ["RESOLVED", "CLOSED"],
  RESOLVED: ["FOLLOWING_UP", "CLOSED"],
  CLOSED: [],
};
const statusName = (status: string, isThai: boolean) => ({
  OPEN: isThai ? "เปิดเรื่อง" : "Open",
  FOLLOWING_UP: isThai ? "กำลังติดตาม" : "Following up",
  RESOLVED: isThai ? "ได้ข้อสรุป" : "Resolved",
  CLOSED: isThai ? "ปิดเรื่อง" : "Closed",
})[status] ?? status;

export default function IssuesScreen() {
  const isThai = useAppLanguage() === "TH";
  const loadPage = useCallback(
    (cursor: string | null, signal: AbortSignal) =>
      warehouseApi.issuesPage(cursor, signal),
    [],
  );
  const { items, setItems, page, loading, loadingMore, error, loadMore } =
    useCursorResource(loadPage);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Issue | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedId) return;
    if (selected?.id === selectedId) return;
    const controller = new AbortController();
    void warehouseApi
      .issue(selectedId, controller.signal)
      .then(setSelected)
      .catch((cause) => {
        if (!controller.signal.aborted) setFailure(message(cause, isThai));
      });
    return () => controller.abort();
  }, [isThai, selectedId, selected?.id]);

  const run = async (
    action: () => Promise<unknown>,
    note: string,
    created = false,
  ) => {
    setFailure(null);
    setSuccess(null);
    try {
      const result = await action();
      setSuccess(note);
      if (created && result && typeof result === "object" && "id" in result) {
        const newIssue = result as Issue;
        setItems((current) => [newIssue, ...current.filter((item) => item.id !== newIssue.id)]);
        setSelectedId(newIssue.id);
        setSelected(newIssue);
      } else if (selectedId) {
        const updated = await warehouseApi.issue(selectedId);
        setSelected(updated);
        setItems((current) => current.map((item) => item.id === updated.id ? { ...item, status: updated.status } : item));
      }
    } catch (cause) {
      setFailure(message(cause, isThai));
    }
  };

  return (
    <WarehousePageTemplate titleEn="Issues" titleTh="ปัญหาและการติดตามเคลม" routePath="/warehouse/issues" iconName="alert" loading={loading && items.length === 0} loadingLabel={isThai ? "กำลังโหลดปัญหาและการติดตามเคลม" : "Loading issues and claim follow-ups"}>
      {error && <Notice tone="error">{error}</Notice>}
      {failure && <Notice tone="error">{failure}</Notice>}
      {success && <Notice tone="success">{success}</Notice>}

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className={panel}>
          <h2 className="mb-4 text-lg font-bold">{isThai ? `เรื่องที่แสดง (${items.length})` : `Issues (${items.length})`}</h2>
          {items.length ? (
            <div className="space-y-2">
              {items.map((issue) => (
                <button key={issue.id} className={`w-full rounded-xl border p-3 text-left text-sm ${selectedId === issue.id ? "border-indigo-500" : "border-slate-200 dark:border-white/10"}`} onClick={() => { if (selectedId !== issue.id) setSelected(null); setSelectedId(issue.id); }}>
                  <span className="font-bold">#{issue.id} · {issue.title}</span>
                  <span className="ml-2 text-slate-500 dark:text-zinc-400">{statusName(issue.status, isThai)}</span>
                </button>
              ))}
            </div>
          ) : !loading ? <Empty text={isThai ? "ยังไม่มีรายงานปัญหา" : "No issues have been reported."} /> : null}
          {page?.hasMore && <button className={`${subtleButton} mt-3`} disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? <Loader2 size={16} className="animate-spin" aria-label={isThai ? "กำลังโหลด" : "Loading"} /> : (isThai ? "โหลดรายการเพิ่ม" : "Load more issues")}</button>}
          {selected && <IssueDetails issue={selected} onStatus={(status, note) => void run(() => warehouseApi.addIssueEvent(selected.id, { status, note }), isThai ? "อัปเดตสถานะแล้ว" : "Status updated.")} onClaim={(body) => void run(() => warehouseApi.addClaim(selected.id, body), isThai ? "บันทึกการติดตามแล้ว" : "Follow-up saved.")} />}
        </section>
        <NewIssue onSave={(body) => void run(() => warehouseApi.createIssue(body), isThai ? "บันทึกรายงานแล้ว" : "Issue report saved.", true)} />
      </div>
    </WarehousePageTemplate>
  );
}

function NewIssue({ onSave }: { onSave: (body: Record<string, unknown>) => void }) {
  const isThai = useAppLanguage() === "TH";
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [poId, setPoId] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [mediaIds, setMediaIds] = useState<number[]>([]);
  return (
    <form className={`${panel} space-y-3 self-start`} onSubmit={(event) => { event.preventDefault(); onSave({ title, detail, purchaseOrderId: poId ? Number(poId) : null, carrierReceiptId: carrierId ? Number(carrierId) : null, mediaAssetIds: mediaIds }); }}>
      <h2 className="text-lg font-bold">{isThai ? "รายงานปัญหา" : "Report an issue"}</h2>
      <Field label={isThai ? "หัวเรื่อง" : "Title"}><input className={input} required value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
      <Field label={isThai ? "รายละเอียด" : "Details"}><textarea className={input} required rows={4} value={detail} onChange={(event) => setDetail(event.target.value)} /></Field>
      <Field label={isThai ? "รหัส PO ภายใน (ถ้ามี)" : "Internal PO ID (optional)"}><input className={input} type="number" min="1" value={poId} onChange={(event) => setPoId(event.target.value)} /></Field>
      <Field label={isThai ? "รหัสใบขนส่งภายใน (ถ้ามี)" : "Internal delivery note ID (optional)"}><input className={input} type="number" min="1" value={carrierId} onChange={(event) => setCarrierId(event.target.value)} /></Field>
      <EvidencePicker onChange={setMediaIds} />
      <button className={button}>{isThai ? "บันทึกรายงาน" : "Save report"}</button>
      <p className="text-xs text-slate-500 dark:text-zinc-400">{isThai ? "การติดต่อผู้ขายดำเนินการนอกระบบ และบันทึกผลไว้ที่นี่" : "Contact suppliers outside this system and record the outcome here."}</p>
    </form>
  );
}

function IssueDetails({ issue, onStatus, onClaim }: { issue: Issue; onStatus: (status: string, note: string) => void; onClaim: (body: Record<string, unknown>) => void }) {
  const isThai = useAppLanguage() === "TH";
  const [status, setStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [party, setParty] = useState("");
  const [outcome, setOutcome] = useState("");
  const [reference, setReference] = useState("");
  return (
    <div className="mt-5 space-y-4 rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/5">
      <h3 className="font-bold">{issue.title}</h3>
      <p className="whitespace-pre-wrap">{issue.detail}</p>
      <p>{isThai ? "สถานะ" : "Status"}: {statusName(issue.status, isThai)} · PO #{issue.purchase_order_id ?? "–"}</p>
      <EvidenceLinks media={issue.media} />
      {issue.events?.map((event) => <p key={event.id} className="border-l-2 border-indigo-400 pl-3">{statusName(event.status, isThai)} · {event.note}</p>)}
      {issue.claims?.map((claim) => <p key={`${claim.contacted_at}-${claim.contacted_party}`} className="border-l-2 border-amber-400 pl-3">{isThai ? "ติดต่อ" : "Contacted"} {claim.contacted_party ?? (isThai ? "ไม่ระบุ" : "Unspecified")} · {claim.outcome ?? (isThai ? "รอผล" : "Pending")}</p>)}
      {!!next[issue.status]?.length && <form className="grid gap-2 border-t border-slate-200 pt-3 dark:border-white/10" onSubmit={(event: FormEvent) => { event.preventDefault(); onStatus(status, statusNote); }}>
        <strong>{isThai ? "เปลี่ยนสถานะ" : "Change status"}</strong>
        <select className={input} required value={status} onChange={(event) => setStatus(event.target.value)}><option value="">{isThai ? "เลือกสถานะ" : "Select status"}</option>{next[issue.status].map((value) => <option key={value} value={value}>{statusName(value, isThai)}</option>)}</select>
        <input className={input} placeholder={isThai ? "บันทึกเหตุผลหรือผลการดำเนินการ" : "Record the reason or outcome"} required value={statusNote} onChange={(event) => setStatusNote(event.target.value)} />
        <button className={subtleButton}>{isThai ? "บันทึกสถานะ" : "Save status"}</button>
      </form>}
      <form className="grid gap-2 border-t border-slate-200 pt-3 dark:border-white/10" onSubmit={(event) => { event.preventDefault(); onClaim({ contactedParty: party || null, contactedAt: new Date().toISOString(), externalReference: reference || null, outcome: outcome || null }); }}>
        <strong>{isThai ? "บันทึกการติดต่อภายนอก" : "Record external contact"}</strong>
        <input className={input} placeholder={isThai ? "ผู้ขายหรือขนส่งที่ติดต่อ" : "Supplier or carrier contacted"} value={party} onChange={(event) => setParty(event.target.value)} />
        <input className={input} placeholder={isThai ? "เลขอ้างอิงภายนอก" : "External reference"} value={reference} onChange={(event) => setReference(event.target.value)} />
        <textarea className={input} placeholder={isThai ? "ผลตอบกลับ / ข้อสรุป" : "Response or outcome"} value={outcome} onChange={(event) => setOutcome(event.target.value)} />
        <button className={subtleButton}>{isThai ? "บันทึกติดตาม" : "Save follow-up"}</button>
      </form>
    </div>
  );
}
