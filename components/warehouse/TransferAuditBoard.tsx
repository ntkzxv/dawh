"use client";

import { useCallback, useState, type ReactNode } from "react";
import {
  Activity,
  ArrowLeftRight,
  CalendarDays,
  Check,
  Clock3,
  RotateCcw,
} from "lucide-react";
import WarehousePageTemplate from "@/app/warehouse/_components/WarehousePageTemplate";
import DataTable, {
  dataTableFrameClassName,
  type DataTableColumn,
} from "@/components/common/DataTable";
import { SkeletonBox } from "@/components/loading_screen/SkeletonLoading";
import { TransferAuditRouteSkeleton } from "@/components/loading_screen/WarehouseRouteSkeletons";
import { useOptionalWarehouseAccount } from "@/context/WarehouseAccountContext";
import { useTheme } from "@/context/ThemeContext";
import { warehouseApi, type StockTransfer } from "@/lib/api/warehouse";
import { useAppLanguage } from "@/utils/language";
import { useRemote } from "@/hooks/useRemoteResource";
import { Empty, Notice } from "./Ui";
import { WAREHOUSE_TABLE_PAGE_SIZE } from "@/lib/warehouse/pagination-config";
import DatePicker from "@/components/common/DatePicker";
import Button from "@/components/common/Button";

const dateLabel = (value: string, isThai: boolean) =>
  new Intl.DateTimeFormat(isThai ? "th-TH" : "en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));

const dateOnlyLabel = (value: string, isThai: boolean) =>
  new Intl.DateTimeFormat(isThai ? "th-TH" : "en-GB", {
    dateStyle: "medium",
  }).format(new Date(`${value}T00:00:00`));

export default function TransferAuditBoard() {
  const isThai = useAppLanguage() === "TH";
  const { theme } = useTheme();
  const isLight = theme === "light";
  const account = useOptionalWarehouseAccount();
  const accountLoading = account?.loading ?? false;
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [draftFromDate, setDraftFromDate] = useState("");
  const [draftToDate, setDraftToDate] = useState("");
  const [dateFilterOpen, setDateFilterOpen] = useState(false);

  const loadTransfers = useCallback((signal: AbortSignal) => {
    const params = new URLSearchParams({ page: "1", limit: String(WAREHOUSE_TABLE_PAGE_SIZE) });
    if (fromDate) params.set("from", fromDate);
    if (toDate) params.set("to", toDate);
    return warehouseApi.stockTransfersPage(params, signal);
  }, [fromDate, toDate]);
  const {
    data: transferData,
    loading: transfersLoading,
    error: transferError,
  } = useRemote(loadTransfers);

  const pageLoading = accountLoading || transfersLoading;

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
      loading={pageLoading}
    >
      {pageLoading ? <TransferAuditRouteSkeleton /> : (
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

        <section className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SectionHeading
              title={isThai ? "สถานะการโอนล่าสุด" : "Recent transfer status"}
              detail={isThai ? "แสดงรายการล่าสุด 8 รายการ" : "Showing the latest 8 transfers"}
              isLight={isLight}
              icon={<Activity size={16} />}
            />
            <div className="relative">
              <button
                type="button"
                aria-expanded={dateFilterOpen}
                aria-controls="transfer-date-filter"
                onClick={() => {
                  setDraftFromDate(fromDate);
                  setDraftToDate(toDate);
                  setDateFilterOpen((open) => !open);
                }}
                className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 ${isLight ? "border-[#D4D4D8] bg-white text-[#222222] hover:bg-[#F4F4F5]" : "border-[#555555] bg-[#383838] text-white hover:bg-[#444444]"}`}
              >
                <CalendarDays size={16} aria-hidden="true" />
                {fromDate || toDate
                  ? `${fromDate ? dateOnlyLabel(fromDate, isThai) : (isThai ? "เริ่มต้น" : "Start")} – ${toDate ? dateOnlyLabel(toDate, isThai) : (isThai ? "สิ้นสุด" : "End")}`
                  : (isThai ? "กรองวันที่" : "Filter dates")}
              </button>
              {dateFilterOpen && (
                <div
                  id="transfer-date-filter"
                  role="region"
                  aria-label={isThai ? "ตัวกรองวันที่รายการโอน" : "Transfer date filter"}
                  className={`absolute right-0 top-full z-30 mt-2 w-[min(360px,calc(100vw-2rem))] space-y-4 rounded-xl border p-4 shadow-xl ${isLight ? "border-[#E4E4E7] bg-white text-[#222222]" : "border-[#444444] bg-[#383838] text-white"}`}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="space-y-1.5 text-xs font-semibold">
                      <span>{isThai ? "วันที่เริ่มต้น" : "Start date"}</span>
                      <DatePicker
                        value={draftFromDate}
                        onChange={setDraftFromDate}
                        isThai={isThai}
                        maxDate={draftToDate || undefined}
                        placeholder={isThai ? "เลือกวันที่เริ่มต้น" : "Select start date"}
                        triggerClassName="!h-10 !rounded-lg !px-3 !py-2 !text-sm"
                        calendarClassName="transfer-date-filter-calendar"
                      />
                    </label>
                    <label className="space-y-1.5 text-xs font-semibold">
                      <span>{isThai ? "วันที่สิ้นสุด" : "End date"}</span>
                      <DatePicker
                        value={draftToDate}
                        onChange={setDraftToDate}
                        isThai={isThai}
                        minDate={draftFromDate || undefined}
                        placeholder={isThai ? "เลือกวันที่สิ้นสุด" : "Select end date"}
                        triggerClassName="!h-10 !rounded-lg !px-3 !py-2 !text-sm"
                        calendarClassName="transfer-date-filter-calendar"
                      />
                    </label>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => {
                        setFromDate("");
                        setToDate("");
                        setDraftFromDate("");
                        setDraftToDate("");
                        setDateFilterOpen(false);
                      }}
                    >
                      {isThai ? "ล้างวันที่" : "Clear dates"}
                    </Button>
                    <Button
                      variant="primary"
                      onClick={() => {
                        setFromDate(draftFromDate);
                        setToDate(draftToDate);
                        setDateFilterOpen(false);
                      }}
                    >
                      {isThai ? "ใช้ตัวกรอง" : "Apply"}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
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
        </section>
      </main>
      )}
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
