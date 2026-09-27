"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import { warehouseApi, type Issue } from "@/lib/api/warehouse";
import { button, Empty, EvidenceLinks, EvidencePicker, Field, input, message, Notice, panel, subtleButton } from "./Ui";
import { useCursorResource } from "@/hooks/useCursorResource";

const next: Record<string, string[]> = {
  OPEN: ["FOLLOWING_UP", "RESOLVED", "CLOSED"],
  FOLLOWING_UP: ["RESOLVED", "CLOSED"],
  RESOLVED: ["FOLLOWING_UP", "CLOSED"],
  CLOSED: [],
};
const statusName: Record<string, string> = {
  OPEN: "เปิดเรื่อง",
  FOLLOWING_UP: "กำลังติดตาม",
  RESOLVED: "ได้ข้อสรุป",
  CLOSED: "ปิดเรื่อง",
};

export default function IssuesScreen() {
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
        if (!controller.signal.aborted) setFailure(message(cause));
      });
    return () => controller.abort();
  }, [selectedId, selected?.id]);

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
      setFailure(message(cause));
    }
  };

  return (
    <WarehousePageTemplate titleEn="Issues" titleTh="ปัญหาและการติดตามเคลม" routePath="/warehouse/issues" iconName="alert">
      {error && <Notice tone="error">{error}</Notice>}
      {failure && <Notice tone="error">{failure}</Notice>}
      {success && <Notice tone="success">{success}</Notice>}
      {loading && <p>กำลังโหลดข้อมูล...</p>}
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
        <section className={panel}>
          <h2 className="mb-4 text-lg font-bold">เรื่องที่แสดง ({items.length})</h2>
          {items.length ? (
            <div className="space-y-2">
              {items.map((issue) => (
                <button key={issue.id} className={`w-full rounded-xl border p-3 text-left text-sm ${selectedId === issue.id ? "border-indigo-500" : "border-slate-200 dark:border-white/10"}`} onClick={() => { if (selectedId !== issue.id) setSelected(null); setSelectedId(issue.id); }}>
                  <span className="font-bold">#{issue.id} · {issue.title}</span>
                  <span className="ml-2 text-slate-500">{statusName[issue.status] ?? issue.status}</span>
                </button>
              ))}
            </div>
          ) : !loading ? <Empty text="ยังไม่มีรายงานปัญหา" /> : null}
          {page?.hasMore && <button className={`${subtleButton} mt-3`} disabled={loadingMore} onClick={() => void loadMore()}>{loadingMore ? "กำลังโหลด..." : "โหลดรายการเพิ่ม"}</button>}
          {selected && <IssueDetails issue={selected} onStatus={(status, note) => void run(() => warehouseApi.addIssueEvent(selected.id, { status, note }), "อัปเดตสถานะแล้ว")} onClaim={(body) => void run(() => warehouseApi.addClaim(selected.id, body), "บันทึกการติดตามแล้ว")} />}
        </section>
        <NewIssue onSave={(body) => void run(() => warehouseApi.createIssue(body), "บันทึกรายงานแล้ว", true)} />
      </div>
    </WarehousePageTemplate>
  );
}

function NewIssue({ onSave }: { onSave: (body: Record<string, unknown>) => void }) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [poId, setPoId] = useState("");
  const [carrierId, setCarrierId] = useState("");
  const [mediaIds, setMediaIds] = useState<number[]>([]);
  return (
    <form className={`${panel} space-y-3 self-start`} onSubmit={(event) => { event.preventDefault(); onSave({ title, detail, purchaseOrderId: poId ? Number(poId) : null, carrierReceiptId: carrierId ? Number(carrierId) : null, mediaAssetIds: mediaIds }); }}>
      <h2 className="text-lg font-bold">รายงานปัญหา</h2>
      <Field label="หัวเรื่อง"><input className={input} required value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
      <Field label="รายละเอียด"><textarea className={input} required rows={4} value={detail} onChange={(event) => setDetail(event.target.value)} /></Field>
      <Field label="รหัส PO ภายใน (ถ้ามี)"><input className={input} type="number" min="1" value={poId} onChange={(event) => setPoId(event.target.value)} /></Field>
      <Field label="รหัสใบขนส่งภายใน (ถ้ามี)"><input className={input} type="number" min="1" value={carrierId} onChange={(event) => setCarrierId(event.target.value)} /></Field>
      <EvidencePicker onChange={setMediaIds} />
      <button className={button}>บันทึกรายงาน</button>
      <p className="text-xs text-slate-500">การติดต่อผู้ขายดำเนินการนอกระบบ และบันทึกผลไว้ที่นี่</p>
    </form>
  );
}

function IssueDetails({ issue, onStatus, onClaim }: { issue: Issue; onStatus: (status: string, note: string) => void; onClaim: (body: Record<string, unknown>) => void }) {
  const [status, setStatus] = useState("");
  const [statusNote, setStatusNote] = useState("");
  const [party, setParty] = useState("");
  const [outcome, setOutcome] = useState("");
  const [reference, setReference] = useState("");
  return (
    <div className="mt-5 space-y-4 rounded-xl bg-slate-50 p-4 text-sm dark:bg-white/5">
      <h3 className="font-bold">{issue.title}</h3>
      <p className="whitespace-pre-wrap">{issue.detail}</p>
      <p>สถานะ: {statusName[issue.status] ?? issue.status} · PO #{issue.purchase_order_id ?? "–"}</p>
      <EvidenceLinks media={issue.media} />
      {issue.events?.map((event) => <p key={event.id} className="border-l-2 border-indigo-400 pl-3">{statusName[event.status] ?? event.status} · {event.note}</p>)}
      {issue.claims?.map((claim) => <p key={`${claim.contacted_at}-${claim.contacted_party}`} className="border-l-2 border-amber-400 pl-3">ติดต่อ {claim.contacted_party ?? "ไม่ระบุ"} · {claim.outcome ?? "รอผล"}</p>)}
      {!!next[issue.status]?.length && <form className="grid gap-2 border-t border-slate-200 pt-3 dark:border-white/10" onSubmit={(event: FormEvent) => { event.preventDefault(); onStatus(status, statusNote); }}>
        <strong>เปลี่ยนสถานะ</strong>
        <select className={input} required value={status} onChange={(event) => setStatus(event.target.value)}><option value="">เลือกสถานะ</option>{next[issue.status].map((value) => <option key={value} value={value}>{statusName[value]}</option>)}</select>
        <input className={input} placeholder="บันทึกเหตุผลหรือผลการดำเนินการ" required value={statusNote} onChange={(event) => setStatusNote(event.target.value)} />
        <button className={subtleButton}>บันทึกสถานะ</button>
      </form>}
      <form className="grid gap-2 border-t border-slate-200 pt-3 dark:border-white/10" onSubmit={(event) => { event.preventDefault(); onClaim({ contactedParty: party || null, contactedAt: new Date().toISOString(), externalReference: reference || null, outcome: outcome || null }); }}>
        <strong>บันทึกการติดต่อภายนอก</strong>
        <input className={input} placeholder="ผู้ขายหรือขนส่งที่ติดต่อ" value={party} onChange={(event) => setParty(event.target.value)} />
        <input className={input} placeholder="เลขอ้างอิงภายนอก" value={reference} onChange={(event) => setReference(event.target.value)} />
        <textarea className={input} placeholder="ผลตอบกลับ / ข้อสรุป" value={outcome} onChange={(event) => setOutcome(event.target.value)} />
        <button className={subtleButton}>บันทึกติดตาม</button>
      </form>
    </div>
  );
}
