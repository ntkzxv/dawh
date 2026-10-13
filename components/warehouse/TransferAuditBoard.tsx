"use client";

import { useCallback, type ReactNode } from "react";
import {
  Activity,
  ArrowLeftRight,
  Check,
  Clock3,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import DataTable, {
  dataTableFrameClassName,
  type DataTableColumn,
} from "@/components/common/DataTable";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import { useTheme } from "@/context/ThemeContext";
import { warehouseApi, type AuditEvent, type StockTransfer } from "@/lib/api/warehouse";
import { getAuditActionLabel } from "@/components/warehouse/auditLog";
import { useAppLanguage } from "@/utils/language";
import { useRemote } from "@/hooks/useRemoteResource";
import { Empty, Notice } from "./Ui";

const dateLabel = (value: string, isThai: boolean) =>
  new Intl.DateTimeFormat(isThai ? "th-TH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

export default function TransferAuditBoard() {
  const isThai = useAppLanguage() === "TH";
  const { theme } = useTheme();
  const isLight = theme === "light";
  const account = useOptionalWarehouseAccount();
  const canViewAudit = account?.me?.role === "ADMIN" || account?.me?.role === "CEO";

  const loadTransfers = useCallback((signal: AbortSignal) => {
    return warehouseApi.stockTransfersPage(new URLSearchParams({ page: "1", limit: "8" }), signal);
  }, []);
  const {
    data: transferData,
    loading: transfersLoading,
    error: transferError,
  } = useRemote(loadTransfers);

  const loadAudit = useCallback(async (signal: AbortSignal) => {
    const response = await warehouseApi.auditPage({ category: "stock-movement", page: 1 }, signal);
    return response.data.items.slice(0, 8);
  }, []);
  const {
    data: auditEvents,
    loading: auditLoading,
    error: auditError,
  } = useRemote(loadAudit, { enabled: Boolean(canViewAudit) });

  const transfers = transferData?.items ?? [];
  const summary = transferData?.summary;
  const columns: DataTableColumn<StockTransfer>[] = [
    {
      key: "record_no",
      header: isThai ? "เลขที่โอน" : "Transfer number",
      className: "whitespace-nowrap font-mono text-xs font-semibold",
      render: (item) => item.record_no,
    },
    {
      key: "route",
      header: isThai ? "เส้นทาง" : "Route",
      render: (item) => (
        <div className="flex min-w-52 items-center gap-2">
          <span className="truncate">{item.source_warehouse_name}</span>
          <ArrowLeftRight className="shrink-0 text-[#6366F1]" size={14} aria-hidden="true" />
          <span className="truncate">{item.destination_warehouse_name}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: isThai ? "สถานะ" : "Status",
      render: (item) => <TransferStatus status={item.status} isThai={isThai} />,
    },
    {
      key: "operator_name",
      header: isThai ? "ผู้บันทึก" : "Recorded by",
      render: (item) => item.operator_name || (isThai ? "ระบบ" : "System"),
    },
    {
      key: "posted_at",
      header: isThai ? "วันที่และเวลา" : "Date and time",
      className: "whitespace-nowrap text-xs",
      render: (item) => dateLabel(item.posted_at, isThai),
    },
  ];

  return (
    <WarehousePageTemplate
      titleEn="Status & Audit Board"
      titleTh="สถานะและบันทึกตรวจสอบ"
      routePath="/warehouse/transfer/audit"
      iconName="history"
      fullBleed
      loading={transfersLoading || (Boolean(canViewAudit) && auditLoading)}
      loadingLabel={isThai ? "กำลังโหลดกระดานตรวจสอบ" : "Loading audit board"}
    >
      <main className="mx-auto w-full max-w-[1600px] space-y-6 p-4 pb-10 sm:p-8">
        <p className={`max-w-2xl text-sm ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
          {isThai
            ? "ติดตามสถานะรายการโอนและตรวจสอบประวัติการลงรายการสต็อกจากข้อมูลล่าสุด"
            : "Track transfer status and review recent stock posting activity."}
        </p>

        {transferError && <Notice tone="error">{transferError}</Notice>}

        <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label={isThai ? "สรุปสถานะการโอน" : "Transfer status summary"}>
          <MetricCard
            icon={<ArrowLeftRight size={16} />}
            label={isThai ? "รายการโอนทั้งหมด" : "Total transfers"}
            value={summary?.total}
            detail={isThai ? "รายการที่ผู้ใช้มีสิทธิ์ดู" : "Transfers in your access scope"}
            isLight={isLight}
            loading={transfersLoading}
          />
          <MetricCard
            icon={<Check size={16} />}
            label={isThai ? "เสร็จสิ้น" : "Completed"}
            value={summary ? summary.total - summary.reversedTotal : undefined}
            detail={isThai ? "โอนและปรับยอดคลังแล้ว" : "Posted to both warehouses"}
            isLight={isLight}
            loading={transfersLoading}
            tone="success"
          />
          <MetricCard
            icon={<RotateCcw size={16} />}
            label={isThai ? "กลับรายการแล้ว" : "Reversed"}
            value={summary?.reversedTotal}
            detail={isThai ? "เก็บรายการเดิมไว้ในประวัติ" : "Original transfer retained in history"}
            isLight={isLight}
            loading={transfersLoading}
            tone="warning"
          />
          <MetricCard
            icon={<Clock3 size={16} />}
            label={isThai ? "รายการในเดือนนี้" : "This month"}
            value={summary?.monthTotal}
            detail={isThai ? "อ้างอิงวันที่บันทึก" : "Based on posting date"}
            isLight={isLight}
            loading={transfersLoading}
          />
        </section>

        <section className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.85fr)]">
          <div className="min-w-0 space-y-3">
            <SectionHeading
              title={isThai ? "สถานะการโอนล่าสุด" : "Recent transfer status"}
              detail={isThai ? "แสดงรายการล่าสุด 8 รายการ" : "Showing the latest 8 transfers"}
              isLight={isLight}
              icon={<Activity size={16} />}
            />
            {transfersLoading ? (
              <div className={`space-y-3 rounded-xl border p-4 ${isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#383838]"}`}>
                {[0, 1, 2, 3].map((item) => <SkeletonBox key={item} className="h-11 rounded-lg" />)}
              </div>
            ) : transfers.length ? (
              <div className={dataTableFrameClassName(isLight)}>
                <DataTable columns={columns} data={transfers} keyExtractor={(item) => item.id} minWidth="860px" />
              </div>
            ) : (
              <div className={`rounded-xl border p-5 ${isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#383838]"}`}>
                <Empty text={isThai ? "ยังไม่มีรายการโอนในขอบเขตที่ดูได้" : "No transfers are available in your access scope."} />
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-3">
            <SectionHeading
              title={isThai ? "กิจกรรมตรวจสอบล่าสุด" : "Recent audit activity"}
              detail={isThai ? "การลงรายการและกลับรายการสต็อก" : "Stock postings and reversals"}
              isLight={isLight}
              icon={<ShieldCheck size={16} />}
            />
            {!canViewAudit ? (
              <div className={`rounded-xl border p-5 ${isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#383838]"}`}>
                <p className="text-sm font-semibold">{isThai ? "จำกัดสิทธิ์การดูบันทึก" : "Audit access is restricted"}</p>
                <p className={`mt-1 text-sm ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
                  {isThai ? "บันทึกตรวจสอบแสดงเฉพาะผู้ดูแลระบบและผู้บริหาร" : "Audit events are available to administrators and CEOs."}
                </p>
              </div>
            ) : auditError ? (
              <Notice tone="error">{auditError}</Notice>
            ) : auditLoading ? (
              <div className={`space-y-3 rounded-xl border p-4 ${isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#383838]"}`}>
                {[0, 1, 2, 3].map((item) => <SkeletonBox key={item} className="h-16 rounded-lg" />)}
              </div>
            ) : auditEvents?.length ? (
              <ol className={`divide-y rounded-xl border ${isLight ? "divide-[#E4E4E7] border-[#E4E4E7] bg-white" : "divide-[#444444] border-[#444444] bg-[#383838]"}`}>
                {auditEvents.map((event) => <AuditEventCard key={event.id} event={event} isThai={isThai} isLight={isLight} />)}
              </ol>
            ) : (
              <div className={`rounded-xl border p-5 ${isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#383838]"}`}>
                <Empty text={isThai ? "ยังไม่มีเหตุการณ์ตรวจสอบ" : "No audit events yet."} />
              </div>
            )}
          </div>
        </section>
      </main>
    </WarehousePageTemplate>
  );
}

function TransferStatus({ status, isThai }: { status: StockTransfer["status"]; isThai: boolean }) {
  const completed = status === "COMPLETED";
  return (
    <span className={`inline-flex whitespace-nowrap rounded-md border px-2 py-1 text-[11px] font-semibold ${completed ? "border-[#2EC4B6]/30 bg-[#2EC4B6]/10 text-[#2EC4B6]" : "border-[#FF9F1C]/30 bg-[#FF9F1C]/10 text-[#FF9F1C]"}`}>
      {completed ? (isThai ? "เสร็จสิ้น" : "Completed") : (isThai ? "กลับรายการ" : "Reversed")}
    </span>
  );
}

function MetricCard({
  icon,
  label,
  value,
  detail,
  isLight,
  loading,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value?: string | number;
  detail: string;
  isLight: boolean;
  loading: boolean;
  tone?: "success" | "warning";
}) {
  const color = tone === "success" ? "text-[#2EC4B6]" : tone === "warning" ? "text-[#FF9F1C]" : isLight ? "text-[#383838]" : "text-[#E4E4E7]";
  return (
    <div className={`flex min-h-[132px] flex-col justify-between gap-4 rounded-xl border p-4 sm:p-5 ${isLight ? "border-[#E4E4E7] bg-white" : "border-[#444444] bg-[#383838]"}`}>
      <div className="flex items-center justify-between gap-3">
        <span className={`text-sm ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>{label}</span>
        <span className={`flex size-8 items-center justify-center rounded-lg ${isLight ? "bg-[#F4F4F5]" : "bg-white/5"} ${color}`}>{icon}</span>
      </div>
      <div>
        <div className={`font-mono text-3xl font-bold tabular-nums ${color}`}>
          {loading ? <SkeletonBox className="h-8 w-16 rounded" /> : Number(value ?? 0).toLocaleString(isLight ? "en-US" : "en-US")}
        </div>
        <p className={`mt-1 text-xs ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>{detail}</p>
      </div>
    </div>
  );
}

function SectionHeading({
  title,
  detail,
  isLight,
  icon,
}: {
  title: string;
  detail: string;
  isLight: boolean;
  icon: ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`flex size-9 shrink-0 items-center justify-center rounded-lg ${isLight ? "bg-[#F4F4F5] text-[#383838]" : "bg-white/5 text-[#E4E4E7]"}`}>{icon}</span>
      <div className="min-w-0">
        <h2 className="font-semibold">{title}</h2>
        <p className={`text-xs ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>{detail}</p>
      </div>
    </div>
  );
}

function AuditEventCard({ event, isThai, isLight }: { event: AuditEvent; isThai: boolean; isLight: boolean }) {
  return (
    <li className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{getAuditActionLabel(event.action, isThai)}</p>
          <p className={`mt-1 truncate text-xs ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
            {isThai ? "เอกสารสต็อก" : "Inventory document"}{event.entity_id == null ? "" : ` #${event.entity_id}`}
          </p>
        </div>
        <time className={`shrink-0 text-right text-[11px] ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`} dateTime={event.created_at}>
          {dateLabel(event.created_at, isThai)}
        </time>
      </div>
      <p className={`mt-2 text-xs ${isLight ? "text-[#666666]" : "text-[#A1A1AA]"}`}>
        {event.actor_name || event.actor_email || (isThai ? "ระบบ" : "System")}
      </p>
      {(event.before_data || event.after_data) && (
        <details className="mt-2 text-xs">
          <summary className="w-fit cursor-pointer font-medium text-[#6366F1]">
            {isThai ? "ดูข้อมูลที่บันทึก" : "View recorded data"}
          </summary>
          <pre className={`mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all rounded-lg p-2 ${isLight ? "bg-[#F4F4F5]" : "bg-black/20"}`}>
            {JSON.stringify({ before: event.before_data, after: event.after_data }, null, 2)}
          </pre>
        </details>
      )}
    </li>
  );
}
